---
description: Prepare and execute partnership outreach for EGOS ecosystem growth
---

# /partnership-outreach — Partnership Preparation Workflow

Prepare materials and outreach for potential EGOS partners.

## Target Partners (by priority)

### Tier 1 — IDE/Developer Tools (highest leverage)
- **Windsurf/Codeium** — `.windsurfrules` showcase, featured community project
- **Cursor** — `.cursorrules` equivalent showcase
- **Vercel** — Deploy partner, community template

### Tier 2 — Infrastructure
- **Supabase** — Community tooling example, agent that audits RLS policies
- **GitHub** — Accelerator program, featured in GitHub blog

### Tier 3 — Community/Education
- **Dev agencies** — Free diagnostic kit for client pitches
- **Bootcamps** (Rocketseat, Trybe, Digital Innovation One) — Structured onboarding
- **Open source projects** — Free audits as case studies

## Outreach Materials (prepare before contact)

### 1. One-pager (PDF/Notion)
- What EGOS is (3 sentences)
- The 3 differentiators (Rules-as-DNA, Zero-dep, Replication)
- Demo: SSOT Auditor output screenshot
- What we want from the partner
- What they get

### 2. Demo video (2 min max)
- Terminal: `bun agent:list` (show 8 agents)
- Terminal: `bun agent:ssot --dry` (show findings in 50ms)
- Terminal: `bun agent:lint` (show validation)
- Narration: "Zero setup. Zero cost. Instant value."

### 3. GitHub repo polish
- README with clear "Quick Start" (3 commands)
- Good-first-issues labeled
- CONTRIBUTING.md with AI onboarding
- Case studies in docs/case-studies/

## Outreach Steps

1. **Polish repo** (README, issues, case studies) — do this BEFORE any contact
2. **Create one-pager** using Stitch or Canva
3. **Record demo** (terminal + narration, OBS Studio)
4. **Identify contact person** (DevRel, community manager, or CTO)
5. **Send cold outreach** via Twitter DM or email:

```
Subject: Free code diagnostic agents for [Company] community

Hi [Name],

I built EGOS — a set of zero-dependency TypeScript agents that find 
SSOT violations, security issues, and team health problems in any 
codebase in under 3 minutes, at zero cost.

I ran it on [X popular repos] and found [Y findings]. Case studies:
[link]

I think [Company]'s community would benefit from [specific value].
Would love to chat about a potential collaboration.

Best,
Enio
```

6. **Follow up** in 5 days if no response
7. **Track** in TASKS.md under COMMUNITY section
