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
  "yarn",
  "npx",
  "git",
]);

const EXEC_TIMEOUT_MS = 10_000;

function hasPathEscape(args: string[]): boolean {
  return args.some((a) => a.startsWith("/") || a.includes(".."));
}

export const execTool: Tool = {
  name: "exec",
  description:
    "Execute a command. Allowlisted: ls, cat, grep, find, node, npm, git. Scoped to project root — absolute paths and '..' are rejected.",
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

    if (hasPathEscape(args)) {
      return "Error: absolute paths and '..' are not allowed. Commands are scoped to the project root.";
    }

    const { stdout, stderr } = await execFileAsync(bin, args, {
      timeout: EXEC_TIMEOUT_MS,
      cwd: process.cwd(),
    });
    const output = (stdout + stderr).trim();
    return output || "(no output)";
  },
};
