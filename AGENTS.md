# AGENTS.md — egos-lab

> **VERSION:** 3.0.0 | **UPDATED:** 2026-02-18
> **TYPE:** Monorepo Lab + Agentic Platform + Nexus Market

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
├── agents/                  # Agentic Platform (15 registered, 20 planned)
│   ├── cli.ts               # CLI: list, run, lint-registry
│   ├── runtime/runner.ts    # Core: registry, logger, runner
│   ├── registry/agents.json # Agent definitions (SSOT)
│   └── agents/*.ts          # Agent implementations
├── apps/
│   ├── egos-web/            # Mission Control (React + Vite)
│   ├── eagle-eye/           # OSINT gazette monitor + AI
│   ├── nexus/               # 🛒 Nexus Market (consolidated)
│   │   ├── web/             #    Next.js merchant + driver dashboard
│   │   ├── mobile/          #    Expo consumer app
│   │   ├── docs/            #    Architecture, PRD
│   │   └── supabase/        #    Schema, seeds
│   └── radio-philein/       # Community radio (paused)
├── packages/
│   ├── shared/              # AI client, rate limiter, types, api-registry
│   └── nexus-shared/        # Nexus types, theme, product pipeline
├── scripts/                 # Proto-agents (security, ideas, rho, review)
├── docs/                    # Plans, stitch designs, agentic docs
└── .guarani/                # Agent identity + coding rules
```

## Nexus Market

| Item | Value |
|------|-------|
| **Product** | Nexus Market — AI-First Marketplace |
| **Primary Persona** | 🚚 Driver/Merchant (registers products, manages deliveries) |
| **Secondary** | Consumer (browses/buys via mobile app) |
| **Dashboard** | `/dashboard/driver` (deliveries), `/dashboard/chat` (AI assistant) |
| **AI Features** | Product enrichment, image search/generation, chatbot operator |
| **Architecture** | White-label, multi-tenant (RLS), financial split |

## ❄️ Frozen Zones

> **DO NOT EDIT** without explicit user request:
> - OAuth flow (any auth-related files)
> - Agent runtime (`agents/runtime/runner.ts`)
> - Pre-commit hooks (`.husky/`)

## Commands

```bash
# Agentic Platform
bun agent:list              # List all 15 registered agents
bun agent:ssot              # Run SSOT Auditor (dry-run)
bun agent:ssot:exec         # Run SSOT Auditor (writes report)
bun agent:ui                # UI Designer (dry-run)
bun agent:ui:exec           # Generate UI mockups via Gemini
bun agent:contract          # Contract Tester (dry-run)
bun agent:contract:exec     # Run real API contract tests
bun agent:integration       # Integration Tester (dry-run)
bun agent:integration:exec  # Run real Supabase RLS/integrity tests
bun agent:test:exec         # Run ALL test agents (contract + integration)
bun agent:regression        # Regression Watcher (dry-run)
bun agent:regression:exec   # Compare test results, detect regressions
bun agent:ai-verify         # AI Verifier (dry-run)
bun agent:ai-verify:exec    # Run adversarial + factual + safety tests
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
