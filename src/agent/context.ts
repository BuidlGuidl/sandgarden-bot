import type { MessageParam } from "@anthropic-ai/sdk/resources/messages.js";
import { platform, arch } from "os";

function identity(): string {
  return "You are a helpful assistant. Be concise. Think step by step when using tools.";
}

function dynamicContext(): string {
  const now = new Date().toISOString();
  const cwd = process.cwd();
  const os = `${platform()} ${arch()}`;
  return `Current time: ${now}\nWorking directory: ${cwd}\nOS: ${os}`;
}

export function buildSystemPrompt(): string {
  return [identity(), dynamicContext()].join("\n\n");
}

// TODO: history will be populated by session persistence (iteration 4)
export function buildMessages(
  history: MessageParam[],
  userMessage: string,
): MessageParam[] {
  return [...history, { role: "user" as const, content: userMessage }];
}
