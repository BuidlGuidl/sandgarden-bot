import * as readline from "node:readline";
import * as fs from "node:fs";
import * as path from "node:path";

const DIR = path.resolve(".sandgarden-bot");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("Delete all bot data (.sandgarden-bot/)? [y/N] ", (answer) => {
  rl.close();
  if (answer.trim().toLowerCase() !== "y") {
    console.log("Cancelled.");
    return;
  }
  if (!fs.existsSync(DIR)) {
    console.log("Nothing to delete — .sandgarden-bot/ doesn't exist.");
    return;
  }
  fs.rmSync(DIR, { recursive: true, force: true });
  console.log("Deleted .sandgarden-bot/");
});
