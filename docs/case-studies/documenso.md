# Case Study: Documenso — EGOS Agent Audit

> **Date:** 2026-02-17 | **Repo:** github.com/documenso/documenso | **Stars:** 8K+

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

## What This Shows

1. **Monorepos amplify SSOT violations** — types get redefined as convenience copies
2. **Field meta types** are particularly prone to duplication (used in UI + lib + API)
3. **Auth coverage** below 50% is common in fast-moving projects
4. **Zero-cost auditing** reveals patterns humans miss in 1000+ file codebases
