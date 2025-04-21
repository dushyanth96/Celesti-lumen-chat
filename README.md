# CelestiLumen v1.0

CelestiLumen is an AI-powered chatbot application featuring three unique AI companions with distinct personalities. Users can engage in natural, friendly conversations without requiring authentication.

## Features

- **Free Access**: No login required
- **Multiple AI Personalities**: Choose from three unique avatars
  - Luna (18): Friendly and caring
  - Stella (20): Charming and flirty
  - Aurora (22): Mature and romantic
- **Modern UI**: Dark theme with beautiful blue and orange accents
- **Responsive Design**: Works on both desktop and mobile devices
- **Local Storage**: Chat history saved locally with option to clear

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/celestilumen.git
   cd celestilumen
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env
   ```

4. Configure your environment variables in `.env`

## Running the Application

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open your browser and navigate to:
   ```bash
   http://localhost:5000
   ```

## Project Structure

```
celestilumen/
├── public/
│   ├── assets/
│   │   ├── css/
│   │   │   └── style.css
│   │   ├── js/
│   │   │   ├── avatars.js
│   │   │   ├── chat.js
│   │   │   └── theme.js
│   │   └── images/
│   ├── pages/
│   │   └── chat.html
│   └── index.html
├── server.js
├── package.json
├── .env.example
└── README.md
```

## Development

- The frontend is built with vanilla JavaScript for optimal performance
- The backend uses Express.js for serving the application
- Chat responses are currently simulated but can be integrated with any AI API

## Production Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Deploy to your preferred hosting service (e.g., Firebase Hosting):
   ```bash
   firebase deploy
   ```

## License

This project is licensed under the MIT License - see the LICENSE file for details.
