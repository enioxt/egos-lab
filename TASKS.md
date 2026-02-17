# TASKS.md — egos-lab

> **VERSION:** 2.1.0 | **UPDATED:** 2026-02-17
> **LAST SESSION:** Windsurf — Security Audit + Activity Pipeline + Case Studies

---

## P0 — Critical

_(none — all P0 items completed this session)_

---

## P1 — Important

### AGENT-004: E2E Smoke Validator
- [ ] Set up Playwright in egos-web
- [ ] Create 3 smoke tests (home, login flow, chat)
- [ ] Integrate with agent runner

### COMMUNITY-001: First External Contribution
- [ ] Add `good-first-issue` labels on GitHub
- [ ] Write 3 starter issues (doc fix, agent improvement, new eval)
- [ ] Share on Dev.to / Twitter

### LAUNCH-001: Public Launch Prep
- [x] Run SSOT Auditor on 2 repos (Documenso: 1012 findings, Cal.com: 1469 findings)
- [ ] Run on 3 more repos (Medusa, Twenty, Supabase)
- [ ] Write "I audited 5 repos with AI agents" article
- [ ] Product Hunt listing draft

### WEB-001: Automate Commit Ingestion
- [ ] Set up GitHub webhook or cron to auto-ingest new commits to Supabase
- [ ] Add agent run outputs to activity stream (not just git commits)
- [ ] Add Rho score display to website

---

## P2 — Future

### PNCP-001: PNCP API Integration
- [ ] Research PNCP API endpoints
- [ ] Cross-reference with Eagle Eye procurement patterns

### MARKETPLACE-001: Rule Marketplace MVP
- [ ] Design in Google Stitch
- [ ] Schema for shareable rule packs
- [ ] Upload/download flow

---

## Completed

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
