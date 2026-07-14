# NpcHandle Class

Returned by `memoir.npc(npcId)`. A handle scoped to a specific NPC's memory.

```typescript
const npc = memoir.npc('shopkeeper-aldaric');
```

## Properties

### `npcId`

* **Type:** `string`
* The unique ID of the NPC this handle is scoped to.

---

## Methods

### `recallContext(playerId)`

Retrieves everything this NPC knows about the player.

* **Parameters:**
  * `playerId` (`string`): The unique ID of the player.
* **Returns:** `Promise<string>` - A `\n`-separated plain text string summarizing the past interactions. Returns `""` if no memories exist or if the request fails (in non-strict mode).
* **Error Behavior:**
  * **Default mode (`strict: false`):** Catches errors internally and returns `""`.
  * **Strict mode (`strict: true`):** Throws `MemoirConnectionError`, `MemoirTimeoutError`, `MemoirAuthError`, or `MemoirAPIError`.

```typescript
const pastContext = await npc.recallContext('player-1');
```

---

### `saveInteraction(playerId, playerInput, npcReply)`

Saves a player-NPC interaction to memory.

* **Parameters:**
  * `playerId` (`string`): The unique ID of the player.
  * `playerInput` (`string`): What the player said.
  * `npcReply` (`string`): The NPC's character response.
* **Returns:** `Promise<void>`
* **Error Behavior:** **Always throws** typed errors on failure (`MemoirConnectionError`, etc.).

```typescript
try {
  await npc.saveInteraction(
    'player-1',
    "Do you sell health potions?",
    "Ah, yes! Only 10 silver pieces each, traveler."
  );
} catch (err) {
  console.error("Failed to write to memory:", err);
}
```

---

### `forget(playerId)`

Wipes this NPC's memory of a specific player. Useful for reset scenarios, debug commands, or "new game" triggers.

* **Parameters:**
  * `playerId` (`string`): The player ID whose memories should be deleted.
* **Returns:** `Promise<void>`
* **Error Behavior:** **Always throws** typed errors on failure.

```typescript
await npc.forget('player-1');
console.log("Memory wiped successfully!");
```
