# How to Contribute — For Humans and AIs

> **Updated:** 2026-02-17 | See also: [OPEN_SOURCE_PLAN.md](./OPEN_SOURCE_PLAN.md)

Welcome to EGOS Lab. This is a collaborative ecosystem where ideas become code, beginners become contributors, and rules evolve through collective intelligence.

---

## Quick Start (3 minutes)

1. **Fork** this repo on GitHub
2. **Clone** your fork locally (or open in GitHub Codespaces for zero setup)
3. **Read** `README.md` (status quo) and `TASKS.md` (current priorities)
4. **Pick** a task labeled `good-first-issue` or propose your own idea
5. **Branch**, implement, **PR** — done

---

## What You Can Contribute

### Code
- Fix bugs, add features, improve performance
- Work on any app in `apps/` or shared code in `packages/`
- Follow `.guarani/PREFERENCES.md` for coding standards

### Ideas
- Submit ideas as markdown files in `docs/plans/`
- Or open a GitHub Issue with the `idea` label
- Ideas get community evaluation (feasibility, impact, originality)
- Top ideas become `projects/` entries

### Rules & Configs
- Share your `.guarani/`, `.windsurfrules`, pre-commit, lint, or CI configs
- Improve existing configs in `packages/config/`
- Every rule improvement benefits the entire ecosystem

### Documentation
- Improve READMEs, add tutorials, translate docs
- Document architecture decisions in `docs/`

### Reviews
- Review open PRs with structured feedback (correctness, style, tests, docs, security)
- Every review earns contributor reputation

---

## Contributor Levels

| Level | Title | What You Can Do | How to Reach |
|-------|-------|----------------|--------------|
| 0 | **Explorer** | Browse, vote on ideas, comment | Sign up |
| 1 | **Apprentice** | Submit PRs (docs, typos, small fixes) | Complete onboarding |
| 2 | **Builder** | Claim issues, submit features | 3+ merged PRs |
| 3 | **Architect** | Propose ideas, review PRs, mentor | 10+ contributions + reviews |
| 4 | **Guardian** | Vote on governance, approve rule changes | Community nomination |

---

## Commit Convention

Your commit message is your voice:

```
feat: ...     → New feature or idea implementation
fix: ...      → Bug fix
docs: ...     → Documentation change
refactor: ... → Code restructuring (no behavior change)
chore: ...    → Tooling, configs, dependencies
security: ... → Security improvements
```

---

## IDE Setup

### Option A: GitHub Codespaces (recommended for beginners)
- Click "Code" → "Codespaces" → "Create codespace" on the repo page
- Zero local setup. Everything runs in the browser.

### Option B: Local with Windsurf / Cursor / VS Code
- Clone the repo
- The `.windsurfrules` and `.cursorrules` files auto-configure your AI assistant
- Run `bun install` at the root

### Option C: AI Agent (Claude Code / Antigravity)
- Point at the repo root — `.guarani/` provides full context
- Run `bun disseminate` if you learn something new
- Run `bun security:scan` before pushing

---

## Rules for PRs

1. **One concern per PR** — don't mix unrelated changes
2. **Describe what and why** in the PR description
3. **Link to issue/idea** if applicable
4. **Tests**: Add or update tests if changing behavior
5. **No secrets**: Never commit API keys, tokens, or passwords
6. **Security scan passes**: Pre-commit hook runs automatically

---

## Community Guidelines

- **Be constructive** — critique code, not people
- **Be patient** — beginners are welcome and encouraged
- **Be transparent** — explain your reasoning
- **No spam** — quality over quantity
- **AI contributions are welcome** — but must be reviewed by humans

---

> *"The best open source isn't just code. It's ideas, rules, reviews, and the humans who connect them."*
