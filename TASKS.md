# TASKS.md — egos-lab

> **VERSION:** 1.0.0 | **UPDATED:** 2026-02-13
> **LAST SESSION:** Antigravity (Gemini) — Initial workspace setup

---

## 🔥 P0 — Critical



### GOVERNANCE-001: Cross-Agent Memory Sync
- **Status:** 🟡 In Progress
- **Agent:** Antigravity
- [x] Create AGENTS.md v1.0
- [x] Create .windsurfrules v1.0
- [x] Create .guarani/IDENTITY.md
- [x] Create .guarani/PREFERENCES.md
- [x] Create TASKS.md (this file)
- [x] Create idea scanner script
- [ ] Test idea scanner on compiladochats
- [ ] Set up pre-commit hook
- [ ] Verify Windsurf reads all governance files

---

## 🟡 P1 — Important

### SCANNER-001: compiladochats Auto-Ingestion
- **Status:** 🟢 Ready
- [ ] First full scan of 228 files
- [ ] Classify: business_idea vs personal vs noise
- [ ] Move classified ideas to `docs/plans/`
- [ ] Generate scan report

### STITCH-001: Google Stitch Design Workflow
- **Status:** 🟢 Ready
- [ ] Create first Stitch prompt (Eagle Eye dashboard)
- [ ] Document Stitch workflow in README
- [ ] Create templates for common UI patterns

### GITHUB-001: Create GitHub Repository
- **Status:** 🟢 Ready
- [x] Create github.com/enioxt/egos-lab
- [x] Push initial commit
- [ ] Set up branch protection

---

## 🔵 P2 — Future

### PNCP-001: PNCP API Integration (Phase 2)
- [ ] Research PNCP API endpoints
- [ ] Cross-reference with Eagle Eye procurement patterns

### DASHBOARD-001: Eagle Eye Dashboard
- [ ] Design in Google Stitch
- [ ] Implement results viewer
- [ ] Add filtering by pattern/city/date

---

## ✅ Completed

### SETUP-001: egos-lab Monorepo
- **Completed:** 2026-02-13
- **Agent:** Antigravity (Gemini)
- [x] npm workspaces setup
- [x] packages/shared (AI client, rate limiter, types)
- [x] apps/eagle-eye scaffold
- [x] 12 idea files migrated
- [x] Initial commit (28 files, 11.4K insertions)

### MIGRATE-001: Migrate to Bun
- **Completed:** 2026-02-13
- **Agent:** Antigravity
- [x] Verify Bun version (>= 1.3.9)
- [x] Clean npm artifacts (node_modules, package-lock.json)
- [x] Install dependencies with Bun
- [x] Update package.json scripts
- [x] Verify workspace functionality

### EAGLE-EYE-001: Complete Eagle Eye MVP
- **Completed:** 2026-02-13
- **Agent:** Antigravity
- [x] Research Querido Diário API (OpenAPI v0.19.0)
- [x] Design 17 opportunity patterns (3 strategies)
- [x] Create core scripts (fetch, patterns, analyze)
- [x] Verify API connection
- [x] Implement robust fallback search (Global/Broad)
- [x] Run full AI analysis with OPENROUTER_API_KEY
- [x] Create `.env` file with API keys
