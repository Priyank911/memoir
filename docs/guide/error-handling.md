# Error Handling

Memoir provides robust, strongly-typed error handling. Instead of letting raw HTTP fetch or raw SDK errors leak to your application, Memoir classifies all failures into four specific classes.

## Error Classes

All Memoir errors extend the standard JavaScript `Error` class and can be checked using `instanceof`:

1. **`MemoirConnectionError`**: Thrown when Supermemory Local is completely unreachable (e.g. server is down, connection refused).
2. **`MemoirAuthError`**: Thrown when authentication fails (HTTP 401 or 403) due to an invalid or missing API key.
3. **`MemoirTimeoutError`**: Thrown when a request to Supermemory exceeds the configured `requestTimeoutMs`.
4. **`MemoirAPIError`**: Thrown for other non-2xx API responses. Exposes the `.statusCode` property.

## Default vs. Strict Mode

Games and backend applications have different requirements for error handling. Memoir supports two behaviors via the `strict` config option:

### Default Mode (`strict: false`)

In default mode, **`recallContext()` will never throw**. If Supermemory is down or a request times out, it gracefully catches the error and returns an empty string `""`.

> **Why?** An NPC that temporarily suffers from "amnesia" (returns no memories) is much better than a game crashing mid-dialogue in front of a player.

However, **`saveInteraction()` will always throw** even in default mode. A failed write means data loss, and your game should decide how to handle it (e.g. log a warning, queue the save for later, or retry).

### Strict Mode (`strict: true`)

If you are building a server, custom tooling, or simply want to enforce strict error checks, initialize Memoir with `{ strict: true }`. In this mode, **both** `recallContext()` and `saveInteraction()` will throw typed errors on any failure.

```typescript
const memoir = new Memoir({
  supermemoryApiKey: 'key',
  strict: true // All methods throw on failure
});
```

## Automatic Retry Policy

To shield your application from brief network blips, Memoir applies an internal **one-time automatic retry** with a short fixed delay (**300ms**).

* **Retried automatically:** `MemoirConnectionError` and `MemoirTimeoutError` (transient errors).
* **Not retried:** `MemoirAuthError` and 4xx `MemoirAPIError` (invalid key or bad requests will not fix themselves by retrying).

If the retry fails, the final error is thrown to your application.
