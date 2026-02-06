import type Anthropic from "@anthropic-ai/sdk";
import type { Tool } from "./types.js";
import { readFileTool } from "./read_file.js";
import { writeFileTool } from "./write_file.js";
import { execTool } from "./exec.js";

const tools = new Map<string, Tool>();

export function register(tool: Tool): void {
  tools.set(tool.name, tool);
}

export function getDefinitions(): Anthropic.Messages.Tool[] {
  return [...tools.values()].map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.parameters as Anthropic.Messages.Tool["input_schema"],
  }));
}

export async function execute(
  name: string,
  params: Record<string, unknown>,
): Promise<string> {
  const tool = tools.get(name);
  if (!tool) return `Error: unknown tool "${name}"`;

  try {
    return await tool.execute(params);
  } catch (err) {
    return `Error: ${err instanceof Error ? err.message : String(err)}`;
  }
}

export function registerBuiltinTools(): void {
  register(readFileTool);
  register(writeFileTool);
  register(execTool);
}
