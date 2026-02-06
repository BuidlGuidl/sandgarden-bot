import { writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import type { Tool } from "./types.js";
import { safePath } from "./safe-path.js";

export const writeFileTool: Tool = {
  name: "write_file",
  description:
    "Write content to a file. Creates directories if needed. Path is relative to project root; cannot escape it.",
  parameters: {
    type: "object",
    properties: {
      path: { type: "string", description: "File path relative to project root" },
      content: { type: "string", description: "Content to write" },
    },
    required: ["path", "content"],
  },
  async execute(params) {
    const resolved = safePath(params.path as string);
    await mkdir(dirname(resolved), { recursive: true });
    await writeFile(resolved, params.content as string, "utf-8");
    return `Wrote ${params.path as string}`;
  },
};
