// ...existing code...
async function sendMessage(message) {
    try {
        const response = await fetch(`${CONFIG.API_URL}/api/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                avatarId: selectedAvatar.id,
                userMessage: message
            })
        });
        // ...existing code...
    } catch (error) {
        console.error('Error sending message:', error);
    }
}
// ...existing code...
