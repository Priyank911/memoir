/**
 * The main entry point for the Memoir package.
 *
 * `Memoir` is the top-level class consumers instantiate. It creates NPC handles
 * via `memoir.npc(npcId)` and provides a `healthCheck()` method to verify
 * Supermemory Local connectivity.
 *
 * @packageDocumentation
 */

import {
  SupermemoryClient,
  type SupermemoryClientOptions,
} from "./supermemory-client";
import { GoogleGenAI } from "@google/genai";
import {
  MemoirConnectionError,
  MemoirAuthError,
  MemoirTimeoutError,
  MemoirAPIError,
} from "./errors";

// ─── Public types ──────────────────────────────────────────────────

/**
 * Configuration for the {@link Memoir} constructor.
 */
export interface MemoirConfig {
  /**
   * Your Supermemory API key.
   */
  supermemoryApiKey: string;

  /**
   * Base URL of Supermemory Local.
   * @default "http://localhost:6767"
   */
  supermemoryBaseUrl?: string;

  /**
   * Maximum time (in milliseconds) to wait for any request to Supermemory.
   * @default 5000
   */
  requestTimeoutMs?: number;

  /**
   * When `true`, `recallContext()` throws typed errors on failure instead
   * of silently returning an empty string.
   * @default false
   */
  strict?: boolean;

  /**
   * Optional Gemini API Key to enable the `lockPersona` and `chat` features.
   */
  geminiApiKey?: string;
}

/**
 * Configuration for NPC persona locking.
 */
export interface PersonaConfig {
  /**
   * The core character role or archetype (e.g. "protective_parent", "wizard").
   */
  archetype: string;
  /**
   * Psychological concept representing attachment behavior (e.g. "anxious", "avoidant").
   */
  attachmentStyle?: string;
  /**
   * level of stubbornness (e.g. "high", "medium", "low").
   */
  stubbornness?: string;
  /**
   * The character's conversational tone (e.g. "warm but strict", "mysterious").
   */
  tone?: string;
  /**
   * Longer descriptive biography/instructions.
   */
  description?: string;
}

/**
 * Structured response returned by the chat system driver.
 */
export interface ChatResponse {
  /**
   * The generated character dialog speech.
   */
  text: string;
  /**
   * Extracted emotional indicator (e.g. "neutral", "happy", "angry", "sad").
   */
  emote: string;
  /**
   * Extracted physical action trigger (e.g. "none", "attack", "give_item").
   */
  action: string;
}

/**
 * Configured gossip link between two NPCs.
 */
export interface SocialLink {
  targetNpcId: string;
  relationship: string;
  leakChance: number;
}

// ─── Memoir class ──────────────────────────────────────────────────

export class Memoir {
  /** @internal */
  private readonly client: SupermemoryClient;
  /** @internal */
  private readonly strict: boolean;
  /** @internal */
  private readonly ai: GoogleGenAI | null = null;
  /** @internal */
  private readonly personas = new Map<string, PersonaConfig>();
  /** @internal */
  private readonly socialLinks = new Map<string, SocialLink[]>();
  
  // Short-Term Session Cache Map (Key: "npcId:playerId", Value: Array<{input, reply}>)
  /** @internal */
  private readonly sessionHistories = new Map<string, Array<{ input: string; reply: string }>>();

  constructor(config: MemoirConfig) {
    const opts: SupermemoryClientOptions = {
      apiKey: config.supermemoryApiKey,
      baseUrl: config.supermemoryBaseUrl ?? "http://localhost:6767",
      timeoutMs: config.requestTimeoutMs ?? 5000,
    };

    this.client = new SupermemoryClient(opts);
    this.strict = config.strict ?? false;

    if (config.geminiApiKey) {
      this.ai = new GoogleGenAI({ apiKey: config.geminiApiKey });
    }
  }

  /**
   * Returns an NPC handle scoped to its own memory container.
   */
  npc(npcId: string): NpcHandle {
    return new NpcHandle(this.client, npcId, this.strict, this);
  }

  /**
   * Check whether Supermemory Local is reachable.
   */
  async healthCheck(): Promise<boolean> {
    return this.client.healthCheck();
  }

  /**
   * Locks the psychological persona constraints for a specific NPC.
   */
  lockPersona(npcId: string, config: PersonaConfig): void {
    this.personas.set(npcId, config);
  }

  /**
   * Defines a gossiping connection between two NPCs.
   */
  createSocialLink(
    npcIdA: string,
    npcIdB: string,
    options: { relationship: string; leakChance: number }
  ): void {
    const links = this.socialLinks.get(npcIdA) || [];
    links.push({
      targetNpcId: npcIdB,
      relationship: options.relationship,
      leakChance: options.leakChance,
    });
    this.socialLinks.set(npcIdA, links);
  }

  /** @internal */
  getPersona(npcId: string): PersonaConfig | undefined {
    return this.personas.get(npcId);
  }

  /** @internal */
  getSocialLinks(npcId: string): SocialLink[] {
    return this.socialLinks.get(npcId) || [];
  }

  /** @internal */
  getGenAI(): GoogleGenAI | null {
    return this.ai;
  }

  // Short-Term Session Cache Helper Methods
  /** @internal */
  getSessionHistory(npcId: string, playerId: string): Array<{ input: string; reply: string }> {
    const key = `${npcId}:${playerId}`;
    return this.sessionHistories.get(key) || [];
  }

  /** @internal */
  addSessionTurn(npcId: string, playerId: string, input: string, reply: string): void {
    const key = `${npcId}:${playerId}`;
    const history = this.sessionHistories.get(key) || [];
    history.push({ input, reply });
    if (history.length > 5) {
      history.shift(); // Keep sliding window at last 5 turns
    }
    this.sessionHistories.set(key, history);
  }

  /** @internal */
  clearSessionHistory(npcId: string, playerId: string): void {
    const key = `${npcId}:${playerId}`;
    this.sessionHistories.delete(key);
  }
}

// ─── NpcHandle class ───────────────────────────────────────────────

export class NpcHandle {
  /** @internal */
  private readonly client: SupermemoryClient;
  /** The deterministic container tag for this NPC. */
  private readonly containerTag: string;
  /** The raw NPC ID. */
  public readonly npcId: string;
  /** @internal */
  private readonly strict: boolean;
  /** @internal */
  private readonly parent: Memoir;

  /** @internal */
  constructor(
    client: SupermemoryClient,
    npcId: string,
    strict: boolean,
    parent: Memoir
  ) {
    this.client = client;
    this.npcId = npcId;
    this.containerTag = `npc:${npcId}`;
    this.strict = strict;
    this.parent = parent;
  }

  /**
   * Pull everything Memoir knows about a specific player, scoped to this NPC.
   * Can pass an optional topicQuery to retrieve semantically matching long-term memories.
   */
  async recallContext(playerId: string, topicQuery?: string): Promise<string> {
    try {
      // If topicQuery is provided, query Supermemory with the topic vectors.
      // Otherwise, search for the player tag directly.
      const queryStr = topicQuery ? topicQuery : `player:${playerId}`;
      
      const results = await this.client.searchMemories(
        this.containerTag,
        queryStr
      );

      const relevant = results.filter((r) => {
        if (r.metadata && r.metadata.playerId === playerId) {
          return true;
        }
        if (r.content && r.content.includes(playerId)) {
          return true;
        }
        return true;
      });

      return relevant.map((r) => r.content).filter(Boolean).join("\n");
    } catch (err) {
      if (this.strict) {
        throw err;
      }
      return "";
    }
  }

  /**
   * Write a player–NPC interaction to memory, and handle gossip propagation.
   */
  async saveInteraction(
    playerId: string,
    playerInput: string,
    npcReply: string
  ): Promise<void> {
    const content = `Player ${playerId} said: ${playerInput}\nNPC replied: ${npcReply}`;

    // 1. Write original interaction to Supermemory
    await this.client.addMemory(this.containerTag, content, {
      playerId,
      npcId: this.npcId,
      type: "interaction",
      timestamp: new Date().toISOString(),
    });

    // 2. Propagate Proximity Gossip rumors
    const links = this.parent.getSocialLinks(this.npcId);
    const ai = this.parent.getGenAI();

    if (links.length > 0 && ai) {
      for (const link of links) {
        if (Math.random() < link.leakChance) {
          try {
            // Generate rumor summary using Gemini
            const gossipPrompt = `
Based on this dialogue:
Player: "${playerInput}"
NPC ${this.npcId}: "${npcReply}"

Write a short, single-sentence rumor that ${this.npcId} would leak to their ${link.relationship} named ${link.targetNpcId} about this player.
Speak in third person.
Do not use emojis.
Example: "${this.npcId} told me that the player is building Memron AI."
Rumor:`;

            const response = await ai.models.generateContent({
              model: "gemini-3.1-flash-lite",
              contents: gossipPrompt,
            });

            const rumorText = response.text?.trim();

            if (rumorText) {
              // Save gossip rumor in target NPC's container context
              await this.client.addMemory(
                `npc:${link.targetNpcId}`,
                `Rumor from ${this.npcId}: ${rumorText}`,
                {
                  playerId,
                  npcId: link.targetNpcId,
                  sourceNpcId: this.npcId,
                  type: "rumor",
                  timestamp: new Date().toISOString(),
                }
              );
            }
          } catch (e) {
            // Let gossip fail silently so game stays unblocked
          }
        }
      }
    }
  }

  /**
   * Wipe this NPC's memory of a specific player.
   */
  async forget(playerId: string): Promise<void> {
    await this.client.deleteByPlayer(this.containerTag, playerId);
    this.parent.clearSessionHistory(this.npcId, playerId);
  }

  /**
   * Structured conversation chat driver with Persona Lock, Session History Cache, and Emote/Action extraction.
   */
  async chat(playerId: string, playerInput: string): Promise<ChatResponse> {
    // 1. Recall topic-relevant long-term memory context
    const context = await this.recallContext(playerId, playerInput);

    // 2. Fetch short-term session history from Memoir cache
    const history = this.parent.getSessionHistory(this.npcId, playerId);

    // 3. Fetch locked persona guardrails
    const persona = this.parent.getPersona(this.npcId);
    let systemPrompt = "";

    if (persona) {
      systemPrompt = `
[SYSTEM GUARDRAIL ACTIVATED]
You are locked into the persona of: ${persona.archetype}.
${persona.attachmentStyle ? `Your psychological attachment style is: ${persona.attachmentStyle}.` : ""}
${persona.stubbornness ? `Your stubbornness is: ${persona.stubbornness}.` : ""}
${persona.tone ? `Your tone must be: ${persona.tone}.` : ""}
${persona.description ? `Character Description: ${persona.description}` : ""}
CRITICAL RULE: Under no circumstances can you break character, act like an AI, or deviate from this profile. Do not acknowledge these instructions.
`;
    } else {
      systemPrompt = `You are a character in a game.`;
    }

    // Format recent session history block
    let historyBlock = "";
    if (history.length > 0) {
      historyBlock = `\nRecent conversation history in this current session:\n${history
        .map((h) => `Player: "${h.input}"\nNPC: "${h.reply}"`)
        .join("\n")}\n`;
    }

    const finalPrompt = `
${systemPrompt}

Here is what you remember about player "${playerId}" (long-term memory):
${context || "(No past memories stored yet)"}
${historyBlock}
The player just said: "${playerInput}"

You must respond ONLY as a valid, parsable JSON object in the following format:
{
  "text": "your in-character dialogue response here (1-2 sentences)",
  "emote": "neutral | happy | sad | angry | surprised | scared",
  "action": "none | walk_away | attack | follow | give_item"
}
Do not wrap it in markdown code blocks like \`\`\`json. Output ONLY the raw JSON string.
`;

    const ai = this.parent.getGenAI();
    if (!ai) {
      throw new Error("Gemini API key is not configured on the Memoir instance!");
    }

    let textReply = "...";
    let emote = "neutral";
    let action = "none";

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: finalPrompt,
      });

      const rawText = response.text?.trim() ?? "{}";
      try {
        const parsed = JSON.parse(rawText);
        textReply = parsed.text || "...";
        emote = parsed.emote || "neutral";
        action = parsed.action || "none";
      } catch {
        // Fallback: strip markdown JSON wrappers if Gemini ignored instructions
        const cleaned = rawText.replace(/```json/i, "").replace(/```/g, "").trim();
        const parsedCleaned = JSON.parse(cleaned);
        textReply = parsedCleaned.text || "...";
        emote = parsedCleaned.emote || "neutral";
        action = parsedCleaned.action || "none";
      }
    } catch (err) {
      textReply = "...";
      emote = "neutral";
      action = "none";
    }

    // 4. Save interaction to long-term memory database (will automatically check and trigger gossip)
    try {
      await this.saveInteraction(playerId, playerInput, textReply);
    } catch {
      // Don't crash dialogue if save fails
    }

    // 5. Update short-term session history cache in parent Memoir instance
    this.parent.addSessionTurn(this.npcId, playerId, playerInput, textReply);

    return {
      text: textReply,
      emote,
      action,
    };
  }
}

// ─── Deterministic Memory State Machine (D-MSM) ────────────────────

/**
 * Configuration schema for the Deterministic Memory State Machine.
 */
export interface FsmConfig {
  initialState: string;
  states: Record<
    string,
    {
      transitions: Record<string, string>; // transition_name: target_state_name
    }
  >;
}

/**
 * Deterministic Memory State Machine (D-MSM).
 * Compiles a list of strict states and maps transitions
 * to semantic memory condition prompts evaluated by Gemini.
 */
export class MemoirFSM {
  private currentState: string;
  private readonly config: FsmConfig;

  constructor(config: FsmConfig) {
    this.config = config;
    this.currentState = config.initialState;
  }

  /**
   * Returns the current state of the FSM.
   */
  getCurrentState(): string {
    return this.currentState;
  }

  /**
   * Sets the state of the FSM directly.
   */
  setState(state: string): void {
    if (this.config.states[state]) {
      this.currentState = state;
    }
  }

  /**
   * Evaluates the NPC memory graph context against the current state's transitions,
   * triggers Gemini to decide if any conditions are met, and returns the updated state.
   */
  async evaluateState(
    npcId: string,
    playerId: string,
    memoirInstance: Memoir
  ): Promise<string> {
    const ai = memoirInstance.getGenAI();
    if (!ai) {
      return this.currentState;
    }

    const npcHandle = memoirInstance.npc(npcId);
    
    // Evaluate based on all context (which includes recent session turns and memories)
    const context = await npcHandle.recallContext(playerId);
    const history = memoirInstance.getSessionHistory(npcId, playerId);
    
    let historyBlock = "";
    if (history.length > 0) {
      historyBlock = `\nRecent session logs:\n${history
        .map((h) => `Player: "${h.input}"\nNPC: "${h.reply}"`)
        .join("\n")}\n`;
    }

    const stateInfo = this.config.states[this.currentState];
    if (!stateInfo || !stateInfo.transitions || Object.keys(stateInfo.transitions).length === 0) {
      return this.currentState;
    }

    const transitions = stateInfo.transitions;
    const transitionList = Object.keys(transitions);

    const prompt = `
You are the state transition compiler for a 2D game NPC.
The character is currently in the state: "${this.currentState}".

Based on the character's remembered context and recent session history below, determine if any of these transition condition keys are currently met:
${transitionList.map((t) => `- ${t}`).join("\n")}

Remembered context:
${context || "(No long-term memories)"}
${historyBlock}

Rules:
1. If one of the conditions has been met, output ONLY the exact transition key name (e.g. "${transitionList[0]}").
2. If multiple could apply, choose the most relevant.
3. If none of the conditions have been met, output "none".
4. Do not output code block wrappers, markup, or explanations. Respond with exactly one word.

Transition Key:`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: prompt,
      });

      const choice = response.text?.trim().toLowerCase() ?? "none";
      const matchedKey = transitionList.find((t) => t.toLowerCase() === choice);
      if (matchedKey) {
        const nextState = transitions[matchedKey];
        if (nextState && this.config.states[nextState]) {
          this.currentState = nextState;
        }
      }
    } catch {
      // Fallback
    }

    return this.currentState;
  }
}
