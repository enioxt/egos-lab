# AGENTS.md — egos-lab

> **VERSION:** 2.1.0 | **UPDATED:** 2026-02-18
> **TYPE:** Monorepo Lab + Agentic Platform

---

## Project Overview

| Item | Value |
|------|-------|
| **Project** | egos-lab |
| **Description** | Collaborative open-source ecosystem with focused code agents |
| **Path** | /home/enio/egos-lab |
| **Web** | egos.ia.br (Mission Control) |
| **Repo** | github.com/enioxt/egos-lab |
| **Deploy** | Vercel (auto on push) |
| **Supabase** | `lhscgsqhiooyatkebose` |

## Architecture

```
egos-lab/
├── agents/                  # Agentic Platform (11 registered, 20 planned)
│   ├── cli.ts               # CLI: list, run, lint-registry
│   ├── runtime/runner.ts    # Core: registry, logger, runner
│   ├── registry/agents.json # Agent definitions (SSOT)
│   └── agents/*.ts          # Agent implementations
├── apps/
│   ├── egos-web/            # Mission Control (React + Vite)
│   ├── eagle-eye/           # OSINT gazette monitor + AI
│   └── radio-philein/       # Community radio (paused)
├── packages/shared/         # AI client, rate limiter, types
├── scripts/                 # Proto-agents (security, ideas, rho, review)
├── docs/                    # Plans, stitch designs, agentic docs
└── .guarani/                # Agent identity + coding rules
```

## Commands

```bash
# Agentic Platform
bun agent:list              # List all 11 registered agents
bun agent:ssot              # Run SSOT Auditor (dry-run)
bun agent:ssot:exec         # Run SSOT Auditor (writes report)
bun agent:ui                # UI Designer (dry-run)
bun agent:ui:exec           # Generate UI mockups via Gemini
bun agent:lint              # Validate registry
bun agent:run <id> --dry    # Run any agent in dry-run
bun agent:all               # Run ALL agents (orchestrator)

# Eagle Eye
bun eagle-eye:fetch         # Test API connection
bun eagle-eye:analyze       # Run AI analysis

# Utilities
bun scan:ideas              # Scan compiladochats for new ideas
bun rho                     # Calculate project health (Rho score)
bun security:scan           # Pre-commit secret scanner

# All
bun install                 # Install all workspace deps
```

## Sibling Projects

| Project | Path | Relationship |
|---------|------|--------------|
| carteira-livre | /home/enio/carteira-livre | Production SaaS (DO NOT MIX) |

## Key Docs

| Doc | Purpose |
|-----|---------|
| `docs/agentic/DIFFERENTIATORS.md` | EGOS vs 13+ frameworks |
| `docs/agentic/agentification-map.md` | 10 areas, 20 agents planned |
| `docs/agentic/how-to.md` | How to create/run agents |
| `docs/OPEN_SOURCE_PLAN.md` | Collaborative Network plan |
| `docs/CONTRIBUTING_WITH_AI.md` | How to contribute |
