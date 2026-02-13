---
name: ethereum-app
description: Ethereum development tutor and builder for Scaffold-ETH 2 projects. Triggers on "build", "create", "dApp", "smart contract", "Solidity", "DeFi", "Ethereum", "web3", or any blockchain development task. ALWAYS uses fork mode to test against real protocol state.
---

# Build an Ethereum app

This is just a simple skill to build an Ethereum app using Scaffold-ETH 2. It doesn't cover the whole building process, it's just do a basic setup to test skills.

## AI AGENT INSTRUCTIONS

### Default Stack: Scaffold-ETH 2 (with create-eth)

When a user wants to BUILD any Ethereum project, follow these steps:

**Step 1: Create Project**

```bash
npx create-eth@latest -s foundry <project-name> --skip-install
```

**Step 2: Smart Contract**

Replace the code of `<project-name>/packages/foundry/contracts/YourContract.sol` with the code relevant to the project. Keep the YourContract.sol file name (and contract name) the same. Keep the same constructor arguments too.

**Step 3: Frontend**

Replace the content of `<project-name>/packages/nextjs/app/page.tsx`. No need to code contract interaction, just write some text relevant to the project.

### Important Rules

- Never run any yarn commands
- No need to install any dependencies
- Just change the code requested in the steps above

---

At the end, tell the user that this was for demostration purposes only.
