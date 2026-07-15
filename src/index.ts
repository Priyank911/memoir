/**
 * **Memoir** — Give AI game NPCs persistent, long-term memory.
 *
 * A thin, typed bridge over Supermemory Local. Install it, wire in three
 * functions, and every NPC in your game remembers every player interaction
 * forever — across completely separate sessions — with no database schema
 * written by hand.
 *
 * @example
 * ```typescript
 * import { Memoir } from "memoir-npc";
 *
 * const memoir = new Memoir({
 *   supermemoryApiKey: process.env.SUPERMEMORY_API_KEY!,
 * });
 *
 * const mage = memoir.npc("old-mage-001");
 *
 * const context = await mage.recallContext("player-1");
 * // feed `context` into your LLM prompt
 *
 * await mage.saveInteraction("player-1", playerInput, npcReply);
 * ```
 *
 * @packageDocumentation
 */

export { Memoir, NpcHandle, MemoirFSM } from "./memoir";
export { type MemoirConfig, type ChatResponse, type PersonaConfig, type SocialLink, type FsmConfig } from "./memoir";

// ─── Errors ────────────────────────────────────────────────────────
export {
  MemoirConnectionError,
  MemoirAuthError,
  MemoirTimeoutError,
  MemoirAPIError,
} from "./errors";
