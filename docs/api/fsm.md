# MemoirFSM Class

A Deterministic Memory State Machine (D-MSM) compiler. Rather than letting AI dialogue run wild and unpredictable, you define a list of strict game states (e.g. `idle`, `hostile`, `friendly`), and the state machine compiler evaluates the NPC memory graph context to safely transition the character along these tracks.

```typescript
import { MemoirFSM } from 'memoir-npc';
```

## Constructor

### `new MemoirFSM(config)`

Creates a new FSM compiler.

```typescript
const guardMachine = new MemoirFSM({
  initialState: "idle",
  states: {
    "idle": {
      transitions: {
        "player_is_threat": "attack",
        "player_is_bribing": "negotiate"
      }
    },
    "negotiate": {
      transitions: {
        "bribe_accepted": "idle",
        "bribe_rejected": "attack"
      }
    },
    "attack": {
      transitions: {
        "player_fled": "idle"
      }
    }
  }
});
```

### Configuration Options

| Option | Type | Description |
|---|---|---|
| `initialState` | `string` | The starting state of the FSM. |
| `states` | `Record<string, { transitions: Record<string, string> }>` | Map of states, where each state lists its valid transitions (`condition_name: next_state_name`). |

---

## Methods

### `getCurrentState()`

* **Returns:** `string` - The current active state name.

```typescript
const activeState = guardMachine.getCurrentState(); // "idle"
```

---

### `setState(state)`

Forcefully transitions the state machine directly to a target state, bypassing evaluation rules.

* **Parameters:**
  * `state` (`string`): The target state name.

```typescript
guardMachine.setState("attack");
```

---

### `evaluateState(npcId, playerId, memoirInstance)`

Recalls memories, runs a semantic evaluation of the current state's transitions using Gemini, transitions the state machine to the new target state (if a transition condition checks out), and returns the active state name.

* **Parameters:**
  * `npcId` (`string`): Unique ID of the NPC whose memory graph to query.
  * `playerId` (`string`): Target player ID.
  * `memoirInstance` (`Memoir`): Active Memoir instance containing the Gemini client configuration.
* **Returns:** `Promise<string>` - The active state name of the character after evaluation.

```typescript
const nextState = await guardMachine.evaluateState("guard_npc", "player-1", memoir);
console.log(nextState); // "attack" or "negotiate" or "idle"
```
