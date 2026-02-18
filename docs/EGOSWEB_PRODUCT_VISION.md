# EgosWeb Product Vision — GitHub-First Builder Hub

> **Source:** ChatGPT conversation (2026-02-17)
> **Status:** Planning
> **Core Idea:** Transform EgosWeb from a static dashboard into a community platform where builders share projects, collaborate, and learn.

---

## 3 Pilares

### Pilar A: Projetos (GitHub-first)
- GitHub repo as source of truth
- Each project has: runbook, env template, keys & costs, prerequisites
- Import wizard: paste GitHub URL → auto-detect stack → generate runbook scaffold
- Status: functioning, in-progress, stuck, seeking help
- Star, comment, follow author

### Pilar B: Ajuda & Colaboração
- **Help Requests** (bug, setup, keys, billing, performance, architecture)
- **Feature Requests** (ideas, roadmap comunitário)
- Structured format: context, what I tried, logs, how to reproduce, acceptance criteria
- "Accepted solution" marking

### Pilar C: LegalLab (Onboarding)
- Executable checklists, not lectures
- 10 initial microtasks: GitHub basics → "how to publish project on EgosWeb"
- Two tracks: "I know GitHub" (fast) vs "I'm new" (guided wizard)
- Progress tracking per user

---

## Auth Strategy
- **Browse:** No login needed
- **Interact (comment, follow, help request):** GitHub or Google login
- **Publish project:** GitHub required (repo link mandatory)
- OAuth via Supabase (already works for Google, add GitHub)

## Data Model (Supabase)

### Core Tables
| Table | Purpose |
|-------|---------|
| `profiles` | User profiles (handle, bio, links) |
| `projects` | GitHub-linked projects |
| `project_runbook` | How to run, env, keys, costs |
| `help_requests` | Structured help/bug/feature requests |
| `help_comments` | Comments on help requests |
| `project_comments` | Comments on projects |
| `stars` | User ↔ Project stars |
| `follows` | User ↔ User follows |
| `legal_lab_tasks` | LegalLab microtask content |
| `legal_lab_progress` | User progress on tasks |

### Enums
- `project_visibility`: public, unlisted, private
- `help_request_status`: open, needs_info, in_progress, solved, closed
- `help_request_type`: bug, setup, keys, billing, performance, architecture, feature
- `legal_lab_task_type`: checklist, prompt, playbook, snippet

## Pages (MVP)
| Route | Purpose |
|-------|---------|
| `/projects` | Feed with filters (tags, status, stars, recent) |
| `/p/[slug]` | Project detail (README + runbook + keys) |
| `/p/[slug]/help` | Help requests for project |
| `/p/[slug]/help/new` | New help request form |
| `/help/[id]` | Help request detail + comments |
| `/legal` | LegalLab home |
| `/legal/[slug]` | Microtask detail |
| `/new-project` | Import wizard |
| `/u/[handle]` | User profile |
| `/settings` | Account, connections |

## Differentiators
1. **"Keys & Costs" as first-class** — Every project shows what API keys you need, where to get them, estimated cost
2. **Structured help** — Not a forum. Context, logs, reproduction steps, acceptance criteria
3. **Import Wizard** — Paste GitHub URL → auto-scaffold runbook
4. **LegalLab** — Onboards beginners from zero to "someone ran my project"
5. **Reputation by utility** — Solutions accepted, projects people could run, help given

## GitHub Follow (Advanced, Later)
- Opt-in only, separate OAuth with `user:follow` scope
- Edge Function proxy for API calls
- Modal explaining permissions before consent
- NOT in MVP

## MVP Scope (What to build first)
1. GitHub + Google login via Supabase
2. Publish project via GitHub URL
3. Project page: README + runbook + keys & costs
4. Help requests with structured format
5. Comments + accepted solution
6. LegalLab with 10 initial microtasks
7. Basic profile page

## What NOT to build yet
- GitHub auto-follow
- Analytics (views, copies)
- Full-text search
- Collections/playlists
- Moderation system
- Marketplace/monetization
