---
description: "Save knowledge and patterns to persistent memory (System v4.0)"
auto_trigger: "When discovering reusable pattern, bug fix, architecture decision, or library behavior"
---
// turbo-all

# /disseminate — Knowledge Persistence (System v4.0)

> **Works in:** ANY repo | **Auto-triggers:** Always, when learning something worth remembering
> **Version:** 4.0 — Now with auto-trigger, dual persistence, and fast-path

---

## Auto-Trigger Conditions

The agent MUST run /disseminate automatically when:
- 🐛 Solving a tricky bug (save the solution + root cause)
- 🏗️ Making an architecture decision (save rationale + alternatives considered)
- 📚 Discovering library/API behavior (especially gotchas)
- 🔧 Finding repo-specific conventions (e.g., "Use `bun` not `npm`")
- ⚡ Discovering a reusable pattern (e.g., "Shannon Entropy > 4.5 for secrets")
- 🚨 Hitting a blocker and solving it (save for future sessions)

## The Process

### Layer 1: Memory MCP (Structured Knowledge Graph)

```
⚠️ AI AGENT: Use mcp_memory tools to persist knowledge:

1. CLASSIFY the knowledge type:
   - 🧠 Concept / Pattern (architecture, design pattern)
   - 🔧 Solution (bug fix, config fix, workaround)
   - 📚 Reference (docs, library behavior, API quirks)
   - ⚠️ Gotcha (edge case, trap, warning)
   - 📏 Rule (operational rule, coding standard)

2. SAVE (mcp_memory_create_entities):
   → name: descriptive, searchable name
   → entityType: one of the types above
   → observations: array of key facts (each < 200 chars)

3. CONNECT (mcp_memory_create_relations):
   → Link to related entities (projects, patterns, tools)
   → Use active voice: "used_in", "solves", "prevents", "enables"

4. VERIFY: If Memory MCP fails, fall back to Layer 2
```

### Layer 2: Knowledge Base (egos-core MCP)

```
⚠️ AI AGENT: If Memory MCP is unavailable, use mcp_egos-core_save_web_knowledge:

   → title: descriptive title
   → content: full explanation with context
   → url: source or "internal://session"
   → tags: categorization array
```

### Layer 3: Code Comments (Fast Path)

For inline knowledge that lives with the code:
```typescript
// @disseminate: [Pattern] Always use Shannon Entropy for secret detection.
// @disseminate: [Gotcha] React 19 types need explicit @types/react@19 install in monorepos.
// @disseminate: [Rule] Nexus Market uses bun, not npm.
```

### Layer 4: Governance File (Permanent Rules)

For rules that should survive across all sessions:
```
⚠️ AI AGENT: Append to docs/OPERATIONAL_RULES.md for permanent operational rules.
```

## Quality Check

Before disseminating, verify:
- [ ] Is this knowledge REUSABLE? (will it help in future sessions?)
- [ ] Is it SPECIFIC enough? (not vague platitudes)
- [ ] Does it include CONTEXT? (when/where it applies)
- [ ] Is it ACTIONABLE? (tells you what to DO, not just what IS)
