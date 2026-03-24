import { createInterface } from "node:readline/promises";
import { loadConfig } from "./config.js";
import { init } from "./provider.js";
import { registerBuiltinTools } from "./tools/registry.js";
import { runAgentLoop } from "./agent/loop.js";
import { clearSession, getHistory } from "./agent/session.js";

const config = await loadConfig();
init(config.anthropicApiKey, {
  model: config.model,
  maxTokens: config.maxTokens,
});
registerBuiltinTools();

const message = process.argv[2];

// Single-shot mode
if (message) {
  try {
    const result = await runAgentLoop(message, "cli:default");
    console.log(result.content);
    console.log(
      `\n[tokens: ${result.usage.input} in, ${result.usage.output} out]`,
    );
  } catch (err) {
    console.error("Agent error:", err instanceof Error ? err.message : err);
    process.exit(1);
  }
  process.exit(0);
}

// REPL mode
const sessionId = "cli:repl";
const history = getHistory(sessionId, Infinity);
if (history.length > 0) {
  console.log(`Resuming session (${history.length} messages). /new to start fresh.`);
} else {
  console.log("New session. /help for commands.");
}
console.log();

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.on("SIGINT", () => {
  rl.close();
});

while (true) {
  let input: string;
  try {
    input = await rl.question("you> ");
  } catch {
    // Ctrl+D or closed stream
    console.log("\nBye!");
    break;
  }

  const trimmed = input.trim();
  if (!trimmed) continue;

  if (trimmed === "/help") {
    console.log("Commands: /new  /exit  /quit\n");
    continue;
  }

  if (trimmed === "/exit" || trimmed === "/quit") {
    console.log("Bye!");
    break;
  }

  if (trimmed === "/new") {
    clearSession(sessionId);
    console.log("Session cleared. Starting fresh!\n");
    continue;
  }

  try {
    const result = await runAgentLoop(trimmed, sessionId);
    console.log(`\nassistant> ${result.content}`);
    console.log(
      `[tokens: ${result.usage.input} in, ${result.usage.output} out]\n`,
    );
  } catch (err) {
    console.error(
      "Agent error:",
      err instanceof Error ? err.message : err,
      "\n",
    );
  }
}

rl.close();
