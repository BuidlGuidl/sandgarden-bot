import { loadConfig } from "../config.js";
import type { Tool } from "./types.js";

const BRAVE_ENDPOINT = "https://api.search.brave.com/res/v1/web/search";
const MAX_RESULTS = 5;

type BraveResult = {
  title?: string;
  url?: string;
  description?: string;
};

type BraveResponse = {
  web?: { results?: BraveResult[] };
};

export const webSearchTool: Tool = {
  name: "web_search",
  description: "Search the web using Brave Search. Returns top results with title, URL, and description.",
  parameters: {
    type: "object",
    properties: {
      query: { type: "string", description: "Search query" },
    },
    required: ["query"],
  },
  async execute(params) {
    const query = params.query as string;
    const config = await loadConfig();

    if (!config.braveApiKey) {
      return "Error: braveApiKey not set in bot.config.ts. Web search is unavailable.";
    }

    const url = `${BRAVE_ENDPOINT}?q=${encodeURIComponent(query)}&count=${MAX_RESULTS}`;
    const res = await fetch(url, {
      headers: { "X-Subscription-Token": config.braveApiKey },
    });

    if (!res.ok) {
      return `Error: Brave Search returned ${res.status} ${res.statusText}`;
    }

    const data = (await res.json()) as BraveResponse;
    const results = data.web?.results ?? [];

    if (results.length === 0) return "No results found.";

    return results
      .map((r) => `${r.title} | ${r.url}\n${r.description ?? ""}`)
      .join("\n\n");
  },
};
