import * as readline from "node:readline";
import * as fs from "node:fs";
import * as path from "node:path";

const DIR = path.resolve(".raked");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("Delete all bot data (.raked/)? [y/N] ", (answer) => {
  rl.close();
  if (answer.trim().toLowerCase() !== "y") {
    console.log("Cancelled.");
    return;
  }
  if (!fs.existsSync(DIR)) {
    console.log("Nothing to delete — .raked/ doesn't exist.");
    return;
  }
  fs.rmSync(DIR, { recursive: true, force: true });
  console.log("Deleted .raked/");
});
