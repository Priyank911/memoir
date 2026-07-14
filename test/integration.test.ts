/**
 * Integration tests for Memoir.
 *
 * These tests run against a real Supermemory Local instance and are
 * **skipped by default**. They will only run when the `RUN_INTEGRATION`
 * environment variable is set.
 *
 * To run:
 *   1. Start Supermemory Local: `npx supermemory local`
 *   2. Run: `npx cross-env RUN_INTEGRATION=1 npx vitest run test/integration.test.ts`
 *
 * Or on Unix/macOS:
 *   RUN_INTEGRATION=1 npm run test:integration
 */

import { describe, it, expect, beforeAll } from "vitest";
import { Memoir } from "../src/memoir";

const RUN = !!process.env.RUN_INTEGRATION;

describe.skipIf(!RUN)("Integration: Memoir ↔ Supermemory Local", () => {
  let memoir: Memoir;
  const testNpcId = `test-npc-${Date.now()}`;
  const testPlayerId = `test-player-${Date.now()}`;

  beforeAll(() => {
    memoir = new Memoir({
      supermemoryApiKey: process.env.SUPERMEMORY_API_KEY ?? "test",
      supermemoryBaseUrl:
        process.env.SUPERMEMORY_BASE_URL ?? "http://localhost:6767",
      requestTimeoutMs: 10000,
    });
  });

  it("healthCheck returns true when Supermemory Local is running", async () => {
    const healthy = await memoir.healthCheck();
    expect(healthy).toBe(true);
  });

  it("saveInteraction writes to Supermemory without throwing", async () => {
    const npc = memoir.npc(testNpcId);

    await expect(
      npc.saveInteraction(
        testPlayerId,
        "I'm looking for the lost sword of Eldoria",
        "Ah, the Blade of Dawn! I haven't heard that name in years..."
      )
    ).resolves.toBeUndefined();
  });

  it("recallContext retrieves previously saved interaction", async () => {
    // Give Supermemory a moment to process the memory
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const npc = memoir.npc(testNpcId);
    const context = await npc.recallContext(testPlayerId);

    // The context should contain something from our saved interaction
    expect(context.length).toBeGreaterThan(0);
  });

  it("forget clears player memories", async () => {
    const npc = memoir.npc(testNpcId);

    // This should not throw
    await expect(npc.forget(testPlayerId)).resolves.toBeUndefined();
  });

  it("recallContext returns empty after forget", async () => {
    // Give Supermemory time to process the deletion
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const npc = memoir.npc(testNpcId);
    const context = await npc.recallContext(testPlayerId);

    expect(context).toBe("");
  });
});
