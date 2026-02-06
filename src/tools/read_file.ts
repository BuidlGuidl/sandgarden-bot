import { readFile } from "node:fs/promises";
import type { Tool } from "./types.js";

export const readFileTool: Tool = {
  name: "read_file",
  description: "Read the contents of a file at the given path.",
  parameters: {
    type: "object",
    properties: {
      path: { type: "string", description: "Absolute or relative file path" },
    },
    required: ["path"],
  },
  async execute(params) {
    const content = await readFile(params.path as string, "utf-8");
    return content;
  },
};
