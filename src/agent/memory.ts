import { existsSync, mkdirSync, readFileSync, appendFileSync } from "fs";
import { join } from "path";

const MEMORY_DIR = join(process.cwd(), ".raked", "memory");
const MEMORY_FILE = join(MEMORY_DIR, "MEMORY.md");

export function readMemory(): string {
  if (!existsSync(MEMORY_FILE)) return "";
  return readFileSync(MEMORY_FILE, "utf-8");
}

export function appendMemory(note: string): void {
  if (!existsSync(MEMORY_DIR)) mkdirSync(MEMORY_DIR, { recursive: true });
  appendFileSync(MEMORY_FILE, note + "\n");
}
