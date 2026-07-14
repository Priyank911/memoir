# Memoir Class

The main entry point of the Memoir SDK.

```typescript
import { Memoir } from 'memoir-npc';
```

## Constructor

### `new Memoir(config)`

Creates a new `Memoir` instance. Each instance is completely independent and maintains no global mutable state.

```typescript
const memoir = new Memoir({
  supermemoryApiKey: 'sm_xxx',
  supermemoryBaseUrl: 'http://localhost:6767',
  requestTimeoutMs: 5000,
  strict: false
});
```

### Configuration Options

| Option | Type | Default | Description |
|---|---|---|---|
| `supermemoryApiKey` | `string` | *(required)* | Your API key to authenticate with Supermemory. Can be any dummy string if your local instance doesn't enforce keys. |
| `supermemoryBaseUrl` | `string` | `"http://localhost:6767"` | The base endpoint of the Supermemory Local server. |
| `requestTimeoutMs` | `number` | `5000` | Timeout in milliseconds before aborting requests. |
| `strict` | `boolean` | `false` | If set to `true`, `recallContext()` throws typed errors on failure instead of returning an empty string. |

---

## Methods

### `healthCheck()`

Checks if the Supermemory Local server is reachable and responding.

* **Returns:** `Promise<boolean>` - `true` if connected successfully, `false` otherwise.
* **Error Behavior:** **Never throws**. All errors (timeout, connection refused, non-2xx) are caught internally.

```typescript
const isUp = await memoir.healthCheck();
if (!isUp) {
  console.log("Please run `npx supermemory local` in your terminal!");
}
```

---

### `npc(npcId)`

Returns a handle to interact with a specific NPC's memory.

* **Parameters:**
  * `npcId` (`string`): A unique, stable identifier for the NPC (e.g. `'old-mage-aldric'`).
* **Returns:** `NpcHandle` - Scoped handle to execute memory operations.

```typescript
const mage = memoir.npc('old-mage-aldric');
```
