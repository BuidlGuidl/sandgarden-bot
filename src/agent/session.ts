import { existsSync, mkdirSync, readFileSync, appendFileSync, unlinkSync } from "fs";
import { join } from "path";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages.js";

const SESSIONS_DIR = join(process.cwd(), ".sandgarden-bot", "sessions");

type SessionEntry = {
  role: "user" | "assistant";
  content: MessageParam["content"];
  timestamp: string;
};

function safeId(sessionId: string): string {
  return sessionId.replace(/:/g, "_");
}

function sessionDir(sessionId: string): string {
  return join(SESSIONS_DIR, safeId(sessionId));
}

function sessionPath(sessionId: string): string {
  return join(sessionDir(sessionId), "current.jsonl");
}

export function load(sessionId: string): MessageParam[] {
  const path = sessionPath(sessionId);
  if (!existsSync(path)) return [];

  const lines = readFileSync(path, "utf-8").split("\n").filter(Boolean);
  return lines.reduce<MessageParam[]>((acc, line, i) => {
    try {
      const entry: SessionEntry = JSON.parse(line);
      acc.push({ role: entry.role, content: entry.content });
    } catch {
      console.warn(`[session] skipping corrupt line ${i + 1} in ${path}`);
    }
    return acc;
  }, []);
}

function dailyPath(sessionId: string): string {
  const date = new Date().toISOString().slice(0, 10);
  return join(sessionDir(sessionId), "daily", `${date}.jsonl`);
}

export function appendToSession(sessionId: string, messages: MessageParam[]): void {
  const daily = dailyPath(sessionId);
  const dir = sessionDir(sessionId);
  const dailyDir = join(dir, "daily");

  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  if (!existsSync(dailyDir)) mkdirSync(dailyDir, { recursive: true });

  const now = new Date().toISOString();
  const lines = messages.map((msg) => {
    const entry: SessionEntry = {
      role: msg.role,
      content: msg.content,
      timestamp: now,
    };
    return JSON.stringify(entry);
  });

  const data = lines.join("\n") + "\n";
  appendFileSync(sessionPath(sessionId), data);
  appendFileSync(daily, data);
}

export function clearSession(sessionId: string): boolean {
  const path = sessionPath(sessionId);
  if (!existsSync(path)) return false;
  unlinkSync(path);
  return true;
}

function isToolResultMessage(msg: MessageParam): boolean {
  if (msg.role !== "user" || typeof msg.content === "string") return false;
  return Array.isArray(msg.content) &&
    msg.content.some((b) => "type" in b && b.type === "tool_result");
}

export function getHistory(sessionId: string, max: number): MessageParam[] {
  const all = load(sessionId);
  if (all.length <= max) return all;

  let start = all.length - max;

  // Walk backward to include the full tool exchange.
  // May return slightly more than `max` — acceptable tradeoff
  // vs breaking the assistant/tool_result pairing contract.
  while (start > 0 && isToolResultMessage(all[start])) {
    start--;
  }

  return all.slice(start);
}
