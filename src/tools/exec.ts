import { execFile as execFileCb } from "node:child_process";
import { promisify } from "node:util";
import type { Tool } from "./types.js";

const execFileAsync = promisify(execFileCb);

const ALLOWED_COMMANDS = new Set([
  "ls",
  "cat",
  "grep",
  "find",
  "node",
  "npm",
  "git",
]);

const EXEC_TIMEOUT_MS = 10_000;

export const execTool: Tool = {
  name: "exec",
  description:
    "Execute a shell command. Only allowlisted commands are permitted: ls, cat, grep, find, node, npm, git.",
  parameters: {
    type: "object",
    properties: {
      command: { type: "string", description: "Shell command to execute" },
    },
    required: ["command"],
  },
  async execute(params) {
    const command = params.command as string;
    const parts = command.trim().split(/\s+/);
    const bin = parts[0];
    const args = parts.slice(1);

    if (!ALLOWED_COMMANDS.has(bin)) {
      return `Error: command "${bin}" is not allowed. Allowed: ${[...ALLOWED_COMMANDS].join(", ")}`;
    }

    const { stdout, stderr } = await execFileAsync(bin, args, {
      timeout: EXEC_TIMEOUT_MS,
    });
    const output = (stdout + stderr).trim();
    return output || "(no output)";
  },
};
