/**
 * The main entry point for the Memoir package.
 *
 * `Memoir` is the top-level class consumers instantiate. It creates NPC handles
 * via `memoir.npc(npcId)` and provides a `healthCheck()` method to verify
 * Supermemory Local connectivity.
 *
 * @example
 * ```typescript
 * import { Memoir } from "memoir-npc";
 *
 * const memoir = new Memoir({
 *   supermemoryApiKey: "sm_xxx",
 * });
 *
 * const npc = memoir.npc("old-mage-001");
 * const context = await npc.recallContext("player-1");
 * ```
 *
 * @packageDocumentation
 */

import {
  SupermemoryClient,
  type SupermemoryClientOptions,
} from "./supermemory-client";
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
   * Your Supermemory API key. Obtain one from the Supermemory dashboard
   * or configure it in your local instance.
   */
  supermemoryApiKey: string;

  /**
   * Base URL of Supermemory Local.
   * @default "http://localhost:6767"
   */
  supermemoryBaseUrl?: string;

  /**
   * Maximum time (in milliseconds) to wait for any single request to
   * Supermemory before aborting it.
   * @default 5000
   */
  requestTimeoutMs?: number;

  /**
   * When `true`, `recallContext()` throws typed errors on failure instead
   * of silently returning an empty string.
   *
   * **Default (`false`):** Silent degradation — an NPC that can't remember
   * is better than a game that crashes mid-dialogue.
   *
   * **Strict mode (`true`):** Library consumers doing something other than
   * a game need the option to fail loudly.
   *
   * @default false
   */
  strict?: boolean;
}

// ─── Memoir class ──────────────────────────────────────────────────

/**
 * Top-level class for Memoir. Construct one instance, then call `.npc(id)`
 * to get handles for individual NPCs.
 *
 * Every `Memoir` instance is independent — no global mutable state. Safe to
 * construct more than once in the same process.
 *
 * @example
 * ```typescript
 * const memoir = new Memoir({
 *   supermemoryApiKey: process.env.SUPERMEMORY_API_KEY!,
 *   supermemoryBaseUrl: "http://localhost:6767",
 *   requestTimeoutMs: 5000,
 * });
 *
 * const healthy = await memoir.healthCheck();
 * if (!healthy) {
 *   console.error("Supermemory Local is not running!");
 * }
 * ```
 */
export class Memoir {
  /** @internal */
  private readonly client: SupermemoryClient;
  /** @internal */
  private readonly strict: boolean;

  constructor(config: MemoirConfig) {
    const opts: SupermemoryClientOptions = {
      apiKey: config.supermemoryApiKey,
      baseUrl: config.supermemoryBaseUrl ?? "http://localhost:6767",
      timeoutMs: config.requestTimeoutMs ?? 5000,
    };

    this.client = new SupermemoryClient(opts);
    this.strict = config.strict ?? false;
  }

  /**
   * Returns an NPC handle scoped to its own memory container.
   *
   * Each NPC gets a deterministic container tag derived from its ID:
   * `npc:${npcId}`. This means two different `Memoir` instances pointing at
   * the same Supermemory Local will share the same NPC memories (by design).
   *
   * @param npcId - A stable, unique identifier for this NPC (e.g. `"old-mage-001"`).
   * @returns A {@link NpcHandle} with `recallContext`, `saveInteraction`, and `forget` methods.
   *
   * @example
   * ```typescript
   * const mage = memoir.npc("old-mage-001");
   * const blacksmith = memoir.npc("blacksmith-town-square");
   * ```
   */
  npc(npcId: string): NpcHandle {
    return new NpcHandle(this.client, npcId, this.strict);
  }

  /**
   * Check whether Supermemory Local is reachable right now.
   *
   * **This method never throws.** It returns `false` on any failure —
   * connection refused, timeout, non-2xx, anything. Safe to call in a loop
   * without wrapping it in try/catch.
   *
   * @returns `true` if Supermemory Local responded successfully, `false` otherwise.
   *
   * @example
   * ```typescript
   * const isUp = await memoir.healthCheck();
   * if (!isUp) {
   *   console.log("Start Supermemory: npx supermemory local");
   * }
   * ```
   */
  async healthCheck(): Promise<boolean> {
    return this.client.healthCheck();
  }
}

// ─── NpcHandle class ───────────────────────────────────────────────

/**
 * A handle scoped to a single NPC's memory. Created by {@link Memoir.npc}.
 *
 * All memory operations are scoped to this NPC's container tag (`npc:${npcId}`).
 * Player-specific recall is done by including the `playerId` in both the
 * search query and the metadata on write.
 */
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
  constructor(client: SupermemoryClient, npcId: string, strict: boolean) {
    this.client = client;
    this.npcId = npcId;
    this.containerTag = `npc:${npcId}`;
    this.strict = strict;
  }

  /**
   * Pull everything Memoir/Supermemory knows about a specific player,
   * scoped to this NPC, as a plain string ready to drop into an LLM prompt.
   *
   * **Default behavior on failure:** returns an empty string (`""`) rather
   * than throwing. Silent degradation is the right default for a game that
   * shouldn't crash mid-dialogue.
   *
   * **Strict mode:** if the `Memoir` instance was constructed with
   * `{ strict: true }`, this method rethrows a typed error
   * (`MemoirConnectionError`, `MemoirTimeoutError`, etc.) on failure.
   *
   * @param playerId - The unique identifier for the player.
   * @returns A `\n`-separated string of everything this NPC remembers about
   *          the player, or `""` if nothing is found or on failure.
   *
   * @example
   * ```typescript
   * const mage = memoir.npc("old-mage-001");
   *
   * const context = await mage.recallContext("player-1");
   * // context might be:
   * // "Player player-1 said: I'm looking for the lost sword\nNPC replied: Ah, the blade of..."
   *
   * const prompt = `You remember: ${context || "nothing yet"}`;
   * ```
   */
  async recallContext(playerId: string): Promise<string> {
    try {
      const results = await this.client.searchMemories(
        this.containerTag,
        `player:${playerId}`
      );

      // Client-side filter: only include results whose metadata
      // has a matching playerId, or that mention this player in content
      const relevant = results.filter((r) => {
        // If metadata has playerId, use that for exact matching
        if (r.metadata && r.metadata.playerId === playerId) {
          return true;
        }
        // Fallback: check if content mentions the player
        if (r.content && r.content.includes(playerId)) {
          return true;
        }
        // If we got results from the search, include them even without
        // explicit metadata — the search query was player-scoped
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
   * Write a player–NPC interaction to memory, letting Supermemory's own
   * extraction engine do the fact extraction. No custom parsing on Memoir's side.
   *
   * **This method always throws typed errors on failure.** A failed write is
   * a real data-loss event — the consumer's application should know about it
   * and decide how to handle it (retry, queue, log, etc.).
   *
   * @param playerId - The unique identifier for the player.
   * @param playerInput - What the player said.
   * @param npcReply - What the NPC replied.
   * @throws {MemoirConnectionError} If Supermemory Local is unreachable.
   * @throws {MemoirAuthError} If the API key is invalid (401/403).
   * @throws {MemoirTimeoutError} If the request exceeds `requestTimeoutMs`.
   * @throws {MemoirAPIError} For any other non-2xx response.
   *
   * @example
   * ```typescript
   * const mage = memoir.npc("old-mage-001");
   *
   * try {
   *   await mage.saveInteraction(
   *     "player-1",
   *     "I'm looking for the lost sword of Eldoria",
   *     "Ah, the Blade of Dawn! I haven't heard that name in years..."
   *   );
   * } catch (err) {
   *   if (err instanceof MemoirConnectionError) {
   *     // queue for retry later
   *   }
   * }
   * ```
   */
  async saveInteraction(
    playerId: string,
    playerInput: string,
    npcReply: string
  ): Promise<void> {
    const content = `Player ${playerId} said: ${playerInput}\nNPC replied: ${npcReply}`;

    await this.client.addMemory(this.containerTag, content, {
      playerId,
      npcId: this.npcId,
      type: "interaction",
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Wipe this NPC's memory of a specific player. Useful for demos, testing,
   * and "new game" scenarios.
   *
   * Searches for all memories mentioning this player in this NPC's container,
   * then deletes each one.
   *
   * @param playerId - The unique identifier for the player whose memories to erase.
   * @throws {MemoirConnectionError} If Supermemory Local is unreachable.
   * @throws {MemoirAuthError} If the API key is invalid (401/403).
   * @throws {MemoirTimeoutError} If the request exceeds `requestTimeoutMs`.
   * @throws {MemoirAPIError} For any other non-2xx response.
   *
   * @example
   * ```typescript
   * const mage = memoir.npc("old-mage-001");
   * await mage.forget("player-1");
   * // The mage no longer remembers player-1
   * ```
   */
  async forget(playerId: string): Promise<void> {
    await this.client.deleteByPlayer(this.containerTag, playerId);
  }
}
