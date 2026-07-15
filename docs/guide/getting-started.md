# Getting Started

Memoir is a developer-centric Narrative AI Framework designed to give AI-driven NPCs persistent, long-term memory and rigid behavioral profiles. By wrapping **Supermemory Local**, it bridges the gap between unstructured text database memories and strict, deterministic game engines.

## Prerequisites

Before using Memoir, you must have:

1. **Node.js** version 18.0.0 or higher.
2. **Supermemory Local** running on your local machine. Start it with:
   ```bash
   npx supermemory local
   ```
   By default, Supermemory Local runs at `http://localhost:6767`.

## Installation

Install Memoir via npm:

```bash
npm install memoir-npc
```

---

## Quickstart

Here is how you configure Memoir and give an NPC the ability to save and recall conversations:

```typescript
import { Memoir } from 'memoir-npc';

// 1. Initialize Memoir
const memoir = new Memoir({
  supermemoryApiKey: 'your_supermemory_key',
  geminiApiKey: 'your_gemini_api_key', // Required for advanced locking & chat features
  supermemoryBaseUrl: 'http://localhost:6767'
});

// 2. Perform a connectivity check
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
```

---

## Advanced Features Setup

Beyond simple database saves, Memoir includes a full narrative execution layer:

### A. Persona Locking & Gossip Links

```typescript
// Lock Mom into a rigid psychological profile
memoir.lockPersona("mom", {
  archetype: "protective_parent",
  attachmentStyle: "anxious",
  stubbornness: "high",
  tone: "warm but strict"
});

// Interconnect Mom and Blake (gossip network)
memoir.createSocialLink("mom", "friend-b", {
  relationship: "neighbors",
  leakChance: 0.8
});
```

### B. Structured Conversations

Trigger structured dialogues with emotion/action tags in a single invocation:

```typescript
const response = await merchant.chat("player-1", "I'm looking for a sword.");

console.log(response.text);   // Speeech: "Take a look at this iron blade."
console.log(response.emote);  // Emotion: "neutral"
console.log(response.action); // Action: "give_item"
```

### C. Deterministic Memory State Machines (D-MSM)

Bind AI memory context to strict game engine state transitions:

```typescript
import { MemoirFSM } from 'memoir-npc';

const guardFsm = new MemoirFSM({
  initialState: "idle",
  states: {
    "idle": {
      transitions: {
        "player_is_threat": "attack"
      }
    },
    "attack": {
      transitions: {}
    }
  }
});

// Evaluate the memory graph and execute state transitions deterministically
const activeState = await guardFsm.evaluateState("guard_npc", "player-1", memoir);
console.log(activeState); // Returns "attack" if player made threats, "idle" otherwise.
```
