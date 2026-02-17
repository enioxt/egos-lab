# EGOS Collaborative Network — Open Source Plan v2.0

> **Updated:** 2026-02-17
> **Vision:** A collaborative social network for builders — where ideas become code, beginners become contributors, and rules evolve through collective intelligence.
> **License:** AGPL-3.0 (Strong Copyleft) — "If you build on our engine, contribute back."

---

## 1. Ecosystem Map

### 1.1 Monorepo Structure (`egos-lab`)

```
egos-lab/
├── apps/
│   ├── egos-web/           ← Mission Control portal (React+Vite, egos.ia.br)
│   ├── eagle-eye/          ← OSINT gazette monitor + AI analysis
│   ├── marketplace-core/   ← Prompt/rule marketplace (Next.js, planned)
│   └── radio-philein/      ← Community radio (paused, migrated from CL)
│
├── packages/
│   ├── shared/             ← AI client (Gemini/OpenRouter), rate limiter, types
│   └── config/             ← Shared .guarani rules
│
├── projects/               ← 14 project blueprints (ideas → implementation)
│   ├── 00-CORE-intelink/   ← Central nervous system (Telemetry, Orchestration, Rho)
│   ├── 01-S-eagle-eye/     ← Gazette + public procurement monitor
│   ├── 02-S-compras-publicas/ ← Public procurement OSINT
│   ├── 03-S-cloud-legal/   ← Legal document cloud
│   ├── 04-A-mercado-mind/  ← Market intelligence
│   ├── 05-A-revisor/       ← AI journalism reviewer
│   ├── 06-A-saas-builder/  ← SaaS generator from blueprints
│   ├── 07-B-agent-centric/ ← Agent-first architecture patterns
│   ├── 08-B-fiscal-anomaly/← Fiscal anomaly detection
│   ├── 09-B-security-audit/← Automated security auditing
│   ├── 10-B-chacreamento/  ← Rural property management
│   ├── 11-C-police-career/ ← Police career tools
│   ├── 12-C-inventory/     ← Inventory management
│   ├── 13-C-qe-tracking/   ← Emotional quotient tracking
│   └── 26-C-cortex-mobile/ ← Android accessibility service
│
├── scripts/                ← Automation (scan_ideas, security, review, disseminate)
├── docs/                   ← Knowledge base, plans, stitch designs, strategies
│   ├── plans/              ← 40+ ingested idea files (business, police, archive)
│   ├── stitch/             ← 12+ Google Stitch UI design prompts
│   ├── partner_packages/   ← Case studies (carteira-livre)
│   └── strategy/           ← Monetization, valuation, business strategy
│
├── .guarani/               ← Agent identity + coding preferences
├── .github/workflows/      ← CI (eagle-eye scan, scorecard)
└── .husky/                 ← Pre-commit hooks (security scan)
```

### 1.2 Live Infrastructure

| Asset | URL | Stack | Status |
|-------|-----|-------|--------|
| **Mission Control** | egos.ia.br | React+Vite on Vercel | ✅ Live |
| **API Proxy** | egos.ia.br/api/* | Vercel Serverless | ✅ Live |
| **Database** | Supabase (lhscgsqhiooyatkebose) | PostgreSQL | ✅ Active |
| **Sibling: Carteira Livre** | carteiralivre.com | Next.js 15, production SaaS | ✅ Live |

---

## 2. Competitive Landscape — What Already Exists

### 2.1 Contributor Payments & Attribution

| Platform | Model | Key Feature | Limitation for EGOS |
|----------|-------|-------------|---------------------|
| **Merit Systems** | Stablecoin payouts to GitHub users | Terminal: impact viz, payout wizard, PR insights | Payment-focused; no idea marketplace or onboarding |
| **OnlyDust** | Grant allocation (AI-powered) | $10M+ distributed to 8K+ contributors, 450+ projects | Shut down AI rewards due to gaming; pivoted to reputation |
| **tea.xyz** | Proof of Contribution (PageRank) | teaRank scoring for packages, token rewards | Package-manager centric; not project/idea level |
| **Algora** | Issue bounties on GitHub | 2,898 bounties, $358K total, 68 countries | Pure bounty; no community building or onboarding |
| **IssueHunt** | Funded issue bounties | 12K+ projects | Stale; limited activity |

### 2.2 Contribution Reputation & Tracking

| Platform | Model | Key Feature | Limitation for EGOS |
|----------|-------|-------------|---------------------|
| **SourceCred** | Contribution Graph + Cred score | Non-transferable reputation, retroactive scoring, Grain tokens | Project ended 2022; algorithm is open but unmaintained |
| **GitPOAP** | NFT badges for contributions | Proof of contribution as collectible | Web3-only; no substance beyond badge |
| **GitHub Achievements** | Native badges | Arctic Vault, Pull Shark, etc. | Shallow; no customization |

### 2.3 Beginner Onboarding

| Platform | Model | Key Feature | Limitation for EGOS |
|----------|-------|-------------|---------------------|
| **CodeTriage** | Daily issue inbox | 99K+ developers, 10K+ repos | Email-only; no IDE integration |
| **Up For Grabs** | Curated beginner tasks | Label-based discovery | Static list; no mentoring |
| **Good First Issue** | GitHub label standard | Built into GitHub | No guidance beyond the label |

### 2.4 Decentralized / Alternative Forges

| Platform | Model | Key Feature |
|----------|-------|-------------|
| **Radicle** | P2P sovereign forge on Git | No central server; full data ownership |
| **GitMesh** | AI-guided contributions | Steers contributors toward mergeable PRs |

### 2.5 Key Lessons Extracted

1. **OnlyDust's pivot**: Pure monetary incentives get gamed. Reputation + quality signals matter more than bounties.
2. **SourceCred's algorithm**: Contribution Graph with PageRank-style flow is the gold standard for fair attribution. Open source, reusable.
3. **Merit's simplicity**: Drop-in GitHub integration + zero-friction payments wins adoption.
4. **tea.xyz's teaRank**: Automated impact scoring based on dependency graph is powerful for packages.
5. **CodeTriage's habit loop**: Small daily doses build contribution habits better than big bounties.
6. **GitMesh's AI guidance**: AI can actively steer contributors to high-impact areas.

---

## 3. EGOS Collaborative Network — The Vision

**What we're building:** A collaborative social network for developers that sits on top of GitHub, with gamification, collective governance, idea incubation, rule sharing, and full onboarding for beginners.

**What makes it different from everything above:**
- **Free and collaborative** (not bounty/payment driven)
- **Idea-first** (not just code — ideas flow through structured documentation pipelines)
- **Rule sharing** (.guarani, .windsurfrules, pre-commits, lint configs are first-class citizens)
- **Better than PRs** (structured voting, visible reviews, no lost contributions)
- **Full onboarding** (from "what is an IDE?" to "merged my first PR")
- **AI-native** (agents help write docs, review code, guide beginners)

### 3.1 Core Modules

#### A. Idea Marketplace (`/ideas`)
- Anyone submits an idea (text, voice, chat export)
- System auto-generates structured documentation (README, PRD, tech spec) using our existing `scripts/scan_ideas.ts` + AI pipeline
- Ideas get **community voting** (not just thumbs up — structured evaluation: feasibility, impact, originality)
- Top ideas become `projects/` entries with auto-scaffolded directories
- Contributors can **claim** sections of an idea to work on

#### B. Rule Forge (`/rules`)
- Share and discover `.guarani/`, `.windsurfrules`, pre-commit configs, lint rules, CI workflows
- Each rule set is versioned and **forkable**
- Community ratings + usage analytics ("1,200 projects use this .windsurfrules")
- **Composable**: mix-and-match rules from different authors into custom configs
- AI reviews rule sets for conflicts and suggests improvements

#### C. Contributor Journey (`/onboarding`)
- **Level 0 — Explorer**: Browse ideas, vote, comment. No code required.
- **Level 1 — Apprentice**: Fork repo, set up IDE (guided walkthrough with screenshots/video). First task: fix a typo or improve docs.
- **Level 2 — Builder**: Claim a "Good First Issue". Pair with an AI mentor that explains the codebase.
- **Level 3 — Architect**: Propose new ideas, review others' PRs, mentor beginners.
- **Level 4 — Guardian**: Vote on governance, approve rule changes, moderate community.
- Each level has **clear requirements** and **visible badges** on profile.

#### D. Structured Review System (`/reviews`)
- **Problem with GitHub PRs**: Reviews get lost, contributors wait weeks, no structured feedback.
- **Our solution**: 
  - Every PR gets a **structured review template** (correctness, style, tests, docs, security)
  - Reviews are **visible and scored** (reviewers build reputation too)
  - **48-hour SLA**: If no human reviews, AI provides initial review
  - **Consensus voting** for controversial changes (not just maintainer approval)
  - **Attribution**: Every review contribution earns Cred

#### E. Collaboration Spaces (`/spaces`)
- Topic-based rooms (not just chat — structured around a project/idea)
- Real-time collaboration via GitHub Codespaces / Gitpod integration
- Shared terminals, pair programming sessions
- **"Office Hours"**: Senior contributors available at scheduled times
- Async + sync hybrid (discussions persist, calls are recorded)

#### F. Gamification Engine
- **Cred Score** (inspired by SourceCred): Contribution Graph with weighted edges
  - Code commits, PR reviews, idea submissions, mentoring, rule contributions ALL earn Cred
  - Cred is non-transferable (reputation, not currency)
  - Cred is retroactive (a dormant idea that becomes popular earns Cred for the originator)
- **Badges**: Milestone-based (First PR, First Idea, First Review, 100 Cred, etc.)
- **Leaderboards**: Weekly/monthly/all-time, by project, by skill area
- **Streaks**: Daily contribution streaks (CodeTriage-style habit building)
- **Impact Score**: How many people benefited from your contributions (downstream usage)

---

## 4. Technical Architecture

### 4.1 Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Frontend** | React + Vite (egos-web, already live) | Fast, existing codebase |
| **API** | Vercel Serverless (`/api/*`) | Zero-cost, already deployed |
| **Database** | Supabase PostgreSQL | RLS, Realtime, Auth — already active |
| **Auth** | Supabase Auth (GitHub OAuth) | Natural fit for developer platform |
| **Realtime** | Supabase Realtime | Activity feeds, collaboration signals |
| **AI** | OpenRouter (Gemini) via `/api/chat` | RAG chat, code review, idea processing |
| **GitHub Integration** | GitHub App + Webhooks | PR events, commit tracking, issue sync |
| **Search** | Supabase Full-Text + pg_trgm | Ideas, rules, contributors |

### 4.2 Data Model (new tables)

```sql
-- Ideas
ideas (id, title, description, author_id, status, category, votes_up, votes_down, created_at)
idea_votes (id, idea_id, user_id, vote, evaluation_json, created_at)
idea_claims (id, idea_id, user_id, section, status, created_at)

-- Rules
rule_sets (id, name, type, content, author_id, version, fork_of, downloads, rating, created_at)
rule_reviews (id, rule_set_id, user_id, rating, comment, created_at)

-- Contributors
contributor_profiles (id, github_username, level, cred_score, badges, streak_days, joined_at)
contributions (id, contributor_id, type, target_id, cred_earned, created_at)

-- Reviews
structured_reviews (id, pr_url, reviewer_id, correctness, style, tests, docs, security, comment, created_at)
```

### 4.3 GitHub Integration Flow

```
GitHub Webhook (push/PR/issue)
  → Vercel Serverless /api/webhook
    → Supabase: update contributions table
    → Supabase: recalculate Cred scores
    → Supabase Realtime: push to activity feed
    → AI: auto-review if 48h SLA breached
```

---

## 5. Governance — Better Than PRs

### 5.1 Voting System
- **Idea Votes**: Structured evaluation (not just 👍). Score: feasibility (1-5), impact (1-5), originality (1-5). Weighted by voter's Cred.
- **Rule Changes**: Proposal → 7-day discussion → Consensus vote (>66% approval from Level 3+ contributors)
- **Code Changes**: Standard PR + structured review. Controversial changes escalate to community vote.
- **Governance Changes**: Require >80% approval from Level 4 Guardians.

### 5.2 Anti-Gaming (Lessons from OnlyDust)
- No direct monetary rewards (removes incentive to game)
- Cred is weighted by **downstream impact**, not just activity count
- AI monitors for low-effort spam contributions
- Peer review of reviews (reviewers are reviewed too)
- Cooldown periods for rapid-fire contributions

---

## 6. Onboarding Playbook — From Zero to First PR

### Step 1: Sign up (GitHub OAuth on egos.ia.br)
### Step 2: Profile quiz — skill level, interests, available time
### Step 3: AI recommends first task based on profile
### Step 4: Guided IDE setup
- **Option A**: GitHub Codespaces (zero local setup, 1-click)
- **Option B**: Local setup with step-by-step guide (VS Code/Cursor + Node.js + Git)
- **Option C**: Windsurf IDE with .guarani pre-loaded
### Step 5: First contribution (guided by AI mentor)
- Fork → Branch → Edit → PR → Review → Merge
- Each step has inline help and a progress bar
### Step 6: Badge earned → Level up → Unlock more features

---

## 7. Roadmap

### Phase 0 — Foundation (NOW — current sprint)
- [x] Mission Control live (egos.ia.br)
- [x] Security hardening (secrets moved to serverless proxy)
- [x] Activity stream + chat fixes
- [ ] Set OPENROUTER_API_KEY + GITHUB_TOKEN in Vercel dashboard
- [ ] GitHub OAuth on egos-web (Supabase Auth)

### Phase 1 — Contributor Portal (Q1 2026)
- [ ] Contributor profiles (GitHub-linked)
- [ ] Idea submission + voting system
- [ ] Onboarding flow (Level 0-1)
- [ ] Activity feed (Supabase Realtime)
- [ ] Rule Forge v1 (browse + share .guarani configs)

### Phase 2 — Social Layer (Q2 2026)
- [ ] Gamification engine (Cred scores, badges, streaks)
- [ ] Structured review system
- [ ] Collaboration spaces
- [ ] AI mentor for beginners
- [ ] Leaderboards

### Phase 3 — Network Effects (Q3 2026)
- [ ] Multi-repo support (any GitHub repo can integrate)
- [ ] GitHub App for webhook-driven contribution tracking
- [ ] Rule Forge marketplace (composable configs)
- [ ] Office Hours scheduling
- [ ] Mobile experience (PWA)

### Phase 4 — Ecosystem (Q4 2026)
- [ ] Optional Merit Systems integration (for projects that want payments)
- [ ] Cross-project collaboration (contributor discovery)
- [ ] API for third-party integrations
- [ ] Decentralized governance voting

---

## 8. Security Pre-Requisites

Before any public launch:
1. **Gitleaks**: Pre-commit secret scanning (active via .husky)
2. **TruffleHog**: Deep git history audit
3. **BFG Repo-Cleaner**: If history contains old secrets
4. **GitHub Advanced Security**: Enable for public repo (free)
5. **Dependabot**: Auto-update dependencies (free)
6. **Secrets**: ALL in Vercel dashboard (server-side only), NEVER in client bundle

---

## 9. Inspiration Credits

| Source | What We Took | Our Twist |
|--------|-------------|-----------|
| Merit Systems | Impact visualization, GitHub integration | Free + non-monetary; focus on Cred not cash |
| OnlyDust | AI-powered contribution evaluation | Anti-gaming from their lessons; reputation over rewards |
| SourceCred | Contribution Graph, Cred algorithm | Simplified scoring; applied to ideas and rules, not just code |
| tea.xyz | Proof of Contribution, dependency graph | Applied to project ecosystem, not package managers |
| CodeTriage | Daily habit loop for contributions | Integrated into platform, not email-only |
| GitMesh | AI-guided contributions | AI mentor + structured onboarding path |
| Radicle | Sovereign, decentralized forge | Hybrid: GitHub integration + our own governance layer |
| Up For Grabs | Curated beginner tasks | Auto-curated by AI based on contributor profile |

---

*"The best open source isn't just code. It's ideas, rules, reviews, and the humans who connect them."*
