import { Bot } from "grammy";
import { loadConfig } from "./config.js";
import { init } from "./provider.js";
import { registerBuiltinTools } from "./tools/registry.js";
import { runAgentLoop } from "./agent/loop.js";
import { clearSession } from "./agent/session.js";

const TELEGRAM_MAX_LENGTH = 4096;

function splitMessage(text: string): string[] {
  if (text.length <= TELEGRAM_MAX_LENGTH) return [text];

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= TELEGRAM_MAX_LENGTH) {
      chunks.push(remaining);
      break;
    }

    // Try to split at last newline before limit
    const slice = remaining.slice(0, TELEGRAM_MAX_LENGTH);
    const lastNewline = slice.lastIndexOf("\n");
    const splitAt = lastNewline > 0 ? lastNewline : TELEGRAM_MAX_LENGTH;

    chunks.push(remaining.slice(0, splitAt));
    remaining = remaining.slice(splitAt).replace(/^\n/, "");
  }

  return chunks;
}

const config = await loadConfig();

if (!config.telegramBotToken) {
  console.error("Set telegramBotToken in bot.config.ts to use Telegram mode.");
  process.exit(1);
}

init(config.anthropicApiKey, {
  model: config.model,
  maxTokens: config.maxTokens,
});

registerBuiltinTools();

const bot = new Bot(config.telegramBotToken);

function isAllowed(chatId: number, chatType: string): boolean {
  if (chatType !== "private") return false;
  if (config.allowedChatIds && !config.allowedChatIds.includes(chatId)) return false;
  return true;
}

bot.command("start", async (ctx) => {
  if (!isAllowed(ctx.chat.id, ctx.chat.type)) return;
  await ctx.reply("Hey! I'm your AI assistant. Send me any message to chat.\n\nUse /new to start a fresh conversation.");
});

bot.command("new", async (ctx) => {
  if (!isAllowed(ctx.chat.id, ctx.chat.type)) return;
  clearSession(`telegram:${ctx.chat.id}`);
  await ctx.reply("Session cleared. Starting fresh!");
});

bot.on("message:text", async (ctx) => {
  if (!isAllowed(ctx.chat.id, ctx.chat.type)) return;

  // Skip bot commands — handled above
  if (ctx.message.text.startsWith("/")) return;

  const sessionId = `telegram:${ctx.chat.id}`;

  // Show typing while processing
  const typingInterval = setInterval(() => {
    ctx.replyWithChatAction("typing").catch(() => {});
  }, 4000);

  // Send initial typing action immediately
  await ctx.replyWithChatAction("typing").catch(() => {});

  try {
    const result = await runAgentLoop(ctx.message.text, sessionId);

    const chunks = splitMessage(result.content);
    for (const chunk of chunks) {
      await ctx.reply(chunk);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await ctx.reply(`Error: ${msg}`);
  } finally {
    clearInterval(typingInterval);
  }
});

bot.start();
console.log("Telegram bot started (long-polling)");
