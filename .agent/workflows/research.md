---
description: "Universal Research Protocol — Multi-modal intelligence gathering before implementation"
auto_trigger: "Before implementing unfamiliar technology, library, or integration pattern"
---

# /research — Universal Research Protocol (v2.0)

> **Auto-triggers:** Before working with unfamiliar tech, new API, or complex integration

---

## Step 1: Define Research Scope

```
⚠️ AI AGENT: Before researching, answer:

1. WHAT am I trying to learn? [specific question]
2. WHY do I need this? [what decision depends on it]
3. WHERE should I look? [docs, web, codebase, KIs]
4. HOW DEEP? [surface scan / deep dive / comprehensive]
```

## Step 2: Check Existing Knowledge // turbo

```bash
printf "═══════════════════════════════════════════════════════════\n"
printf "🔍 CHECKING EXISTING KNOWLEDGE\n"
printf "═══════════════════════════════════════════════════════════\n\n"

ROOT="$PWD"; CUR="$ROOT"
while [ "$CUR" != "/" ] && [ ! -e "$CUR/.git" ]; do CUR="$(dirname "$CUR")"; done
[ -e "$CUR/.git" ] && ROOT="$CUR"

printf "📂 Project docs:\n"
find "$ROOT/docs" -name "*.md" -maxdepth 2 2>/dev/null | head -15
printf "\n"
```

## Step 3: Multi-Modal Search

```
⚠️ AI AGENT: Use ALL available sources in this order:

1. 🧠 Memory MCP — search_nodes for prior knowledge
2. 📚 Knowledge Items — check KI summaries
3. 🔍 Codebase — grep_search for existing patterns
4. 🌐 Web — search_web or Exa for external info
5. 📖 Docs — official documentation of libraries/APIs
```

## Step 4: Synthesize & Persist

```
⚠️ AI AGENT: After researching:

1. Summary of findings (2-4 paragraphs)
2. Decision recommendation (with pros/cons)
3. AUTO-TRIGGER /disseminate for reusable findings
4. Save to Knowledge Base if externally sourced
```
