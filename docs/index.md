---
layout: home

hero:
  name: "MEMOIR"
  text: "NPC MEMORY ENGINE"
  tagline: "Give your AI game characters persistent, long-term memory. A high-speed TypeScript SDK built directly on top of Supermemory — the ultimate AI memory and knowledge graph engine."
  actions:
    - theme: brand
      text: BOOT ENGINE (GET STARTED)
      link: /guide/getting-started
    - theme: alt
      text: API MANIFEST
      link: /api/memoir
    - theme: alt
      text: GITHUB
      link: https://github.com/supermemoryai/supermemory

features:
  - icon: |
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="miter" stroke-linecap="square" class="feature-icon"><rect x="4" y="4" width="16" height="16" rx="1"/><path d="M8 4v4h8V4M6 20h12"/></svg>
    title: PERSISTENT MEMORIES
    details: Saves NPC–Player interactions forever. Built on top of Supermemory to keep quest details, player choices, and item interactions persistent across game sessions.
  - icon: |
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="miter" stroke-linecap="square" class="feature-icon"><rect x="6" y="3" width="12" height="18" rx="1"/><path d="M18 6h2M18 10h2M18 14h2M18 18h2M4 6h2M4 10h2M4 14h2M4 18h2M10 8h4v4h-4z"/></svg>
    title: ZERO SCHEMA SETUP
    details: Powered by Supermemory's extraction engine. No database schemas to write. Pass dialogue logs and let the system resolve facts and relationships automatically.
  - icon: |
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="miter" stroke-linecap="square" class="feature-icon"><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M6 12h4M8 10v4M15 11h.01M17 13h.01"/></svg>
    title: GAMER OPTIMIZED
    details: High-speed, thin middleware designed to ensure AI processing doesn't freeze the main game loop. Low latency calls mapping to Supermemory Local.
  - icon: |
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="miter" stroke-linecap="square" class="feature-icon"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
    title: EXCEPTION SAFETY
    details: Strongly typed exception mapping. Catch network failures, timeouts, and auth errors cleanly to keep the gaming dialogue system reliable.
---

<style>
/* Stark monochromatic gradient for hero name and visuals */
:root {
  --vp-home-hero-name-color: transparent;
  --vp-home-hero-name-background: linear-gradient(135deg, var(--vp-c-text-1) 0%, var(--vp-c-text-2) 100%);
}

.home-quickstart {
  max-width: 860px;
  margin: 64px auto;
  padding: 0 24px;
}

.terminal-header {
  background-color: var(--vp-c-text-1);
  color: var(--vp-c-bg);
  padding: 8px 16px;
  font-family: 'Pixelify Sans', sans-serif;
  font-size: 14px;
  font-weight: bold;
  letter-spacing: 0.05em;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.terminal-dots {
  display: flex;
  gap: 6px;
}

.terminal-dot {
  width: 8px;
  height: 8px;
  background-color: var(--vp-c-bg);
}

.terminal-body {
  border: 2px solid var(--vp-c-text-1);
  border-top: none;
  background-color: rgba(var(--vp-c-bg-elv), 0.3);
  backdrop-filter: blur(8px);
  padding: 24px;
  margin-bottom: 48px;
  box-shadow: 6px 6px 0px 0px var(--vp-c-divider);
}

.terminal-body:hover {
  box-shadow: 6px 6px 0px 0px var(--vp-c-text-1);
}

.terminal-title {
  font-family: 'Pixelify Sans', sans-serif;
  font-size: 20px;
  margin-top: 0;
  margin-bottom: 12px;
  text-transform: uppercase;
  border-bottom: 1px dashed var(--vp-c-divider);
  padding-bottom: 8px;
}
</style>

<div class="home-quickstart">
  <div class="terminal-header">
    <span>SYSTEM_BOOT: MEMOIR_INITIALIZER</span>
    <div class="terminal-dots">
      <div class="terminal-dot"></div>
      <div class="terminal-dot"></div>
      <div class="terminal-dot"></div>
    </div>
  </div>
  <div class="terminal-body">
    <h3 class="terminal-title">🎮 Core NPC Memory Loop</h3>
    <p>Inject long-term context directly into your dialogue generator script in three clean calls. Memoir wraps Supermemory Local to manage long-term NPC context safely:</p>

```typescript
import { Memoir } from "memoir";

// 1. Initialize the memory cartridge pointing to Supermemory Local
const memoir = new Memoir({
  supermemoryApiKey: "sm_api_key_here", // dummy key for local mode
  supermemoryBaseUrl: "http://localhost:6767"
});

// 2. Load the NPC Memory Handle
const mage = memoir.npc("old-mage-001");

// 3. Recall memory context & save the reply
const pastContext = await mage.recallContext("player-1");
const npcReply = await generateNPCDialogue(playerInput, pastContext);
await mage.saveInteraction("player-1", playerInput, npcReply);
```

  </div>
</div>
