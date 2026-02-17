# I Audited 5 Open Source Repos with AI Agents — Here's What I Found

> **Target:** Dev.to / Hashnode | **Author:** @enioxt | **Est. read:** 8 min

---

## Hook

> What if you could run 5 diagnostic agents on any TypeScript codebase and get a full health report in under 3 minutes — for $0?

I built EGOS, a zero-dependency agent framework that does exactly that. Then I ran it on popular open-source projects. The results were eye-opening.

## What is EGOS?

EGOS is not another LangChain or CrewAI. It's a **rules-as-DNA** system where:
- `.guarani/` files define agent identity (like DNA)
- `.windsurfrules` configure the workspace (like epigenetics)
- Agents are specialized cells that do ONE thing well
- A registry acts as the nervous system
- Evals are the immune system

**Total agent code:** ~50KB. **Dependencies:** zero (pure TS + Bun). **Cost to run:** $0.

## The 5 Agents

| Agent | What it does | Time | Cost |
|-------|-------------|------|------|
| **SSOT Auditor** | Finds duplicate type definitions across files | <1min | $0 |
| **Security Scanner** | Detects exposed secrets via pattern matching + entropy | <30s | $0 |
| **Rho Score** | Calculates team health metrics | <10s | $0 |
| **Code Reviewer** | AI-powered diff analysis | ~30s | ~$0.01 |
| **Auth Auditor** | Finds permission inconsistencies | <1min | $0 |

## Case Study #1: Documenso (Document Signing)

**Repo:** github.com/documenso/documenso | **Stars:** ~8k

**SSOT Auditor results:**
- **1,012 findings** in 47 seconds
- 31 duplicate type definitions
- Key finding: `Document` type defined in 4 separate files
- Some types were imported from a `@documenso/prisma` package but also redefined locally

**Takeaway:** Even well-maintained projects accumulate type drift over time.

## Case Study #2: Cal.com (Scheduling)

**Repo:** github.com/calcom/cal.com | **Stars:** ~32k

**SSOT Auditor results:**
- **1,469 findings** in 52 seconds
- 42 duplicate type definitions
- Monorepo structure amplified the problem — types in `packages/` were re-exported and re-defined in `apps/`
- `BookingStatus` defined in 3 different packages

**Takeaway:** Monorepos need explicit SSOT governance or type drift compounds fast.

## Case Study #3: tRPC (Type-Safe APIs)

**Repo:** github.com/trpc/trpc | **Stars:** ~35k

**SSOT Auditor results:**
- **388 findings** in 233ms
- 204 duplicate type definitions, 184 orphaned types
- Key finding: `Context` type defined in **42 files** (!!)
- `Input` in 19 files, `Post` in 17 files, `User` in 9 files
- Examples directories are the worst offenders — each example re-defines core types instead of importing

**Takeaway:** Library repos with examples/ directories amplify duplication massively. A shared `@trpc/example-utils` package would eliminate ~60% of findings.

## What I Learned

### 1. Every project has SSOT violations
Even the best teams accumulate duplicate definitions. Without automated enforcement, it's inevitable.

### 2. The cost of duplication is hidden
Each duplicate type is a potential bug: change one, forget the other. In a monorepo with 40+ duplicate types, that's 40+ potential inconsistencies.

### 3. Pre-commit hooks are the answer
We added SSOT governance checks to our pre-commit hooks. On every commit, the system:
- Scans for new duplicate types (blocking)
- Checks for orphan docs outside `docs/` (warning)
- Detects `select('*')` in API routes (warning)
- Flags config drift between `.guarani/` and `AGENTS.md` (warning)

### 4. Zero-dependency agents are powerful
No framework overhead means:
- Runs anywhere (CI/CD, local, cloud)
- No version conflicts
- Easy to fork and customize
- Fast startup (~100ms)

## How to Try It

```bash
# Clone the repo
git clone https://github.com/enioxt/egos-lab.git
cd egos-lab
bun install

# Run on YOUR project
cd /path/to/your-project
bun /path/to/egos-lab/agents/cli.ts run ssot_auditor --dry

# See results
cat docs/agentic/reports/ssot-audit.md
```

## What's Next

- **Eval suites** for every agent (tracking accuracy over time)
- **Rule Marketplace** — share `.guarani/` configs between projects
- **`npx create-egos-kit`** — one command to add agents to any project
- **More case studies** — accepting audit requests!

## Call to Action

- ⭐ Star the repo: [github.com/enioxt/egos-lab](https://github.com/enioxt/egos-lab)
- 🐛 Good first issues: [#6](https://github.com/enioxt/egos-lab/issues/6), [#7](https://github.com/enioxt/egos-lab/issues/7), [#8](https://github.com/enioxt/egos-lab/issues/8)
- 📩 Want a free audit? Open an issue or DM me

---

**Tags:** #typescript #opensource #ai #agents #devtools #codequality
