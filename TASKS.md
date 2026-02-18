# TASKS.md — egos-lab

> **VERSION:** 3.1.0 | **UPDATED:** 2026-02-18
> **LAST SESSION:** Windsurf — Deep Intelink cleanup (86 files, PII removed) + Espiral de Escuta + Dependabot fixes + GOV progress

---

## P0 — Critical

### EGOSWEB-001: GitHub-First Builder Hub (MVP)
> **Vision:** `docs/EGOSWEB_PRODUCT_VISION.md`
> **Core:** Projects + Help Requests + LegalLab onboarding

**Phase 1 — Foundation (this sprint)**
- [ ] GitHub OAuth login via Supabase (add provider)
- [ ] DB migrations: profiles, projects, project_runbook, stars, follows
- [ ] DB migrations: help_requests, help_comments, project_comments
- [ ] DB migrations: legal_lab_tasks, legal_lab_progress
- [ ] RLS policies for all new tables
- [ ] Auto-create profile trigger on signup

**Phase 2 — Pages**
- [ ] `/projects` feed with filters (tags, status, stars)
- [ ] `/p/[slug]` project detail (README + runbook + keys & costs)
- [ ] `/new-project` import wizard (paste GitHub URL → scaffold)
- [ ] `/p/[slug]/help` + `/p/[slug]/help/new` help request flow
- [ ] `/help/[id]` detail with comments + accepted solution
- [ ] `/u/[handle]` user profile
- [ ] `/legal` LegalLab home + `/legal/[slug]` microtask
- [ ] `/settings` connections (GitHub, Google)

**Phase 3 — Content & Polish**
- [ ] 10 LegalLab microtasks (GitHub basics → publish project)
- [ ] Import wizard: auto-detect stack from GitHub repo
- [ ] "Keys & Costs" structured section per project
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
- [ ] `agent-dev` — How to create, test, register agents
- [ ] `deploy` — Vercel deploy procedures for egos-web
- [ ] `security` — RLS, pre-commit, secrets scanning
- [ ] `audit` — Running agents on external repos, case studies

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
- [ ] Move `@types/pg` to devDependencies (2 files)
- [ ] Consolidate `Finding` type — import from runner.ts in governance
- [ ] Align TypeScript/React versions across workspaces
- [ ] Consolidate `AIAnalysisResult`, `AnalysisResult`, `Territory` to shared
- [ ] Clean orphaned types in egos-web

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
- [ ] Expose `orchestrator.ts` via secure API endpoint (server-side)
- [ ] Create UI: "Paste Repo URL" input on Dashboard
- [ ] Implement `agent:audit-external` runner (clones, runs, cleans up)
- [ ] Build Report UI: Render JSONL findings as interactive components
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

### DOCS-002: Intelink Positioning Clarity
> **Goal:** Clearly distinguish "Intelink (Police Tool)" vs "Intelink (General Intelligence Engine)"
- [ ] Update landing page copy to define the dual role
- [ ] Create `docs/INTELINK_IDENTITY.md`
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

### SETUP-001: egos-lab Monorepo ✅ (2026-02-13)
- [x] Bun workspaces, packages/shared, apps/eagle-eye, 12 idea files

### EAGLE-EYE-001: Eagle Eye MVP ✅ (2026-02-13)
- [x] Querido Diário API, 17 opportunity patterns, AI analysis
