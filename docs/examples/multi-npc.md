# Multi-NPC Contexts

In complex games, you will have multiple NPCs. Memoir ensures that each NPC's memory is isolated by automatically namespace-scoping their container tags.

## Isolation Example

Memories for `'wizard'` are saved under `npc:wizard`, while memories for `'blacksmith'` are saved under `npc:blacksmith`. Even when the same player interacts with both, their memories will never mix.

```typescript
import { Memoir } from 'memoir-npc';

const memoir = new Memoir({
  supermemoryApiKey: 'key'
});

const player = 'player-1';

// 1. Get handles for two separate NPCs
const wizard = memoir.npc('wizard-aldric');
const smith = memoir.npc('blacksmith-thorin');

async function testIsolation() {
  // Save blacksmith memory
  await smith.saveInteraction(
    player,
    "Can you repair my iron shield?",
    "Aye, that'll be 5 gold coins. Come back in an hour."
  );

  // Save wizard memory
  await wizard.saveInteraction(
    player,
    "Can you teach me a fireball spell?",
    "Fire is dangerous, apprentice! Read this scroll first."
  );

  // Recall blacksmith context
  const smithContext = await smith.recallContext(player);
  console.log('Smith Memories:', smithContext);
  // Only shows: "Player player-1 said: Can you repair my iron shield? ... "

  // Recall wizard context
  const wizardContext = await wizard.recallContext(player);
  console.log('Wizard Memories:', wizardContext);
  // Only shows: "Player player-1 said: Can you teach me a fireball spell? ... "
}

testIsolation();
```
