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

**Memoir** is a high-speed, developer-centric SDK built directly on top of the **Supermemory** AI memory engine. It gives AI game NPCs persistent, long-term memory across sessions by wrapping [Supermemory Local](https://docs.supermemory.ai) (a self-hosted memory engine) so you never touch raw memory database APIs directly. Install it, wire in three functions, and every NPC in your game remembers every player interaction — forever — with no database schema written by hand.

---

## Features Overview

*   **🧠 Persistent RAG Memory**: Saves NPC–Player interactions forever. NPCs remember quest details, player items, and choices across game sessions.
*   **⚡ Zero Database Setup**: No database schemas to write. Pass dialogue logs and let the extraction engine resolve facts and relationships automatically.
*   **👾 Gamer-Optimized**: High-speed, thin middleware designed to ensure AI processing doesn't freeze the main game thread.
*   **🛡️ Strong Exception Safety**: Explicit exception classes for network drops, timeouts, and auth errors. Keep the AI dialogue loop running smoothly.
*   **🔄 Resilient Auto-Retries**: Automated 1-time retry (300ms delay) for connection drops and timeouts. Keeps games fluid.

---

## Install

```bash
npm install memoir-npc
```

---

## Prerequisites

Memoir requires **Supermemory Local** running on your machine. Start it with:

```bash
npx supermemory local
```

It runs at `http://localhost:6767` by default. See [Supermemory's docs](https://docs.supermemory.ai) for full setup instructions.

---

## Quickstart

```typescript
import { Memoir } from "memoir-npc";

// 1. Create a Memoir instance pointing to Supermemory Local
const memoir = new Memoir({
  supermemoryApiKey: process.env.SUPERMEMORY_API_KEY!,
  supermemoryBaseUrl: "http://localhost:6767", // default
});

// 2. Check Supermemory is running
const healthy = await memoir.healthCheck();
if (!healthy) throw new Error("Start Supermemory: npx supermemory local");

// 3. Get an NPC handle
const mage = memoir.npc("old-mage-001");

// 4. Recall what the NPC knows about this player
const pastContext = await mage.recallContext("player-1");

// 5. Feed context into your LLM and get a reply
const npcReply = await generateNPCDialogue(playerInput, pastContext);

// 6. Save the interaction for next time
await mage.saveInteraction("player-1", playerInput, npcReply);
```

That's it. The NPC now remembers this conversation next time, even across completely separate sessions.

---

## Technical Architecture

Here is the data loop orchestration between your game code, Memoir SDK, and the Supermemory database engine during runtime:

```text
+-----------------------------------------------------------------+
|                        YOUR GAME ENGINE                         |
|      (Dialogue Loops, Quest Handlers, NPC AI controllers)       |
+---------------+---------------------------------+---------------+
                |                                 ^
                | 1. saveInteraction()            | 2. recallContext()
                |    (Player Input & NPC Reply)   |    (Formulated Prompt)
                v                                 |
+-------------------------------------------------+---------------+
|                         MEMOIR SDK                              |
|                                                                 |
|  +--------------------+                    +----------------+   |
|  |  NpcHandle Scoper  |                    | Timeout/Abort  |   |
|  |  (Tag: npc:${id})  |                    |   Controller   |   |
|  +--------+-----------+                    +-------+--------+   |
|           |                                        |            |
|           v                                        v            |
|  +--------------------+                    +----------------+   |
|  |  Memory Formatter  |                    | Auto-Retry-Once|   |
|  |  (Metadata Inject) |                    | (300ms delay)  |   |
|  +--------+-----------+                    +-------+--------+   |
+-----------|----------------------------------------|------------+
            |                                        |
            +-------------------+--------------------+
                                |
                                | HTTP REST/JSON Calls
                                v
+-----------------------------------------------------------------+
|                       SUPERMEMORY LOCAL                         |
|     (Self-hosted memory service running daemon at port 6767)     |
|                                                                 |
|  +-----------------------------------------------------------+  |
|  |                   API REST Endpoint Router                |  |
|  +------------------------------+----------------------------+  |
|                                 |                               |
|  +------------------------------v----------------------------+  |
|  |                  Semantic Extraction Engine               |  |
|  |    (Identifies entities, resolves conflicting facts,      |  |
|  |     merges memories, and consolidates knowledge graphs)   |  |
|  +------------------------------+----------------------------+  |
|                                 |                               |
|  +------------------------------v----------------------------+  |
|  |                       RAG Search Router                   |  |
|  |    (Vector matches query tags with cosine similarity)     |  |
|  +------------------------------+----------------------------+  |
+---------------------------------|-------------------------------+
                                  |
                                  | Persistent Storage
                                  v
+-----------------------------------------------------------------+
|                   PERSISTENT STORAGE ENGINES                    |
|                                                                 |
|  +--------------------+   +-------------------+   +----------+  |
|  |    Vector Index    |   |  SQLite Metadata  |   | Knowledge|  |
|  | (Dense Embeddings) |   | (Container Tags)  |   |  Graph   |  |
|  +--------------------+   +-------------------+   +----------+  |
+-----------------------------------------------------------------+
```

---

## API Reference

### `new Memoir(config)`

Creates a new Memoir instance. Every instance is independent — no global mutable state.

| Parameter | Type | Default | Description |
|---|---|---|---|
| `supermemoryApiKey` | `string` | *(required)* | Your Supermemory API key |
| `supermemoryBaseUrl` | `string` | `"http://localhost:6767"` | Base URL of Supermemory Local |
| `requestTimeoutMs` | `number` | `5000` | Timeout per request (ms) |
| `strict` | `boolean` | `false` | If `true`, `recallContext()` throws on failure instead of returning `""` |

```typescript
const memoir = new Memoir({
  supermemoryApiKey: "sm_xxx",
  requestTimeoutMs: 3000,
  strict: false,
});
```

---

### `memoir.healthCheck(): Promise<boolean>`

Check whether Supermemory Local is reachable. **Never throws** — returns `false` on any failure.

```typescript
const isUp = await memoir.healthCheck();
if (!isUp) {
  console.log("Run: npx supermemory local");
}
```

---

### `memoir.npc(npcId): NpcHandle`

Returns an NPC handle scoped to its own memory container. The container tag is derived deterministically as `npc:${npcId}`.

| Parameter | Type | Description |
|---|---|---|
| `npcId` | `string` | Stable, unique identifier for this NPC |

```typescript
const mage = memoir.npc("old-mage-001");
const smith = memoir.npc("blacksmith-town-square");
```

---

### `npc.recallContext(playerId): Promise<string>`

Pull everything this NPC knows about a specific player, returned as a `\n`-separated plain string ready to drop into an LLM prompt.

| Parameter | Type | Description |
|---|---|---|
| `playerId` | `string` | Unique identifier for the player |

**Error behavior:**
- **Default mode:** Returns `""` on failure (silent degradation — a game shouldn't crash mid-dialogue)
- **Strict mode** (`{ strict: true }`): Throws a typed error

```typescript
const context = await mage.recallContext("player-1");
const prompt = `You remember: ${context || "nothing yet, first meeting"}`;
```

---

### `npc.saveInteraction(playerId, playerInput, npcReply): Promise<void>`

Write a player–NPC interaction to memory. Supermemory's extraction engine handles fact extraction — no custom parsing needed.

| Parameter | Type | Description |
|---|---|---|
| `playerId` | `string` | Unique identifier for the player |
| `playerInput` | `string` | What the player said |
| `npcReply` | `string` | What the NPC replied |

**Error behavior:** Always throws typed errors on failure. A failed write is data loss — your app should decide how to handle it.

```typescript
try {
  await mage.saveInteraction("player-1", "Where is the sword?", "In the cave to the north.");
} catch (err) {
  if (err instanceof MemoirConnectionError) {
    // queue for retry
  }
}
```

---

### `npc.forget(playerId): Promise<void>`

Wipe this NPC's memory of a specific player. Useful for demos, testing, and "new game" scenarios.

| Parameter | Type | Description |
|---|---|---|
| `playerId` | `string` | Player whose memories to erase |

```typescript
await mage.forget("player-1");
```

---

## Error Handling

Memoir defines four typed error classes. Raw SDK/fetch errors never leak to the consumer.

| Error Class | When Thrown | Recommended Handling |
|---|---|---|
| `MemoirConnectionError` | Supermemory unreachable (ECONNREFUSED, DNS failure, network error) | Check if Supermemory Local is running. Retry after delay. |
| `MemoirAuthError` | Bad API key (HTTP 401/403) | Fix your API key. Do not retry. |
| `MemoirTimeoutError` | Request exceeded `requestTimeoutMs` | Increase timeout or check Supermemory load. |
| `MemoirAPIError` | Any other non-2xx response. Has `.statusCode` property. | Log and inspect the status code. |

```typescript
import {
  Memoir,
  MemoirConnectionError,
  MemoirAuthError,
  MemoirTimeoutError,
  MemoirAPIError,
} from "memoir-npc";

try {
  await npc.saveInteraction("player-1", input, reply);
} catch (err) {
  if (err instanceof MemoirConnectionError) {
    console.error("Supermemory is down:", err.message);
  } else if (err instanceof MemoirAuthError) {
    console.error("Bad API key:", err.message);
  } else if (err instanceof MemoirTimeoutError) {
    console.error("Request timed out:", err.message);
  } else if (err instanceof MemoirAPIError) {
    console.error(`API error ${err.statusCode}:`, err.message);
  }
}
```

### Retry Policy

Memoir automatically retries **once** with a **300ms delay** for transient failures:

- ✅ Retried: `MemoirTimeoutError`, `MemoirConnectionError`
- ❌ Not retried: `MemoirAuthError`, `MemoirAPIError` (not transient — retrying wastes time)

This happens internally. The consumer sees at most one error after the retry has already been attempted.

---

## How It Works

Memoir is a thin bridge, not a memory engine. When you call `saveInteraction()`, Memoir formats the conversation and pushes it to Supermemory Local via its SDK. Supermemory's own extraction engine builds the knowledge graph — fact extraction, contradiction resolution, and memory consolidation all happen inside Supermemory. When you call `recallContext()`, Memoir queries Supermemory for everything it knows about that player-NPC pair and returns it as plain text. Memoir deliberately does not reimplement any of this intelligence.

---

## Testing

```bash
# Unit tests (no network calls)
npm test

# Integration tests (requires Supermemory Local running)
npx cross-env RUN_INTEGRATION=1 npx vitest run test/integration.test.ts
```

---

## License

MIT — see [LICENSE](./LICENSE)
