# /start — Session Initialization (v4.0)

## 1. Load Context

- Read `AGENTS.md` for project config (ports, stack, commands, SSOT)
- Read `TASKS.md` for current priorities (P0 → P1 → P2)
- Read `docs/SYSTEM_MAP.md` for full system overview (pages, APIs, tables, services)
- Check last handoff in `docs/_current_handoffs/`
- Read `.guarani/PREFERENCES.md` for coding standards

## 2. Rule Checksum Validation (Mitigate Rule Drift)

> **CRITICAL:** LLMs suffer from probabilistic rule drift over long contexts. You MUST explicitly acknowledge the active ruleset.
- Read `.guarani/RULES` (or `.guarani/ANTIGRAVITY_RULES.md`).
- Print a one-sentence "Checksum Validation" confirming you understand the core directives before starting.

## 3. System Map Verification

> **CRITICAL:** The system map is the SSOT for understanding what exists. Always read it before implementing anything.

```bash
# Regenerate system map to catch any drift
// turbo
bun scripts/extract_system_map.ts
```

Compare `docs/SYSTEM_MAP.md` counts with reality. If outdated (pages, APIs, tables differ), flag for update at session end.

## 3. 🔐 Security Check

```bash
# Verify RLS policies in DB (don't trust docs)
mcp10_get_advisors({ type: "security" })
```

| Item | Verificação | Ação se Falhar |
|------|-------------|----------------|
| RLS Policies | `mcp10_get_advisors("security")` | Corrigir antes de continuar |
| Webhook Secrets | Vercel Dashboard | Configurar no Vercel |

## 4. 💰 Cost Monitor

| Recurso | Limite | Status |
|---------|--------|--------|
| Vercel usage | > 50% | ⚠️ Investigar |
| Vercel usage | > 75% | 🚨 PARAR e otimizar |
| Supabase DB | > 500 MB | ⚠️ Limpar logs |
| Supabase DB | > 2 GB | 🚨 Emergência |

## 5. Admin Dashboard Overview

> Read the admin pages to understand existing tools before building new ones.

| Admin Page | Path | Purpose |
|------------|------|---------|
| Dashboard | `/admin` | KPIs overview |
| Analytics | `/admin/analytics` | AI analytics |
| AI Orchestrator | `/admin/ai-orchestrator` | AI agent management |
| System Health | `/admin/system-health` | Observability |

## 6. Output Briefing

Present to user:

- **System Map:** Pages / APIs / Tables counts (from SYSTEM_MAP.md)
- **Tasks:** P0 blockers → P1 sprint → P2 backlog
- **Security:** Any advisors flagged
- **Costs:** Vercel/Supabase within limits?
- **Recent commits:** `git log --oneline -5`

---

*v4.0 — Added system map verification, admin dashboard reference, simplified security check, consistent with /end*
