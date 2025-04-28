const express = require('express');
const path = require('path');
const morgan = require('morgan');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware to parse JSON
app.use(express.json());
app.use(cors()); // Enable CORS
app.use(morgan('dev')); // Logging middleware

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Basic route for the home page
app.get('/', (req, res) => {
    res.send('Welcome to the Celesti Lumen Chat!');
});

// Example additional route
app.get('/api/chat', (req, res) => {
    res.json({ message: 'This is the chat API endpoint.' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});