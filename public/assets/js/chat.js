// Chat functionality
class ChatManager {
    constructor() {
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.chatMessages = document.getElementById('chatMessages');
        this.typingIndicator = document.getElementById('typingIndicator');
        this.clearHistoryBtn = document.getElementById('clearHistoryBtn');
        this.selectedAvatar = JSON.parse(localStorage.getItem('selectedAvatar')) || { id: 1, name: 'Luna', imageClass: 'luna-avatar' };
        console.log("Selected avatar:", this.selectedAvatar); // Debugging
        
        // Settings elements
        this.settingsBtn = document.getElementById('settingsBtn');
        this.settingsModal = document.getElementById('settingsModal');
        this.closeSettingsBtn = document.getElementById('closeSettingsBtn');
        this.storageToggle = document.getElementById('storageToggle');
        
        // Initialize storage setting (default to true if not set)
        this.storageEnabled = localStorage.getItem('storageEnabled') !== 'false';
        
        // Update toggle to match current setting
        if (this.storageToggle) {
            this.storageToggle.checked = this.storageEnabled;
        }
        
        this.setupEventListeners();
        this.clearChatDisplay(); // Clear the display before loading history
        
        // Only load chat history if storage is enabled
        if (this.storageEnabled) {
            this.loadChatHistory();
        }
        
        // Listen for avatar changes
        window.addEventListener('avatarChanged', (event) => {
            if (event.detail && event.detail.avatar) {
                this.selectedAvatar = event.detail.avatar;
                if (this.storageEnabled) {
                    this.loadChatHistory();
                } else {
                    this.clearChatDisplay();
                }
            }
        });
    }

    setupEventListeners() {
        if (this.sendButton) {
            this.sendButton.addEventListener('click', () => {
                const message = this.messageInput.value.trim();
                if (message) {
                    this.sendMessage(); // Call sendMessage to process the message
                }
            });
        }

        if (this.messageInput) {
            this.messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
            this.messageInput.addEventListener('input', this.adjustTextareaHeight.bind(this));
        }

        if (this.clearHistoryBtn) {
            this.clearHistoryBtn.addEventListener('click', () => this.clearChatHistory());
        }
        
        // Add event listener for back to avatars button
        const backToAvatarsBtn = document.getElementById('backToAvatarsBtn');
        if (backToAvatarsBtn) {
            backToAvatarsBtn.addEventListener('click', () => {
                window.location.href = '../index.html';
            });
        }
        
        // Settings modal event listeners
        if (this.settingsBtn) {
            this.settingsBtn.addEventListener('click', () => this.openSettingsModal());
        }
        
        if (this.closeSettingsBtn) {
            this.closeSettingsBtn.addEventListener('click', () => this.closeSettingsModal());
        }
        
        if (this.storageToggle) {
            this.storageToggle.addEventListener('change', () => this.toggleStorageSetting());
        }
        
        // Close modal when clicking outside
        window.addEventListener('click', (event) => {
            if (event.target === this.settingsModal) {
                this.closeSettingsModal();
            }
        });
    }
    
    // Open settings modal
    openSettingsModal() {
        if (this.settingsModal) {
            this.settingsModal.classList.add('show');
        }
    }
    
    // Close settings modal
    closeSettingsModal() {
        if (this.settingsModal) {
            this.settingsModal.classList.remove('show');
        }
    }
    
    // Method to toggle storage setting
    toggleStorageSetting() {
        this.storageEnabled = this.storageToggle.checked;
        localStorage.setItem('storageEnabled', this.storageEnabled);
        
        // If enabling storage, save current chat
        if (this.storageEnabled) {
            this.saveChatHistory();
        }
    }

    adjustTextareaHeight() {
        this.messageInput.style.height = 'auto';
        this.messageInput.style.height = (this.messageInput.scrollHeight) + 'px';
    }

    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message) return;

        // Add user message to chat
        this.addMessage(message, 'user');

        // Clear the input field only after adding the message
        this.messageInput.value = '';
        this.adjustTextareaHeight();

        // Show typing indicator
        this.showTypingIndicator();

        try {
            const response = await this.getAIResponse(message);
            this.hideTypingIndicator();
            
            // Split long responses into multiple messages
            const messages = this.splitResponse(response);
            for (const msg of messages) {
                await this.addMessageWithDelay(msg, 'ai');
            }
        } catch (error) {
            console.error('Error getting AI response:', error);
            this.hideTypingIndicator();
            this.addMessage('Sorry, I encountered an error. Please try again.', 'ai');
        }

        // Only save chat history if storage is enabled
        if (this.storageEnabled) {
            this.saveChatHistory();
        }
    }

    splitResponse(response) {
        // Split long responses into multiple messages
        const maxLength = 150;
        if (response.length <= maxLength) return [response];

        const messages = [];
        let currentMessage = '';
        const words = response.split(' ');

        for (const word of words) {
            if ((currentMessage + ' ' + word).length > maxLength) {
                messages.push(currentMessage.trim());
                currentMessage = word;
            } else {
                currentMessage += (currentMessage ? ' ' : '') + word;
            }
        }
        if (currentMessage) {
            messages.push(currentMessage.trim());
        }
        return messages;
    }

    async getAIResponse(message) {
        // Extract the last 5 exchanges without emojis
        const messages = Array.from(this.chatMessages.children)
            .slice(-10) // Get the last 10 messages (5 user + 5 AI)
            .map(msg => ({
                content: msg.textContent.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, ''), // Remove emojis
                sender: msg.classList.contains('user') ? 'user' : 'ai'
            }));

        const lastFiveExchanges = messages.slice(-5); // Keep only the last 5 exchanges

        const payload = {
            avatarId: this.selectedAvatar.id,
            userMessage: message,
            context: lastFiveExchanges // Include the context in the payload
        };
        console.log("Sending payload:", payload); // Debugging

        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorData = await response.json(); // Log server error details
            console.error("Server error:", errorData);
            throw new Error('Failed to get AI response');
        }

        const data = await response.json();
        
        if (!data.reply || typeof data.reply !== 'string') {
            throw new Error('Unexpected response structure');
        }

        return data.reply;
    }

    addMessage(message, sender) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', sender);
        messageElement.textContent = message;
        this.chatMessages.appendChild(messageElement);
        this.scrollToBottom();
    }

    async addMessageWithDelay(message, sender) {
        await new Promise(resolve => setTimeout(resolve, 500));
        this.addMessage(message, sender);
    }

    showTypingIndicator() {
        this.typingIndicator.classList.remove('hidden');
    }

    hideTypingIndicator() {
        this.typingIndicator.classList.add('hidden');
    }

    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    saveChatHistory() {
        // Only save if storage is enabled
        if (!this.storageEnabled) return;
        
        const messages = Array.from(this.chatMessages.children).map(msg => ({
            content: msg.textContent,
            sender: msg.classList.contains('user') ? 'user' : 'ai'
        }));
        
        // Get avatar ID for storage key
        const avatarId = this.selectedAvatar.id || 1;
        localStorage.setItem(`chatHistory_${avatarId}`, JSON.stringify(messages));
    }

    loadChatHistory() {
        // Only load if storage is enabled
        if (!this.storageEnabled) return;
        
        // Clear existing messages first
        this.clearChatDisplay();
        
        // Get avatar ID for storage key
        const avatarId = this.selectedAvatar.id || 1;
        const history = localStorage.getItem(`chatHistory_${avatarId}`);
        
        if (history) {
            const messages = JSON.parse(history);
            messages.forEach(msg => this.addMessage(msg.content, msg.sender));
        }
    }

    clearChatHistory() {
        if (confirm('Are you sure you want to clear the chat history?')) {
            // Get avatar ID for storage key
            const avatarId = this.selectedAvatar.id || 1;
            localStorage.removeItem(`chatHistory_${avatarId}`);
            this.clearChatDisplay();
        }
    }
    
    clearChatDisplay() {
        // Clear the chat display without removing from storage
        this.chatMessages.innerHTML = '';
    }

    // Method to switch avatar
    switchAvatar(avatarId) {
        // Get the avatar from localStorage or fetch it
        const avatarData = localStorage.getItem('selectedAvatar');
        let avatars;
        
        try {
            avatars = JSON.parse(avatarData);
        } catch (e) {
            console.error('Error parsing avatar data:', e);
            return;
        }
        
        // Update selected avatar
        this.selectedAvatar = avatars;
        
        // Reload chat history for this avatar
        if (this.storageEnabled) {
            this.loadChatHistory();
        } else {
            this.clearChatDisplay();
        }

        // Automatically send relationship status to the API
        const relationshipStatusMessage = `What is the relationship status of ${this.selectedAvatar.name}?`;
        this.addMessage(relationshipStatusMessage, 'user');
        this.getAIResponse(relationshipStatusMessage)
            .then(response => this.addMessage(response, 'ai'))
            .catch(error => {
                console.error('Error getting relationship status:', error);
                this.addMessage('Sorry, I could not retrieve the relationship status.', 'ai');
            });

        // Update UI elements
        if (typeof updateAvatarUI === 'function') {
            updateAvatarUI(this.selectedAvatar);
        } else {
            // Fallback if updateAvatarUI is not available
            const avatarName = document.getElementById('avatarName');
            if (avatarName && this.selectedAvatar) {
                avatarName.textContent = this.selectedAvatar.name;
            }
        }
    }
}

// Initialize chat when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const chatManager = new ChatManager();
    console.log("ChatManager initialized:", chatManager); // Debugging
});

