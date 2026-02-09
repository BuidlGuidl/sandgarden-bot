# sandgarden-bot

AI agent built from scratch in TypeScript to learn agent internals. Uses the Anthropic SDK directly (no frameworks) to expose the raw mechanics of tool use, context building, and session management.

## Setup

```bash
npm install
cp bot.config.example.ts bot.config.ts
# Edit bot.config.ts and add your Anthropic API key
```

## Usage

Simple chat:

```bash
npm run dev "Hey, can you tell me a joke?"
```

With tool use:

```bash
npm run dev "Can you tell me which libraries are installed in the package.json file?"
```

Session persistence (the CLI reuses the same session across calls)

```bash
npm run dev "My name is Alice"
npm run dev "What's my name?"
```

## Tools

The agent can call tools in a loop, it decides when to use them, executes locally, and feeds results back until done.

Built-in tools:

| Tool         | Description                                                                          |
| ------------ | ------------------------------------------------------------------------------------ |
| `read_file`  | Read file contents                                                                   |
| `write_file` | Write content to a file (creates dirs if needed)                                     |
| `exec`       | Run a shell command (allowlisted: `ls`, `cat`, `grep`, `find`, `node`, `npm`, `git`) |
| `memory`     | Read or save to long-term memory (persists across all sessions)                       |

### Adding a new tool

1. Create `src/tools/your_tool.ts` implementing the `Tool` type (name, description, JSON Schema params, execute fn)
2. Register it in `registerBuiltinTools()` in `src/tools/registry.ts`

## Sessions

Conversations are persisted as JSONL files in `.sandgarden-bot/sessions/`. Each message (user or assistant) is one JSON line. The agent loads the last 50 (MAX_HISTORY) messages as history for context continuity.

Every message is also appended to a daily archive at `.sandgarden-bot/sessions/daily/YYYY-MM-DD.jsonl` — a chronological log across all sessions.

Session IDs:

- CLI: `cli:default`
- Telegram: `telegram:<chat_id>` (automatic per user)

## Memory

Long-term memory lives in `.sandgarden-bot/memory/MEMORY.md`. The agent can read and save notes via the `memory` tool. Saved facts are injected into the system prompt on every request.

The agent saves autonomously when it detects noteworthy facts or preferences (configurable via system prompt instructions). Users can also ask explicitly ("remember X").

## Telegram

Run the bot as a Telegram DM assistant using long-polling (no server needed).

### Configuration

Add to `bot.config.ts`:

```ts
telegramBotToken: "123456:ABC-DEF...",
allowedChatIds: [123456789],  // your Telegram user ID
```

### Run

```bash
npm run telegram
```

The bot responds to private text messages from whitelisted chat IDs.

**commands**
/start: just prints a welcome message
/new: start a new conversation (clears the current session)

<details>
<summary>How to set up a Telegram bot</summary>

1. Message [@BotFather](https://t.me/BotFather) on Telegram
2. Send `/newbot`, follow the prompts to pick a name and username
3. Copy the bot token into `telegramBotToken` in your config

**Getting your chat ID:**

1. Message [@userinfobot](https://t.me/userinfobot) on Telegram
2. It replies with your user/chat ID
3. Add that number to `allowedChatIds`

</details>

## Clearing data

Wipe all bot state (sessions, memory, daily archives):

```bash
npm run clear
```

Prompts for confirmation before deleting `.sandgarden-bot/`.
