# Getting Started

Memoir is a lightweight, open-source TypeScript SDK designed to give AI-driven NPCs (or any conversational character) persistent, long-term memory. Instead of building a complex memory pipeline, vector search database, and conflict-resolution engine yourself, Memoir provides a simple, strongly-typed bridge to **Supermemory Local**.

## Prerequisites

Before using Memoir, you must have:

1. **Node.js** version 18.0.0 or higher.
2. **Supermemory Local** running on your local machine. You can start it using:
   ```bash
   npx supermemory local
   ```
   By default, Supermemory Local runs a REST API server at `http://localhost:6767`.

## Installation

Install Memoir via npm:

```bash
npm install memoir-npc
```

## Quickstart

Here is how you configure Memoir and give an NPC the ability to save and recall conversations:

```typescript
import { Memoir } from 'memoir-npc';

// 1. Initialize Memoir pointing to your local Supermemory instance
const memoir = new Memoir({
  supermemoryApiKey: 'your_supermemory_key', // Required (can be dummy key for local mode)
  supermemoryBaseUrl: 'http://localhost:6767'  // Default
});

// 2. Perform a health check before launching your game / application
const isReady = await memoir.healthCheck();
if (!isReady) {
  console.error("Supermemory Local is not running! Run: npx supermemory local");
  process.exit(1);
}

// 3. Create a handle for your NPC
const merchant = memoir.npc('shopkeeper-aldaric');

// 4. Recall memories of a specific player when they start talking
const playerId = 'player-guild-leader';
const pastMemories = await merchant.recallContext(playerId);

console.log('Past Context for prompt:', pastMemories);
// Pass `pastMemories` into your AI model's context or system prompt!

// 5. Save the interaction once the NPC replies
const playerInput = "Can you sell me that sword?";
const npcReply = "Ah, the Blade of Dawn! It requires 500 gold coins, traveler.";

await merchant.saveInteraction(playerId, playerInput, npcReply);
```
