# ChatNavigator

ChatNavigator is a Chrome extension that allows users to chat with web articles using AI-powered natural language processing. It extracts content from web pages and provides an interactive chat interface to ask questions about the article's content.

## Features

- Extract article content from web pages
- Interactive chat interface within the Chrome extension popup
- AI-powered responses to user queries about the article
- Persistent chat history for each article
- Automatic cleanup of old chat data to manage storage

## Technology Stack

- Frontend: HTML, CSS, JavaScript
- Backend: Python with Flask
- AI Model: Google's Generative AI (via google-generativeai library)
- Chrome Extension APIs

## Setup

1. Clone the repository
2. Install the required Python packages:
   ```bash
   pip install -r requirements.txt
   ```
3. Set up your environment variables (including your Google AI API key)
4. Load the extension in Chrome:
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the extension directory

## Usage

1. Navigate to a web article
2. Click the ChatNavigator extension icon
3. Ask questions about the article in the chat interface
4. Receive AI-generated responses based on the article's content

## Development

- `popup.html` and `popup.js`: Extension popup interface
- `app.py`: Flask backend for processing requests and interacting with the AI model
- `manifest.json`: Chrome extension configuration

## Deployment

The backend is designed to be deployed on Chemicloud or a similar Python-compatible hosting service.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Acknowledgements

- Google Generative AI
- Flask and Flask-CORS
- Chrome Extensions API