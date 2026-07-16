/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║                                                                  ║
 * ║   📖 Memoir — Interactive NPC Memory Demo                        ║
 * ║                                                                  ║
 * ║   This script proves Memoir works end-to-end:                    ║
 * ║   • Connects to Supermemory Local                                ║
 * ║   • Uses Gemini 3.5 Flash as the NPC brain                      ║
 * ║   • Saves every conversation to persistent memory                ║
 * ║   • Recalls past context on every new message                    ║
 * ║                                                                  ║
 * ║   Run: npx tsx demo.ts                                           ║
 * ║                                                                  ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

import * as readline from "node:readline";
import { Memoir, MemoirConnectionError } from "../src/index";
import { GoogleGenAI } from "@google/genai";
import "dotenv/config";

// ─── ANSI Colors ─────────────────────────────────────────────────
const C = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  magenta: "\x1b[35m",
  blue: "\x1b[34m",
  gray: "\x1b[90m",
  bgCyan: "\x1b[46m",
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m",
  white: "\x1b[37m",
};

// ─── Config ──────────────────────────────────────────────────────
const SUPERMEMORY_API_KEY = process.env.SUPERMEMORY_API_KEY ?? "test";
const SUPERMEMORY_BASE_URL =
  process.env.SUPERMEMORY_BASE_URL ?? "http://localhost:6767";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const PLAYER_ID = process.env.PLAYER_ID ?? "demo-player-1";
const NPC_ID = process.env.NPC_ID ?? "old-mage-aldric";

// ─── NPC personality ─────────────────────────────────────────────
const NPC_SYSTEM_PROMPT = `You are Aldric, an old mage who lives in a tower at the edge of a small medieval village.
You are wise but slightly eccentric. You speak in a warm, grandfatherly tone.
You love telling stories about your adventures and are always curious about travelers.
You have a pet owl named Hoot.

CRITICAL INSTRUCTIONS:
- Reply in 1-3 short sentences, always in character.
- Never use stage directions or action descriptions in brackets.
- If you remember something about the player from past conversations, casually reference it naturally.
- If this is your first meeting, introduce yourself warmly.`;

// ─── Helpers ─────────────────────────────────────────────────────
function banner() {
  console.log(`
${C.cyan}${C.bold}  ╔══════════════════════════════════════════════════════════════╗
  ║                                                              ║
  ║   📖  M E M O I R  —  Interactive NPC Demo                   ║
  ║                                                              ║
  ║   Talk to Aldric the Old Mage. He remembers everything.      ║
  ║   Close this script, come back later, and he still knows.    ║
  ║                                                              ║
  ╚══════════════════════════════════════════════════════════════╝${C.reset}
`);
}

function status(label: string, value: string, color = C.green) {
  console.log(`  ${C.dim}${label}:${C.reset} ${color}${value}${C.reset}`);
}

function divider() {
  console.log(
    `  ${C.dim}${"─".repeat(58)}${C.reset}`
  );
}

function npcSays(text: string) {
  console.log(
    `\n  ${C.yellow}${C.bold}🧙 Aldric:${C.reset} ${C.white}${text}${C.reset}\n`
  );
}

function memoryInfo(context: string) {
  if (!context) {
    console.log(
      `  ${C.dim}📭 Memory: No past memories of you yet${C.reset}`
    );
  } else {
    const lines = context.split("\n").filter(Boolean);
    console.log(
      `  ${C.magenta}📬 Memory: ${lines.length} past interaction(s) recalled${C.reset}`
    );
  }
}

function errorBox(msg: string) {
  console.log(`\n  ${C.red}${C.bold}✖ ERROR:${C.reset} ${C.red}${msg}${C.reset}\n`);
}

function successBox(msg: string) {
  console.log(`  ${C.green}✔ ${msg}${C.reset}`);
}

// ─── Main ────────────────────────────────────────────────────────
async function main() {
  banner();

  // ── Validate env vars ──────────────────────────────────────────
  if (!GEMINI_API_KEY) {
    errorBox(
      "GEMINI_API_KEY is not set!\n" +
        "  Get one free at: https://aistudio.google.com/apikey\n" +
        "  Then set it:     set GEMINI_API_KEY=your_key_here"
    );
    process.exit(1);
  }

  status("Supermemory URL", SUPERMEMORY_BASE_URL);
  status("Supermemory Key", SUPERMEMORY_API_KEY.substring(0, 8) + "...");
  status("Gemini Key", GEMINI_API_KEY.substring(0, 8) + "...");
  status("Player ID", PLAYER_ID, C.cyan);
  status("NPC", `${NPC_ID} (Aldric the Old Mage)`, C.yellow);
  divider();

  // ── Initialize Memoir ──────────────────────────────────────────
  console.log(`\n  ${C.dim}Initializing Memoir...${C.reset}`);

  const memoir = new Memoir({
    supermemoryApiKey: SUPERMEMORY_API_KEY,
    supermemoryBaseUrl: SUPERMEMORY_BASE_URL,
    requestTimeoutMs: 10000,
  });

  // ── Health Check ───────────────────────────────────────────────
  console.log(`  ${C.dim}Checking Supermemory Local...${C.reset}`);
  const healthy = await memoir.healthCheck();

  if (!healthy) {
    errorBox(
      "Supermemory Local is NOT running!\n\n" +
        `  Start it with: ${C.bold}npx supermemory local${C.reset}${C.red}\n` +
        "  Then run this demo again."
    );
    process.exit(1);
  }

  successBox("Supermemory Local is running");

  // ── Initialize Gemini ──────────────────────────────────────────
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  successBox("Gemini AI initialized");

  // ── Get NPC handle ─────────────────────────────────────────────
  const npc = memoir.npc(NPC_ID);
  successBox(`NPC handle created: ${NPC_ID}`);

  // ── Check existing memory ──────────────────────────────────────
  console.log(`\n  ${C.dim}Checking for past memories...${C.reset}`);
  const initialContext = await npc.recallContext(PLAYER_ID);
  memoryInfo(initialContext);

  divider();
  console.log(
    `\n  ${C.bold}Type your messages below. The mage will remember everything.${C.reset}`
  );
  console.log(
    `  ${C.dim}Commands: /recall  /forget  /quit${C.reset}\n`
  );

  // ── Conversation Loop ──────────────────────────────────────────
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const prompt = () => {
    rl.question(`  ${C.cyan}${C.bold}You:${C.reset} `, async (input) => {
      const trimmed = input.trim();

      if (!trimmed) {
        prompt();
        return;
      }

      // ── Slash commands ─────────────────────────────────────────
      if (trimmed === "/quit" || trimmed === "/exit") {
        console.log(
          `\n  ${C.yellow}🧙 Aldric waves goodbye...${C.reset}\n`
        );
        rl.close();
        process.exit(0);
      }

      if (trimmed === "/recall") {
        const ctx = await npc.recallContext(PLAYER_ID);
        if (ctx) {
          console.log(`\n  ${C.magenta}${C.bold}📬 Full Memory Dump:${C.reset}`);
          for (const line of ctx.split("\n").filter(Boolean)) {
            console.log(`  ${C.dim}  • ${line}${C.reset}`);
          }
          console.log();
        } else {
          console.log(`\n  ${C.dim}📭 No memories stored yet.${C.reset}\n`);
        }
        prompt();
        return;
      }

      if (trimmed === "/forget") {
        try {
          await npc.forget(PLAYER_ID);
          successBox("Memory wiped! Aldric no longer remembers you.\n");
        } catch (err) {
          errorBox(`Failed to forget: ${(err as Error).message}`);
        }
        prompt();
        return;
      }

      // ── Normal conversation ────────────────────────────────────
      try {
        // 1. Recall context
        process.stdout.write(`  ${C.dim}  ⟳ recalling memory from Supermemory...${C.reset}`);
        const context = await npc.recallContext(PLAYER_ID);
        process.stdout.write(`\r  ${C.dim}  ✔ memory recalled from Supermemory     ${C.reset}\n`);

        // ── Visual Verification Panel ──────────────────────────────
        console.log(`\n  ${C.magenta}${C.bold}┌─ [MEMOIR DEBUG: RECALLED CONTEXT] ──────────────────────────┐${C.reset}`);
        if (context) {
          const lines = context.split("\n").filter(Boolean);
          for (const line of lines) {
            console.log(`  ${C.magenta}│${C.reset} ${C.gray}${line.padEnd(58)}${C.reset} ${C.magenta}│${C.reset}`);
          }
        } else {
          console.log(`  ${C.magenta}│${C.reset} ${C.dim}${"(No past memories found in Supermemory - First Meeting)".padEnd(58)}${C.reset} ${C.magenta}│${C.reset}`);
        }
        console.log(`  ${C.magenta}└─────────────────────────────────────────────────────────────┘${C.reset}\n`);
        // ───────────────────────────────────────────────────────────

        // 2. Build prompt
        const memoryBlock = context
          ? `Here is what you remember about this player from past conversations:\n${context}`
          : "You have never met this player before. This is your first meeting.";

        const fullPrompt = `${NPC_SYSTEM_PROMPT}\n\n${memoryBlock}\n\nThe player just said: "${trimmed}"\n\nReply in character:`;

        // 3. Generate reply with Gemini
        process.stdout.write(`  ${C.dim}  ⟳ generating NPC reply via Gemini...${C.reset}`);
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: fullPrompt,
        });

        const reply =
          (response as unknown as { text: string }).text?.trim() ??
          "...";
        process.stdout.write(`\r  ${C.dim}  ✔ reply generated     ${C.reset}\n`);

        // 4. Save interaction
        process.stdout.write(`  ${C.dim}  ⟳ syncing new interaction back to Supermemory...${C.reset}`);
        await npc.saveInteraction(PLAYER_ID, trimmed, reply);
        process.stdout.write(`\r  ${C.dim}  ✔ synced to Supermemory successfully   ${C.reset}\n`);

        // 5. Display reply
        npcSays(reply);
      } catch (err) {
        if (err instanceof MemoirConnectionError) {
          errorBox("Lost connection to Supermemory Local!");
        } else {
          errorBox((err as Error).message);
        }
      }

      prompt();
    });
  };

  prompt();
}

main().catch((err) => {
  errorBox(err.message);
  process.exit(1);
});
