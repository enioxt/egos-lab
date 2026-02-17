# EGOS Master Diagnostic — Full Ecosystem Audit

> Generated: 2026-02-17 | Session: Windsurf Agentic Platform Build

---

## 0. Current System Snapshot (evidence-based)

### Repo state (recent changes)

- `25befe0` — First 2 case studies: Documenso + Cal.com
- `04b4e04` — Runner fix: external repo mode (registry/log paths resolved from EGOS install dir)
- `0c5afdb` — Auth Roles Checker + Code Reviewer wired to LLM
- `1d8216e` — egos-web secrets moved to Vercel serverless proxies

### Registered agents (8)

| ID | Status | Notes |
|----|--------|------|
| `security_scanner` | active | Pre-commit entropy + heuristic scan |
| `idea_scanner` | active | Compiladochats ingest |
| `rho_calculator` | active | Git health metric |
| `code_reviewer` | active | Uses `packages/shared/src/ai-client.ts` (OpenRouter) |
| `disseminator` | active | Knowledge propagation |
| `ssot_auditor` | pending | Implemented and runnable; registry status still pending |
| `auth_roles_checker` | active | Heuristic auth/role scan |
| `e2e_smoke` | pending | Not implemented yet |

### Latest local diagnostics (egos-lab)

- **SSOT Auditor (`bun agent:ssot`)**
  - Output summary: `5 errors`, `9 warnings`, `41 info`
  - **Known false positives (high impact):** regex currently matches `type X` in import/export lines and can match comment text.
    - Examples surfaced in this repo: `definitions`, `for`, `RunContext`, `Finding`, `AIAnalysisResult` showing up as “duplicate type definitions”.
    - In this repo, `AIAnalysisResult` is *actually* defined in `packages/shared/src/types.ts` — the other “definitions” are import/re-export lines (false positives).
  - **Likely-real duplicates (worth fixing):**
    - `GraphData` (2 files)
    - `CommitData` (2 files)
    - `VercelRequest` / `VercelResponse` (2 files)
    - `UserProfile` (2 files, cross-domain naming collision)

- **Auth Roles Checker (`bun agent:auth`)**
  - 13 findings (8 warnings)
  - Warned that multiple `apps/radio-philein/api/**/route.ts` files have **no auth check**
  - Reported coverage: **5/11 routes (45%)**
  - Warned: **no middleware file found** (routing-level auth may not exist)
  - **Important:** current detection is path/pattern-based; treat this as triage output.

- **Code Reviewer (`bun agent:review`)**
  - Uses `packages/shared/src/ai-client.ts` (OpenRouter model `google/gemini-2.0-flash-001`)
  - Requires `OPENROUTER_API_KEY`
    - If missing: prints diff stats only (no AI call)
    - If present: requests JSON output (OpenRouter `response_format: { type: 'json_object' }`)
  - Note: currently lives in `scripts/review.ts` (proto-agent), not yet runner-migrated (no JSONL log output)

- **Rho (`bun rho`)**
  - `ρ = 0.1453` (status: WARNING)
  - `Commits = 24`, `Contributors = 1`, `Bus factor = 1`

- **Security scan (`bun security:scan`)**
  - PASSED (no critical secrets detected)

### egos-web Activity Pipeline (audited 2026-02-17)

- **Data sources (dual):**
  1. **Supabase `commits` table** — primary source (25 rows as of audit)
  2. **GitHub API fallback** — `/api/github-commits` Vercel serverless proxy
- **Polling:** `ActivityStream.tsx` refreshes every 30s
- **What shows:** Git commit history (message, author, date, link to GitHub)
- **What doesn't show yet:** Agent run outputs, Rho score, case study results
- **Ingest:** `apps/egos-web/scripts/ingest-commits.ts` — requires `SUPABASE_DB_PASSWORD` + `GITHUB_TOKEN`

### Security audit (2026-02-17)

| Check | Status | Details |
|-------|--------|---------|
| `.env` in git | ✅ Safe | Root `.gitignore` excludes `.env`; `git ls-files apps/egos-web/.env` returns empty |
| Client bundle secrets | ✅ Safe | Only `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (public by design) |
| `OPENROUTER_API_KEY` | ✅ Safe | Server-side only in `api/chat.ts` via `process.env` |
| `GITHUB_TOKEN` | ✅ Safe | Server-side only in `api/github-commits.ts` via `process.env` |
| RLS on `commits` | ✅ **Fixed** | Was: anon could WRITE (security risk). Now: `commits_public_read` (SELECT for public) + `commits_service_role_write` (ALL for service_role only) |
| Supabase anon key in client | ✅ Expected | Anon key is designed for client-side use with RLS enforcement |

**Critical fix applied:** Dropped `commits_service_write` policy (allowed anon INSERT/UPDATE/DELETE) and replaced with `commits_service_role_write` (service_role only).

### Secrets & git hygiene

- `git ls-files | grep .env` returns only `.env.example` (good).

### Operational notes

- `agents/.logs/` exists and is accumulating JSONL logs (SSOT runs can generate multi-MB logs). For VPS 24/7, log rotation/retention needs a policy.

## 1. Complete File Inventory & Status

### Root Files

| File | Status | Action |
|------|--------|--------|
| `AGENTS.md` v2.0 | **Active** | SSOT — updated this session |
| `TASKS.md` v2.0 | **Active** | SSOT — updated this session |
| `.windsurfrules` v2.0 | **Active** | SSOT — updated this session |
| `README.md` | **Active** | Updated last session |
| `package.json` | **Active** | Agent scripts added |
| `tsconfig.json` | **Active** | Bun TS config |
| `BUILDER_INSTRUCTIONS.md` | **Removed** | Phase 2 Gemini instructions, superseded by AGENTS.md |
| `.idea-manifest.json` | **Archive** | Idea scanner manifest, still useful |

### agents/ (NEW — this session)

| File | Status | Purpose |
|------|--------|---------|
| `cli.ts` | **Active** | CLI: list, run, lint-registry |
| `runtime/runner.ts` | **Active** | Core: registry loader, JSONL logger, correlation IDs |
| `registry/agents.json` | **Active** | 8 agents registered (SSOT) |
| `agents/ssot-auditor.ts` | **Active** | P0.1 — finds SSOT violations, 55 findings on first run |
| `agents/auth-roles-checker.ts` | **Active** | P0.2 — heuristics for auth/roles + API guard coverage |
| `evals/` | **Empty** | Planned: eval suites per agent |
| `.logs/` | **Gitignored** | JSONL structured logs |

### scripts/ (proto-agents)

| Script | Status | Migrated? | Lines |
|--------|--------|-----------|-------|
| `security_scan.ts` | **Active** | Registered in agents.json | 4183B |
| `scan_ideas.ts` | **Active** | Registered in agents.json | 10017B |
| `rho.ts` | **Active** | Registered in agents.json | 7013B |
| `review.ts` | **Active** | Registered in agents.json | 4634B |
| `disseminate.ts` | **Active** | Registered in agents.json | 1926B |
| `categorize_ideas.ts` | **Active** | NOT registered — candidate for agent | 9261B |
| `test_exa.ts` | **Utility** | NOT an agent — test script | 1111B |
| `list_downloads.ts` | **Utility** | NOT an agent — helper | 574B |
| `apply_schema_direct.ts` | **Utility** | DB schema tool | 1476B |
| `migrate_to_supabase.ts` | **Utility** | DB migration tool | 3667B |
| `setup_supabase_schema.ts` | **Utility** | DB setup tool | 1504B |

### .guarani/

| File | Status | Action Needed |
|------|--------|---------------|
| `IDENTITY.md` v2.0 | **Active** | Universal agent identity + rules of engagement |
| `PREFERENCES.md` v2.0 | **Active** | Security + conventions + MCP usage rules |

### apps/

| App | Status | Lines (approx) | Deploy |
|-----|--------|-----------------|--------|
| `egos-web/` | **Active** | ~3K | Vercel (egos.ia.br) |
| `eagle-eye/` | **Active** | ~8K | CLI only |
| `marketplace-core/` | **Empty** | 0 | Planned |
| `radio-philein/` | **Paused** | ~1K | Not deployed |

### packages/shared/src/

| File | Status | Used By |
|------|--------|---------|
| `ai-client.ts` | **Active** | review.ts, future agents |
| `rate-limiter.ts` | **Active** | ai-client.ts |
| `types.ts` | **Active** | All apps + agents |
| `index.ts` | **Active** | Re-exports |

### docs/ (knowledge base)

| Directory | Files | Status | Notes |
|-----------|-------|--------|-------|
| `agentic/` | 4 | **Active** | Core docs — DIFFERENTIATORS, map, how-to, reports/ |
| `plans/` | 155 | **Archive** | Ingested ideas from compiladochats |
| `stitch/` | 14 | **Active** | Google Stitch design prompts |
| `_current_handoffs/` | 3 | **Active** | Cross-agent handoff docs |
| `eagle-eye/` | 1 | **Active** | Eagle Eye specific docs |
| `eagle-eye-results/` | 4 | **Active** | AI analysis results |
| `partner_packages/` | 4 | **Active** | carteira-livre integration docs |
| `marketplace/` | 2 | **Planned** | Marketplace design docs |
| `database/` | 1 | **Active** | DB schema docs |
| `guides/` | 1 | **Active** | Setup guides |
| `knowledge/` | — | **Removed** | Directory removed to prevent empty-doc drift |
| `review/` | 1 | **Active** | Code review output |
| `strategy/` | 1 | **Active** | Monetization strategy |
| `valuation/` | 1 | **Active** | AI-era valuation metrics |

### Standalone docs

| File | Status | Action |
|------|--------|--------|
| `OPEN_SOURCE_PLAN.md` | **Active** | 16K — comprehensive collaborative network plan |
| `CONTRIBUTING_WITH_AI.md` | **Active** | 3.7K — contributor onboarding |
| `KEY_MANAGEMENT.md` | **Active** | 2.3K — secret management guide |
| `SECURITY.md` | **Active** | 1.2K — security policy |
| `SECURITY_PROTOCOL.md` | **Removed** | Consolidated into SECURITY.md |
| `BUSINESS_STRATEGY.md` | **Active** | 2K — business plan |
| `STANDARDS.md` | **Removed** | Superseded by .windsurfrules v2.0 |
| `BACKLOG.md` | **Removed** | Old creative dump removed |

---

## 2. Redundancy & Cleanup Map

### Files to DELETE or MERGE

| File | Reason | Action |
|------|--------|--------|
| `BUILDER_INSTRUCTIONS.md` | Superseded by AGENTS.md | Delete |
| `docs/STANDARDS.md` | Superseded by .windsurfrules v2.0 | Delete |
| `docs/BACKLOG.md` | Old items, mostly irrelevant | Merge useful bits into TASKS.md, delete |
| `docs/SECURITY_PROTOCOL.md` | Overlaps SECURITY.md | Merge into SECURITY.md |
| `packages/config/` | Empty directory | Delete |
| `scripts/shared/` | Empty directory | Delete |
| `docs/knowledge/` | Empty directory | Delete |

### Files to UPDATE (v2.0)

| File | Current | Needed |
|------|---------|--------|
| `.guarani/IDENTITY.md` | v1.0 (Antigravity-specific) | v2.0 — universal agent identity |
| `.guarani/PREFERENCES.md` | v1.0 (basic) | v2.0 — agent conventions, MCP usage rules |

---

## 3. Case Study Targets — 5 Real Open-Source Repos

Best candidates for running EGOS agents and publishing findings:

| # | Repo | Stars | Why This One | Area |
|---|------|-------|-------------|------|
| 1 | **supabase/supabase** | 75K+ | Our own DB provider. TS monorepo. They'd appreciate SSOT findings. Partnership angle. | Infrastructure |
| 2 | **calcom/cal.com** | 35K+ | Scheduling SaaS. TS monorepo (turborepo). Known for good practices. Mid-size, relatable. | SaaS |
| 3 | **medusajs/medusa** | 27K+ | E-commerce platform. TS. Complex type system across modules. Great for SSOT audit. | E-commerce |
| 4 | **documenso/documenso** | 8K+ | Open-source DocuSign. Next.js + TS. Smaller, more manageable. Good for first case study. | Legal Tech |
| 5 | **twentyhq/twenty** | 24K+ | Open-source CRM. TS + NestJS. Complex domain types. Great for SSOT + auth audit. | CRM |

### Why these 5

- **All TypeScript** — our agents are built for TS analysis
- **All monorepos** — SSOT violations are most likely in monorepos
- **Different industries** — shows EGOS works across domains
- **Different sizes** — from 8K to 75K stars
- **Active communities** — findings will be noticed and discussed
- **Open to contributions** — we can submit fix PRs after the audit

### Execution order

1. Start with **documenso** (smallest, easiest to audit, fast case study)
2. Then **cal.com** (mid-size, well-known)
3. Then **medusa** (complex types, great findings expected)
4. Then **twenty** (CRM domain, auth audit potential)
5. Finally **supabase** (partnership target, do last when we have credibility)

---

## 4. Egos-Core MCP Assessment

### Current state (from `mcp1_get_tasks_summary`)

The egos-core MCP has **31 P0/P1 tasks** from old EGOSv3 sessions that are completely irrelevant to egos-lab:

- P0 (5): "Phase 4 Hardening", "CSP fix", "Link Analysis", "ETHIK Distribution", "Shannon AI Tool"
- P1 (21): "Admin Chat Widget", "Telemetry", "Mycelium", "Mobile Factory", etc.
- P2 (5): "Dashboard patterns", "Hyper-Agent", "Lifecycle manager"
- Completed (30): Mostly test tasks

### Recommendations

1. **Clean up egos-core tasks** — Remove all EGOSv3/carteira-livre tasks from egos-lab context
2. **Add egos-lab specific tasks** — Mirror TASKS.md into egos-core for cross-session persistence
3. **Add MCP usage rules** to .guarani/PREFERENCES.md:
   - Always use `mcp1_search_knowledge` before researching externally
   - Always use `mcp1_save_web_knowledge` after finding valuable info
   - Always use `mcp4_*` (GitHub MCP) for repo operations
   - Always use `mcp10_*` (Supabase MCP) for DB operations
4. **Agents should trigger MCP calls** — future agents that need web search should use `mcp2_*` (Exa)

---

## 5. Short / Medium / Long-Term Roadmap

### SHORT TERM (1-2 weeks)

#### Goal — Run on 5 repos, publish first case study, get first external contributor

| # | Task | Effort | Depends On |
|---|------|--------|------------|
| S1 | Clean up obsolete files (BUILDER_INSTRUCTIONS, STANDARDS, BACKLOG, empty dirs) | 30min | — |
| S2 | Update .guarani/IDENTITY.md + PREFERENCES.md to v2.0 | 30min | — |
| S3 | Implement Auth Roles Checker agent | 2h | — |
| S4 | Wire Code Reviewer to LLM (ai-client.ts) | 1h | — |
| S5 | Run /audit-external on documenso (first case study) | 1h | S3, S4 |
| S6 | Run /audit-external on cal.com + medusa | 2h | S5 |
| S7 | Create 5 good-first-issues on GitHub | 30min | — |
| S8 | Write Dev.to article: "I audited 5 repos with AI agents" | 2h | S5, S6 |
| S9 | Twitter thread + screenshots | 30min | S8 |
| S10 | Hacker News "Show HN" post | 15min | S8 |

**Milestone:** First external star/fork/issue from a stranger.

### MEDIUM TERM (1-2 months)

#### Goal — 10+ contributors, 500+ stars, first partnership, consulting proof-of-concept

| # | Task | Effort | Depends On |
|---|------|--------|------------|
| M1 | E2E Smoke Validator agent (Playwright) | 4h | Short-term done |
| M2 | Eval suites for all 8 agents | 8h | M1 |
| M3 | `npx egos-audit` — npm package for one-command audit | 4h | M2 |
| M4 | Run consulting diagnostic on a real client project | 2h | M3 |
| M5 | Partnership outreach: Windsurf/Codeium (Tier 1) | 2h | Case studies ready |
| M6 | Partnership outreach: Supabase (Tier 2) | 2h | M5 |
| M7 | Product Hunt launch | 4h | M3, case studies |
| M8 | First paid consulting gig using EGOS diagnostic | 4h | M4 |
| M9 | 5 more agents from agentification map (Layer 1-2) | 16h | M2 |
| M10 | Rule marketplace MVP (share .guarani configs) | 8h | Community feedback |

**Milestone:** First $ earned from EGOS consulting. 500+ GitHub stars.

### LONG TERM (3-6 months)

#### Goal — Self-sustaining open-source project with recurring consulting revenue

| # | Task | Effort | Depends On |
|---|------|--------|------------|
| L1 | All 20 agents from agentification map implemented | 40h | Medium-term done |
| L2 | Self-evolving rules: agents that improve .guarani based on findings | 16h | L1 |
| L3 | Multi-language support (Python, Go agents) | 24h | L1 |
| L4 | EGOS Dashboard (web UI for audit results) | 16h | L1 |
| L5 | Hosted EGOS service (upload repo, get report) | 24h | L4 |
| L6 | Bootcamp partnership (structured curriculum) | 8h | Community > 50 contributors |
| L7 | GitHub Accelerator application | 4h | 1K+ stars |
| L8 | Revenue target: R$ 10K/month from consulting + hosted service | Ongoing | L5, L8 |

**Milestone:** EGOS is a recognized tool in the TS ecosystem. Multiple contributors. Recurring revenue.

---

## 6. What Each Future Agent Will Learn From

Every agent in the registry should be designed to:

1. **Read .guarani/ on startup** — knows the rules
2. **Use MCPs when available** — never reinvent what an MCP provides
3. **Log with correlation IDs** — all findings traceable
4. **Produce structured findings** — same `Finding` type for all agents
5. **Support --dry mode** — always safe to run
6. **Cost $0 or near-$0** — no API keys required for read-only agents
7. **Be under 300 lines** — focused, auditable, forkable

---

## 7. MCP Usage Rules (to add to PREFERENCES.md)

```markdown
## MCP Usage (MANDATORY)

Before manual implementation, check if an MCP can do it:

| Task | Use MCP | NOT manual |
|------|---------|------------|
| Web search | mcp2_web_search_exa | fetch() to Google |
| Code search | mcp2_get_code_context_exa | grep GitHub manually |
| File operations | mcp3_read_text_file (if native fails) | shell commands |
| GitHub ops | mcp4_create_issue, mcp4_push_files | git CLI |
| Knowledge persist | mcp1_save_web_knowledge | writing .md files |
| Knowledge search | mcp1_search_knowledge | grep docs/ |
| Supabase queries | mcp10_execute_sql | pg client |
| Task management | mcp1_add_task, mcp1_update_task_status | editing TASKS.md manually |

After finding valuable information:
→ ALWAYS call mcp1_save_web_knowledge to persist it
→ ALWAYS call create_memory to persist across sessions
```
