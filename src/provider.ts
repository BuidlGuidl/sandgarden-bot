import Anthropic from "@anthropic-ai/sdk";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages.js";
import { logProviderExchange } from "./provider-log.js";

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
  system?: string,
): Promise<Anthropic.Messages.Message> {
  const payload: Anthropic.Messages.MessageCreateParams = {
    model,
    max_tokens: maxTokens,
    ...(system ? { system } : {}),
    messages,
    ...(tools?.length ? { tools } : {}),
  };

  const response = await client.messages.create(payload);
  await logProviderExchange({ request: payload, response });
  return response;
}
