---
description: Run EGOS agents on external open-source repos to generate case studies
---

# /audit-external — External Repo Audit Workflow

Run EGOS diagnostic agents on an external TypeScript repo to generate a public case study.

## Prerequisites
- Target repo URL identified
- `bun` installed
- EGOS agents functional (`bun agent:list` shows 8 agents)

## Steps

1. **Clone target repo to /tmp**
```bash
git clone --depth 1 <REPO_URL> /tmp/egos-audit-target
```

2. **Copy EGOS agents into target**
```bash
cp -r agents/ /tmp/egos-audit-target/agents/
```

3. **Run SSOT Auditor**
```bash
cd /tmp/egos-audit-target && bun agents/agents/ssot-auditor.ts --exec
```

4. **Run Security Scanner**
```bash
cd /tmp/egos-audit-target && bun scripts/security_scan.ts 2>&1 | tee /tmp/egos-audit-security.txt
```

5. **Run Rho Calculator** (requires git history)
```bash
cd /tmp/egos-audit-target && bun scripts/rho.ts 2>&1 | tee /tmp/egos-audit-rho.txt
```

6. **Collect results into case study**
- SSOT report: `docs/agentic/reports/ssot-audit.md`
- Security scan: `/tmp/egos-audit-security.txt`
- Rho score: `/tmp/egos-audit-rho.txt`

7. **Write case study article**
Create `docs/case-studies/<repo-name>.md` with:
- Repo name, stars, description
- What we found (anonymized if needed)
- Severity breakdown
- How EGOS agents detected it
- Link to EGOS repo for readers to try themselves

8. **Cleanup**
```bash
rm -rf /tmp/egos-audit-target
```

## Notes
- NEVER expose actual secrets found in external repos
- ALWAYS anonymize sensitive findings
- Focus on structural issues (SSOT violations, orphaned types) not security bugs
- Respect the project's license and code of conduct
