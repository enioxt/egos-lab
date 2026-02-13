# 🧪 egos-lab

**MVP Lab — Monorepo for business idea prototyping and validation.**

Clean workspace for building and testing ideas independently, with shared AI infrastructure.

## Structure

```
egos-lab/
├── apps/
│   └── eagle-eye/          🦅 Brazilian Gazette Monitor + AI Opportunity Detector
├── packages/
│   ├── shared/             🔧 AI client (Gemini/OpenRouter), rate limiter, types
│   └── config/             ⚙️ Shared configuration
├── docs/plans/             📋 13 idea files (source material)
└── scripts/shared/         🛠️ Cross-cutting utilities
```

## Quick Start

```bash
```bash
bun install
bun eagle-eye:fetch      # Test Querido Diário API
bun eagle-eye:analyze    # Run AI analysis (needs OPENROUTER_API_KEY)
```

## Apps

| App | Status | Description |
|---|---|---|
| **eagle-eye** | 🟢 Active | Gazette monitor with 17 opportunity patterns |
| compras-radar | 🔵 Planned | Procurement alert system (Eagle Eye addon) |
| cloud-legal | 🔵 Planned | AI contract review in PT-BR |

## Tech Stack

- **Runtime:** Bun v1.3.9+
- **AI:** Gemini 2.0 Flash via OpenRouter (~$5/mo)
- **Monorepo:** Bun workspaces
- **Data:** Querido Diário API, PNCP, Compras.gov.br

## Architecture Principles

1. **Each idea = one app** — independently deployable
2. **Shared AI client** — reuse across all apps
3. **API-first + MCP-ready** — designed for agent interaction
4. **Cost-controlled** — track every API call cost
