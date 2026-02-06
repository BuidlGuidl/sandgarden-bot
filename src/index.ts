import { loadConfig } from "./config.js";
import { init } from "./provider.js";
import { registerBuiltinTools } from "./tools/registry.js";
import { runAgentLoop } from "./agent/loop.js";

const message = process.argv[2];

if (!message) {
  console.error("Usage: npx tsx src/index.ts \"your message\"");
  process.exit(1);
}

const config = await loadConfig();
init(config.anthropicApiKey, {
  model: config.model,
  maxTokens: config.maxTokens,
});

registerBuiltinTools();

try {
  const result = await runAgentLoop(message);
  console.log(result.content);
  console.log(
    `\n[tokens: ${result.usage.input} in, ${result.usage.output} out]`,
  );
} catch (err) {
  console.error("Agent error:", err instanceof Error ? err.message : err);
  process.exit(1);
}
