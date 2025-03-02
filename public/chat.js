async getAIResponse(message) {
    try {
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: message })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to get AI response');
        }

        const data = await response.json();
        return data.response;
    } catch (error) {
        console.error('Error getting AI response:', error);
        throw error;
    }
}