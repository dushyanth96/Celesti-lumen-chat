const express = require('express');
const router = express.Router();

// Example AI response logic
router.post('/chat', async (req, res) => {
    try {
        const { message, relationshipStatus, avatarId } = req.body;

        // Validate input
        if (!message || !relationshipStatus || !avatarId) {
            return res.status(400).json({ error: 'Missing required fields: message, relationshipStatus, or avatarId' });
        }

        console.log(`Received message: "${message}" with relationship status: "${relationshipStatus}" and avatarId: ${avatarId}`);

        // Example AI response logic based on relationship status
        let aiResponse;
        switch (relationshipStatus) {
            case 'friend':
                aiResponse = `As your friend, I think: "${message}" sounds great!`;
                break;
            case 'best_friend':
                aiResponse = `As your best friend, I totally agree with: "${message}"!`;
                break;
            case 'lover':
                aiResponse = `As your lover, I feel deeply connected to: "${message}".`;
                break;
            case 'romance_talker':
                aiResponse = `As your romance talker, "${message}" makes my heart flutter!`;
                break;
            default:
                aiResponse = `I'm not sure how to respond to: "${message}" in this context.`;
        }

        // Send the AI response
        res.json({ avatarId, relationshipStatus, aiResponse });
    } catch (error) {
        console.error('Error handling chat request:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
