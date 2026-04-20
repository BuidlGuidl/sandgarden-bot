import type Anthropic from "@anthropic-ai/sdk";
import { appendFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";

let lastStopReason: Anthropic.Messages.Message["stop_reason"] | undefined;

export function isProviderLogEnabled(): boolean {
  return process.env.PROVIDER_LOG === "1";
}

export async function logProviderExchange(params: {
  request: Anthropic.Messages.MessageCreateParams;
  response: Anthropic.Messages.Message;
}): Promise<void> {
  if (!isProviderLogEnabled()) return;

  try {
    const humanLogPath = ".raked/logs/provider.log";
    const jsonlPath = ".raked/logs/provider.jsonl";
    await mkdir(dirname(humanLogPath), { recursive: true });

    const entry: ExchangeEntry = {
      ts: new Date().toISOString(),
      type: "llm_exchange",
      request: params.request,
      response: params.response,
    };

    // Human-readable log (primary)
    await appendFile(humanLogPath, formatExchange(entry), "utf8");
    // Machine-readable log (secondary)
    await appendFile(jsonlPath, `${JSON.stringify(entry)}\n`, "utf8");
  } catch {
    // Best-effort logging; ignore failures.
  } finally {
    // Used to label the next exchange in the same process.
    lastStopReason = params.response.stop_reason ?? undefined;
  }
}

type ExchangeEntry = {
  ts: string;
  type: "llm_exchange";
  request: Anthropic.Messages.MessageCreateParams;
  response: Anthropic.Messages.Message;
};

function formatExchange(entry: ExchangeEntry): string {
  const { ts, request, response } = entry;
  const toolNames = (request.tools ?? []).map((t) => t.name);
  const isToolUseFollowup = lastStopReason === "tool_use";

  const out: string[] = [];
  out.push("=".repeat(80));
  out.push(`${isToolUseFollowup ? "TOOL_USE" : "LLM EXCHANGE"} @ ${ts}`);
  out.push("");

  out.push("REQUEST");
  out.push(`- model: ${request.model}`);
  out.push(`- max_tokens: ${request.max_tokens}`);
  out.push(`- tools: ${toolNames.length ? toolNames.join(", ") : "(none)"}`);
  out.push("");

  if (typeof request.system === "string" && request.system.trim().length) {
    out.push("SYSTEM");
    out.push("<<<");
    out.push(request.system);
    out.push(">>>");
    out.push("");
  }

  out.push("MESSAGES");
  request.messages.forEach((m, idx) => {
    out.push(`- [${idx}] role=${m.role}`);
    if (typeof m.content === "string") {
      out.push(indent(m.content));
      return;
    }
    for (const block of m.content) {
      if (block.type === "text") {
        out.push(indent(`text: ${block.text}`));
      } else if (block.type === "tool_use") {
        out.push(
          indent(
            `tool_use: name=${block.name} id=${block.id} input=${safeJson(block.input)}`,
          ),
        );
      } else if (block.type === "tool_result") {
        out.push(
          indent(
            `tool_result: tool_use_id=${block.tool_use_id} content=${truncate(
              block.content,
              4000,
            )}`,
          ),
        );
      } else {
        out.push(indent(`${block.type}: ${safeJson(block)}`));
      }
    }
  });
  out.push("");

  out.push("RESPONSE");
  out.push(`- id: ${response.id}`);
  out.push(`- stop_reason: ${response.stop_reason}`);
  out.push(
    `- usage: input=${response.usage.input_tokens} output=${response.usage.output_tokens}`,
  );
  out.push("");

  out.push("CONTENT");
  for (const block of response.content) {
    if (block.type === "text") {
      out.push(indent(block.text));
    } else if (block.type === "tool_use") {
      out.push(
        indent(
          `tool_use: name=${block.name} id=${block.id} input=${safeJson(block.input)}`,
        ),
      );
    } else {
      out.push(indent(`${block.type}: ${safeJson(block)}`));
    }
  }
  out.push("");

  return `${out.join("\n")}\n`;
}

function indent(s: string, spaces = 2): string {
  const pad = " ".repeat(spaces);
  return s
    .split("\n")
    .map((line) => `${pad}${line}`)
    .join("\n");
}

function safeJson(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function truncate(value: unknown, maxLen: number): string {
  const s = typeof value === "string" ? value : safeJson(value);
  if (s.length <= maxLen) return s;
  return `${s.slice(0, maxLen)}… (truncated, ${s.length} chars total)`;
}
