# GUARANI ARCHITECTURE OVERVIEW
**Updated:** 2025-11-29

## Project: EGOSv3
Production workspace with HANDOFF+ 360° System.

## 🕵️ CURRENT FOCUS: INTELINK

### Intelink - Police Intelligence System
- **Dashboard:** `/intelink/*` pages
- **Bot:** Telegram integration (Grupo DHPP: -4814357401)
- **Analysis:** PageRank, Betweenness, Community Detection
- **OCR:** Gemini 2.0 Flash Vision

### Key Intelink Files
| Path | Purpose |
|------|---------|
| `lib/intelink/intelink-service.ts` | Core bot logic |
| `lib/intelink/graph-analysis-engine.ts` | SOTA analysis |
| `lib/intelink/constants.ts` | SSOT PT-BR translations |
| `app/intelink/*` | Dashboard pages |
| `components/intelink/*` | UI components |

### Database (Supabase)
- **Project ID:** `lhscgsqhiooyatkebose`
- **Project Name:** supabase-egos
- **Key Tables:** `intelink_*` (investigations, entities, relationships, etc.)

---

## 1. Frontend (`frontend/`)
-   **Framework:** Next.js 15 (App Router)
-   **Styling:** TailwindCSS, Shadcn/UI, Radix UI
-   **State Management:** React Context, Hooks
-   **Testing:** Playwright (E2E), Vitest (Unit)
-   **Living UI Engine:**
    -   `ThemeContext`: Dynamic theming based on User Archetype (Initiate, Warrior, Architect, Healer).
    -   `WordsOfPowerBadge`: Gamified visual elements.
-   **Key Directories:**
    -   `app/`: Routes and pages (Spiral, Dashboard, Auth, Admin)
    -   `components/`: Reusable UI components
    -   `lib/`: Utilities, API clients, constants
    -   `hooks/`: Custom React hooks
    -   `providers/`: Context providers (Auth, Theme, ModelSelector)

## 2. Backend & Services

> **⚠️ IMPORTANTE:** Não existe backend Python separado. Toda lógica está no Next.js.

### API Routes (Next.js)
-   **Location:** `apps/intelink/app/api/`
-   **Core APIs:**
    -   `/api/investigations/*` - CRUD de investigações
    -   `/api/entities/*` - Gestão de entidades
    -   `/api/relationships/*` - Vínculos e grafos
    -   `/api/rho/*` - Cálculo e snapshots do Rho Protocol
    -   `/api/audit/*` - Hash chain e compliance
    -   `/api/compliance/*` - Justificativas obrigatórias

### MCP Servers (`.windsurf/servers/`)
Custom TypeScript servers extending agent capabilities:
-   **Core Tools:**
    -   `egos-core`: Task management, memory, telemetry, knowledge base
    -   `composio-helper`: External integrations
-   **External:**
    -   `supabase-mcp-server`: Database operations
    -   `sequential-thinking`: Reasoning chains
    -   `memory`: Persistent context

## 3. Database & Infrastructure
-   **Primary DB:** Supabase (PostgreSQL)
-   **Auth:** Supabase Auth + Privy
-   **Vector Store:** Supabase pgvector
-   **Deployment Pipeline:**
    -   **Frontend:** Vercel (Production)
    -   **Intelligence:** Railway (MCP Server)
    -   **Database:** Supabase (Migrations)

## 4. Agentic Layer (GUARANI)
-   **Context Core:** `.guarani/` (Identity, Preferences, History)
-   **Triggers:** `.windsurfrules`, `AI_README.md`, Git Hooks
-   **Philosophy:** "MCP First", Sequential Thinking, Commit Discipline.

## 5. Workflows (`.agent/workflows/`)
-   `deploy_system.md`: Full deployment protocol.
-   `system_diagnostic.md`: Health checks.
-   `verification_protocol.md`: Testing standards.
