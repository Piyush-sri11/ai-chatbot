
# Anurag Singh

A versatile chat application that allows you to communicate with various AI models from different providers, including:

- OpenAI (GPT-4o, GPT-o1, GPT-o1 Mini, GPT-o1 Preview, DALL-E 2/3, etc.)
- Anthropic (Claude 3 Opus, Sonnet, Haiku)
- Google (Gemini 1.5 Pro, Gemini 1.5 Flash, Gemini 2 Pro)
- Meta (Llama 3 70B, Llama 3 8B)

## Features

- Switch between different AI models and providers
- File upload support (images and documents) based on model capabilities
- Persistent chat history with Redux
- Markdown rendering for AI responses
- Conversation management (rename, delete, clear)
- Clean black and white theme

## Setup

1. Clone the repository
2. Install dependencies with `npm install`
3. Copy `.env.example` to `.env` and add your API keys:
   ```
   VITE_OPENAI_API_KEY=your_openai_api_key_here
   VITE_ANTHROPIC_API_KEY=your_anthropic_api_key_here
   VITE_GOOGLE_API_KEY=your_google_api_key_here
   VITE_LLAMA_API_KEY=your_llama_api_key_here
   ```
4. Run the development server with `npm run dev`

## Usage

- Click "New Chat" to start a conversation
- Select your preferred AI model from the dropdown
- Type messages and upload files as needed (images and documents supported by most models)
- Manage conversations from the sidebar

## Implementation Details

- Uses Redux with redux-persist for state management
- Implements file upload capabilities with client-side preview
- Formats AI responses with proper markdown rendering
- Clean minimal UI with black and white theme
