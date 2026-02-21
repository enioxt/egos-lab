# TASKS.md — egos-lab

> **VERSION:** 4.0.0 | **UPDATED:** 2026-02-19
> **LAST SESSION:** Agent Hub Webhook API, Build Rules, UI Fixes, and Strategic Roadmap

---

## 🚀 ROADMAP & VISÃO ESTRATÉGICA (Curto, Médio e Longo Prazo)
*Para onde o EGOS-Lab está indo e como atrairemos mais desenvolvedores.*

### As 5 Grandes Metas (The Master Plan)
1. **Self-Service Audit Hub (Curto Prazo - Atração):** Transformar nossos agentes internos em um serviço público "Cole o Repo → Receba o Relatório" para atrair milhares de devs para o ecossistema.
2. **EGOS-Kit Starter (Curto Prazo - Onboarding):** Repo template com `.windsurfrules`, Husky, e Stack Base pra qualquer dev clonar e sair codando seguro.
3. **Agent API Gateway (Médio Prazo - Monetização):** Chaves de API (`EGOS_SK_...`) para B2B. Empresas usam nossos 15 agentes via REST nas próprias esteiras de CI/CD.
4. **Marketplace de Regras (Médio Prazo - Comunidade):** Stack-specific `.windsurfrules` compartilháveis. O "NPM" dos prompts de sistema.
5. **Mycelium Network & Sov-OS (Longo Prazo - Enterprise/Gov):** Comunicação entre agentes P2P em background. O EGOS vira um Sistema Operacional instalável On-Premise para corporações e governos.

---

## P0 — Critical

### EGOSWEB-001: GitHub-First Builder Hub (MVP)
> **Vision:** `docs/EGOSWEB_PRODUCT_VISION.md`
> **Core:** Projects + Help Requests + LegalLab onboarding

**Phase 1 — Foundation (this sprint)**
- [x] GitHub OAuth login via Supabase (useAuth hook + Layout) ✓ (18/02/2026) — ⚠️ USER: enable GitHub provider in Supabase Dashboard
- [x] DB migrations: profiles, projects, project_runbook, stars, follows ✓ (18/02/2026)
- [x] DB migrations: help_requests, help_comments, project_comments ✓ (18/02/2026)
- [x] DB migrations: legal_lab_tasks, legal_lab_progress ✓ (18/02/2026)
- [x] RLS policies for all 10 hub_* tables ✓ (18/02/2026)
- [x] Auto-create profile trigger on signup ✓ (18/02/2026)
- [x] 10 LegalLab microtasks seeded ✓ (18/02/2026)
- [x] TypeScript types: apps/egos-web/src/types/hub.ts ✓ (18/02/2026)

**Phase 2 — Pages**
- [x] `/projects` feed with filters (tags, status, stars) ✓ (18/02/2026)
- [x] `/p/[slug]` project detail (README + runbook + keys & costs) ✓ (18/02/2026)
- [x] `/new-project` import wizard (3-step: URL → details → runbook) ✓ (18/02/2026)
- [x] `/p/[slug]/help` + `/p/[slug]/help/new` help request flow ✓ (18/02/2026)
- [x] `/help/[id]` detail with comments + accepted solution ✓ (18/02/2026)
- [x] `/u/[handle]` user profile ✓ (18/02/2026)
- [x] `/legal` LegalLab home (accordion with 10 microtasks) ✓ (18/02/2026)
- [x] `/settings` connections + profile edit ✓ (18/02/2026)
- [x] React Router + Layout component + Builder Hub CSS ✓ (18/02/2026)
- [x] Vercel deploy (manual, Root Directory = apps/egos-web) ✓ (18/02/2026)

**Phase 3 — Content & Polish**
- [x] API Registry — SSOT for all ecosystem routes ✓ (18/02/2026)
  - `packages/shared/src/api-registry.ts` (SSOT — 28 routes, 5 apps, 4 automation levels)
  - `apps/egos-web/api/registry.ts` (GET /api/registry — searchable JSON endpoint)
  - `apps/egos-web/src/pages/ApiDocs.tsx` (UI page at /api-docs)
  - Nav link in Layout, CSS complete
  - Pattern improved from carteira-livre: multi-app, automation tracking, agent bridge, typed
- [ ] 10 LegalLab microtasks (GitHub basics → publish project)
- [ ] Import wizard: auto-detect stack from GitHub repo
- [ ] "Keys & Costs" structured section per project
- [x] GitHub OAuth fix: flowType='implicit' for pure SPA ✓ (18/02/2026)
- [x] Collapsible sections: mobile-first, animated, all homepage sections ✓ (18/02/2026)
  - `CollapsibleSection.tsx` reusable component (Framer Motion)
  - Ecosystem open by default, rest collapsed → drastically reduces page scroll
  - Auth UI styles: avatar, skeleton, signout button
- [ ] Mobile-first UI, skeleton loading, empty states

---

## P1 — Important

### GOV-001: ~/.egos/ Governance Cleanup ✅ (17/02/2026)
> **Location:** `/home/enio/.egos/`

- [x] Workflows populated: start, end, research, pre, disseminate, prompt, regras (7 total)
- [x] Skills populated: stitch-design
- [ ] Update `~/.egos/guarani/IDENTITY.md` v1.0 → v2.0 (add egos-lab/intelink references)
- [ ] Update `~/.egos/guarani/PREFERENCES_SHARED.md` (add end-of-message discipline)
- [ ] Run `~/.egos/sync.sh` to propagate to both repos

### GOV-002: Intelink Workspace Integration ✅ (17/02/2026)
> **Resolved:** Intelink now lives at `apps/intelink/` in egos-lab monorepo

- [x] Integrated 604 files → trimmed to 518 (core only)
- [x] Security: removed .env secrets, .git, PII (real names, CPFs, phones, local paths)
- [x] Removed: .archive, scripts/test-*, dev pages, dated docs, Docker, .guarani
- [x] Sanitized phone-normalizer.ts (24)99227→(11)91234
- [ ] Delete `/home/enio/INTELINK/` (empty skeleton)
- [ ] Port modal/toast patterns to egos-web

### GOV-003: Memory Audit & Cleanup
> **Problem:** 80+ memories, many stale/redundant. Only 2-3 egos-lab specific.

**Stale (consolidate or delete):**
- [ ] ~20 session summaries from carteira-livre (sessions 3-40) → consolidate into 1 summary
- [ ] 5+ OAuth/auth memories (overlapping info) → merge into 1 definitive pattern
- [ ] 3 build discipline memories (redundant) → merge into 1
- [ ] DocSync, INPI, Nano Banana → archive or delete if inactive

**Missing (create):**
- [ ] egos-lab architecture + agent platform memory
- [ ] EgosWeb product vision memory
- [ ] Deploy discipline v3 (end-of-message mandatory) memory
- [ ] ~/.egos/ governance structure memory
- [ ] Intelink modal/toast patterns memory

### GOV-004: Skills Audit & Creation
> **Problem:** carteira-livre has 7 skills, egos-lab has 1 (stitch-design)

**egos-lab skills to create:**
- [x] `stitch-design` — Google Stitch UI workflow ✓ (exists in ~/.egos/skills/)
- [x] `agent-dev` — How to create, test, register agents ✓ (18/02/2026)
- [x] `deploy` — Vercel deploy procedures for egos-web ✓ (18/02/2026)
- [x] `security` — RLS, pre-commit, secrets scanning ✓ (18/02/2026)
- [x] `audit` — Running agents on external repos, case studies ✓ (18/02/2026)

**carteira-livre skills to review:**
- [ ] Review 7 existing skills for accuracy (last updated Feb 2026)
- [ ] Add `payment` skill (Asaas patterns, split, webhook)
- [ ] Add `ai-orchestrator` skill (agent routing, streaming)

**Shared skills (~/.egos/skills/):**
- [ ] `research` — Multi-modal intelligence gathering
- [ ] `governance` — SSOT rules, task management, commit discipline

### GOV-005: Rules Audit & Consistency
> **Problem:** Global .windsurfrules references EGOSv3 (archived), MCP prefixes wrong

**Global .windsurfrules (EGOSv3):**
- [ ] Update project name: EGOSv3 → EGOS Ecosystem
- [ ] Fix MCP prefixes (mcp18_, mcp13_ etc. → actual tool names)
- [ ] Remove Intelink port reference (3001 — no longer relevant here)
- [ ] Update deploy table (add egos.ia.br)
- [ ] Add end-of-message discipline rule
- [ ] Trim to 150 lines (current ~150, check after edits)

**egos-lab .windsurfrules v2.1:**
- [x] Added end-of-message discipline ✓
- [x] Updated agent count to 10 ✓
- [x] Intelink integrated at apps/intelink/ ✓

**carteira-livre .windsurfrules v4.0:**
- [ ] Review for outdated info (port, Supabase ref still correct?)
- [ ] Ensure end-of-message discipline is added

**Rule files (always.md, database.md, ui.md):**
- [ ] Verify all are current and consistent with .windsurfrules

### AGENT-007: SSOT Auditor v2 (Suggest + AI Handoff)
- [ ] Add `suggestion` field to every finding (actionable fix)
- [ ] Generate fix patches (e.g., "move type X to shared/types.ts")
- [ ] Export findings as structured JSON for AI consumption
- [ ] Create `ssot-fixer.ts` agent that takes findings JSON and applies fixes
- [ ] Reduce false positives (filter import re-exports, test files)
> **Goal:** detect → suggest → hand off to AI → auto-fix

### FINDINGS-001: Resolve 143 Agent Findings
> **Report:** `docs/agentic/reports/findings-categorized.md`
- [x] Move `@types/pg` to devDependencies (2 files) ✓ (18/02/2026)
- [ ] Consolidate `Finding` type — import from runner.ts in governance
- [ ] Align TypeScript/React versions across workspaces
- [ ] Consolidate `AIAnalysisResult`, `AnalysisResult`, `Territory` to shared
- [ ] Clean orphaned types in egos-web

### AGENT-008: Multi-Layer Testing Architecture (Agents Testing Agents)
> **Architecture:** `docs/agentic/TESTING_ARCHITECTURE.md`
> **Vision:** Real production-close tests, AI-powered verification, agents testing each other in layers

- [x] Layer 1: Static Analysis — existing agents (SSOT, Dead Code, Dep, Security) ✓
- [x] Layer 2: Contract Tester — API routes, status codes, schemas (9/10 passed) ✓ (18/02/2026)
- [x] Layer 3: Integration Tester — Supabase RLS, integrity, SQL injection, XSS (10/10 passed) ✓ (18/02/2026)
- [x] Layer 4: Regression Watcher — compare results over time, detect flaky/broken ✓ (18/02/2026)
- [x] Layer 5: AI Verifier — AI tests AI responses, adversarial inputs, false positive review ✓ (18/02/2026)
- [ ] Wire test agents into orchestrator (run as part of `bun agent:all`)
- [ ] Test history tracking (agents/.logs/test-history.jsonl)
- [x] Pre-push gate: registry lint (always) + test agents (opt-in EGOS_TEST_GATE=1) ✓ (18/02/2026)

**Found real bugs:**
- `chat-long-message`: validation exists but not enforced on prod (Vercel deploy lag)

### AGENT-004: E2E Smoke Validator
- [ ] Set up Playwright in egos-web
- [ ] Create 3 smoke tests (home, login flow, chat)
- [ ] Integrate with agent runner

### COMMUNITY-001: First External Contribution
- [x] Created 3 good-first-issues on GitHub (#6, #7, #8)
- [x] Dev.to article draft: `docs/agentic/DEVTO_ARTICLE_DRAFT.md` (3 case studies included)
- [ ] Publish on Dev.to / Twitter
- [ ] Product Hunt listing draft

### LAUNCH-001: Public Launch Prep
- [x] Run SSOT Auditor on 3 repos (Documenso: 1012, Cal.com: 1469, tRPC: 388 findings)
- [x] Case study #4: Medusa (2,427 findings: 149 errors, 333 warnings, 1,945 info)
- [ ] Run on 1 more repo (Supabase — large, needs shallow clone strategy)
- [ ] Publish article + social media push

### LAUNCH-002: Self-Service Audit Hub (Phase 2)
> **Goal:** "Paste Repo URL → Get Audit Report"
- [x] Expose `orchestrator.ts` via secure API endpoint (server-side) (19/02/2026)
- [x] Create UI: "Paste Repo URL" input on Dashboard (public + private PAT support) (19/02/2026)
- [x] Implement `agent:audit-external` runner (clones, runs, cleans up via sandbox)
- [x] Build Report UI: Render findings as interactive components (MVP)
- [ ] Add "Fix with EGOS" CTA (leads to fork/CLI)

### UX-002: Ecosystem Visualization (Learnings from EGOS Universe)
> **Goal:** Port the 3D Graph experience to Mission Control
- [ ] Replace/Augment `EcosystemGrid` with `EcosystemGraph3D`
- [ ] Use `react-force-graph-3d` (already in Intelink)
- [ ] Click node → Slide-over panel with details (like Timeline/Intelink)
- [ ] Nodes: Apps, Agents, Rules, Knowledge

### WEB-001: Automate Commit Ingestion
- [x] Created `/api/ingest-commits.ts` — AI-enriched ingestion via OpenRouter Gemini 2.0 Flash
- [x] Added AI enrichment columns to commits table (category, tags, tech_debt_flag, impact_score)
- [x] Enhanced ActivityStream with category badges + tech debt flags (Intelink pattern)
- [x] Consolidated VercelRequest/VercelResponse into `api/_types.ts` (SSOT fix)
- [x] Vercel env vars set (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
- [ ] Add agent run outputs to activity stream
- [ ] Add Rho score display to website

### SECURITY-HUB-001: Community Security Hub ✅ (18/02/2026)
> **Goal:** Help users set up secure public repos with shared rules and AI-powered improvement tracking

- [x] DB: hub_shared_rules, hub_rule_versions, hub_rule_insights, hub_rule_stars, hub_security_tools (all RLS)
- [x] Seeded 15 real security tools (Husky, gitleaks, Semgrep, Snyk, Dependabot, etc.)
- [x] Seeded 5 official EGOS rules from actual project files
- [x] API: `/api/security-tools` (GET with category/recommended filters)
- [x] API: `/api/shared-rules` (GET/POST with category/tag/sort)
- [x] API: `/api/rule-history` (GET history + POST new version with AI diff analysis via Gemini)
- [x] SecurityHub component: 3 tabs (Tools, Rules, Contribute)
- [x] AI-powered version insights: every rule edit analyzed for improvement type + impact score
- [x] Integrated in App.tsx as CollapsibleSection
- [ ] Rule Validator: AI checks new submissions for mistakes
- [ ] Benchmark Scoring: OWASP/OSSF comparison for user's security setup

### AI-AUDIT-001: Full Ecosystem AI Insertion Audit ✅ (18/02/2026)
> **Report:** `docs/AI_INSERTION_AUDIT.md`

- [x] Intelink: 17 existing AI features documented, 15 new opportunities identified across full funnel
- [x] egos-web: 4 existing AI features + 10 new opportunities (Project Health Score, Help Triage, etc.)
- [x] Carteira Livre: 2 existing AI features + 10 new opportunities (OCR, matching, fraud detection)
- [x] Agent Platform: 6 new agent proposals (Rule Optimizer, Onboarding Advisor, etc.)
- [x] Priority matrix: 4 quick wins, 4 medium effort, 4 strategic items

### INTELINK-AUTH-001: Email+Password Registration ✅ (18/02/2026)
- [x] `/api/v2/auth/check-email` — auto-create member by email
- [x] Login API updated: accepts email OR phone
- [x] Create-password API: supports email-based member lookup
- [x] Login page UI: phone/email segmented toggle, all handlers email-aware

### GOVERNANCE-001: SSOT Enforcement
- [x] Created `docs/agentic/GOVERNANCE_RULES.md` — SSOT registry + rule sharing design
- [x] SSOT pre-commit checks live: `scripts/ssot_governance.ts` (5 checks + deploy discipline)
- [x] Pre-push build gate: `.husky/pre-push` blocks failed deploys
- [x] Deploy discipline rules in `.windsurfrules` v2.1
- [ ] Package egos-kit template repo for rule sharing

### CONTENT-002: LinkedIn Posting Series
- [ ] Update LinkedIn headline + bio (quiet builder style)
- [ ] Post 1: A virada de chave (curiosity → execution)
- [ ] Post 5: EGOS Lab, regras públicas
- [ ] Post 6: "Auditei 5 repos com agentes IA"
> **Roteiro:** `docs/LINKEDIN_ACTION_PLAN.md`

### INTELINK-001: Port Reusable Features
- [x] Created `docs/agentic/INTELINK_FEATURES_ANALYSIS.md` — 6 features analyzed
- [x] Ported Timeline pattern → ActivityStream with category badges + color-coded dots
- [ ] Port Accuracy Tracker for agent eval system
- [ ] Port DraggableGridLayout for Mission Control dashboard

---

### DOCS-002: Intelink Positioning Clarity ✅ (18/02/2026)
> **Goal:** Clearly distinguish "Intelink (Police Tool)" vs "Intelink (General Intelligence Engine)"
- [x] Update landing page copy to define the dual role
- [x] Create `docs/INTELINK_IDENTITY.md` ✓
- [ ] Ensure agents know the context (Context-Aware Prompts)

## P2 — Future (Medium Term)

### PNCP-001: PNCP API Integration
- [ ] Research PNCP API endpoints
- [ ] Cross-reference with Eagle Eye procurement patterns

### MARKETPLACE-001: Rule Marketplace MVP
- [ ] Design in Google Stitch
- [ ] Schema for shareable rule packs
- [ ] Upload/download flow

### EGOSWEB-002: Advanced Features (Post-MVP)
- [ ] Full-text search (pg_trgm)
- [ ] Analytics (views, copies, remixes)
- [ ] Collections/playlists
- [ ] Moderation + anti-spam
- [ ] GitHub auto-follow (opt-in, separate OAuth)
- [ ] Reputation system (solutions accepted, projects run)
- [ ] Project Import Wizard v2 (auto-detect .env.example, docker-compose)

---

## Completed

### DEPLOY-FIX-001: Vercel Build Fix ✅ (2026-02-17)
- [x] Root cause: Vercel uses `vite build` directly (not `npm run build`) when `framework: vite`
- [x] Fix v1: `npx` prefix in package.json (not enough)
- [x] Fix v2: Added `buildCommand: "npm run build"` to vercel.json (definitive)
> **Commit:** becaa24

### AGENT-006: Orchestrator + Full Validation ✅ (2026-02-17)
- [x] `orchestrator.ts` — runs ALL agents, collects results, generates combined report
- [x] Health score calculation, timing, findings aggregation
- [x] CLI: `bun agent:all` (dry-run) / `bun agent:all --exec` (write report)
- [x] **Validation: 9/9 agents passed, 100% health, 143 findings, 3.8s total**
- [x] Report: `docs/agentic/reports/orchestrator-report.md`

### SECURITY-004: Remaining RLS Hardening ✅ (2026-02-17)
- [x] 4 migrations: intelink (merge_pending, merge_votes, otp_tokens, reports, rho_*, role_permissions)
- [x] 2 migrations: volante_* (profiles, ratings, referrals, points, tutor_*, telemetry, notifications)
- [x] All policies tightened from `WITH CHECK (true)` to `auth.role() = 'authenticated'`

### AGENT-005: Dependency Auditor + Dead Code Detector ✅ (2026-02-17)
- [x] `dep-auditor.ts` — version conflicts, dev-in-prod, unused deps (25 findings on egos-lab)
- [x] `dead-code-detector.ts` — orphan exports, empty files (49 findings on egos-lab)
- [x] Both registered in agents.json, CLI scripts added
- [x] Total: **10 agents** registered (8 active, 1 pending, 1 pending)

### CONTENT-003: LinkedIn Posts Drafted ✅ (2026-02-17)
- [x] 3 posts ready: Carteira Livre (product), EGOS Lab (rules), A Jornada (trajectory)
- [x] Support data section with all features, learnings, honest gaps
> **File:** `docs/LINKEDIN_POSTS_DRAFT.md`

### BRANDING-001: EGOS Logo + Favicon ✅ (2026-02-17)
- [x] Created SVG logo: sacred geometry (hexagon + triangle + eye + agent nodes)
- [x] Configured in index.html with favicon + apple-touch-icon + OG meta tags
- [x] Added to README.md header
- [x] LinkedIn action plan: `docs/LINKEDIN_ACTION_PLAN.md` (7 posts + rules)
> **Commit:** ceadbd5

### SECURITY-003: Supabase Security Hardening ✅ (2026-02-17)
- [x] Fix 2 ERROR: RLS enabled on eagle_eye_gazettes + eagle_eye_opportunities
- [x] Fix 2 WARN: mutable search_path on get_rho_status + cleanup_duplicate_relationships
- [x] Fix ~15 intelink permissive RLS policies (WITH CHECK true → auth.role()='authenticated')
- [x] Fix commits + handoff_history RLS (open insert → service_role only)
- [x] Move extensions (unaccent, pg_trgm) from public to extensions schema
- [x] Drop duplicate index on inbox_items
- [x] 8 migrations applied, 0 ERRORs remaining
> **Commit:** 0d61443

### AGENT-002: Auth Roles Checker ✅ (2026-02-17)
- [x] Implement `agents/agents/auth-roles-checker.ts`
- [x] Scan middleware guards, sidebar rendering, API session checks
- [x] Generate structured report (13 findings, 8 warnings)
> **Commit:** 0c5afdb

### AGENT-003: Connect Code Reviewer to LLM ✅ (2026-02-17)
- [x] Wire `scripts/review.ts` to `packages/shared/ai-client.ts`
- [x] Registry entry updated (status: active)
- [x] Fallback mode: prints diff stats only when OPENROUTER_API_KEY missing
> **Commit:** 0c5afdb

### CASE-001: First 2 Case Studies ✅ (2026-02-17)
- [x] Documenso audit: 1012 findings (117 warnings, 880 info)
- [x] Cal.com audit: 1469 findings (154 warnings, 1291 info)
- [x] Multi-angle analysis with confidence grading and false-positive notes
> **Commits:** 25befe0, b244839

### SECURITY-002: egos-web Activity Security Audit ✅ (2026-02-17)
- [x] Verify no API keys in client bundle
- [x] Fix RLS on `commits` table (anon write → service_role only)
- [x] Populate Supabase with 26 commits (was 12, added 13 from Feb 17 session)
- [x] Add Agentic Platform to website ecosystem grid
- [x] Update hero stats (8 agents, 9 modules)
> **Commits:** 05167d6, 20a756c

### AGENT-001: Agentic Platform Foundation ✅ (2026-02-17)
- [x] Create `agents/runtime/runner.ts` (registry, logger, correlation IDs)
- [x] Create `agents/registry/agents.json` (8 agents registered)
- [x] Create `agents/cli.ts` (list, run, lint-registry)
- [x] Implement P0.1 SSOT Auditor (55 findings on first run)
- [x] Create agentification map (10 areas, 20 agents)
- [x] Add bun scripts: agent:list, agent:run, agent:lint, agent:ssot
- [x] Write docs: how-to.md, DIFFERENTIATORS.md
> **Commit:** ca85cb7

### SECURITY-001: API Key Hardening ✅ (2026-02-17)
- [x] Create Vercel serverless proxies (`/api/chat`, `/api/github-commits`)
- [x] Remove VITE_OPENROUTER_API_KEY and VITE_GITHUB_TOKEN from client
- [x] Update vercel.json routing
> **Commit:** 1d8216e

### DOCS-001: Collaborative Network Plan ✅ (2026-02-17)
- [x] Research 10+ platforms (Merit, OnlyDust, tea.xyz, SourceCred, etc.)
- [x] Rewrite OPEN_SOURCE_PLAN.md v2.0 (6 core modules, 4-phase roadmap)
- [x] Rewrite README.md (professional landing page)
- [x] Rewrite CONTRIBUTING_WITH_AI.md (contributor levels, PR rules)
> **Commit:** 581f972

### UX-001: Activity Stream + Chat Scroll ✅ (2026-02-17)
- [x] Fix empty activity stream (GitHub API fallback)
- [x] Fix chat auto-scroll on mobile
> **Commit:** 1a803a3

### INTELINK-001: Projeto "The Open Epstein Network" (Crowdsourcing Investigativo)

*Phase 1: Data Ingestion*
- [ ] Baixar CSVs públicos (epsteininvestigation.org): entities, flights, relationships, emails
- [ ] Criar script ETL para ingestão no Supabase (tabelas `epstein_entities`, `epstein_flights`, `epstein_relationships`)
- [ ] Processar PDFs da DOJ (`justice.gov/epstein`) usando módulo OCR/Extração do Intelink (`lib/ocr`, `lib/documents`)
- [ ] Alimentar o módulo `entity-resolution` para deduplicar e normalizar nomes

*Phase 2: Intelligence Layer*
- [ ] Rodar `modus-operandi.ts` (pattern detection) nos dados para detectar padrões comportamentais
- [ ] Integrar `link-prediction` para sugerir conexões ocultas entre entidades
- [ ] Integrar Pramana (grau de certeza) para scoring de cada relação
- [ ] AI analysis: extrair padrões por pessoa, data, país, tipo de envolvimento

*Phase 3: Public Interface*
- [ ] Criar interface pública (Next.js) com grafo 3D interativo (`react-force-graph-3d`)
- [ ] Filtros avançados: por pessoa, data, país, bairro, tipo de envolvimento, relações cruzadas
- [ ] Relatórios exportáveis: PDF, CSV, JSON — filtráveis por entidade, período, geografia
- [ ] Bot Telegram aberto para cidadãos enviarem dicas/evidências
- [ ] Sistema de contribuição com validação Pramana (score de confiança público)

*Phase 4: Monetização (Credit System)*
- [ ] Tier gratuito: navegar o grafo, ver entidades públicas (0 créditos)
- [ ] Tier pago: análise AI, relatórios cruzados, OCR de novos documentos, padrões comportamentais
- [ ] Integrar com CREDITS-001 (sistema de créditos universal)
> **Dados:** epsteininvestigation.org (CSV+API), justice.gov/epstein (PDFs)
> **Plano completo:** `docs/plans/CREDIT_SYSTEM_PLAN.md`

### CREDITS-001: Sistema de Créditos Universal (Pay-Per-Process AI)

*Evolução do GayTaoUai Gateway (EGOSv2) para sistema de créditos moderno*
- [ ] Schema: `credit_ledger` (imutável, append-only) + `credit_purchases`
- [ ] Compra via PIX (Asaas, já integrado em Carteira Livre)
- [ ] Compra via Cartão de Crédito/Débito (Asaas ou Stripe)
- [ ] Compra via Crypto (BTCPay Server ou Coinbase Commerce)
- [ ] Webhook automático: pagamento confirmado → créditos adicionados em tempo real
- [ ] API de consumo: verificar saldo → deduzir → executar operação AI → retornar resultado
- [ ] Painel de saldo em tempo real (Supabase Realtime)
- [ ] Pacotes: Starter (R$19.90/100cr), Pro (R$49.90/300cr), Enterprise (R$149.90/1000cr)
> **Plano completo:** `docs/plans/CREDIT_SYSTEM_PLAN.md`
> **Origem:** GayTaoUai Gateway (`EGOSv2/apps/mcp-bridge/gaytaouai_gateway_mcp.py`)

### ENTERPRISE-001: Evolução do Módulo de Pagamentos (B2B Ready)
- [ ] Conciliação Bancária automatizada (Webhook -> Ledger imutável)
- [ ] Roteamento Multi-Gateway (Fallback: Asaas → Stripe → BTCPay)
- [ ] Integração com ERP (ContaAzul/Bling) para emissão de NFe automática
- [ ] Sistema avançado de split de assinaturas com proration (cálculo proporcional)
- [ ] Agnosticismo de domínio: `InstructorWallet` → `TenantWallet` (multi-tenant)

### ENTERPRISE-002: Criação da Identidade Corporativa
- [ ] Nome escolhido: **Pramana Forge** (`pramanaforge.dev`) — *Parked para o futuro*.
- [ ] Decisão estratégica: Manter tudo sob o guarda-chuva da marca **EGOS**.
- [ ] Criar landing page B2B do EGOS (foco em "AI Agents & Intelligence Infrastructure").
- [ ] Preparar currículo/portfólio do Enio diretamente atrelado ao ecossistema EGOS.

### TASK-016: Agnostic Domain-to-Solution Engine v2 ✅ (20/02/2026)
- [x] Deep research: Descript tech stack (Temporal, Go, Whisper, transcript-as-SSOT)
- [x] Rewrite `domain_explorer.ts` — proper runner integration (RunContext, Finding[], CLI entry)
- [x] Rewrite `AGNOSTIC_DOMAIN_ENGINE.md` v2 — real technical depth + EGOS vs Descript comparison
- [x] Rewrite `/domain` workflow — actionable steps with MCP tools
- [x] Update registry description + add filesystem:write tool
> **Arquivos:** `agents/agents/domain_explorer.ts`, `docs/agentic/AGNOSTIC_DOMAIN_ENGINE.md`, `.windsurf/workflows/domain.md`

### TASK-017: Living Laboratory Agent ✅ (20/02/2026)
- [x] Create `living-laboratory.ts` — git pattern analysis, agent log analysis, rule proposals
- [x] Register in `agents/registry/agents.json` (19th agent)
- [x] Add bun scripts: `agent:lab`, `agent:lab:exec`
- [x] Implements Descript "Culture as Product" pattern for EGOS
> **Arquivos:** `agents/agents/living-laboratory.ts`, `agents/registry/agents.json`, `package.json`

### TASK-018: Descript Analysis + Pitch Strategy ✅ (20/02/2026)
- [x] Analyze Descript architecture (Temporal, Underlord, Notion-as-OS)
- [x] Map all 6 engineering open positions with salary ranges
- [x] Create fit analysis: Enio vs "Software Engineer, Agent" role
- [x] Design pitch strategy with proof points and application flow
> **Arquivos:** `docs/agentic/DESCRIPT_ANALYSIS.md`
