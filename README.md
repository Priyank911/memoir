```text
 ▄▄▄▄▄▄▄ ▄▄▄▄▄▄▄ ▄▄▄▄▄▄▄ ▄▄▄▄▄▄▄ ▄▄▄▄▄ ▄▄▄▄▄▄▄
 █ ▄ ▄ █ █ ▄▄▄▄█ █ ▄ ▄ █ █ ▄▄▄ █   █   █ ▄▄▄ █
 █ █ █ █ █ ▄▄▄█▄ █ █ █ █ █ █▄█ █   █   █ ▄ ▄▄█
 █▄█▀█▄█ █▄▄▄▄▄█ █▄█▀█▄█ █▄▄▄▄▄█ █▄▄▄█ █▄█▄▄▄█
```

# Memoir

[![npm version](https://img.shields.io/npm/v/memoir-npc?color=black&style=flat-square)](https://www.npmjs.com/package/memoir-npc)
[![MIT License](https://img.shields.io/badge/license-MIT-black.svg?style=flat-square)](./LICENSE)
[![Engine](https://img.shields.io/badge/engine-Supermemory-black.svg?style=flat-square)](https://docs.supermemory.ai)

Memoir is a high-speed, developer-centric Narrative AI Framework built directly on top of the Supermemory AI memory engine. It gives AI game NPCs persistent, long-term memory across sessions by wrapping Supermemory Local (a self-hosted memory engine) and supplying advanced character guardrail systems. 

Install it, configure your character locks, and every NPC in your game remembers every player interaction and stays perfectly in character, with no manual database schema or prompt engineering.

---

## Features Overview

*   **Persistent Context Memory**: Automatically saves NPC-Player interactions. NPCs recall quest choices, player items, and history across scenes.
*   **Persona Locking via Tags**: Lock your NPCs into rigid psychological profiles (archetype, attachment style, stubbornness, tone) using system envelopes.
*   **Proximity Gossip Network**: Interconnect NPC memory databases. When the player tells a secret to one character, it can leak as a rumor to neighboring NPCs automatically.
*   **Structured Chat Driver**: Intercepts LLM calls, recalls context, checks locks, generates dialogues, parses emotion/action tags, and updates the database in a single step.
*   **Resilient Auto-Retries**: Automated one-time retry (300ms delay) for transient connection drops and timeouts.

---

## Installation

```bash
npm install memoir-npc
```

---

## Prerequisites

Memoir requires Supermemory Local running on your machine. Start it in your terminal:

```bash
npx supermemory local
```

It runs at `http://localhost:6767` by default. See Supermemory's documentation for full setup instructions.

---

## Core Usage

### 1. Initialize and Define Personas

```typescript
import { Memoir } from "memoir-npc";

// Initialize Memoir pointing to local Supermemory and Gemini
const memoir = new Memoir({
  supermemoryApiKey: "your_supermemory_api_key",
  geminiApiKey: "your_gemini_api_key",
  supermemoryBaseUrl: "http://localhost:6767"
});

// Configure psychological guardrails for a character
memoir.lockPersona("mom_npc", {
  archetype: "protective_parent",
  attachmentStyle: "anxious",
  stubbornness: "high",
  tone: "warm but strict",
  description: "Caring mother who hates screens and wants the player home early."
});

memoir.lockPersona("guard_npc", {
  archetype: "corrupt_guard",
  stubbornness: "high",
  tone: "cynical"
});
```

### 2. Configure the Proximity Gossip Network

Establish connection paths and leak probabilities between NPC containers:

```typescript
// If the player tells a secret to Mom, she might leak it to the Guard
memoir.createSocialLink("mom_npc", "guard_npc", {
  relationship: "neighbors",
  leakChance: 0.7
});
```

### 3. Handle Dialogues with Structured Output

Use the `chat` method to query memory, check guardrails, call the LLM, evaluate actions, and save the interaction automatically:

```typescript
const npc = memoir.npc("mom_npc");

const response = await npc.chat("player-1", "I am leaving for the hackathon.");

console.log(response.text);   // In-character speech (e.g. "Come back early!")
console.log(response.emote);  // Extracted emotion (e.g. "worried")
console.log(response.action); // Action tag (e.g. "none")
```

---

## Technical Architecture

Here is the data loop orchestration between your game code, Memoir SDK, and the Supermemory database engine during runtime:

```text
+-----------------------------------------------------------------+
|                        YOUR GAME ENGINE                         |
|      (Dialogue Loops, Quest Handlers, NPC AI controllers)       |
+---------------+---------------------------------+---------------+
                |                                 ^
                | 1. chat(playerId, input)        | 4. Returns:
                |    (Triggers LLM generation)    |    { text, emote, action }
                v                                 |
+-------------------------------------------------+---------------+
|                         MEMOIR SDK                              |
|                                                                 |
|  +--------------------+                    +----------------+   |
|  |  NpcHandle Scoper  |                    | Persona Engine |   |
|  |  (Tag: npc:${id})  |                    |  (Guardrails)  |   |
|  +--------+-----------+                    +-------+--------+   |
|           |                                        |            |
|           | 2. query database                      | 3. run LLM |
|           v                                        v            |
|  +--------------------+                    +----------------+   |
|  | Supermemory Client |                    | Gemini Client  |   |
|  +--------+-----------+                    +----------------+   |
|           |                                                     |
+-----------|-----------------------------------------------------+
            v
+-----------------------------------------------------------------+
|                        SUPERMEMORY LOCAL                        |
|           (Vector Database, Graph Store, SQLite)                |
+-----------------------------------------------------------------+
```

---

## API Reference

### `new Memoir(config: MemoirConfig)`

Creates a new Memoir context instance.

*   `supermemoryApiKey: string` - API token for Supermemory Local.
*   `geminiApiKey?: string` - API key for Gemini models.
*   `supermemoryBaseUrl?: string` - Base path of your Supermemory server (defaults to `http://localhost:6767`).
*   `requestTimeoutMs?: number` - Request timeout limit (default: 5000ms).
*   `strict?: boolean` - If true, throws errors rather than degrading gracefully on network failure.

### `memoir.lockPersona(npcId: string, config: PersonaConfig)`

Binds rigid psychological constraints to an NPC.
*   `archetype: string` - Core role profile.
*   `attachmentStyle?: string` - Psychological attachment type.
*   `stubbornness?: string` - Character resistance level.
*   `tone?: string` - Speech style.

### `memoir.createSocialLink(npcIdA: string, npcIdB: string, options: { relationship: string, leakChance: number })`

Binds two NPCs in a social network gossip connection. When interactions are saved to `npcIdA`, a processed rumor will be generated and saved to `npcIdB` according to the `leakChance` rate.

### `npc.chat(playerId: string, playerInput: string): Promise<ChatResponse>`

Queries memories, generates dialogues in-character, extracts emotions/actions, saves interactions to databases, and executes gossip propagation in a single invocation.

*   `playerId: string` - Unique user ID.
*   `playerInput: string` - Player dialogue string.
*   Returns: `Promise<{ text: string, emote: string, action: string }>`

---

## License

MIT
