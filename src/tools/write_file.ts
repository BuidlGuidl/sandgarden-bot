import { writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import type { Tool } from "./types.js";

export const writeFileTool: Tool = {
  name: "write_file",
  description: "Write content to a file at the given path. Creates directories if needed.",
  parameters: {
    type: "object",
    properties: {
      path: { type: "string", description: "Absolute or relative file path" },
      content: { type: "string", description: "Content to write" },
    },
    required: ["path", "content"],
  },
  async execute(params) {
    const filePath = params.path as string;
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, params.content as string, "utf-8");
    return `Wrote ${filePath}`;
  },
};
