import { readFile } from "node:fs/promises";
import type { Tool } from "./types.js";
import { safePath } from "./safe-path.js";

export const readFileTool: Tool = {
  name: "read_file",
  description:
    "Read the contents of a file. Path is relative to project root; cannot escape it.",
  parameters: {
    type: "object",
    properties: {
      path: { type: "string", description: "File path relative to project root" },
    },
    required: ["path"],
  },
  async execute(params) {
    const resolved = safePath(params.path as string);
    return await readFile(resolved, "utf-8");
  },
};
