/**
 * Internal wrapper around the Supermemory SDK.
 *
 * **This is the only file in the entire codebase that imports `supermemory`.**
 * Every other module talks to Supermemory through this class. If the SDK's
 * API surface changes, only this file needs updating.
 *
 * @internal — not exported from the package's public API.
 */

import Supermemory from "supermemory";
import {
  MemoirConnectionError,
  MemoirAuthError,
  MemoirTimeoutError,
  MemoirAPIError,
} from "./errors";

/** Shape of a single memory result coming back from search. */
export interface MemoryResult {
  content: string;
  metadata?: Record<string, unknown> | null;
  id?: string;
}

/** Options for constructing the internal Supermemory client. */
export interface SupermemoryClientOptions {
  apiKey: string;
  baseUrl: string;
  timeoutMs: number;
}

/**
 * Thin wrapper that owns the single `Supermemory` SDK instance and translates
 * every raw SDK error into a typed Memoir error. Also applies timeouts via
 * `AbortController` and the one-retry policy.
 *
 * @internal
 */
export class SupermemoryClient {
  private readonly client: Supermemory;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  /** Fixed delay between retries (ms). */
  private static readonly RETRY_DELAY_MS = 300;

  constructor(options: SupermemoryClientOptions) {
    this.baseUrl = options.baseUrl;
    this.timeoutMs = options.timeoutMs;

    this.client = new Supermemory({
      apiKey: options.apiKey,
      baseURL: options.baseUrl,
    });
  }

  // ─── Public methods ────────────────────────────────────────────────

  /**
   * Lightweight connectivity check. **Never throws** — returns `false` on
   * any failure (connection refused, timeout, non-2xx, anything).
   */
  async healthCheck(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);

      try {
        // Try /health first
        const res = await fetch(`${this.baseUrl}/health`, {
          signal: controller.signal,
        });
        if (res.ok) return true;

        // If /health doesn't exist, try base URL
        const res2 = await fetch(this.baseUrl, {
          signal: controller.signal,
        });
        return res2.ok;
      } catch {
        return false;
      } finally {
        clearTimeout(timer);
      }
    } catch {
      return false;
    }
  }

  /**
   * Store a memory in the given container.
   * Throws typed errors on failure; supports the one-retry policy.
   */
  async addMemory(
    containerTag: string,
    content: string,
    metadata: Record<string, string | number | boolean | string[]>
  ): Promise<void> {
    await this.withRetry(async (signal) => {
      await this.client.add(
        {
          content,
          containerTag,
          metadata,
        },
        { signal }
      );
    });
  }

  /**
   * Search memories within a container using the low-latency memories endpoint.
   * Returns an array of `MemoryResult`. Throws typed errors on failure.
   */
  async searchMemories(
    containerTag: string,
    query: string
  ): Promise<MemoryResult[]> {
    return await this.withRetry(async (signal) => {
      const response = await this.client.search.memories(
        {
          q: query,
          containerTag,
        },
        { signal }
      );

      const results: MemoryResult[] = [];
      if (response?.results && Array.isArray(response.results)) {
        for (const r of response.results) {
          // search.memories returns results with `memory` or `chunk` fields
          const content = r.memory ?? r.chunk ?? "";
          if (content) {
            results.push({
              content,
              metadata: r.metadata ?? undefined,
              id: r.id,
            });
          }
        }
      }

      return results;
    });
  }

  /**
   * Delete all memories in a container that match a given player ID.
   * Searches first, then deletes each result individually via documents.delete().
   */
  async deleteByPlayer(
    containerTag: string,
    playerId: string
  ): Promise<void> {
    // First, find all memories for this player
    const memories = await this.searchMemories(containerTag, playerId);

    // Collect document IDs from the memory results
    const docIds = new Set<string>();
    for (const memory of memories) {
      // Each memory result has an id
      if (memory.id) {
        docIds.add(memory.id);
      }
      // Also check if there are associated documents
    }

    // Search documents to find document IDs too
    try {
      const docResponse = await this.withRetry(async (signal) => {
        return await this.client.search.documents(
          {
            q: playerId,
            containerTag,
            filters: {
              AND: [{ key: "playerId", value: playerId }],
            },
          },
          { signal }
        );
      });

      if (docResponse?.results && Array.isArray(docResponse.results)) {
        for (const r of docResponse.results) {
          if (r.documentId) {
            docIds.add(r.documentId);
          }
        }
      }
    } catch {
      // If document search fails, we still have memory IDs to try
    }

    // Delete each document
    for (const docId of docIds) {
      await this.withRetry(async (signal) => {
        await this.client.documents.delete(docId, { signal });
      });
    }
  }

  // ─── Internal helpers ──────────────────────────────────────────────

  /**
   * Execute `fn` with an `AbortController` timeout and the one-retry policy.
   *
   * Retry policy:
   * - **1 retry** with 300ms delay for `MemoirTimeoutError` and `MemoirConnectionError`
   * - **No retry** for `MemoirAuthError` or `MemoirAPIError` (4xx/5xx that aren't transient)
   */
  private async withRetry<T>(
    fn: (signal: AbortSignal) => Promise<T>
  ): Promise<T> {
    try {
      return await this.executeWithTimeout(fn);
    } catch (err) {
      // Only retry on timeout or connection errors — not auth or API errors
      if (
        err instanceof MemoirTimeoutError ||
        err instanceof MemoirConnectionError
      ) {
        await this.delay(SupermemoryClient.RETRY_DELAY_MS);
        return await this.executeWithTimeout(fn);
      }
      throw err;
    }
  }

  /**
   * Run `fn` with an `AbortController`-based timeout. Translates raw errors
   * into typed Memoir errors.
   */
  private async executeWithTimeout<T>(
    fn: (signal: AbortSignal) => Promise<T>
  ): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      return await fn(controller.signal);
    } catch (err) {
      throw this.classifyError(err);
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Translate a raw error into a typed Memoir error.
   */
  private classifyError(err: unknown): Error {
    // Already a Memoir error (e.g. from a nested call) — pass through
    if (
      err instanceof MemoirConnectionError ||
      err instanceof MemoirAuthError ||
      err instanceof MemoirTimeoutError ||
      err instanceof MemoirAPIError
    ) {
      return err;
    }

    // AbortController abort → timeout
    if (
      (err instanceof DOMException && err.name === "AbortError") ||
      (err instanceof Error && err.name === "AbortError")
    ) {
      return new MemoirTimeoutError(
        `Request to Supermemory timed out after ${this.timeoutMs}ms`
      );
    }

    // Connection-level errors — fetch throws TypeError for network failures
    if (err instanceof TypeError) {
      return new MemoirConnectionError(
        `Supermemory Local is unreachable: ${err.message}`
      );
    }

    // SDK may throw an error with a status property
    if (err && typeof err === "object") {
      const errObj = err as Record<string, unknown>;

      const status =
        (errObj.status as number | undefined) ??
        (errObj.statusCode as number | undefined) ??
        (errObj.response &&
        typeof errObj.response === "object" &&
        (errObj.response as Record<string, unknown>).status
          ? ((errObj.response as Record<string, unknown>).status as number)
          : undefined);

      if (status !== undefined && typeof status === "number") {
        if (status === 401 || status === 403) {
          return new MemoirAuthError(
            `Authentication failed (HTTP ${status}) — check your Supermemory API key`
          );
        }
        return new MemoirAPIError(
          `Supermemory returned HTTP ${status}: ${
            (errObj.message as string) ?? "Unknown error"
          }`,
          status
        );
      }

      // Error with code property (e.g. ECONNREFUSED)
      const code = errObj.code as string | undefined;
      if (
        code === "ECONNREFUSED" ||
        code === "ENOTFOUND" ||
        code === "ECONNRESET" ||
        code === "UND_ERR_CONNECT_TIMEOUT"
      ) {
        return new MemoirConnectionError(
          `Supermemory Local is unreachable (${code})`
        );
      }
    }

    // Check message content for connection-related keywords
    if (err instanceof Error) {
      const msg = err.message.toLowerCase();
      if (
        msg.includes("econnrefused") ||
        msg.includes("enotfound") ||
        msg.includes("fetch failed") ||
        msg.includes("network") ||
        msg.includes("connect")
      ) {
        return new MemoirConnectionError(
          `Supermemory Local is unreachable: ${err.message}`
        );
      }
      return new MemoirAPIError(err.message, 0);
    }

    return new MemoirConnectionError(
      `Supermemory Local is unreachable: ${String(err)}`
    );
  }

  /** Simple delay helper. */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
