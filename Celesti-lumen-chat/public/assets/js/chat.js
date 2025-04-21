// Chat functionality
class ChatManager {
    constructor() {
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.chatMessages = document.getElementById('chatMessages');
        this.typingIndicator = document.getElementById('typingIndicator');
        this.clearHistoryBtn = document.getElementById('clearHistoryBtn');
        
        // Get the selected avatar with proper ID handling
        this.selectedAvatar = this.getSelectedAvatar();
        
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
        
        // Debug localStorage to check for any issues
        this.debugLocalStorage();
        
        // Clean up localStorage and remove any old chat history data
        this.cleanupLocalStorage();
        
        // Clear the display before loading history
        this.clearChatDisplay();
        
        // Log the selected avatar on initialization
        console.log('Initializing chat with avatar:', this.selectedAvatar);
        
        // Only load chat history if storage is enabled
        if (this.storageEnabled) {
            this.loadChatHistory();
        }
        
        // Listen for avatar changes
        window.addEventListener('avatarChanged', (event) => {
            if (event.detail && event.detail.avatar) {
                console.log('Avatar changed event received:', event.detail.avatar);
                
                // Save current chat history before switching
                if (this.storageEnabled && this.selectedAvatar) {
                    this.saveChatHistory();
                }
                
                // Update the avatar with proper ID handling
                const newAvatar = event.detail.avatar;
                if (typeof newAvatar.id === 'string') {
                    newAvatar.id = parseInt(newAvatar.id, 10);
                }
                this.selectedAvatar = newAvatar;
                
                // Clear the chat display first
                this.clearChatDisplay();
                
                // Load the chat history for the new avatar if storage is enabled
                if (this.storageEnabled) {
                    this.loadChatHistory();
                }
            }
        });
    }

    setupEventListeners() {
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        this.messageInput.addEventListener('input', this.adjustTextareaHeight.bind(this));
        this.clearHistoryBtn.addEventListener('click', () => this.clearChatHistory());
        
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
        const previousState = this.storageEnabled;
        this.storageEnabled = this.storageToggle.checked;
        console.log('Storage enabled changed from', previousState, 'to', this.storageEnabled);
        
        localStorage.setItem('storageEnabled', this.storageEnabled);
        
        // If enabling storage, save current chat
        if (!previousState && this.storageEnabled) {
            console.log('Storage was enabled, saving current chat history');
            this.saveChatHistory();
        } else if (previousState && !this.storageEnabled) {
            console.log('Storage was disabled, chat history will not be saved');
        }
    }

    adjustTextareaHeight() {
        this.messageInput.style.height = 'auto';
        this.messageInput.style.height = (this.messageInput.scrollHeight) + 'px';
    }

    getSelectedAvatar() {
        const savedAvatar = localStorage.getItem('selectedAvatar');
        console.log('Getting selected avatar from localStorage:', savedAvatar);
        
        if (savedAvatar) {
            try {
                const avatar = JSON.parse(savedAvatar);
                // Ensure the avatar has a numeric ID
                if (avatar && typeof avatar.id === 'string') {
                    avatar.id = parseInt(avatar.id, 10);
                }
                console.log('Parsed avatar with ID:', avatar.id);
                return avatar;
            } catch (e) {
                console.error('Error parsing avatar data:', e);
            }
        }
        
        // Default avatar if none is selected
        return {
            id: 1,
            name: 'Luna',
            imageClass: 'luna-avatar'
        };
    }

    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message) return;

        // Add user message to chat
        this.addMessage(message, 'user');
        this.messageInput.value = '';
        this.adjustTextareaHeight();

        // Save chat history after user message
        if (this.storageEnabled) {
            this.saveChatHistory();
        }

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
            
            // Save chat history again after AI response
            if (this.storageEnabled) {
                this.saveChatHistory();
            }
        } catch (error) {
            console.error('Error getting AI response:', error);
            this.hideTypingIndicator();
            this.addMessage('Sorry, I encountered an error. Please try again.', 'ai');
            
            // Save chat history even if there was an error
            if (this.storageEnabled) {
                this.saveChatHistory();
            }
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
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message,
                avatar: this.selectedAvatar
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to get AI response');
        }

        const data = await response.json();
        return data.response;
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
        
        // Get messages from the chat display
        const messages = Array.from(this.chatMessages.children).map(msg => ({
            content: msg.textContent,
            sender: msg.classList.contains('user') ? 'user' : 'ai'
        }));
        
        // Get avatar ID for storage key - ensure it's a number
        const avatarId = typeof this.selectedAvatar.id === 'number' ? 
                        this.selectedAvatar.id : 
                        parseInt(this.selectedAvatar.id, 10) || 1;
                        
        console.log(`Saving ${messages.length} messages for avatar ID: ${avatarId} (${this.selectedAvatar.name})`);
        
        // Use a unique key for each avatar
        const storageKey = `chatHistory_avatar_${avatarId}`;
        localStorage.setItem(storageKey, JSON.stringify(messages));
        
        // Verify that the data was saved correctly
        const savedData = localStorage.getItem(storageKey);
        if (savedData) {
            try {
                const parsedData = JSON.parse(savedData);
                console.log(`Successfully saved and verified ${parsedData.length} messages for ${this.selectedAvatar.name}`);
            } catch (error) {
                console.error('Error verifying saved chat history:', error);
            }
        } else {
            console.error('Failed to save chat history for', this.selectedAvatar.name);
        }
    }

    loadChatHistory() {
        // Only load if storage is enabled
        if (!this.storageEnabled) return;
        
        // Clear existing messages first
        this.clearChatDisplay();
        
        // Get avatar ID for storage key - ensure it's a number
        const avatarId = typeof this.selectedAvatar.id === 'number' ? 
                        this.selectedAvatar.id : 
                        parseInt(this.selectedAvatar.id, 10) || 1;
                        
        console.log(`Loading chat history for avatar ID: ${avatarId} (${this.selectedAvatar.name})`);
        
        // Check for old format key first and migrate if needed
        const oldKey = `chatHistory_${avatarId}`;
        const newKey = `chatHistory_avatar_${avatarId}`;
        const oldHistory = localStorage.getItem(oldKey);
        
        if (oldHistory) {
            console.log(`Found chat history in old format for avatar ${avatarId}, migrating...`);
            localStorage.setItem(newKey, oldHistory);
            localStorage.removeItem(oldKey);
        }
        
        // Use the unique key for this avatar
        const history = localStorage.getItem(newKey);
        
        if (history) {
            try {
                const messages = JSON.parse(history);
                
                // Only add messages if they exist and are in the correct format
                if (Array.isArray(messages) && messages.length > 0) {
                    messages.forEach(msg => {
                        if (msg && msg.content && msg.sender) {
                            this.addMessage(msg.content, msg.sender);
                        }
                    });
                    console.log(`Loaded ${messages.length} messages for avatar ID: ${avatarId} (${this.selectedAvatar.name})`);
                } else {
                    console.log(`Empty or invalid chat history for avatar ID: ${avatarId}`);
                }
            } catch (error) {
                console.error('Error parsing chat history:', error);
                // If there's an error, clear the corrupted history
                localStorage.removeItem(newKey);
            }
        } else {
            console.log(`No chat history found for avatar ID: ${avatarId} (${this.selectedAvatar.name})`);
        }
    }

    clearChatHistory() {
        // Get avatar ID for storage key - ensure it's a number
        const avatarId = typeof this.selectedAvatar.id === 'number' ? 
                        this.selectedAvatar.id : 
                        parseInt(this.selectedAvatar.id, 10) || 1;
        
        if (confirm(`Are you sure you want to clear the chat history for ${this.selectedAvatar.name}?`)) {
            console.log(`Clearing chat history for avatar ID: ${avatarId} (${this.selectedAvatar.name})`);
            
            // Remove using the unique key for this avatar
            localStorage.removeItem(`chatHistory_avatar_${avatarId}`);
            this.clearChatDisplay();
        }
    }
    
    clearChatDisplay() {
        // Clear the chat display without removing from storage
        this.chatMessages.innerHTML = '';
    }

    clearAllChatHistories() {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('chatHistory_avatar_')) {
                localStorage.removeItem(key);
            }
        }
        console.log('Cleared all chat histories');
    }

    // Method to clean up localStorage and remove any old chat history data
    cleanupLocalStorage() {
        console.log('Cleaning up localStorage...');
        
        // Get all keys in localStorage
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            
            // Check for old format keys
            if (key.startsWith('chatHistory_') && !key.startsWith('chatHistory_avatar_')) {
                keysToRemove.push(key);
            }
        }
        
        // Remove old keys
        keysToRemove.forEach(key => {
            console.log(`Removing old key: ${key}`);
            localStorage.removeItem(key);
        });
        
        console.log(`Removed ${keysToRemove.length} old keys from localStorage`);
    }

    // Debug method to check localStorage state
    debugLocalStorage() {
        console.log('===== DEBUG: localStorage state =====');
        console.log('Current avatar:', this.selectedAvatar);
        
        // List all localStorage keys
        console.log('All localStorage keys:');
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            console.log(`- ${key}`);
        }
        
        // Check for all possible chat history keys
        console.log('Checking for chat histories:');
        for (let i = 1; i <= 3; i++) {
            const oldKey = `chatHistory_${i}`;
            const newKey = `chatHistory_avatar_${i}`;
            
            const oldData = localStorage.getItem(oldKey);
            const newData = localStorage.getItem(newKey);
            
            console.log(`Avatar ${i}:`);
            console.log(`- Old format (${oldKey}): ${oldData ? 'EXISTS' : 'not found'}`);
            console.log(`- New format (${newKey}): ${newData ? 'EXISTS' : 'not found'}`);
            
            // If old format exists but new doesn't, migrate it
            if (oldData && !newData) {
                console.log(`Migrating chat history for avatar ${i} to new format`);
                localStorage.setItem(newKey, oldData);
                localStorage.removeItem(oldKey);
            }
        }
        
        console.log('===== END DEBUG =====');
    }

    // Method to switch avatar
    switchAvatar(avatarId) {
        // Get the avatar from localStorage or fetch it
        const avatarData = localStorage.getItem('selectedAvatar');
        let avatar;
        
        try {
            avatar = JSON.parse(avatarData);
            
            // Ensure the avatar has a numeric ID
            if (avatar && typeof avatar.id === 'string') {
                avatar.id = parseInt(avatar.id, 10);
            }
            
            console.log('Switching to avatar:', avatar);
        } catch (e) {
            console.error('Error parsing avatar data:', e);
            return;
        }
        
        // Save current chat history before switching if storage is enabled
        if (this.storageEnabled && this.selectedAvatar) {
            console.log(`Saving chat history for current avatar (${this.selectedAvatar.name}) before switching`);
            this.saveChatHistory();
        }
        
        // Update selected avatar
        this.selectedAvatar = avatar;
        
        // Always clear the chat display first
        this.clearChatDisplay();
        console.log(`Switched to avatar: ${this.selectedAvatar.name} (ID: ${this.selectedAvatar.id})`);
        
        // Reload chat history for this avatar if storage is enabled
        if (this.storageEnabled) {
            console.log(`Loading chat history for new avatar: ${this.selectedAvatar.name}`);
            this.loadChatHistory();
        }
        
        // Update UI elements
        if (typeof updateAvatarUI === 'function') {
            updateAvatarUI(this.selectedAvatar);
        } else {
            // Fallback if updateAvatarUI is not available
            const avatarName = document.getElementById('avatarName');
            if (avatarName && this.selectedAvatar) {
                avatarName.textContent = this.selectedAvatar.name;
            }
            
            // Update avatar image class
            const avatarImageElement = document.querySelector('.selected-avatar-image');
            if (avatarImageElement && this.selectedAvatar) {
                // Remove existing avatar classes
                avatarImageElement.classList.remove('luna-avatar', 'stella-avatar', 'aurora-avatar');
                
                // Add the correct avatar class based on the name
                const imageClass = this.selectedAvatar.imageClass || 
                                  `${this.selectedAvatar.name.toLowerCase()}-avatar`;
                avatarImageElement.classList.add(imageClass);
            }
        }
    }
}

// Initialize chat when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.chatManager = new ChatManager();
});
