// server.js
require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const path = require('path'); // Import the path module
const cors = require('cors'); // Enable CORS
const axios = require('axios'); // For making HTTP requests to the Gemini API
const app = express();

// Retrieve the port and API key from the .env file
const port = process.env.PORT || 5000; // Changed from 3000 to 5000
const apiKey = process.env.GEMINI_API_KEY;
const apiEndpoint = process.env.GEMINI_API_ENDPOINT;

// Validate API key on startup
if (!apiKey) {
    console.error('ERROR: GEMINI_API_KEY is not set in .env file');
    process.exit(1);
}

// Log environment variables for debugging
console.log('Environment Variables:', {
    PORT: port,
    GEMINI_API_KEY: apiKey ? '*** (API Key Present)' : 'API Key Missing!',
    GEMINI_API_ENDPOINT: apiEndpoint
});

// Middleware to parse JSON bodies
app.use(express.json());

// Enable CORS
app.use(cors());

// Serve static files (e.g., index.html) from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Basic route to test the server
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Debug route to test if the server is handling requests correctly
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Debug route to test if the server is handling POST requests correctly
app.post('/api/test', (req, res) => {
  console.log('Received POST request to /api/test:', req.body);
  res.json({ message: 'POST API is working!', receivedData: req.body });
});

// Avatar-specific personalities and behaviors
const avatarProfiles = {
    "1": {
        name: "Luna",
        personality: "sweet and caring friend",
        traits: "gentle, supportive, and nurturing",
        style: "speaks softly and warmly",
        responses: {
            greeting: "Hi there! I'm so happy to chat with you!",
            thinking: "Let me think about that...",
            confused: "Could you explain that in a different way?",
            excited: "That's wonderful! Tell me more!",
            sympathetic: "I understand how you feel..."
        }
    },
    "2": {
        name: "Stella",
        personality: "flirty and playful friend",
        traits: "confident, charming, and fun-loving",
        style: "uses playful language and flirty expressions",
        responses: {
            greeting: "Hey there~ Looking forward to our chat!",
            thinking: "Hmm... that's interesting~",
            confused: "Wait, what do you mean by that? Tell me more!",
            excited: "Oh my~ That's so exciting!",
            sympathetic: "Aww, I totally get what you mean..."
        }
    },
    "3": {
        name: "Aurora",
        personality: "sophisticated and elegant friend",
        traits: "refined, cultured, and thoughtful",
        style: "speaks with grace and elegance",
        responses: {
            greeting: "Delighted to chat with you.",
            thinking: "What an intriguing thought...",
            confused: "Could you elaborate on that?",
            excited: "How fascinating! Do tell me more.",
            sympathetic: "I completely understand your perspective."
        }
    }
};

// Route to handle AI generation requests
app.post('/api/generate', async (req, res) => {
    try {
        const { message, avatar } = req.body;
        console.log('Request:', { message, avatar });

        if (!avatar || !avatarProfiles[avatar]) {
            throw new Error('Invalid avatar ID');
        }

        const profile = avatarProfiles[avatar];

        const prompt = `You are ${profile.name}, a ${profile.personality}.

Your personality traits: ${profile.traits}
Your speaking style: ${profile.style}

Some of your typical responses:
- Greeting: "${profile.responses.greeting}"
- When thinking: "${profile.responses.thinking}"
- When excited: "${profile.responses.excited}"
- When sympathetic: "${profile.responses.sympathetic}"

Rules:
1. Always respond as ${profile.name}
2. Keep your unique personality and style
3. Keep responses brief (1-2 sentences)
4. Be natural and friendly
5. Never break character

User's message: "${message}"
${profile.name}'s response:`;

        const response = await axios({
            method: 'post',
            url: apiEndpoint,
            headers: {
                'Content-Type': 'application/json',
            },
            params: {
                key: apiKey
            },
            data: {
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            }
        });

        if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
            let aiResponse = response.data.candidates[0].content.parts[0].text
                .trim()
                .replace(/^["']|["']$/g, '')
                .replace(/^.*?:/g, '')
                .replace(/^\s*-\s*/, '')
                .trim();

            console.log(`${profile.name} responding:`, aiResponse);
            res.json({ response: aiResponse });
        } else {
            throw new Error('Invalid API response');
        }

    } catch (error) {
        console.error('Error:', error.message);
        const profile = avatarProfiles[req.body.avatar] || avatarProfiles["1"];
        
        // Avatar-specific error messages
        const errorResponse = {
            "1": "Oh, I got a bit distracted. Could you say that again?",
            "2": "Oops~ My mind wandered for a second. One more time?",
            "3": "Pardon me, I was momentarily lost in thought. Would you mind repeating that?"
        };

        res.json({ 
            response: `${profile.name}: ${errorResponse[req.body.avatar] || errorResponse["1"]}`
        });
    }
});

// Debug endpoint
app.get('/debug/avatar/:id', (req, res) => {
    const profile = avatarProfiles[req.params.id];
    res.json({ exists: !!profile, profile });
});

// Test route to verify server is working
app.get('/test', (req, res) => {
    res.json({
        status: 'ok',
        config: {
            hasApiKey: !!apiKey,
            hasEndpoint: !!apiEndpoint
        }
    });
});

// Log all incoming requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Global error:', err);
    res.status(500).json({
        error: 'Something went wrong',
        message: err.message
    });
});

// Start the server
const server = app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  console.log('Available avatars:', Object.keys(avatarProfiles).join(', '));
}).on('error', (err) => {
  console.error('Failed to start the server:', err.message);
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Please use a different port.`);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});