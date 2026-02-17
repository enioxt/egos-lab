---
description: Create and publish content for EGOS public launch across multiple channels
---

# /launch-content — Content Creation & Publishing Workflow

## Content Pieces (create in order)

### 1. GitHub Issues (good-first-issue)

Create 5 starter issues on github.com/enioxt/egos-lab:

- **Issue 1:** "Improve SSOT Auditor: reduce false positives on comment regex"
  - Labels: `good-first-issue`, `agent`, `bug`
  - Difficulty: Easy

- **Issue 2:** "Add new agent: Hardcode Detector"
  - Labels: `good-first-issue`, `agent`, `feature`
  - Difficulty: Medium

- **Issue 3:** "Write eval suite for Security Scanner"
  - Labels: `good-first-issue`, `evals`, `testing`
  - Difficulty: Easy

- **Issue 4:** "Improve how-to.md with step-by-step screenshots"
  - Labels: `good-first-issue`, `docs`
  - Difficulty: Easy

- **Issue 5:** "Create `.guarani` template for Python projects"
  - Labels: `good-first-issue`, `community`, `feature`
  - Difficulty: Medium

### 2. Blog Article (Dev.to / Hashnode)

Title: "I ran AI code agents on 5 popular open-source repos. Here's what they found."

Structure:
1. Hook: "What if you could audit any codebase in 3 minutes for free?"
2. What EGOS agents are (30 seconds explanation)
3. Case Study 1: [Repo] — X findings in Yms
4. Case Study 2: [Repo] — X findings in Yms
5. Case Study 3: [Repo] — X findings in Yms
6. Pattern: What ALL repos had in common
7. CTA: "Try it on your repo: `git clone ... && bun agent:ssot`"

### 3. Twitter/X Thread

```
Thread: "I built zero-dependency code agents that find SSOT violations in 50ms. Here's what happened when I ran them on 5 popular repos 🧵"

Tweet 1: Hook + screenshot of SSOT Auditor output
Tweet 2: "What is SSOT? Single Source of Truth. When the same type is defined in 3 files, bugs happen."
Tweet 3: Case study 1 result (screenshot)
Tweet 4: Case study 2 result (screenshot)
Tweet 5: "The agents are 50KB total. Zero dependencies. Pure TypeScript."
Tweet 6: "The secret sauce isn't the agents. It's the RULES." + .guarani explanation
Tweet 7: CTA: "Try it: github.com/enioxt/egos-lab"
```

### 4. Hacker News

Title: "Show HN: EGOS – Zero-dependency code agents that find SSOT violations in 50ms"

Post text:
```
I built a set of focused TypeScript agents that scan codebases for structural problems:

- SSOT Auditor: finds duplicated types, orphaned exports (50ms, $0)
- Security Scanner: detects exposed secrets via entropy analysis (30s, $0)
- Rho Calculator: measures team health from git history (10s, $0)

No LangChain. No CrewAI. No dependencies. 50KB of agent code total.

The core idea: rules govern agents, agents enforce rules, community evolves rules.

Try it: git clone https://github.com/enioxt/egos-lab && bun agent:ssot

Feedback welcome.
```

### 5. Product Hunt

Tagline: "EGOS Agent Kit — Portable code diagnostics in 3 minutes"
Description: "Zero-dependency TypeScript agents that find SSOT violations, security issues, and team health problems. Rules-as-DNA architecture. Open source."

## Publishing Schedule

| Day | Channel | Content |
|-----|---------|---------|
| Day 1 | GitHub | Create 5 good-first-issues |
| Day 2 | Dev.to | Publish article |
| Day 3 | Twitter | Thread (link to article) |
| Day 4 | Hacker News | Show HN post |
| Day 7 | Product Hunt | Launch |

## Metrics to Track

- GitHub stars (before/after)
- Article views + claps
- Tweet impressions
- HN upvotes + comments
- First external contributor
