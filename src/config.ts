export type BotConfig = {
  anthropicApiKey: string;
  model?: string;
  maxTokens?: number;
  telegramBotToken?: string;
  allowedChatIds?: number[];
  braveApiKey?: string;
};

const DEFAULTS = {
  model: "claude-sonnet-4-20250514",
  maxTokens: 4096,
} as const;

export type ResolvedConfig = Required<Pick<BotConfig, "anthropicApiKey" | "model" | "maxTokens">> &
  Pick<BotConfig, "telegramBotToken" | "allowedChatIds" | "braveApiKey">;

export async function loadConfig(): Promise<ResolvedConfig> {
  let mod: { default: BotConfig };

  const configPath = new URL("../bot.config.js", import.meta.url).href;
  try {
    mod = await import(configPath);
  } catch {
    console.error(
      "Config not found. Copy bot.config.example.ts → bot.config.ts and set your API key.",
    );
    return process.exit(1);
  }

  const raw = mod.default;

  if (!raw.anthropicApiKey || raw.anthropicApiKey === "your-api-key-here") {
    console.error("Set your Anthropic API key in bot.config.ts");
    return process.exit(1);
  }

  return {
    anthropicApiKey: raw.anthropicApiKey,
    model: raw.model ?? DEFAULTS.model,
    maxTokens: raw.maxTokens ?? DEFAULTS.maxTokens,
    telegramBotToken: raw.telegramBotToken,
    allowedChatIds: raw.allowedChatIds,
    braveApiKey: raw.braveApiKey,
  };
}
