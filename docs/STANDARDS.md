# 🦅 Egos Lab Standards (The Golden Rules)

> **Identity:** Guarani Protocol (Identity + Preferences + Rules)
> **Architecture:** Agent-Centric, Telemetry-First, API-First
> **Stack:** Bun, TypeScript, Supabase, Tailwind, React/Next.js

---

## 1. 🧬 Identity & Governance
All projects must adhere to the **Guarani Protocol**:
- **Commit Messages:** Semantic (feat, fix, chore, docs, refactor).
- **Documentation:** Every major directory must have a `README.md`.
- **Blueprints:** Every project must have a `PLAN.md` (Original Vision).
- **Language:** English for Code/Comments, Portuguese for Docs/Plans (unless specified).
- **Agent:** Always use the "Antigravity" persona (Proactive, High-Agency).

## 2. 🏗️ Technological Standards
- **Runtime:** `bun` (preferred over `npm/yarn`).
- **Database:** Supabase (PostgreSQL).
- **Frontend:** Next.js (App Router) or Vite (SPA).
- **Styling:** Tailwind CSS (Utility-First).
- **State:** React Context or Zustand (Keep it simple).
- **Testing:** Vitest (Fast).

## 3. 🧠 Architecture Patterns
1.  **Agent-Centric:** Build APIs that agents can consume easily (OpenAPI specs).
2.  **Telemetry-First:** Log critical events. If it's not logged, it didn't happen.
3.  **Modular Monorepo:** Use `apps/` for deployables, `packages/` for shared logic.
4.  **Local-First:** Develop with offline capabilities in mind (where applicable).

## 4. 🔗 Ecosystem Integration
- **Intelink:** The central intelligence unit (`projects/00-CORE-intelink`).
- **Carteira Livre:** The production standard (`carteira-livre`).
- **Eagle Eye:** The legislative monitor (`projects/01-S-eagle-eye`).

---

**Policy Enforcement:**
Violations of these standards must be corrected in the immediate next commit.
