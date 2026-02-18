---
description: "Session initialization — Agnostic session start (works in ANY repo)"
auto_trigger: "First interaction in a new session or new conversation"
---
// turbo-all

# /start — Session Initialization (v5.0)

> **Auto-triggers:** First message of every session

---

## 1. Detect Repo & Load Context // turbo

```bash
printf "═══════════════════════════════════════════════════════════\n"
printf "🚀 EGOS SESSION START\n"
printf "═══════════════════════════════════════════════════════════\n\n"

ROOT="$PWD"; CUR="$ROOT"
while [ "$CUR" != "/" ] && [ ! -e "$CUR/.git" ]; do CUR="$(dirname "$CUR")"; done
[ -e "$CUR/.git" ] && ROOT="$CUR"
export EGOS_ROOT="$ROOT"

REPO_NAME=$(basename "$ROOT")
printf "📂 Repo: %s\n" "$REPO_NAME"
printf "📍 Root: %s\n\n" "$ROOT"

for f in AGENTS.md TASKS.md .windsurfrules docs/OPERATIONAL_RULES.md; do
  if [ -f "$ROOT/$f" ]; then
    printf "   ✅ %s\n" "$f"
  else
    printf "   ⚠️  %s — MISSING\n" "$f"
  fi
done
printf "\n"
```

## 2. Load Tasks & Git Status // turbo

```bash
printf "═══════════════════════════════════════════════════════════\n"
printf "📋 CONTEXT LOADING\n"
printf "═══════════════════════════════════════════════════════════\n\n"

LAST_COMMIT=$(git -C "$ROOT" log --oneline -1 2>/dev/null)
UNCOMMITTED=$(git -C "$ROOT" status --short 2>/dev/null | wc -l)
printf "   Last commit: %s\n" "$LAST_COMMIT"
printf "   Uncommitted: %s files\n\n" "$UNCOMMITTED"

if [ -f "$ROOT/TASKS.md" ]; then
  OPEN=$(grep -c '\- \[ \]' "$ROOT/TASKS.md" 2>/dev/null || echo "0")
  DONE=$(grep -c '\- \[x\]' "$ROOT/TASKS.md" 2>/dev/null || echo "0")
  printf "📝 Tasks: %s open | %s done\n\n" "$OPEN" "$DONE"
fi
```

## 3. Environment Scan // turbo

```bash
printf "⚙️  Environment:\n"
printf "   Node: %s | bun: %s\n" "$(node --version 2>/dev/null || echo 'N/A')" "$(bun --version 2>/dev/null || echo 'N/A')"
[ -f "$ROOT/.env" ] || [ -f "$ROOT/.env.local" ] && printf "   🔐 .env: present\n" || printf "   ⚠️  .env: MISSING\n"
[ -d "$ROOT/node_modules" ] && printf "   📁 node_modules: installed\n" || printf "   ⚠️  node_modules: NOT installed\n"
printf "\n"
```

## 4. Agent Instructions

```
⚠️ AI AGENT — AFTER running the above:

1. Read AGENTS.md
2. Read TASKS.md for priorities
3. Read docs/OPERATIONAL_RULES.md for communication protocol
4. Check for latest handoff in docs/_current_handoffs/
5. Resume from where the last session left off

RULES:
- Operate in FULL AUTONOMOUS MODE (docs/OPERATIONAL_RULES.md)
- Only stop for EXTERNAL ACTIONS (use 🚨 format)
- Update task.md as you work
- End session with /end
```
