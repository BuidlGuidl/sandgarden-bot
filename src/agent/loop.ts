import type Anthropic from "@anthropic-ai/sdk";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages.js";
import { chat } from "../provider.js";
import { getDefinitions, execute } from "../tools/registry.js";
import { buildSystemPrompt, buildMessages } from "./context.js";
import { getHistory, appendToSession } from "./session.js";

const MAX_ITERATIONS = 20;
const MAX_HISTORY = 50;

function extractText(content: Anthropic.Messages.ContentBlock[]): string {
  return content
    .filter((b): b is Anthropic.Messages.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
}

export type AgentResult = {
  content: string;
  usage: { input: number; output: number };
};

export async function runAgentLoop(
  userMessage: string,
  sessionId?: string,
): Promise<AgentResult> {
  const tools = getDefinitions();
  const system = buildSystemPrompt();
  const history = sessionId ? getHistory(sessionId, MAX_HISTORY) : [];
  const messages: MessageParam[] = buildMessages(history, userMessage);
  const usage = { input: 0, output: 0 };

  // Buffer new messages; flush once at the end for crash safety
  const newMessages: MessageParam[] = [{ role: "user", content: userMessage }];

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const response = await chat(messages, tools, system);
    usage.input += response.usage.input_tokens;
    usage.output += response.usage.output_tokens;

    if (response.stop_reason === "end_turn") {
      newMessages.push({ role: "assistant", content: response.content });
      if (sessionId) appendToSession(sessionId, newMessages);
      return { content: extractText(response.content), usage };
    }

    if (response.stop_reason === "tool_use") {
      const assistantMsg: MessageParam = { role: "assistant", content: response.content };
      messages.push(assistantMsg);
      newMessages.push(assistantMsg);

      // Execute each tool call and build tool_result blocks
      const toolUseBlocks = response.content.filter(
        (b) => b.type === "tool_use",
      );

      const results: MessageParam["content"] = [];
      for (const block of toolUseBlocks) {
        console.log(`  [tool] ${block.name}(${JSON.stringify(block.input)})`);
        const result = await execute(
          block.name,
          block.input as Record<string, unknown>,
        );
        results.push({
          type: "tool_result" as const,
          tool_use_id: block.id,
          content: result,
        });
      }

      const toolResultMsg: MessageParam = { role: "user", content: results };
      messages.push(toolResultMsg);
      newMessages.push(toolResultMsg);
      continue;
    }

    // Unexpected stop_reason
    newMessages.push({ role: "assistant", content: response.content });
    if (sessionId) appendToSession(sessionId, newMessages);
    const text = extractText(response.content);
    return { content: text || `(stopped: ${response.stop_reason})`, usage };
  }

  if (sessionId) appendToSession(sessionId, newMessages);
  return {
    content: "Error: agent loop exceeded max iterations",
    usage,
  };
}
