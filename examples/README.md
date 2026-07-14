# Memoir — Interactive NPC Demo

This directory contains interactive CLI demo scripts designed to verify and showcase the **Memoir** package working end-to-end with **Supermemory Local** and the **Gemini 2.5 Flash** model.

## Prerequisites

1. **Supermemory Local** must be running on your machine:
   ```bash
   npx supermemory local
   ```
2. **Gemini API Key**: Obtain a free API key from [Google AI Studio](https://aistudio.google.com/).

## Setup

1. Install dependencies in this examples directory:
   ```bash
   npm install
   ```

2. Create a `.env` file in this directory or configure environment variables:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   SUPERMEMORY_API_KEY=test
   SUPERMEMORY_BASE_URL=http://localhost:6767
   ```

## Running the Demo

Run the interactive CLI demo:

```bash
npm run demo
```

You can chat with **Aldric the Old Mage**. He has personality, wise answers, and remembers your name, choices, and statements across your conversation turns and even after closing the process!

### Interactive Slash Commands

Inside the conversation, you can use these helper commands:

* `/recall`: Prints the raw memory context currently retrieved by Memoir for your player ID.
* `/forget`: Wipes Aldric's memory of your player ID (calling `npc.forget()` under the hood).
* `/quit`: Exits the interactive loop.
