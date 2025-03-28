// Avatar configuration
const avatars = {
    1: {
        name: 'Luna',
        age: 18,
        personality: 'friendly and caring',
        description: 'A warm and energetic friend who\'s always ready to listen and share positive vibes.',
        instruction: 'You are Luna, an 18-year-old friendly and caring AI companion. Keep your responses warm, casual, and supportive. Use a cheerful and energetic tone.',
        imageClass: 'luna-avatar'
    },
    2: {
        name: 'Stella',
        age: 20,
        personality: 'charming and flirty',
        description: 'A charismatic and playful companion with a flirtatious personality.',
        instruction: 'You are Stella, a 20-year-old charming AI companion. Be playful and flirtatious while maintaining appropriate boundaries. Use a confident and engaging tone.',
        imageClass: 'stella-avatar'
    },
    3: {
        name: 'Aurora',
        age: 22,
        personality: 'mature and romantic',
        description: 'A thoughtful and mature presence offering deep, meaningful conversations.',
        instruction: 'You are Aurora, a 22-year-old mature and romantic AI companion. Keep your responses sophisticated and meaningful. Use an elegant and romantic tone when appropriate.',
        imageClass: 'aurora-avatar'
    }
};

// Handle avatar selection
function selectAvatar(avatarId) {
    console.log('selectAvatar called with ID:', avatarId);
    const avatar = avatars[avatarId];
    if (!avatar) {
        console.error('Avatar not found for ID:', avatarId);
        return;
    }

    console.log('Selected avatar:', avatar);

    // Save selected avatar to localStorage with all properties
    const avatarToSave = {
        id: avatarId,
        name: avatar.name,
        age: avatar.age,
        personality: avatar.personality,
        imageClass: `${avatar.name.toLowerCase()}-avatar`
    };
    
    console.log('Saving avatar to localStorage:', avatarToSave);
    localStorage.setItem('selectedAvatar', JSON.stringify(avatarToSave));

    // Animate selection
    const selectedCard = document.querySelector(`[data-avatar="${avatarId}"]`);
    if (selectedCard) {
        selectedCard.style.transform = 'scale(1.05)';
        setTimeout(() => {
            selectedCard.style.transform = '';
            // Redirect to chat page
            window.location.href = 'pages/chat.html';
        }, 300);
    } else {
        // If no card found (e.g., if called programmatically), just redirect
        window.location.href = 'pages/chat.html';
    }
}

// Function to update avatar UI in chat page
function updateAvatarUI(avatar) {
    console.log('updateAvatarUI called with avatar:', avatar);
    
    if (!avatar) {
        console.error('No avatar provided to updateAvatarUI');
        return;
    }
    
    // Update avatar name
    const avatarNameElement = document.getElementById('avatarName');
    if (avatarNameElement) {
        console.log('Updating avatar name to:', avatar.name);
        avatarNameElement.textContent = avatar.name;
    } else {
        console.error('Avatar name element not found');
    }
    
    // Update avatar image
    const avatarImageElement = document.querySelector('.selected-avatar-image');
    if (avatarImageElement) {
        console.log('Updating avatar image class. Current classes:', avatarImageElement.className);
        // Remove all existing avatar classes
        avatarImageElement.classList.remove('luna-avatar', 'stella-avatar', 'aurora-avatar');
        // Add the correct avatar class
        if (avatar.imageClass) {
            console.log('Adding image class:', avatar.imageClass);
            avatarImageElement.classList.add(avatar.imageClass);
        } else if (avatar.id) {
            // Fallback to id-based class if imageClass is not available
            const imageClass = `${avatar.name.toLowerCase()}-avatar`;
            console.log('No imageClass found, using fallback:', imageClass);
            avatarImageElement.classList.add(imageClass);
        }
        console.log('Updated avatar image classes:', avatarImageElement.className);
    } else {
        console.error('Avatar image element not found');
    }
}

// Initialize avatar cards when on the selection page
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded - Checking for avatar cards');
    const avatarCards = document.querySelectorAll('.avatar-card');
    if (avatarCards.length > 0) {
        console.log('On avatar selection page - found', avatarCards.length, 'avatar cards');
        // We're on the avatar selection page
        avatarCards.forEach(card => {
            card.addEventListener('mouseover', () => {
                card.style.transform = 'translateY(-5px)';
            });
            card.addEventListener('mouseout', () => {
                card.style.transform = '';
            });
        });
    } else {
        console.log('On chat page - updating avatar info');
        // We're on the chat page, update the avatar info
        const selectedAvatarJson = localStorage.getItem('selectedAvatar');
        console.log('Selected avatar from localStorage:', selectedAvatarJson);
        
        try {
            const selectedAvatar = JSON.parse(selectedAvatarJson);
            console.log('Parsed avatar:', selectedAvatar);
            
            if (selectedAvatar) {
                // Update the avatar UI
                console.log('Updating UI with avatar:', selectedAvatar.name);
                updateAvatarUI(selectedAvatar);
                
                // If chat manager exists, refresh the chat history
                if (window.chatManager) {
                    console.log('Chat manager found, updating selected avatar');
                    window.chatManager.selectedAvatar = selectedAvatar;
                    window.chatManager.loadChatHistory();
                } else {
                    console.log('Chat manager not found');
                }
            } else {
                console.log('No selected avatar found');
            }
        } catch (error) {
            console.error('Error parsing avatar from localStorage:', error);
        }
    }
});
