# Basic NPC Example

This example demonstrates how to integrate Memoir to run a command-line conversation loop for an NPC wizard named Aldric, complete with psychological persona locks, automated memory updates, and deterministic state transitions.

## Code Example

First, install the Memoir SDK:
```bash
npm install memoir-npc tsx
```

Create a file named `aldric.ts`:

```typescript
import { Memoir, MemoirFSM } from 'memoir-npc';
import * as readline from 'node:readline';

// 1. Initialize Memoir
const memoir = new Memoir({
  supermemoryApiKey: 'test',
  geminiApiKey: process.env.GEMINI_API_KEY!, // Loaded from environment
  supermemoryBaseUrl: 'http://localhost:6767'
});

// 2. Lock Aldric's Persona
memoir.lockPersona("aldric", {
  archetype: "wise_wizard",
  attachmentStyle: "relaxed",
  stubbornness: "high",
  tone: "mysterious and helpful",
  description: "An ancient wizard who guards the dungeon gates. Speaks cryptically in 1-2 short sentences."
});

// 3. Define State Machine for the game engine
const wizardFsm = new MemoirFSM({
  initialState: "idle",
  states: {
    "idle": {
      transitions: {
        "player_has_weapon": "cautious",
        "player_is_respectful": "friendly"
      }
    },
    "cautious": {
      transitions: {
        "player_threatens": "hostile",
        "player_holstered_weapon": "idle"
      }
    },
    "friendly": {
      transitions: {
        "player_steals": "hostile"
      }
    },
    "hostile": {
      transitions: {}
    }
  }
});

async function main() {
  const isUp = await memoir.healthCheck();
  if (!isUp) {
    console.error("Supermemory Local is down! Run `npx supermemory local` first.");
    process.exit(1);
  }

  const npc = memoir.npc('aldric');
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

      // 1. Trigger conversation (queries memory, locks persona, generates response & updates DB)
      const response = await npc.chat(playerId, input);
      console.log(`Aldric [Emotion: ${response.emote}]: ${response.text}`);

      // 2. Evaluate state transitions deterministically
      const state = await wizardFsm.evaluateState("aldric", playerId, memoir);
      console.log(`[D-MSM STATE TRANSITION: ${state.toUpperCase()}]`);

      ask();
    });
  };

  console.log("Aldric: Ah, hello traveler! (Type 'quit' to exit)\n");
  ask();
}

main();
```

To run the script:
```bash
export GEMINI_API_KEY="your_api_key"
npx tsx aldric.ts
```
