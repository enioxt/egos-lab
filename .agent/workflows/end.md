---
description: "Session finalization — Agnostic session end with handoff (works in ANY repo)"
auto_trigger: "When user says goodbye, session ending, or switching to different repo"
---
// turbo-all

# /end — Session Finalization (v3.0)

> **Auto-triggers:** End of session, switching repos, or user says "tchau/bye/encerrar"

---

## 1. Generate Handoff Summary

```
⚠️ AI AGENT: Create/update the handoff document:

1. Create file: docs/_current_handoffs/handoff_YYYY-MM-DD.md
2. Include:
   - What was accomplished (bullet list with file links)
   - What's in progress (with % completion)
   - What's blocked (with reason + required action)
   - Next steps (ordered by priority)
   - Environment state (builds passing? tests green?)

3. Keep it ACTIONABLE — next agent should be productive in < 2 minutes
```

## 2. Update TASKS.md

```
⚠️ AI AGENT: Ensure TASKS.md reflects current state:
- Mark completed tasks with [x]
- Mark in-progress with [/]
- Add any new tasks discovered during session
```

## 3. Commit If Needed // turbo

```bash
ROOT="$PWD"; CUR="$ROOT"
while [ "$CUR" != "/" ] && [ ! -e "$CUR/.git" ]; do CUR="$(dirname "$CUR")"; done
[ -e "$CUR/.git" ] && ROOT="$CUR"

UNCOMMITTED=$(git -C "$ROOT" status --short 2>/dev/null | wc -l)
if [ "$UNCOMMITTED" -gt 0 ]; then
  printf "⚠️  %s uncommitted files — consider committing!\n" "$UNCOMMITTED"
  git -C "$ROOT" status --short
fi
```

## 4. Disseminate Knowledge

```
⚠️ AI AGENT: Before ending, auto-trigger /disseminate for any:
- Bug fixes discovered
- Patterns learned
- Architecture decisions made
- Gotchas encountered
```
