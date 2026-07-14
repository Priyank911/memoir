# Errors

Memoir exports four specific error classes. You can catch them individually to handle different failure modes.

```typescript
import {
  MemoirConnectionError,
  MemoirAuthError,
  MemoirTimeoutError,
  MemoirAPIError
} from 'memoir-npc';
```

## `MemoirConnectionError`

Thrown when Supermemory Local is completely unreachable.

* **Typical Causes:**
  * Supermemory Local is not running.
  * Running on the wrong port (default is `6767`).
  * Firewall/network blocks.

---

## `MemoirAuthError`

Thrown when authentication fails (HTTP 401 or 403 status codes).

* **Typical Causes:**
  * Invalid API key passed to `supermemoryApiKey`.
  * API key expired.

---

## `MemoirTimeoutError`

Thrown when a request exceeds the configured `requestTimeoutMs`.

* **Typical Causes:**
  * Supermemory Local server is overloaded or hung.
  * System latency.

---

## `MemoirAPIError`

Thrown for any other non-2xx status codes (such as 500 Internal Server Errors).

### Properties

* `statusCode` (`number`): The HTTP status code returned by Supermemory (e.g. `500`).

---

## Example Usage

```typescript
try {
  await npc.saveInteraction('player-1', playerInput, npcReply);
} catch (err) {
  if (err instanceof MemoirConnectionError) {
    console.warn("Memory server is down! Interaction not saved.");
  } else if (err instanceof MemoirAuthError) {
    console.error("Invalid Supermemory API key!");
  } else if (err instanceof MemoirTimeoutError) {
    console.warn("Request timed out!");
  } else if (err instanceof MemoirAPIError) {
    console.error(`Supermemory API error ${err.statusCode}:`, err.message);
  }
}
```
