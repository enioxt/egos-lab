# Agent Findings — Categorized Report

> **Generated:** 2026-02-17T21:30:00-03:00
> **Total:** 143 findings (5 errors, 21 warnings, 117 info)
> **Health Score:** 100% (all agents passed)

---

## Category 1: SSOT Violations (55 findings)

### Duplicate Types (13) — Priority: FIX

Real violations where the same type is defined in multiple files, causing drift risk.

| Type | Files | Severity | Action |
|------|-------|----------|--------|
| `Finding` | 6 files (runner.ts, ssot-auditor, auth-checker, dep-auditor, dead-code, governance) | ERROR | Consolidate to `runner.ts`, import everywhere |
| `RunContext` | 5 files (all agents + runner) | ERROR | Already in `runner.ts`, agents import it — false positive from re-export detection |
| `AgentDefinition` | 2 files (orchestrator, runner) | WARN | Orchestrator imports it — agent regex is too greedy |
| `GraphData` | 2 files (github.ts, ListeningSpiral) | WARN | Consolidate to shared types |
| `CommitData` | 2 files (ActivityStream, useAppStore) | WARN | Consolidate to shared types |
| `UserProfile` | 2 files (marketplace-core, eagle-eye) | WARN | Different contexts, acceptable |
| `AIAnalysisResult` | 3 files (eagle-eye, shared) | ERROR | Consolidate to `packages/shared` |
| `CityProfile` | 2 files (test file + types) | WARN | Test file duplicates type — minor |
| `GoogleMapsReadinessChecklist` | 2 files (test + types) | WARN | Same — test duplication |
| `AnalysisResult` | 2 files (scan_brazil, shared) | WARN | Consolidate to shared |
| `Territory` | 2 files (scan_brazil, territories) | WARN | Consolidate |

### Orphaned Types (42) — Priority: REVIEW

Exported types never imported. Many are **intentional public API** (marketplace-core domain types), others are genuinely unused.

**Likely intentional (domain API):** `PaymentStatus`, `ServiceRequest`, `Proposal`, `Booking`, `StateMachine`, `UserRole`, `ProviderProfile` — these are marketplace-core's public API surface.

**Likely dead:** `CommitNode`, `CommitLink`, `GraphData` (egos-web) — refactored but not cleaned up.

---

## Category 2: Dependency Issues (25 findings)

### Version Conflicts (6) — Priority: FIX

| Package | Versions | Where |
|---------|----------|-------|
| `typescript` | ^5.3.0, ~5.9.3, ^5 | root, egos-web, marketplace-core |
| `react` | ^19.2.0, ^19.2.4 | egos-web, marketplace-core |
| `react-dom` | ^19.2.0, ^19.2.4 | egos-web, marketplace-core |
| `@types/node` | ^24.10.1, ^25.2.3 | egos-web, marketplace-core |
| `@types/react` | ^19.2.7, ^19.2.14 | egos-web, marketplace-core |
| `eslint` | ^9.39.1, ^9 | egos-web, marketplace-core |

**Fix:** Align versions in root `package.json` using workspace protocol.

### Dev Deps in Production (2) — Priority: FIX

| Package | Where |
|---------|-------|
| `@types/pg` | root package.json |
| `@types/pg` | eagle-eye package.json |

**Fix:** Move to `devDependencies`.

### Possibly Unused (17) — Priority: REVIEW

Most are real deps used indirectly (e.g., `react` imported via JSX, `next` used as framework, `lucide-react` used in JSX). A few may be genuinely unused leftovers from marketplace-core scaffolding.

---

## Category 3: Auth Gaps (14 findings)

### Missing Auth on API Routes (7) — Priority: LOW

All 7 are in `radio-philein` (paused project) and `_types.ts` (shared types file, not a route). No real security risk currently.

### Coverage Warning (1)
- 6/13 routes have auth (46%) — mostly radio-philein routes pulling the number down.

### No Middleware (1)
- egos-web doesn't have middleware.ts — acceptable for a Vite SPA, auth is handled differently.

---

## Category 4: Dead Code (49 findings)

### Unused Components (5 warnings)
Components exported but never imported — likely from marketplace-core scaffolding that was generated but not wired up yet.

### Unused Functions/Constants (44 info)
Mostly from eagle-eye research scripts, marketplace-core domain types, and early egos-web utilities. These are either:
- Intentional public API (marketplace-core)
- Research scripts run standalone (eagle-eye)
- Utilities awaiting integration

---

## Summary: What to Fix NOW vs LATER

### Fix Now (next commit)
1. Move `@types/pg` to devDependencies (2 files)
2. Consolidate `Finding` type — import from runner.ts in `ssot_governance.ts`

### Fix Soon (P1)
3. Align TypeScript/React versions across workspaces
4. Consolidate `AIAnalysisResult`, `AnalysisResult`, `Territory` to shared package
5. Clean up orphaned types in egos-web (CommitNode, CommitLink, etc.)

### Defer (P2)
6. radio-philein auth — project is paused
7. marketplace-core dead types — scaffolding, will be used when built out
8. eagle-eye test file type duplication — minor
