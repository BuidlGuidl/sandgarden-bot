import { resolve } from "node:path";

const PROJECT_ROOT = process.cwd();

/**
 * Resolves a path relative to cwd and ensures it stays within the project root.
 * Throws if the resolved path escapes the project directory.
 */
export function safePath(p: string): string {
  const resolved = resolve(PROJECT_ROOT, p);
  if (!resolved.startsWith(PROJECT_ROOT + "/") && resolved !== PROJECT_ROOT) {
    throw new Error(`Path "${p}" escapes project root`);
  }
  return resolved;
}
