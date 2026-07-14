/**
 * Thrown when Supermemory Local is unreachable — connection refused, DNS failure,
 * or any network-level error that prevents the request from completing.
 *
 * @example
 * ```typescript
 * try {
 *   await npc.saveInteraction("player-1", "Hello", "Hi there!");
 * } catch (err) {
 *   if (err instanceof MemoirConnectionError) {
 *     console.error("Supermemory Local is down:", err.message);
 *   }
 * }
 * ```
 */
export class MemoirConnectionError extends Error {
  constructor(message = "Supermemory Local is unreachable") {
    super(message);
    this.name = "MemoirConnectionError";
    Object.setPrototypeOf(this, MemoirConnectionError.prototype);
  }
}

/**
 * Thrown when Supermemory responds with 401 or 403 — the API key is invalid,
 * expired, or missing required permissions.
 *
 * @example
 * ```typescript
 * try {
 *   await npc.saveInteraction("player-1", "Hello", "Hi there!");
 * } catch (err) {
 *   if (err instanceof MemoirAuthError) {
 *     console.error("Bad API key:", err.message);
 *   }
 * }
 * ```
 */
export class MemoirAuthError extends Error {
  constructor(message = "Authentication failed — check your Supermemory API key") {
    super(message);
    this.name = "MemoirAuthError";
    Object.setPrototypeOf(this, MemoirAuthError.prototype);
  }
}

/**
 * Thrown when a request to Supermemory exceeds the configured `requestTimeoutMs`.
 * This uses `AbortController` internally — a hung request will never hang the caller.
 *
 * @example
 * ```typescript
 * try {
 *   await npc.recallContext("player-1");
 * } catch (err) {
 *   if (err instanceof MemoirTimeoutError) {
 *     console.error("Request timed out after", err.message);
 *   }
 * }
 * ```
 */
export class MemoirTimeoutError extends Error {
  constructor(message = "Request to Supermemory timed out") {
    super(message);
    this.name = "MemoirTimeoutError";
    Object.setPrototypeOf(this, MemoirTimeoutError.prototype);
  }
}

/**
 * Thrown for any non-2xx response from Supermemory that isn't a 401/403.
 * Carries the HTTP status code so consumers can make decisions based on it.
 *
 * @example
 * ```typescript
 * try {
 *   await npc.saveInteraction("player-1", "Hello", "Hi there!");
 * } catch (err) {
 *   if (err instanceof MemoirAPIError) {
 *     console.error(`API error ${err.statusCode}:`, err.message);
 *   }
 * }
 * ```
 */
export class MemoirAPIError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "MemoirAPIError";
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, MemoirAPIError.prototype);
  }
}
