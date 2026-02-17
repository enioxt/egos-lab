# EGOS Governance Rules — SSOT Enforcement

> **Version:** 1.0.0 | **Date:** 2026-02-17
> **Principle:** Single Source of Truth for everything. No duplicate data. No orphan docs.

---

## 1. Golden Rules

1. **One Entry Point**: Every piece of data has exactly ONE canonical source
2. **No Duplicate Definitions**: Types, configs, and rules defined once, imported everywhere
3. **Pre-commit Enforcement**: Rules are checked automatically, not by convention
4. **Audit Trail**: Every change is logged with correlation ID and timestamp
5. **Rule Files ARE the Product**: `.guarani/`, `.windsurfrules`, `pre-commit`, `TASKS.md` — these are what we ship

## 2. SSOT Registry

| Data | Canonical Source | DO NOT duplicate in |
|------|-----------------|---------------------|
| Tasks | `TASKS.md` | GitHub Issues, docs/, random .md files |
| Agent definitions | `agents/registry/agents.json` | README, docs, comments |
| Coding rules | `.guarani/PREFERENCES.md` | .eslintrc, random docs |
| Agent identity | `.guarani/IDENTITY.md` | README, package.json description |
| Project config | `AGENTS.md` | README (link instead), docs/ |
| Workspace rules | `.windsurfrules` | .cursorrules (symlink OK) |
| Shared types | `packages/shared/src/types.ts` | Inline types in apps/ |
| Activity data | Supabase `commits` table | Local JSON files, hardcoded arrays |
| Secrets | Vercel env vars (server-side) | .env files in git, hardcoded |

## 3. Pre-commit Checks (Existing + New)

### Existing (security_scan.ts)
- [x] Entropy-based secret detection
- [x] Pattern-based API key detection
- [x] Blocks commits with exposed secrets

### New — SSOT Governance Checks (to implement)

| Check | Type | What it catches |
|-------|------|----------------|
| `no-duplicate-types` | Blocking | Same `type X` or `interface X` defined in 2+ files |
| `no-orphan-docs` | Warning | New .md files outside docs/ (prevent doc proliferation) |
| `tasks-in-ssot` | Warning | TODO/FIXME comments without TASKS.md reference |
| `no-select-star` | Warning | `.select('*')` in API routes (over-fetching) |
| `config-drift` | Warning | `.guarani/` or `.windsurfrules` modified without AGENTS.md update |
| `commit-format` | Blocking | Non-conventional commit messages |

## 4. Rule Sharing Package Design

### What gets shared (the "EGOS Kit")

```
egos-kit/
├── .guarani/
│   ├── IDENTITY.md          ← Agent identity template
│   └── PREFERENCES.md       ← Coding rules + conventions
├── .windsurfrules            ← Workspace rules for AI agents
├── .cursorrules              ← Symlink to .windsurfrules
├── agents/
│   ├── registry/agents.json  ← Agent definitions (customizable)
│   └── runtime/runner.ts     ← Agent runtime (copy as-is)
├── scripts/
│   └── security_scan.ts      ← Pre-commit security scanner
├── .husky/
│   └── pre-commit            ← Git hooks setup
├── package.json              ← Bun scripts for agents
└── README.md                 ← Setup instructions
```

### How to share

1. **GitHub Template Repo**: `egos-kit` template → "Use this template" button
2. **npx command**: `npx create-egos-kit` (future)
3. **Copy-paste**: Clone `agents/` + `.guarani/` + `.windsurfrules` into any TS project

### Customization points

| File | What to customize | What to keep |
|------|------------------|--------------|
| `.guarani/IDENTITY.md` | Project name, description, sacred code | Structure, sections |
| `.guarani/PREFERENCES.md` | Stack-specific rules (React vs Vue, etc) | Security rules, MCP rules |
| `.windsurfrules` | Port numbers, deploy config | SSOT mandamentos, workflow triggers |
| `agents/registry/agents.json` | Enable/disable agents, add custom ones | Schema, required fields |
| `TASKS.md` | Your actual tasks | Format, priority levels |

## 5. Cross-Project Governance

### When working on multiple repos (egos-lab + carteira-livre)

| Rule | Why |
|------|-----|
| Never mix Supabase project refs | `lhscgsqhiooyatkebose` = egos-lab, `eevhnrqmdwjhwmxdidns` = carteira-livre |
| Never copy code between repos | Import from `packages/shared/` or publish as npm package |
| Each repo has its OWN `.guarani/` | Not symlinked — allows independent evolution |
| Shared rules go to `egos-kit` template | Not duplicated in each repo |
| MCP config is GLOBAL | Switch `--project-ref` when changing projects |

## 6. Enforcement Roadmap

| Phase | What | When |
|-------|------|------|
| **Phase 1** | Document rules (this file) + manual review | Now ✅ |
| **Phase 2** | Add SSOT checks to pre-commit hooks | Next session |
| **Phase 3** | SSOT Auditor agent enforces automatically | Week 2 |
| **Phase 4** | `npx create-egos-kit` packages everything | Week 3-4 |
| **Phase 5** | Rule Forge: web UI for composing rules | Month 2 |
