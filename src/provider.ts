import Anthropic from "@anthropic-ai/sdk";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages.js";

let client: Anthropic;
let model: string;
let maxTokens: number;

export function init(
  apiKey: string,
  opts: { model: string; maxTokens: number },
) {
  client = new Anthropic({ apiKey });
  model = opts.model;
  maxTokens = opts.maxTokens;
}

export async function chat(
  messages: MessageParam[],
  tools?: Anthropic.Messages.Tool[],
): Promise<Anthropic.Messages.Message> {
  return client.messages.create({
    model,
    max_tokens: maxTokens,
    messages,
    ...(tools?.length ? { tools } : {}),
  });
}
