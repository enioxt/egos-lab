# AGENTS.md — egos-lab

> **VERSION:** 1.0.0 | **UPDATED:** 2026-02-13
> **TYPE:** Monorepo Lab | **Parent:** carteira-livre governance heritage

---

## 🎯 Project Overview

| Item | Valor |
|------|-------|
| **Projeto** | egos-lab |
| **Descrição** | MVP Lab — Monorepo for business idea prototyping |
| **Path** | /home/enio/egos-lab |
| **Porta** | N/A (CLI scripts, not web server) |
| **Remote** | TBD — github.com/enioxt/egos-lab |
| **Design Tool** | Google Stitch (external — prompts in docs/stitch/) |

## 🏗️ Architecture

```
egos-lab/
├── apps/                    # Each idea = one independent app
│   └── eagle-eye/           # 🦅 Gazette Monitor + AI Opportunity Detector
├── packages/
│   ├── shared/              # AI client, rate limiter, types
│   └── config/              # Shared .guarani rules
├── docs/
│   ├── plans/               # 12+ idea files (source material)
│   └── stitch/              # Google Stitch design prompts (SSOT for UI)
├── scripts/
│   └── scan_ideas.ts        # Auto-scan compiladochats for new ideas
├── AGENTS.md                # THIS FILE (project config)
├── TASKS.md                 # Task tracking
└── .windsurfrules           # Agent rules
```

## 📡 External Data Sources

| Source | URL | Rate Limit | Cost |
|--------|-----|------------|------|
| Querido Diário | api.queridodiario.ok.org.br | 60 req/min | Free |
| PNCP | pncp.gov.br/api/consulta | TBD | Free |
| Compras.gov.br | compras.dados.gov.br | TBD | Free |
| OpenRouter (AI) | openrouter.ai/api/v1 | 200 req/min | ~$5/mo |

## 🧰 Commands

```bash
# Eagle Eye
npm run eagle-eye:fetch      # Test API connection
npm run eagle-eye:analyze    # Run AI analysis (needs OPENROUTER_API_KEY)

# Idea Scanner
npm run scan:ideas           # Scan compiladochats for new ideas

# All apps
npm install                  # Install all workspace deps
```

## 🔗 Sibling Projects

| Project | Path | Relationship |
|---------|------|--------------|
| carteira-livre | /home/enio/carteira-livre | Production SaaS (DO NOT MIX) |
| EGOSv5 | /home/enio/EGOSv5 | Legacy framework (archived) |

## 🎨 Design Standard: Google Stitch

**ALL UI/dashboard designs MUST go through Google Stitch first.**

Workflow:
1. Write design prompt in `docs/stitch/[feature].md`
2. Generate design in Google Stitch
3. Export assets → implement code matching the design
4. NEVER build UI directly without Stitch mockup first

## 📥 Idea Ingestion

Source: `/home/enio/Downloads/compiladochats/` (228+ files)

The `scripts/scan_ideas.ts` script:
1. Scans compiladochats for new .md files (ChatGPT/Gemini exports)
2. Hashes seen files to avoid re-processing
3. Classifies by relevance (business idea vs personal vs noise)
4. Copies relevant files to `docs/plans/`
5. Runs on pre-commit hook or manually via `npm run scan:ideas`
