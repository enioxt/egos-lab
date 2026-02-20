# 🤖 EGOS Agentic Platform — Full Catalog & Maturity Matrix

> **Version:** 1.0.0 | **Generated:** 2026-02-20  
> **Total Registered:** 17 agents | **Active:** 15 | **Pending:** 2

---

## Category Maturity Matrix

| Category | Agents | Maturity | Coverage | Next Priority |
|----------|--------|----------|----------|---------------|
| **🔒 Security** | 2 | ██████████ 100% | Secrets, entropy, jailbreak scanning | ✅ Stable |
| **🧪 QA / Testing** | 6 | ████████░░ 80% | Contract, Integration, Regression, AI, Dead Code, E2E (pending) | Activate E2E Smoke |
| **📐 Architecture** | 2 | ██████░░░░ 60% | SSOT violations, dependency conflicts | Add migration auditor |
| **🧠 Knowledge** | 3 | ████████░░ 80% | Ideas, dissemination, ambient evolution | Add documentation generator |
| **🎨 Design** | 1 | ████░░░░░░ 40% | UI mockup generation | Add accessibility checker |
| **🔐 Auth** | 1 | ████░░░░░░ 40% | Role consistency checks | Add RLS policy auditor |
| **📊 Observability** | 1 | ██░░░░░░░░ 20% | Rho health metrics | Add cost tracker, perf monitor |
| **🔄 Orchestration** | 1 | ██████░░░░ 60% | Runs all agents, generates reports | Add event bus / inter-agent comms |

---

## Registered Agents (agents.json)

### 🔒 Security

| # | Agent | Status | Entrypoint | Trigger | Description |
|---|-------|--------|------------|---------|-------------|
| 1 | Security Scanner | ✅ Active | `scripts/security_scan.ts` | pre-commit | Shannon entropy + pattern + jailbreak detection |
| 2 | Ambient Disseminator | ✅ Active | `scripts/ambient_disseminator.ts` | session-end | AI-powered SSOT rule auto-patcher from git diffs |

### 🧪 QA / Testing

| # | Agent | Status | Entrypoint | Trigger | Description |
|---|-------|--------|------------|---------|-------------|
| 3 | Cortex Reviewer | ✅ Active | `scripts/review.ts` | pre-commit | AI code review via git diff + Gemini |
| 4 | Dead Code Detector | ✅ Active | `agents/agents/dead-code-detector.ts` | manual, weekly | Finds unused exports across monorepo |
| 5 | Contract Tester | ✅ Active | `agents/agents/contract-tester.ts` | manual, pre-push | API contract compliance (status, shapes, errors) |
| 6 | Integration Tester | ✅ Active | `agents/agents/integration-tester.ts` | manual, pre-push | Supabase RLS + full flow + edge case testing |
| 7 | Regression Watcher | ✅ Active | `agents/agents/regression-watcher.ts` | manual, pre-push | Cross-run comparison for regressions |
| 8 | AI Verifier | ✅ Active | `agents/agents/ai-verifier.ts` | manual | Adversarial AI testing (prompt injection, safety) |
| 9 | E2E Smoke Validator | 🟡 Pending | `agents/agents/e2e-smoke.ts` | pre-deploy | Playwright-based critical flow validation |

### 📐 Architecture

| # | Agent | Status | Entrypoint | Trigger | Description |
|---|-------|--------|------------|---------|-------------|
| 10 | SSOT Auditor | ✅ Active | `agents/agents/ssot-auditor.ts` | manual, weekly | Detects duplicated types, orphan docs, config drift |
| 11 | Dependency Auditor | ✅ Active | `agents/agents/dep-auditor.ts` | manual, weekly | Version conflicts, unused deps, misplaced devDeps |

### 🧠 Knowledge

| # | Agent | Status | Entrypoint | Trigger | Description |
|---|-------|--------|------------|---------|-------------|
| 12 | Idea Scanner | ✅ Active | `scripts/scan_ideas.ts` | pre-commit | Scans chat logs for business ideas, classifies them |
| 13 | Knowledge Disseminator | ✅ Active | `scripts/disseminate.ts` | manual | Harvests @disseminate tags into HARVEST.md |

### 🎨 Design

| # | Agent | Status | Entrypoint | Trigger | Description |
|---|-------|--------|------------|---------|-------------|
| 14 | Stitch UI Designer | ✅ Active | `agents/agents/ui-designer.ts` | manual | Generates UI mockups via Gemini + Stitch prompts |

### 🔐 Auth

| # | Agent | Status | Entrypoint | Trigger | Description |
|---|-------|--------|------------|---------|-------------|
| 15 | Auth & Roles Checker | ✅ Active | `agents/agents/auth-roles-checker.ts` | manual, CI | Role consistency across middleware, UI, API |

### 📊 Observability

| # | Agent | Status | Entrypoint | Trigger | Description |
|---|-------|--------|------------|---------|-------------|
| 16 | Rho Calculator | ✅ Active | `scripts/rho.ts` | manual, weekly | Git-log analysis: authority, diversity, bus factor |

### 🔄 Orchestration

| # | Agent | Status | Entrypoint | Trigger | Description |
|---|-------|--------|------------|---------|-------------|
| 17 | Agent Orchestrator | ✅ Active | `agents/agents/orchestrator.ts` | manual | Runs ALL agents, generates combined health report |

---

## Worker Pipeline (Production — Railway)

| Module | File | Purpose |
|--------|------|---------|
| Task Router | `agents/worker/index.ts` | HTTP server, Redis sub, rate limiting, task orchestration |
| Agent Executor | `agents/worker/executor.ts` | Bun.spawn per agent in sandbox, timeout enforcement |
| Results Aggregator | `agents/worker/aggregator.ts` | Rho score, findings summary, structured JSON |
| Sandbox Manager | `agents/worker/sandbox.ts` | Git clone to /tmp, size limits, cleanup |
| AI Enricher | `agents/worker/ai-enricher.ts` | Post-process: AI-generated fix suggestions per finding |

---

## Uncatalogued Scripts (Utility / Not Agents)

| Script | Purpose | Should Register? |
|--------|---------|------------------|
| `scripts/ssot_governance.ts` | Pre-commit SSOT checks (drift, duplicates) | ❌ Pre-commit hook utility |
| `scripts/categorize_ideas.ts` | Classifies scanned ideas into categories | ❌ Part of idea_scanner pipeline |
| `scripts/extract_system_map.ts` | Generates SYSTEM_MAP.md from codebase | ⚠️ Could be agent |
| `scripts/simulate_audit.ts` | Sends test tasks to worker for validation | ❌ Test utility |
| `scripts/deploy_global_catalog.ts` | Deploys catalog to Supabase | ❌ Deploy utility |
| `scripts/deploy_nexus_schema.ts` | Deploys Nexus DB schema | ❌ Deploy utility |
| `scripts/migrate_to_supabase.ts` | Migration helper | ❌ One-time utility |
| `scripts/disseminate_index.sh` | Prevents _knowledge context collapse | ❌ Shell utility |

---

## 🔴 Identified Gaps & Blind Spots

### Critical Gaps (P0)

1. **No Inter-Agent Event Bus** — Agents cannot communicate with each other. The orchestrator runs them sequentially but there's no pub/sub for agent-to-agent signals (e.g., "security scanner found issue → trigger AI verifier").
2. **E2E Smoke Agent Still Pending** — Registered but no implementation file exists. Critical flows (login, audit, dashboard) have no automated validation.
3. **`orchestrator` Not in Registry** — The orchestrator itself is not a registered agent, creating an SSOT violation.

### High Priority Gaps (P1)

4. **No Cost Tracking Agent** — AI calls via OpenRouter have costs but no automated tracker. The `ai-client.ts` logs cost per call, but no agent aggregates or alerts on spend.
5. **No Documentation Generator** — No agent auto-generates or validates documentation. README staleness, missing JSDoc, outdated API docs all go undetected.
6. **No Performance Benchmark Agent** — No automated Lighthouse/Web Vitals checks for the web apps (`egos-web`, `intelink`).

### Medium Gaps (P2)

7. **No Accessibility Checker** — No a11y scanning on UI components.
8. **No API Schema Drift Detector** — API routes can drift from documented schemas without detection.
9. **No Cross-Repo Sync Validator** — `sync.sh` exists but no agent validates that symlinks are intact and rules are consistent across repos.
10. **`ambient_disseminator` Not in Registry** — Just created but needs registry entry + proper trigger classification.

---

## 📋 Recommended Action Plan

### Immediate (This Session)
- [x] Register `orchestrator` and `ambient_disseminator` in `agents.json`
- [x] Commit and push all Phase 14 work
- [ ] Create `AGENTS_CATALOG.md` (this document)

### Next Session (P0)
- [ ] Implement E2E Smoke agent (`agents/agents/e2e-smoke.ts`)
- [ ] Build Cost Tracker agent to aggregate OpenRouter spend

### Future (P1-P2)
- [ ] Build inter-agent event bus (Redis pub/sub between agents)
- [ ] Add Performance Benchmark agent (Lighthouse CLI)
- [ ] Add Documentation Freshness agent
- [ ] Add Cross-Repo Sync Validator agent
