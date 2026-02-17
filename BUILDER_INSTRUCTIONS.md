
# 🏗️ GEMINI BUILDER INSTRUCTIONS - PHASE 2

**Context:**
We are upgrading `egos-web` to a "Mission Control" interface with a 3D Listening Spiral and a RAG-powered Chatbot ("EGOS").
- **Repo:** `apps/egos-web`
- **Tech:** React, Vite, Supabase, Three.js (react-force-graph), Zustand, Framer Motion.

## 🎯 Objective
Implement the "Mission Control" Split View and the RAG Pipeline as defined in `implementation_plan.md`.

## 🛠️ Environment Status
- **Dependencies:** Installed (`@supabase/supabase-js`, `zustand`, `framer-motion`, `lucide-react`).
- **Env Vars:** `.env` Configured & Verified (`test-connections.ts` passed).
- **Database:** `commits` table created in Supabase.

## 📋 Execution Steps (Follow Order)

### 1. State Management (Zustand)
- Create `src/store/useAppStore.ts`.
- Store `rhoScore`, `commits[]`, `isChatOpen`, `userQuery`.

### 2. RAG Ingestion (Script)
- Create `scripts/ingest-commits.ts`.
- Use `Octokit` to fetch commits.
- Use an embedding provider (OpenAI `text-embedding-3-small` or local).
- Upsert to `commits` table in Supabase.

### 3. Usage Experience (Mission Control)
- Refactor `App.tsx` into a Split View.
- **Left:** `ListeningSpiral.tsx` (Update to strictly visualize real `commits` from store).
- **Right:** `Dashboard.tsx` (Contains Chat & RHO Gauge).
- **Transitions:** Use `framer-motion` for smooth entry.

### 4. Chat Intelligence
- Update `CommunityChat.tsx` to query Supabase Vector (RPC call `match_commits`).
- Inject retrieved context into the System Prompt.

## 🔗 References
- **Plan:** `implementation_plan.md` (Detailed Architecture).
- **Tasks:** `task.md` (Checklist).
