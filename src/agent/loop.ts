import type Anthropic from "@anthropic-ai/sdk";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages.js";
import { chat } from "../provider.js";
import { getDefinitions, execute } from "../tools/registry.js";

const MAX_ITERATIONS = 20;

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
): Promise<AgentResult> {
  const tools = getDefinitions();
  const messages: MessageParam[] = [{ role: "user", content: userMessage }];
  const usage = { input: 0, output: 0 };

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const response = await chat(messages, tools);
    usage.input += response.usage.input_tokens;
    usage.output += response.usage.output_tokens;

    if (response.stop_reason === "end_turn") {
      return { content: extractText(response.content), usage };
    }

    if (response.stop_reason === "tool_use") {
      // Push the full assistant message
      messages.push({ role: "assistant", content: response.content });

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

      messages.push({ role: "user", content: results });
      continue;
    }

    // Unexpected stop_reason
    const text = extractText(response.content);
    return { content: text || `(stopped: ${response.stop_reason})`, usage };
  }

  return {
    content: "Error: agent loop exceeded max iterations",
    usage,
  };
}
