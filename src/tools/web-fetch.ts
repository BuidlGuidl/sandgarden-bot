import { Readability } from "@mozilla/readability";
import { parseHTML } from "linkedom";
import type { Tool } from "./types.js";

const MAX_CONTENT_LENGTH = 5000;
const FETCH_TIMEOUT_MS = 10_000;
const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

// Hostname-based SSRF check. Does not protect against DNS rebinding
// (attacker domain resolving to private IP). Acceptable for a personal bot.
const PRIVATE_PATTERNS = [
  /^localhost$/i,
  /^127\.\d+\.\d+\.\d+$/,
  /^10\.\d+\.\d+\.\d+$/,
  /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/,
  /^192\.168\.\d+\.\d+$/,
  /^169\.254\.\d+\.\d+$/,
  /^0\.0\.0\.0$/,
  /^::1$/,
  /^f[cd][0-9a-f]{2}:/i,
  /^fe80:/i,
];

function isPrivateHost(hostname: string): boolean {
  return PRIVATE_PATTERNS.some((p) => p.test(hostname));
}

export const webFetchTool: Tool = {
  name: "web_fetch",
  description: "Fetch a web page and extract its main text content.",
  parameters: {
    type: "object",
    properties: {
      url: { type: "string", description: "URL to fetch" },
    },
    required: ["url"],
  },
  async execute(params) {
    const raw = params.url as string;

    let parsed: URL;
    try {
      parsed = new URL(raw);
    } catch {
      return "Error: invalid URL.";
    }

    if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
      return "Error: only http and https URLs are supported.";
    }

    if (isPrivateHost(parsed.hostname)) {
      return "Error: fetching private/internal addresses is not allowed.";
    }

    const res = await fetch(raw, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { "User-Agent": "SandgardenBot/1.0" },
      redirect: "manual",
    });

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      return `Error: redirect to ${location ?? "unknown"} — fetch the target URL directly.`;
    }

    if (!res.ok) {
      return `Error: fetch returned ${res.status} ${res.statusText}`;
    }

    const html = await res.text();
    const { document } = parseHTML(html);
    const article = new Readability(document as unknown as Document).parse();
    const text = article?.textContent ?? html.replace(/<[^>]*>/g, " ");

    return text.slice(0, MAX_CONTENT_LENGTH).trim() || "(empty page)";
  },
};
