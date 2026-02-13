import * as readline from "node:readline";
import * as fs from "node:fs";
import * as path from "node:path";
import { DATA_DIR } from "../src/config.js";

const DIR = path.resolve(DATA_DIR);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question(`Delete all bot data (${DATA_DIR}/)? [y/N] `, (answer) => {
  rl.close();
  if (answer.trim().toLowerCase() !== "y") {
    console.log("Cancelled.");
    return;
  }
  if (!fs.existsSync(DIR)) {
    console.log(`Nothing to delete — ${DATA_DIR}/ doesn't exist.`);
    return;
  }
  fs.rmSync(DIR, { recursive: true, force: true });
  console.log(`Deleted ${DATA_DIR}/`);
});
