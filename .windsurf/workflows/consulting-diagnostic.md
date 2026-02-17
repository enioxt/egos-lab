---
description: Run full EGOS diagnostic suite on a client/target project in under 5 minutes
---

# /consulting-diagnostic — Client Project Diagnostic

Full diagnostic workflow for demonstrating EGOS value on any TypeScript project.

## When to use

- Client pitch meeting prep
- New project onboarding
- Open-source case study generation
- Internal codebase health check

## Steps

1. **Identify target project path** (local clone or `/tmp/` clone)

2. **Run SSOT Auditor** (50ms, $0)
   - `bun agents/agents/ssot-auditor.ts --exec`
   - Output: duplicated types, orphaned exports, scattered entity fields
   - Report: `docs/agentic/reports/ssot-audit.md`

3. **Run Security Scanner** (30s, $0)
   - `bun scripts/security_scan.ts`
   - Output: exposed secrets, high-entropy strings, PII risks

4. **Run Rho Calculator** (10s, $0)
   - `bun scripts/rho.ts`
   - Output: authority score, diversity score, bus factor, health status

5. **Run Code Reviewer** (30s, ~$0.01) — requires OPENROUTER_API_KEY
   - `bun scripts/review.ts`
   - Output: AI-powered analysis of recent changes

6. **Compile executive summary**
   - Total findings by severity (critical/error/warning/info)
   - Top 3 actionable recommendations
   - Estimated fix effort (hours)
   - Cost of NOT fixing (risk assessment)

7. **Present to stakeholder**
   - Lead with the numbers: "X findings in Y seconds, $0 cost"
   - Show the most impactful finding first
   - Propose a fix engagement (hourly or project-based)

## Template: Executive Summary

```markdown
# Code Health Diagnostic — [Project Name]

**Date:** YYYY-MM-DD
**Scanned by:** EGOS Agent Kit v1.0
**Duration:** X minutes | **Cost:** $0.00

## Findings Summary
| Severity | Count |
|----------|-------|
| Critical | X |
| Error    | X |
| Warning  | X |
| Info     | X |

## Top 3 Recommendations
1. **[Finding]** — [Impact] — [Fix effort: Xh]
2. **[Finding]** — [Impact] — [Fix effort: Xh]
3. **[Finding]** — [Impact] — [Fix effort: Xh]

## How We Found This
Zero-dependency TypeScript agents, running locally, no API keys required.
Open source: github.com/enioxt/egos-lab
```
