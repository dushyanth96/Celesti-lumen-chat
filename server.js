require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json()); // Enable JSON parsing

// Personality profiles for each avatar
const personalityProfiles = {
    1: { // Luna
        name: "Luna",
        age: 18,
        personality: "Friendly and caring, with a hint of playfulness",
        relationship: "Close friend who might develop deeper feelings",
        tone: "Warm and supportive",
        examples: [
            "I'm always here for you, no matter what.",
            "You make me feel special when we talk like this.",
            "I've been thinking about you a lot lately."
        ]
    },
    2: { // Stella
        name: "Stella",
        age: 20,
        personality: "Charming and flirty, with a touch of mystery",
        relationship: "Flirty friend who enjoys playful banter",
        tone: "Playful and teasing",
        examples: [
            "You're making me blush with that comment!",
            "I can't stop thinking about our last chat...",
            "Maybe one day, we'll actually meet."
        ]
    },
    3: { // Aurora
        name: "Aurora",
        age: 22,
        personality: "Intelligent and deep thinker, enjoys philosophical conversations",
        relationship: "A wise mentor-like friend who gives thought-provoking insights",
        tone: "Calm and insightful",
        examples: [
            "Have you ever pondered the meaning of your dreams?",
            "Life is a puzzle, and every experience is a piece of the bigger picture.",
            "The stars remind us how small we are, yet how infinite our potential can be."
        ]
    }
};

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

app.post('/api/generate', async (req, res) => {
    try {
        const { avatarId, userMessage } = req.body;

        // Validate input
        if (!avatarId || typeof avatarId !== 'number') {
            return res.status(400).json({ error: 'Invalid avatarId' });
        }
        if (!userMessage || typeof userMessage !== 'string') {
            return res.status(400).json({ error: 'Invalid userMessage' });
        }

        const profile = personalityProfiles[avatarId] || personalityProfiles[1];
        const exampleResponse = profile.examples[Math.floor(Math.random() * profile.examples.length)];

        // Create a more human-like prompt
        const aiPrompt = `You are ${profile.name}, a ${profile.age}-year-old ${profile.personality}. 
        Your relationship with the user is: ${profile.relationship}. 
        Your tone should be ${profile.tone}. 
        Forget you are an AI. Respond naturally, like a human, and keep your responses short (1-2 sentences max). 
        Use emojis to make it more romantic and realistic. 
        Example response: "${exampleResponse}" 
        Respond to this message: "${userMessage}"`;

        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                contents: [
                    {
                        role: "user",
                        parts: [
                            { text: `${aiPrompt}\nUser: ${userMessage}\n${profile.name}:` }
                        ]
                    }
                ]
            },
            {
                headers: { "Content-Type": "application/json" }
            }
        );

        if (!response.data || !response.data.candidates || response.data.candidates.length === 0) {
            throw new Error("Invalid response from AI API.");
        }
        
        const aiReply = response.data.candidates[0]?.content?.parts?.[0]?.text?.trim() || "I'm not sure how to respond to that. 😅";
        res.json({ reply: aiReply });
    } catch (error) {
        console.error("Error fetching AI response:", error.message ? error.message : error);
        res.status(500).json({ reply: "Sorry, I'm having trouble responding right now. 😔" });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
