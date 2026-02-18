---
description: Running EGOS agents on external repos for security audits and case studies
---

# Audit Skill

## Overview

EGOS agents can audit any GitHub repository. This generates a health scorecard useful for case studies and as a public service ("Audit My Repo").

## Quick Audit (Single Agent)

```bash
# Clone target repo to /tmp
git clone --depth 1 https://github.com/org/repo /tmp/audit-target

# Run SSOT Auditor against it
cd /tmp/audit-target && bun /home/enio/egos-lab/agents/agents/ssot-auditor.ts --exec

# Run Dep Auditor
bun /home/enio/egos-lab/agents/agents/dep-auditor.ts --exec

# Run Dead Code Detector
bun /home/enio/egos-lab/agents/agents/dead-code-detector.ts --exec
```

## Full Orchestrated Audit

```bash
# Run ALL agents via orchestrator
cd /tmp/audit-target && bun /home/enio/egos-lab/agents/orchestrator.ts --exec
```

Output: `docs/agentic/reports/orchestrator-report.md` in the target repo.

## Case Study Workflow

1. **Clone** target repo (shallow)
2. **Run** orchestrator in execute mode
3. **Collect** findings JSON
4. **Analyze** findings (categorize, count severity levels)
5. **Write** case study in `docs/agentic/case-studies/`
6. **Format**: repo name, findings summary, top issues, comparison table

## Existing Case Studies

| Repo | Findings | Errors | Warnings | Info |
|------|----------|--------|----------|------|
| Documenso | 1,012 | 15 | 117 | 880 |
| Cal.com | 1,469 | 24 | 154 | 1,291 |
| tRPC | 388 | 0 | 0 | 388 |
| Medusa | 2,427 | 149 | 333 | 1,945 |

## Self-Service Audit (LAUNCH-002 — Planned)

Future: expose via API endpoint on egos.ia.br
- User pastes GitHub URL
- Server clones, runs agents in sandbox
- Returns interactive report
