# Case Study: Cal.com — EGOS Agent Audit

> **Date:** 2026-02-17 | **Repo:** github.com/calcom/cal.com | **Stars:** 35K+

## Results

| Agent | Files | Findings | Time | Cost |
|-------|-------|----------|------|------|
| SSOT Auditor | 7,302 | 1,469 (277 errors, 492 warnings, 700 info) | ~2s | $0 |

## Key SSOT Findings

### Worst Offenders

- `PageProps` — **38 files** (every page redefines it instead of importing from `_types.ts`)
- `id` — **31 files** (type defined inline across API, features, platform packages)
- `does` — 8 files (false positive from comments — known regex issue)
- `GetBookingType` — 3 files (lib, features, app layer all define their own)

### Patterns Observed

1. **PageProps explosion** — Next.js App Router pages each define their own `PageProps` type instead of importing from a shared location. This is the #1 SSOT violation in Next.js monorepos.

2. **API versioning creates duplication** — `apps/api/v2/` has its own type copies that drift from `packages/platform/types/`. Versioned APIs need explicit re-exports, not copies.

3. **Test files redefine types** — `MockedFunction`, `ValidatedOrgAdminSession` etc. redefined in test files instead of imported from test utilities.

4. **Scale amplifies the problem** — 7,302 TS files means 7,067 type definitions. At this scale, manual tracking is impossible. Automated SSOT auditing is the only viable approach.

## Comparison

| Metric | Documenso (8K stars) | Cal.com (35K stars) |
|--------|---------------------|---------------------|
| TS Files | 1,662 | 7,302 |
| Types Found | 1,888 | 7,067 |
| Errors | 52 | 277 |
| Warnings | 98 | 492 |
| Worst Offender | `TCheckboxFieldMeta` (5 files) | `PageProps` (38 files) |

**Conclusion:** SSOT violations grow superlinearly with codebase size. The bigger the repo, the more value EGOS agents provide.
