# sandgarden-bot

A minimal AI agent built from scratch in TypeScript. A hackable implementation to understand how all the pieces of an AI agent fit together: the agent loop, sessions, memory, tools, and skills. Simple but covers the key concepts.

## Quickstart

```bash
git clone https://github.com/BuidlGuidl/sandgarden-bot
cd sandgarden-bot
npm install
cp bot.config.example.ts bot.config.ts
# Edit bot.config.ts: add, at least, your Anthropic API key
```

Run via CLI:

```bash
npm run dev "What files do you have in your working directory?"
# this will send a request to the LLM and it will use the tools to get the answer
```

Run via Telegram (see [Telegram setup](#telegram-setup) below):

```bash
npm run telegram
```

## Architecture

These are the core AI agent pieces and how they connect.

### Agent Loop

The fundamental cycle every AI agent runs. The LLM can request actions (tool calls), get results back, and keep going until it's done.

```
user message
    ↓
  build context (identity + memory + available skills + session history + tool definitions)
    ↓
┌─→ LLM ──→ stop_reason: end? ──→ done
│    ↓
│   stop_reason: tool_use
│    ↓
│   execute tool(s)
│    ↓
└── tool_result(s) back to LLM
```

Before the first LLM call, the agent assembles everything the model needs into a single request: a **system prompt** (identity, current time, memory contents, available skills), the **conversation history** (last 50 messages from the session), and **tool definitions** (name, description, JSON schema for each tool). The LLM uses all of this to decide what to say or which tools to call.

File: `src/agent/loop.ts`, context assembly in `src/agent/context.ts`

### Sessions

Without sessions, the agent forgets what you just said, every request would be a blank slate. The conversation is stored as JSONL for easy parsing.

Each session also keeps daily logs (`daily/YYYY-MM-DD.jsonl`) for future use like summaries or analytics.

File: `src/agent/session.ts`
Stored in: `.sandgarden-bot/sessions/<session_id>/`

### Memory

Sessions eventually fill the context window, and you don't need the entire conversation history for every request. Memory solves this, the LLM autonomously decides what's worth saving (your name, preferences, key facts) and writes it to a single markdown file.

That file is injected into the system prompt on every request, so the agent always "remembers" the important stuff without needing the full conversation.

File: `src/agent/memory.ts`
Stored in: `.sandgarden-bot/memory/MEMORY.md`

### Tools

LLMs can reason but can't _do_ things. Tools let the agent take deterministic actions in the real world. Each tool has a name, description, JSON schema for parameters, and an execute function. Their definitions are passed in the [context](#agent-loop) on every request, and the LLM decides when to call them.

Built-in tools:

- **File ops**: `read_file`, `write_file`
- **Shell**: `exec` (allowlisted commands: `ls`, `cat`, `grep`, `find`, `node`, `npm`, `yarn`, `npx`, `git`, `cd`)
- **Memory**: `memory` (read/save long-term notes)
- **Web**: `web_search` (via Brave Search API), `web_fetch` (extract page content)
- **Skills**: `use_skill` (load a skill into the conversation)

Folder with all the tools: `src/tools/`

### Skills

Similar to tools, but instead of running code, skills inject **context and instructions** into the conversation. They're defined as markdown files with YAML frontmatter (`name` + `description`) and loaded on-demand via the `use_skill` tool.

Think of them as expert personas or specialized knowledge the agent can activate when needed.

There's an example skill included: `ethereum-app`, an Ethereum development tutor. You can trigger it by asking something like _"help me build a dApp"_ or explicitly with _"use the ethereum-app skill"_.

File: `src/skills.ts`, skills defined in `skills/<name>/SKILL.md`

## Extend It

The whole point of this project is to give you a codebase small enough to fully understand, and then make it your own. Fork it, break it, add things. Here are some intentional limitations that make good starting points:

- **Anthropic SDK only**, You can switch to your favorite SDK provider or use a generic one like AI SDK from Vercel.
- **Non-interactive exec**, the agent can run shell commands but can't respond to prompts, select options, or interact with CLIs that expect user input
- **CLI + Telegram only**, You can add support for other platforms like web UI, Discord, Slack, etc.
- **No scheduled tasks**, no heartbeat, reminders, or cron
- **No subagents**, no parallel tool calls or agent delegation
- **No streaming**, waits for full responses
- **Simple memory**, append-only, no summarization or pruning

## Reference

<details>
<summary><a name="telegram-setup"></a>Telegram setup</summary>

Add to `bot.config.ts`:

```ts
telegramBotToken: "123456:ABC-DEF...",
allowedChatIds: [123456789],
```

**Creating a bot:**

1. Message [@BotFather](https://t.me/BotFather) on Telegram
2. Send `/newbot`, follow the prompts
3. Copy the bot token into your config

**Getting your chat ID:**

1. Message [@userinfobot](https://t.me/userinfobot)
2. It replies with your user/chat ID
3. Add that number to `allowedChatIds`

**Commands:** `/start` (welcome message), `/new` (clear session, start fresh)

</details>

<details>
<summary>Brave Search API setup</summary>

Required for the `web_search` tool. `web_fetch` works without it.

1. Go to [brave.com/search/api](https://brave.com/search/api/)
2. Sign up for the **Free** plan (2,000 queries/month)
3. Create an API key in the dashboard
4. Add to `bot.config.ts`:

```ts
braveApiKey: "BSA...",
```

</details>

<details>
<summary>Adding a new tool</summary>

1. Create `src/tools/your_tool.ts` implementing the `Tool` type (name, description, JSON Schema params, execute fn)
2. Register it in `registerBuiltinTools()` in `src/tools/registry.ts`

</details>

<details>
<summary>Clearing the bot state</summary>

Wipe all bot state (sessions, memory, daily archives):

```bash
npm run clear
```

Prompts for confirmation before deleting `.sandgarden-bot/`.

</details>
