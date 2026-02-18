---
description: "Collect and interpret all project governance rules (SSOT)"
auto_trigger: "When enforcing code standards, reviewing PRs, or setting up new project"
---
// turbo-all

# /regras — Governance SSOT Collector (v2.0)

> **Auto-triggers:** Code review, PR setup, new project bootstrap, standards enforcement

---

## 1. Collect All Rule Sources // turbo

```bash
ROOT="$PWD"; CUR="$ROOT"
while [ "$CUR" != "/" ] && [ ! -e "$CUR/.git" ]; do CUR="$(dirname "$CUR")"; done
[ -e "$CUR/.git" ] && ROOT="$CUR"

printf "═══════════════════════════════════════════════════════════\n"
printf "📜 GOVERNANCE SSOT COLLECTOR\n"
printf "═══════════════════════════════════════════════════════════\n\n"

printf "📂 Scanning: %s\n\n" "$ROOT"

for f in AGENTS.md docs/OPERATIONAL_RULES.md .windsurfrules .guarani/ANTIGRAVITY_RULES.md .guarani/PREFERENCES.md .eslintrc.json .prettierrc tsconfig.json; do
  if [ -f "$ROOT/$f" ]; then
    LINES=$(wc -l < "$ROOT/$f")
    printf "   ✅ %s (%s lines)\n" "$f" "$LINES"
  fi
done

if [ -d "$ROOT/.egos" ]; then
  printf "\n   📁 Shared governance (.egos/):\n"
  ls "$ROOT/.egos/guarani/"*.md 2>/dev/null | while read f; do
    printf "      ✅ %s\n" "$(basename "$f")"
  done
fi
printf "\n"
```

## 2. AI Agent: Synthesize Rules

```
⚠️ AI AGENT: After running the scan:

1. Read ALL detected rule files
2. Build a PRIORITY ORDER:
   - OPERATIONAL_RULES.md > AGENTS.md > .windsurfrules > .guarani/*
3. Identify CONFLICTS between sources
4. Report findings in a concise table:
   | Rule | Source | Status |
   |------|--------|--------|
5. Flag any outdated or contradictory rules
```
