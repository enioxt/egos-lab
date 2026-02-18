# EGOS Agentic Platform (`agents/`)

> **"Agents enforce rules. Rules govern agents."**

This directory contains the **Agentic Platform** that powers the EGOS Lab ecosystem.
It provides a standardized runtime, registry, and CLI for autonomous agents.

## 🏗️ Structure

| Component | Path | Description |
|-----------|------|-------------|
| **Core** | `runtime/runner.ts` | The execution engine (Bun). Handles logging, correlation IDs, and dry-run safety. |
| **Registry** | `registry/agents.json` | **SSOT** defining all 8+ agents (id, permissions, risk level). |
| **CLI** | `cli.ts` | Command-line interface (`bun agent:run`, `bun agent:list`). |
| **Agents** | `agents/*.ts` | Actual agent implementations (SSOT Auditor, Auth Checker, etc.). |
| **Logs** | `.logs/` | Structured JSONL execution logs (gitignored). |

## 🤖 Active Agents

Run `bun agent:list` to see the full list. Key agents include:

- **SSOT Auditor**: Detects duplicated types and conflicting sources of truth.
- **Security Scanner**: Pre-commit hook for secrets and PII leaks.
- **Code Reviewer**: AI-powered diff analysis (Gemini via OpenRouter).
- **Idea Scanner**: Ingests new business ideas from "Compilado Chats".

## 🚀 Usage

```bash
# List available agents
bun agent:list

# Run an agent (Dry Run - safe)
bun agent:run ssot_auditor --dry

# Run an agent (Execute - applies changes)
bun agent:run ssot_auditor --exec
```

## 📚 Docs

See [docs/agentic/how-to.md](../docs/agentic/how-to.md) for a guide on creating new agents.
