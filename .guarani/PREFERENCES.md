# GUARANI PREFERENCES — egos-lab

> **Version:** 2.0.0 | **Updated:** 2026-02-17

## Security (Non-Negotiable)

1. **Pre-Commit:** `scripts/security_scan.ts` MUST pass
2. **Secrets:** NO hardcoded keys. Use `.env`. Server-side via Vercel proxy
3. **Recursion:** MAX_DEPTH ~50. IGNORE_DIRS includes External/
4. **Dependencies:** Zero new packages without justification
5. **PII:** Agents MUST mask CPF/email in all output

## Code Quality

1. **TypeScript:** Strict mode. Avoid `any` (use explicit types)
2. **Comments:** Explain "WHY", not "WHAT"
3. **Files:** Max 400 lines (agents: 300 lines)
4. **Commits:** Conventional (feat:/fix:/chore:/docs:) every 30-60min

## Agent Conventions

1. **Registry first:** No agent runs without `agents/registry/agents.json` entry
2. **Runner always:** All agents use `agents/runtime/runner.ts` for logging + correlation IDs
3. **Dry-run default:** `--dry` is the default mode. `--exec` requires explicit flag
4. **Zero deps:** Agents use only Node/Bun stdlib. No framework dependencies
5. **Idempotent:** Running twice produces the same result
6. **Structured output:** All findings use the `Finding` type from runner.ts

## MCP Usage (MANDATORY)

Before manual implementation, check if an MCP can do it:

| Task | Use MCP | NOT manual |
|------|---------|------------|
| Web search | `mcp2_web_search_exa` | fetch() to Google |
| Code examples | `mcp2_get_code_context_exa` | grep GitHub |
| GitHub ops | `mcp4_*` (create_issue, push_files) | git CLI for complex ops |
| Knowledge persist | `mcp1_save_web_knowledge` | writing random .md files |
| Knowledge search | `mcp1_search_knowledge` | grep docs/ |
| Supabase queries | `mcp10_execute_sql` | pg client |

After finding valuable information:
- ALWAYS `mcp1_save_web_knowledge` to persist in knowledge base
- ALWAYS `create_memory` to persist across Windsurf sessions

## Workflows

Available in `.windsurf/workflows/`:
- `/audit-external` — Run agents on external repos for case studies
- `/consulting-diagnostic` — Full diagnostic suite for client projects
- `/partnership-outreach` — Prepare and execute partnership contacts
- `/launch-content` — Create content for public launch
