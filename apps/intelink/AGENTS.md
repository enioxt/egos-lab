# AGENTS.md — EGOSv3 Universal Agent Configuration

> **VERSION:** 1.0.0 | **UPDATED:** 2025-12-24
> Open Standard for AI Coding Agents (Cursor, Windsurf, Claude Code, Copilot, Roo Code, Devin)

---

## 🎯 Project Overview

**Project:** EGOSv3 (Ethical Guardian Operating System v3)
**Sacred Code:** 000.111.369.963.1618
**Primary App:** Intelink (Police Intelligence System for DHPP)
**Secondary Apps:** Carteira Livre (Driving School Platform), Dashboard Ideas (Digital Mirror)

## 🏗️ Architecture

```
EGOSv3/
├── apps/
│   ├── intelink/          # Police Intelligence (Next.js 15, port 3001)
│   ├── carteira-livre/    # Driving School (Next.js, port 3004)
│   └── dashboard_ideas/   # Personal Knowledge (Next.js, port 3000)
├── .guarani/              # Agent context (identity, preferences, skills)
├── .windsurf/             # IDE-specific (workflows, servers, rules)
└── TASKS.md               # Single Source of Truth for tasks
```

## 🛠️ Tech Stack

- **Frontend:** Next.js 15 (App Router), React 18, TailwindCSS, Shadcn/UI
- **Backend:** Next.js API Routes (no separate backend)
- **Database:** Supabase PostgreSQL (Project: lhscgsqhiooyatkebose)
- **Auth:** Supabase Auth
- **Deployment:** Vercel (auto-deploy on push to main)

## 📋 Setup & Build Commands

```bash
# Development
cd apps/intelink && npm run dev    # Port 3001

# Testing
npm test                           # Vitest unit tests
npx playwright test                # E2E tests

# Build
npm run build                      # Production build

# Deploy
git push origin main               # Auto-deploy via Vercel
```

## ✅ Coding Standards

### Must Do
- Use TypeScript strict mode
- Follow conventional commits: `feat:`, `fix:`, `chore:`, `docs:`
- Keep components < 500 lines, pages < 400 lines, APIs < 300 lines
- Use existing components from `components/ui/` before creating new ones
- Run Sequential Thinking (mcp18) before P0/P1 tasks

### Don't Do
- Never hardcode API keys or secrets
- Never mark tasks as complete without human validation
- Never create new .md files for simple tasks (use TASKS.md or Memory MCP)
- Never deploy without local testing first
- Never reimplment features marked as "Já Concluído"

## 🔧 MCP Tools (Windsurf)

| Prefix | Tool | Use Case |
|--------|------|----------|
| `mcp18_` | Sequential Thinking | Planning, complex decisions |
| `mcp13_` | Memory | Persist context between sessions |
| `mcp7_` | Filesystem | Read/write files |
| `mcp4_` | Egos-Core | Tasks, patterns, knowledge, diagnostics |
| `mcp5_` | Exa | Web/code search (preferred) |
| `mcp20_` | Supabase | Database operations |

## 📁 Key Files Reference

| Purpose | File |
|---------|------|
| Agent Identity | `.guarani/IDENTITY.md` |
| Coding Rules | `.guarani/PREFERENCES.md` |
| System Architecture | `.guarani/ARCHITECTURE.md` |
| MCP Guide | `.guarani/MCP_ORCHESTRATION_GUIDE.md` |
| Design Standards | `.guarani/DESIGN_STANDARDS.md` |
| Current Tasks | `TASKS.md` (root) |
| Session Start | `.windsurf/workflows/start.md` |
| Session End | `.windsurf/workflows/end.md` |

## 🚀 Session Protocol

### Start Session
```
/start
```
- Reads ACTIVATION_PAYLOAD.md
- Runs health check
- Loads handoff context
- Validates MCP tools

### End Session
```
/end
```
- Generates handoff report
- Updates Memory MCP
- Commits changes

## ⚠️ Critical Rules

1. **MCP First:** Never write manual logic if an MCP tool exists
2. **SSOT:** Tasks only in `TASKS.md` (root)
3. **Human Validation:** Never claim 100% without user testing
4. **Commit Discipline:** Conventional commits every 30-60 min
5. **Size Limits:** Component < 500, Page < 400, API < 300 lines

---

*"The best code is no code. Use MCPs. One source of truth."*
