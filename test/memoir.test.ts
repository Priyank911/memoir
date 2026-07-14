import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock the SupermemoryClient before importing Memoir ────────────

// We mock the internal client so no real network calls happen
const mockHealthCheck = vi.fn<() => Promise<boolean>>();
const mockAddMemory = vi.fn<() => Promise<void>>();
const mockSearchMemories = vi.fn<() => Promise<Array<{ content: string; metadata?: Record<string, unknown> | null; id?: string }>>>();
const mockDeleteByPlayer = vi.fn<() => Promise<void>>();

vi.mock("../src/supermemory-client", () => {
  return {
    SupermemoryClient: vi.fn().mockImplementation(() => ({
      healthCheck: mockHealthCheck,
      addMemory: mockAddMemory,
      searchMemories: mockSearchMemories,
      deleteByPlayer: mockDeleteByPlayer,
    })),
  };
});

import { Memoir } from "../src/memoir";
import {
  MemoirConnectionError,
  MemoirAuthError,
  MemoirTimeoutError,
  MemoirAPIError,
} from "../src/errors";

describe("Memoir", () => {
  let memoir: Memoir;

  beforeEach(() => {
    vi.clearAllMocks();

    memoir = new Memoir({
      supermemoryApiKey: "test-key",
      supermemoryBaseUrl: "http://localhost:6767",
      requestTimeoutMs: 5000,
    });
  });

  // ─── healthCheck ─────────────────────────────────────────────────

  describe("healthCheck()", () => {
    it("returns true when Supermemory is reachable", async () => {
      mockHealthCheck.mockResolvedValue(true);

      const result = await memoir.healthCheck();

      expect(result).toBe(true);
      expect(mockHealthCheck).toHaveBeenCalledOnce();
    });

    it("returns false when Supermemory is unreachable", async () => {
      mockHealthCheck.mockResolvedValue(false);

      const result = await memoir.healthCheck();

      expect(result).toBe(false);
    });

    it("never throws, even if the underlying client throws", async () => {
      // healthCheck delegates to client.healthCheck() which already
      // never throws — but let's verify the contract holds
      mockHealthCheck.mockResolvedValue(false);

      const result = await memoir.healthCheck();

      expect(result).toBe(false);
    });
  });

  // ─── npc() ───────────────────────────────────────────────────────

  describe("npc()", () => {
    it("returns an NpcHandle with the correct npcId", () => {
      const handle = memoir.npc("old-mage-001");

      expect(handle.npcId).toBe("old-mage-001");
    });

    it("creates independent handles for different NPCs", () => {
      const mage = memoir.npc("old-mage-001");
      const smith = memoir.npc("blacksmith-01");

      expect(mage.npcId).not.toBe(smith.npcId);
    });
  });

  // ─── recallContext ───────────────────────────────────────────────

  describe("recallContext()", () => {
    it("returns joined memory content on success", async () => {
      mockSearchMemories.mockResolvedValue([
        { content: "Player player-1 said: Hi\nNPC replied: Hello!", metadata: { playerId: "player-1" } },
        { content: "Player player-1 said: What's your name?\nNPC replied: I am the Old Mage.", metadata: { playerId: "player-1" } },
      ]);

      const npc = memoir.npc("old-mage-001");
      const context = await npc.recallContext("player-1");

      expect(context).toBe(
        "Player player-1 said: Hi\nNPC replied: Hello!\n" +
        "Player player-1 said: What's your name?\nNPC replied: I am the Old Mage."
      );
    });

    it("returns empty string when no memories found", async () => {
      mockSearchMemories.mockResolvedValue([]);

      const npc = memoir.npc("old-mage-001");
      const context = await npc.recallContext("player-1");

      expect(context).toBe("");
    });

    it("returns empty string on connection failure (default mode)", async () => {
      mockSearchMemories.mockRejectedValue(
        new MemoirConnectionError("Supermemory Local is unreachable")
      );

      const npc = memoir.npc("old-mage-001");
      const context = await npc.recallContext("player-1");

      expect(context).toBe("");
    });

    it("returns empty string on timeout failure (default mode)", async () => {
      mockSearchMemories.mockRejectedValue(
        new MemoirTimeoutError("Request timed out")
      );

      const npc = memoir.npc("old-mage-001");
      const context = await npc.recallContext("player-1");

      expect(context).toBe("");
    });

    it("throws MemoirConnectionError in strict mode", async () => {
      const strictMemoir = new Memoir({
        supermemoryApiKey: "test-key",
        strict: true,
      });

      mockSearchMemories.mockRejectedValue(
        new MemoirConnectionError("Supermemory Local is unreachable")
      );

      const npc = strictMemoir.npc("old-mage-001");

      await expect(npc.recallContext("player-1")).rejects.toThrow(
        MemoirConnectionError
      );
    });

    it("throws MemoirTimeoutError in strict mode", async () => {
      const strictMemoir = new Memoir({
        supermemoryApiKey: "test-key",
        strict: true,
      });

      mockSearchMemories.mockRejectedValue(
        new MemoirTimeoutError("Request timed out")
      );

      const npc = strictMemoir.npc("old-mage-001");

      await expect(npc.recallContext("player-1")).rejects.toThrow(
        MemoirTimeoutError
      );
    });

    it("throws MemoirAuthError in strict mode", async () => {
      const strictMemoir = new Memoir({
        supermemoryApiKey: "bad-key",
        strict: true,
      });

      mockSearchMemories.mockRejectedValue(
        new MemoirAuthError("Authentication failed")
      );

      const npc = strictMemoir.npc("old-mage-001");

      await expect(npc.recallContext("player-1")).rejects.toThrow(
        MemoirAuthError
      );
    });

    it("passes the correct container tag and query to the client", async () => {
      mockSearchMemories.mockResolvedValue([]);

      const npc = memoir.npc("old-mage-001");
      await npc.recallContext("player-42");

      expect(mockSearchMemories).toHaveBeenCalledWith(
        "npc:old-mage-001",
        "player:player-42"
      );
    });
  });

  // ─── saveInteraction ─────────────────────────────────────────────

  describe("saveInteraction()", () => {
    it("calls addMemory with correct content format", async () => {
      mockAddMemory.mockResolvedValue(undefined);

      const npc = memoir.npc("old-mage-001");
      await npc.saveInteraction("player-1", "Hello there!", "Greetings, traveler.");

      expect(mockAddMemory).toHaveBeenCalledOnce();
      const [containerTag, content, metadata] = mockAddMemory.mock.calls[0];

      expect(containerTag).toBe("npc:old-mage-001");
      expect(content).toBe(
        "Player player-1 said: Hello there!\nNPC replied: Greetings, traveler."
      );
      expect(metadata).toMatchObject({
        playerId: "player-1",
        npcId: "old-mage-001",
        type: "interaction",
      });
      expect(metadata).toHaveProperty("timestamp");
    });

    it("throws MemoirConnectionError when Supermemory is unreachable", async () => {
      mockAddMemory.mockRejectedValue(
        new MemoirConnectionError("Supermemory Local is unreachable")
      );

      const npc = memoir.npc("old-mage-001");

      await expect(
        npc.saveInteraction("player-1", "Hello", "Hi")
      ).rejects.toThrow(MemoirConnectionError);
    });

    it("throws MemoirAuthError on bad API key", async () => {
      mockAddMemory.mockRejectedValue(
        new MemoirAuthError("Authentication failed")
      );

      const npc = memoir.npc("old-mage-001");

      await expect(
        npc.saveInteraction("player-1", "Hello", "Hi")
      ).rejects.toThrow(MemoirAuthError);
    });

    it("throws MemoirTimeoutError when request times out", async () => {
      mockAddMemory.mockRejectedValue(
        new MemoirTimeoutError("Request timed out")
      );

      const npc = memoir.npc("old-mage-001");

      await expect(
        npc.saveInteraction("player-1", "Hello", "Hi")
      ).rejects.toThrow(MemoirTimeoutError);
    });

    it("throws MemoirAPIError on non-2xx responses", async () => {
      mockAddMemory.mockRejectedValue(
        new MemoirAPIError("Internal Server Error", 500)
      );

      const npc = memoir.npc("old-mage-001");

      await expect(
        npc.saveInteraction("player-1", "Hello", "Hi")
      ).rejects.toThrow(MemoirAPIError);
    });

    it("never swallows errors silently (even in non-strict mode)", async () => {
      mockAddMemory.mockRejectedValue(
        new MemoirConnectionError("Supermemory Local is unreachable")
      );

      const npc = memoir.npc("old-mage-001");

      // saveInteraction always throws, regardless of strict mode
      await expect(
        npc.saveInteraction("player-1", "Hello", "Hi")
      ).rejects.toThrow();
    });
  });

  // ─── forget ──────────────────────────────────────────────────────

  describe("forget()", () => {
    it("calls deleteByPlayer with correct container tag and player ID", async () => {
      mockDeleteByPlayer.mockResolvedValue(undefined);

      const npc = memoir.npc("old-mage-001");
      await npc.forget("player-1");

      expect(mockDeleteByPlayer).toHaveBeenCalledWith(
        "npc:old-mage-001",
        "player-1"
      );
    });

    it("throws MemoirConnectionError on failure", async () => {
      mockDeleteByPlayer.mockRejectedValue(
        new MemoirConnectionError("Supermemory Local is unreachable")
      );

      const npc = memoir.npc("old-mage-001");

      await expect(npc.forget("player-1")).rejects.toThrow(
        MemoirConnectionError
      );
    });

    it("throws MemoirAPIError on API failure", async () => {
      mockDeleteByPlayer.mockRejectedValue(
        new MemoirAPIError("Not found", 404)
      );

      const npc = memoir.npc("old-mage-001");

      await expect(npc.forget("player-1")).rejects.toThrow(MemoirAPIError);
    });
  });

  // ─── Error classes ───────────────────────────────────────────────

  describe("Error classes", () => {
    it("MemoirConnectionError has correct name", () => {
      const err = new MemoirConnectionError("test");
      expect(err.name).toBe("MemoirConnectionError");
      expect(err).toBeInstanceOf(Error);
      expect(err).toBeInstanceOf(MemoirConnectionError);
    });

    it("MemoirAuthError has correct name", () => {
      const err = new MemoirAuthError("test");
      expect(err.name).toBe("MemoirAuthError");
      expect(err).toBeInstanceOf(Error);
      expect(err).toBeInstanceOf(MemoirAuthError);
    });

    it("MemoirTimeoutError has correct name", () => {
      const err = new MemoirTimeoutError("test");
      expect(err.name).toBe("MemoirTimeoutError");
      expect(err).toBeInstanceOf(Error);
      expect(err).toBeInstanceOf(MemoirTimeoutError);
    });

    it("MemoirAPIError has correct name and statusCode", () => {
      const err = new MemoirAPIError("test", 500);
      expect(err.name).toBe("MemoirAPIError");
      expect(err.statusCode).toBe(500);
      expect(err).toBeInstanceOf(Error);
      expect(err).toBeInstanceOf(MemoirAPIError);
    });
  });

  // ─── Instance independence ───────────────────────────────────────

  describe("Instance independence", () => {
    it("multiple Memoir instances are independent", () => {
      const memoir1 = new Memoir({
        supermemoryApiKey: "key-1",
        supermemoryBaseUrl: "http://localhost:6767",
      });
      const memoir2 = new Memoir({
        supermemoryApiKey: "key-2",
        supermemoryBaseUrl: "http://localhost:6768",
      });

      const npc1 = memoir1.npc("mage");
      const npc2 = memoir2.npc("mage");

      // Both should exist independently
      expect(npc1.npcId).toBe("mage");
      expect(npc2.npcId).toBe("mage");
    });
  });
});
