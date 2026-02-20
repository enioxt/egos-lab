---
name: disseminate
description: Knowledge Dissemination Protocol. Use this to permanently save architectural decisions, security patterns, or systemic insights.
---

# Disseminate Skill

Use this skill whenever you discover a pattern, security vulnerability fix, or architectural insight that must be shared across the EGOS System.

## The Process

1. **Harvest (Code Level)**
   - Add inline comments tagged with `@disseminate: [Pattern] ...` where relevant.
   - The pre-commit hook will auto-harvest these into `HARVEST.md`.

2. **Save (Memory Level)**
   - If MCP Memory tools are activated, use `mcp_memory_create_entities` to store the Concept, Solution, Reference, or Gotcha.

3. **Global Rule Propagation (System Level - CRITICAL)**
   - If the knowledge is structurally vital (e.g., APEX-SECURE defenses, new Architecture rule), **YOU MUST**:
     1. Inject the rule into the local `.windsurfrules` (ensure it goes to the correct section like `## SECURITY`).
     2. Propagate the rule to `.guarani/PREFERENCES.md` (locally) or `~/.egos/guarani/PREFERENCES_SHARED.md` (globally).
     3. Ensure the Zero-Trust mandate is visibly documented.

**Goal:** Zero knowledge should be lost when a session ends. Act as the orchestrator of SSOT.
