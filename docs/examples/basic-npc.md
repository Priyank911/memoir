# Basic NPC Example

This example demonstrates how to integrate Memoir with the official **Gemini SDK** (`@google/genai`) to create a conversational loop for an NPC named Aldric.

## Full Code Example

Ensure you have installed Memoir and the Gemini SDK:
```bash
npm install memoir-npc @google/genai dotenv tsx
```

Create a file named `aldric.ts`:

```typescript
import { Memoir } from 'memoir-npc';
import { GoogleGenAI } from '@google/genai';
import * as readline from 'node:readline';
import 'dotenv/config';

// 1. Initialize Memoir
const memoir = new Memoir({
  supermemoryApiKey: process.env.SUPERMEMORY_API_KEY ?? 'test',
  supermemoryBaseUrl: 'http://localhost:6767'
});

// 2. Initialize Gemini
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!
});

// Define personality and instruction set
const SYSTEM_PROMPT = `You are Aldric, a wise old wizard.
Reply in 1-2 short sentences.
Reference past memories if they are provided.`;

async function chat() {
  const isUp = await memoir.healthCheck();
  if (!isUp) {
    console.error("Supermemory Local is down! Run `npx supermemory local` first.");
    process.exit(1);
  }

  const npc = memoir.npc('aldric-the-wizard');
  const playerId = 'player-1';

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const ask = () => {
    rl.question('You: ', async (input) => {
      if (input.trim() === 'quit') {
        rl.close();
        return;
      }

      // 1. Recall past memories for this player
      const context = await npc.recallContext(playerId);

      // 2. Build full prompt
      const prompt = `${SYSTEM_PROMPT}\n\nMemories of this player:\n${context || 'None'}\n\nPlayer: "${input}"\n\nWizard:`;

      // 3. Generate response
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });
      const reply = response.text?.trim() ?? '...';

      console.log(`Aldric: ${reply}`);

      // 4. Save interaction to memory
      await npc.saveInteraction(playerId, input, reply);

      ask();
    });
  };

  console.log("Aldric: Ah, hello traveler! (Type 'quit' to exit)\n");
  ask();
}

chat();
```
To run the script:
```bash
npx tsx aldric.ts
```
