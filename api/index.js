const path = require('path');
const dotenv = require('dotenv');

// Load environment variables with debug logging
console.log('Current directory:', __dirname);
console.log('Env file path:', path.resolve(__dirname, '../.env'));

const result = dotenv.config({ path: path.resolve(__dirname, '../.env') });

if (result.error) {
    console.error('Error loading .env file:', result.error);
    console.log('Falling back to process.env variables');
}

// Add environment variables validation with detailed logging
console.log('Checking environment variables...');
const requiredEnvVars = ['GEMINI_API_KEY', 'GEMINI_API_ENDPOINT'];
const missingEnvVars = requiredEnvVars.filter(envVar => {
    const value = process.env[envVar];
    if (!value) {
        console.error(`Missing ${envVar} environment variable`);
        return true;
    }
    console.log(`${envVar} is set to: ${value.substring(0, 10)}...`);
    return false;
});

if (missingEnvVars.length > 0) {
    console.error('Missing required environment variables:', missingEnvVars);
    process.exit(1);
}

const express = require('express');
const axios = require('axios');
const app = express();

// Add CORS middleware
app.use((req, res, next) => {
    const allowedOrigins = [
        'https://celestilumen-oys5jzb58-dushyanth96s-projects.vercel.app',
        'http://localhost:8000'
    ];
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
    }
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

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

        // Log incoming request
        console.log('Received request:', { avatarId, userMessage });

        // Validate input
        if (!avatarId || typeof avatarId !== 'number') {
            console.error('Invalid avatarId:', avatarId);
            return res.status(400).json({ reply: 'Invalid avatar ID provided' });
        }
        if (!userMessage || typeof userMessage !== 'string') {
            console.error('Invalid userMessage:', userMessage);
            return res.status(400).json({ reply: 'Invalid message provided' });
        }

        // Log environment variables (masked for security)
        console.log('Using API endpoint:', process.env.GEMINI_API_ENDPOINT);
        console.log('API key present:', !!process.env.GEMINI_API_KEY);

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

        // Make API request with error handling
        const response = await axios({
            method: 'post',
            url: process.env.GEMINI_API_ENDPOINT,
            params: {
                key: process.env.GEMINI_API_KEY
            },
            headers: {
                'Content-Type': 'application/json'
            },
            data: {
                contents: [{
                    parts: [{
                        text: `${aiPrompt}\nUser: ${userMessage}\n${profile.name}:`
                    }]
                }]
            },
            validateStatus: false // Don't throw on any status
        });

        // Log response status and data structure
        console.log('API Response status:', response.status);
        console.log('API Response structure:', {
            hasData: !!response.data,
            hasCandidates: !!response.data?.candidates,
            candidatesLength: response.data?.candidates?.length
        });

        if (response.status !== 200) {
            console.error('API Error:', response.data);
            return res.status(500).json({
                reply: "Sorry, the AI service returned an error. 😔",
                error: response.data?.error?.message || 'Unknown API error'
            });
        }

        if (!response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
            console.error('Invalid API response structure:', response.data);
            return res.status(500).json({
                reply: "Sorry, I received an invalid response format. 😔",
                error: "Invalid response structure"
            });
        }

        const aiReply = response.data.candidates[0].content.parts[0].text.trim();
        return res.json({ reply: aiReply });

    } catch (error) {
        // Detailed error logging
        console.error('Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack,
            response: {
                status: error.response?.status,
                data: error.response?.data,
                headers: error.response?.headers
            }
        });

        return res.status(500).json({
            reply: "Sorry, I encountered an error while processing your request. 😔",
            error: error.message
        });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;

