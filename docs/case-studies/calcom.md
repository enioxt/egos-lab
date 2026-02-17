# Case Study: Cal.com — EGOS Agent Audit

> **Date:** 2026-02-17 | **Repo:** github.com/calcom/cal.com | **Stars:** 35K+

## Executive Summary (claims we can defend)

- **Scale proof:** EGOS scanned a very large TS monorepo (7,302 TS files) in ~2s and produced a repo-wide duplication signal at **$0 cost**.
- **Triage output, not a verdict:** The raw “duplicate type name” list is useful to prioritize review, but it includes predictable **name-only false positives** in Next.js repos (e.g., many files naming a local type `PageProps`).
- **Key gap identified:** For large repos, EGOS needs a second pass (shape-aware or context-aware) to turn high-volume signals into maintainer-ready, high-confidence issues.

## Results

| Agent | Files | Findings | Time | Cost |
|-------|-------|----------|------|------|
| SSOT Auditor | 7,302 | 1,469 (277 errors, 492 warnings, 700 info) | ~2s | $0 |

## Key SSOT Findings

### High-count duplicates (requires validation)

- `PageProps` — **38 files**
- `id` — **31 files**
- `does` — 8 files (**known false positive** from comments — regex limitation)

**Interpretation:** `PageProps` is a common local alias name in Next.js pages. A name-only scanner will flag this even when each `PageProps` has a different shape and is intentionally local.

### Likely more actionable duplicates (better signal)

- `GetBookingType` — 3 files (lib, features, app layer)

## Multi-angle Analysis

### 1) Maintainability / Drift Risk

- **Medium confidence:** versioned API folders and feature packages can drift via copy/paste types (common in turborepo-scale codebases).
- **Low confidence for `PageProps`:** very high counts can be explained by conventions, not SSOT drift.

### 2) Developer Experience (DX)

- A repo-wide scan is the only practical way to find naming collisions at this scale.
- The highest-value output is not the count; it is the **ranked list** of suspicious duplicate clusters to review.

### 3) Security / Access Control

- Not covered in this case study (only SSOT Auditor ran). This is a diagnostic gap for Cal.com until Auth Roles Checker is executed on the repo.

## Known Limitations (avoid overselling)

- **Name-only duplication:** SSOT Auditor currently flags duplicate identifiers, not duplicate semantics.
- **Regex-based extraction:** comment/string matches can create false positives (e.g., `does`).
- **Framework conventions:** common aliases (`PageProps`, `Props`) inflate counts unless filtered.

## Next Validation Steps (still read-only)

1. **Filter obvious convention aliases**
   - Add a repo/framework-specific ignore list (or a “treat as low-signal” bucket).
2. **Add a second pass (shape-aware)**
   - Compare type bodies (AST-based) for top duplicates.
3. **Run Auth Roles Checker on Cal.com**
   - Build a security/access-control view to pair with SSOT findings.

## Comparison

| Metric | Documenso (8K stars) | Cal.com (35K stars) |
|--------|---------------------|---------------------|
| TS Files | 1,662 | 7,302 |
| Types Found | 1,888 | 7,067 |
| Errors | 52 | 277 |
| Warnings | 98 | 492 |
| Worst Offender | `TCheckboxFieldMeta` (5 files) | `PageProps` (38 files) |

**Conclusion:** SSOT violations grow superlinearly with codebase size. The bigger the repo, the more value EGOS agents provide.

**Caveat:** raw duplicate-name counts also grow with repo size *and* with framework naming conventions. The value is still real (fast triage at scale), but the output needs confidence grading to avoid false-positive noise.
