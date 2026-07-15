# How It Works

Memoir is a developer-centric Narrative AI Framework that sits between your game engine and the Supermemory Local database engine. Rather than managing vector databases, building custom entity extractors, or formatting prompt templates, Memoir exposes simple APIs while managing the complex cognitive cycles under the hood.

---

## Technical Architecture

The diagram below outlines the runtime data loops and operations of Memoir's core subsystems:

```text
+-----------------------------------------------------------------+
|                        YOUR GAME ENGINE                         |
|      (Dialogue Loops, Quest Handlers, NPC AI controllers)       |
+---------------+---------------------------------+---------------+
                |                                 ^
                | 1. npc.chat(playerId, input)    | 5. Returns:
                |    (Or MemoirFSM evaluation)    |    { text, emote, action }
                v                                 |    (or deterministic state)
+-------------------------------------------------+---------------+
|                         MEMOIR SDK                              |
|                                                                 |
|  +--------------------+   +-------------------+                 |
|  |  NpcHandle Scoper  |   |   Persona Engine  |                 |
|  |  (Tag: npc:${id})  |   |   (Guardrails)    |                 |
|  +--------+-----------+   +---------+---------+                 |
|           |                         |                           |
|           | recallContext()         | wraps locked prompts      |
|           v                         v                           |
|  +--------+-----------+   +---------+---------+                 |
|  | Supermemory Client |   |   Gemini Client   |                 |
|  +--------+-----------+   +---------+---------+                 |
|           |                         |                           |
+-----------|-------------------------|---------------------------+
            | HTTP calls              | generateContent()
            v                         v
+-----------------------+   +-------------------------------------+
|   SUPERMEMORY LOCAL   |   |        GEMINI INFERENCE API         |
|  (Vector DB / Graph)  |   |   (JSON Chat & FSM Evaluations)     |
+-----------------------+   +-------------------------------------+
```

---

## Core Subsystems

### 1. Persona Locking (Guardrails)

AI models are probabilistic; they can easily break character or hallucinate if the user says something unexpected. To solve this, Memoir introduces **Persona Locking**.

* When a developer defines a lock configuration (archetype, attachment style, stubbornness, tone), Memoir compiles these attributes into a rigid `[SYSTEM GUARDRAIL ACTIVATED]` block.
* When `chat` is called, Memoir automatically retrieves the active lock and appends it to the very beginning of the prompt context, guaranteeing that Gemini adheres strictly to the character's psychology.

---

### 2. Proximity Gossip Network

In traditional games, sharing knowledge across separate NPCs requires complex global databases and event routers. Memoir solves this by managing automated gossip inside the API wrapper:

1. The developer links NPCs together via `memoir.createSocialLink(npcIdA, npcIdB, { leakChance })`.
2. When the player saves an interaction to `npcIdA`, Memoir rolls a check against the `leakChance` rate.
3. If it passes, Memoir fires a background prompt to Gemini, feeding the dialog history and asking it to write a short, third-person rumor note (e.g. *"Mom told me that the player is leaving town"*).
4. Memoir writes this generated rumor directly into `npcIdB`'s memory container context.
5. Next time the player speaks to NPC B, `recallContext` will pull this rumor block naturally, and NPC B will gossip about it.

---

### 3. Deterministic Memory State Machines (D-MSM)

Generative AI dialog is unstructured and fuzzy, but game engines run on strict, deterministic code (e.g. playing specific animations). Memoir's `MemoirFSM` acts as the translator:

1. The developer defines a state map containing strict states (e.g. `idle`, `hostile`, `friendly`) and transitional conditions.
2. When `fsm.evaluateState()` is called, Memoir retrieves the current NPC memory context.
3. It asks Gemini to evaluate the memory graph against the current state's transitions and choose exactly one matched condition key, or return `"none"`.
4. Memoir validates the chosen key against the FSM configuration. If valid, the state transitions. If it hallucinates, the FSM ignores it and remains in the current state safely, preventing game engine crashes.
