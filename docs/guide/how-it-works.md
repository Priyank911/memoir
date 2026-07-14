# How It Works

Memoir is a high-performance, strongly-typed bridge between your game engine and the Supermemory Local memory engine. Rather than managing vector databases, building custom entity extractors, or orchestrating database transactions, your game queries a clean, gamer-optimized SDK while Memoir delegates state management to Supermemory.

---

## Technical Architecture

The diagram below outlines the deep, end-to-end memory flow during a gameplay dialogue session. It details how Memoir isolates NPC scopes, retries network failures, formats inputs, and interfaces with Supermemory's vector database, metadata stores, and entity graphs:

<div class="architecture-diagram">
<pre>
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
</pre>
</div>

---

## Scope Isolation (Container Tags)

To prevent an NPC's memory from leaking into another (e.g. preventing the shopkeeper from knowing a secret the wizard told the player), Memoir enforces strict memory isolation using **Container Tags**.

Every NPC initialized via `memoir.npc(npcId)` is bound to a deterministic, unique tag:
```typescript
const containerTag = `npc:${npcId}`;
```

- When storing context via `saveInteraction()`, Memoir associates the content and structured metadata strictly with this container.
- When retrieving context via `recallContext()`, Memoir limits vector search queries to matching container tags.

---

## Detailed Data Flows

### 1. Storing Memories (`saveInteraction`)

When you call `await npc.saveInteraction(playerId, playerInput, npcReply)`:
1. **Formatting**: Memoir constructs a plaintext conversation snippet:
   ```
   Player <playerId> said: <playerInput>
   NPC replied: <npcReply>
   ```
2. **Metadata Injection**: Memoir appends crucial search vectors as structural JSON metadata:
   - `playerId`: The ID of the player participating in the dialogue.
   - `npcId`: The unique ID of the scoped NPC.
   - `type`: Classified as `"interaction"`.
   - `timestamp`: High-precision ISO string.
3. **Execution & Retry**: The client fires a POST request to Supermemory Local's database router. If a transient network glitch or connection timeout occurs, the internal retry policy halts for 300ms before attempting a fallback dispatch.
4. **Extraction**: Supermemory parses the text, extracts atomic facts, resolves semantic discrepancies with past inputs, and stores the new indices.

### 2. Recalling Context (`recallContext`)

When you call `await npc.recallContext(playerId)`:
1. **Targeted Vector Search**: Memoir initiates a query scoped to the NPC's container tag, searching specifically for records tagged with `player:${playerId}`.
2. **Client-Side Filtering**: To achieve maximum accuracy and zero memory leakage, Memoir performs a strict structural check:
   - It verifies that the returned memory matches the `playerId` inside the metadata, OR
   - It matches context mentioning the player ID within the body text.
3. **String Consolidation**: Verified facts are joined with newline separators (`\n`) and returned as a single context block, ready to be injected straight into your LLM's system prompt.
