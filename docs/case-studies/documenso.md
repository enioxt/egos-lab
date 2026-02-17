# Case Study: Documenso — EGOS Agent Audit

> **Date:** 2026-02-17 | **Repo:** github.com/documenso/documenso | **Stars:** 8K+

## Executive Summary (claims we can defend)

- **Zero-cost, repo-wide signal:** EGOS surfaced high-frequency duplicated type names across UI + lib layers in **< 1s**.
- **Actionable prioritization:** The output helps maintainers decide *where to look first* for drift-prone concepts (e.g., field meta types).
- **Auth coverage is a heuristic:** The 47% number is a *signal* from a path/pattern scanner, not proof of insecure endpoints.

## Results

| Agent | Files | Findings | Time | Cost |
|-------|-------|----------|------|------|
| SSOT Auditor | 1,662 | 1,012 (52 errors, 98 warnings, 862 info) | 555ms | $0 |
| Auth Roles Checker | 1,662 | 41 (31 warnings) | ~200ms | $0 |

**Total: 1,053 findings in <1 second, $0 cost.**

## Key SSOT Findings

### Duplicated Types (errors — same type defined in multiple files)

- `TCheckboxFieldMeta` — 5 files (components + packages/lib)
- `TRadioFieldMeta` — 5 files
- `TTextFieldMeta` — 5 files
- `User` — 5 files (remix app, auth, prisma seed, lib)
- `TDocumentMetaDateFormat` — 3 files
- `DomainRecord` — 3 files
- `EnvelopeItem` — 3 files
- `SettingsSubset` — 3 files
- `TSignatureFieldMeta` — 3 files

**Pattern:** Field meta types are the worst offenders — defined in both component files AND the canonical `packages/lib/types/field-meta.ts`. Components should import from the lib, not redefine.

### Auth Coverage

- **58 API routes found**, only **27 have auth checks** (47% coverage)
- 31 API routes lack session/auth verification
- Middleware exists at 3 levels: Remix server, Prisma, and API v1
- Only 1 role string detected: `"OWNER"` (2 references)

## Multi-angle Analysis

### 1) Maintainability / Drift Risk

- **High confidence:** duplicated “field meta” types are drift-prone because they represent shared domain contracts used by both UI and backend-ish layers.
- **Medium confidence:** generic domain types like `User` may be intentional (bounded contexts), but are still worth review because name collisions hide divergence.

### 2) Security / Access Control

- **Medium confidence:** “missing auth” findings are useful as a *triage list*.
- **Low confidence as a verdict:** the agent can misclassify files as routes. Validation requires checking the actual route entrypoints.

### 3) Developer Experience (DX)

- Duplication often correlates with “local convenience” in fast-moving monorepos (copy a type to move faster).
- EGOS provides a *repo-level view* that TypeScript/ESLint usually won’t flag by default (same name can exist in separate modules without compiler errors).

## Known Limitations (avoid overselling)

- **Regex-based extraction:** SSOT Auditor currently detects `export interface/type X` by regex and can over-count if patterns appear in non-type contexts.
- **Name-only duplication:** it does not compare type “shape”, only the identifier name.
- **Auth route heuristics:** Auth Roles Checker uses patterns like `/api/`, `route.ts`, and auth-call regexes; it can flag helpers as routes.

## Next Validation Steps (still read-only)

1. **Validate top duplicate clusters**
   - Compare bodies for top 5 duplicated names.
   - Classify: copy/paste vs intentional bounded contexts vs drift.
2. **Recompute auth coverage with stricter route detection**
   - Count only actual route handlers.
   - Split: public endpoints vs missing auth.
3. **Produce maintainer-facing output**
   - One short issue: top 10 duplicates + suggested canonical import paths.

## What This Shows

1. **Monorepos amplify SSOT violations** — types get redefined as convenience copies
2. **Field meta types** are particularly prone to duplication (used in UI + lib + API)
3. **Auth coverage** below 50% is common in fast-moving projects
4. **Zero-cost auditing** reveals patterns humans miss in 1000+ file codebases
