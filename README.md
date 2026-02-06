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
npx tsx src/index.ts "Hey, can you tell me a joke?"
```

With tool use:

```bash
npx tsx src/index.ts "Can you tell me which libraries are installed in the package.json file?"
```

## Tools

The agent can call tools in a loop — it decides when to use them, executes locally, and feeds results back until done.

Built-in tools:

| Tool         | Description                                                                          |
| ------------ | ------------------------------------------------------------------------------------ |
| `read_file`  | Read file contents                                                                   |
| `write_file` | Write content to a file (creates dirs if needed)                                     |
| `exec`       | Run a shell command (allowlisted: `ls`, `cat`, `grep`, `find`, `node`, `npm`, `git`) |

### Adding a new tool

1. Create `src/tools/your_tool.ts` implementing the `Tool` type (name, description, JSON Schema params, execute fn)
2. Register it in `registerBuiltinTools()` in `src/tools/registry.ts`
