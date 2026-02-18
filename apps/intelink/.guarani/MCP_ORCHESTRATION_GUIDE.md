# 🎛️ MCP ORCHESTRATION GUIDE
**Version:** 2.2.0 | **Updated:** 2025-12-14 | **Status:** Active

---

## 🛑 MODEL COMPATIBILITY (CRÍTICO - LEIA PRIMEIRO)

> **Nem todos os modelos suportam MCP tools.**
> Se você ver "Try again with MCP servers disabled", TROQUE O MODELO.

### ✅ Modelos COMPATÍVEIS
- `google/gemini-2.0-flash-001` ⭐ **RECOMENDADO**
- `google/gemini-2.5-flash-preview`
- `openai/gpt-4o` / `openai/gpt-4o-mini`
- `anthropic/claude-3.5-sonnet` / `anthropic/claude-3.5-haiku`

### ❌ Modelos INCOMPATÍVEIS
- `anthropic/claude-opus-4.5` → Retorna `invalid_argument`
- `anthropic/claude-opus-4.5-thinking` → Retorna `invalid_argument`

### Diagnóstico
```bash
./scripts/tools/mcp-error-monitor.sh
cat .windsurf/model_guard.json
```

---

## 🎯 PHILOSOPHY: MCP FIRST

> **NEVER write manual logic if a Tool (MCP) exists.**
> The Agent is an **Orchestrator**, not a coder.

---

## 📋 MCP INVENTORY (Windsurf IDE)

### 🔴 CRITICAL (Always Active)

| MCP | Prefix | Use Case | Example |
|-----|--------|----------|---------|
| **sequential-thinking** | `mcp18_` | Planning, complex decisions | `mcp18_sequentialthinking({thought, thoughtNumber, totalThoughts})` |
| **memory** | `mcp13_` | Persist context between sessions | `mcp13_create_entities([{name, entityType, observations}])` |
| **filesystem** | `mcp7_` | Read/write files | `mcp7_read_text_file({path})` |
| **egos-core** | `mcp4_` | Tasks, patterns, knowledge | `mcp4_get_tasks_summary()` |

### 🟡 ON-DEMAND (Activate When Needed)

| MCP | Prefix | Use Case | Activate When |
|-----|--------|----------|---------------|
| **supabase-mcp-server** | `mcp20_` | DB operations | Working with database |
| **exa** | `mcp5_` | Web search, code context | **PREFERÊNCIA** para pesquisa |
| **brightdata** | - | Scraping protected sites | Need to bypass anti-bot |
| **local-rag** | - | Query ingested documents | Semantic search in docs |
| **mcp-playwright** | - | Browser automation | E2E tests, visual validation |
| **hf-mcp-server** | `mcp9_` | Image generation | Need to generate images |
| **github** | - | Git operations | Complex git workflows |
| **vercel** | - | Deployment | Deploy to Vercel |
| **render** | - | Deployment | Deploy to Render |
| **snyk** | - | Security scan | Check vulnerabilities |
| **puppeteer** | - | Browser control | Screenshots, PDF |
| **postgresql** | - | Direct DB access | Raw SQL needed |

### 🔵 EGOS-CORE TOOLS (Detailed)

```typescript
// TASKS
mcp4_add_task({category, title, priority})     // Add new task
mcp4_get_tasks_summary()                        // Get all tasks
mcp4_get_tasks_by_priority({priority})          // P0, P1, P2, COMPLETED
mcp4_search_tasks({keyword})                    // Search tasks
mcp4_update_task_status({task_pattern})         // Mark complete

// PATTERNS (Therapeutic)
mcp4_detect_patterns({text, min_confidence})    // AI pattern detection
mcp4_create_pattern_worksheet({pattern_name})   // Generate worksheet

// KNOWLEDGE (Use mcp13 or local-rag instead)
mcp4_save_web_knowledge({title, content, url, tags}) // Save knowledge
mcp4_submit_knowledge({type, content, metadata})     // Community knowledge
// ⚠️ DEPRECATED: mcp4_search_knowledge → Use mcp13_search_nodes

// SYSTEM
mcp4_get_full_context()                         // Identity + Prefs + Arch
mcp4_get_identity()                             // Agent identity
mcp4_get_preferences()                          // Coding rules
mcp4_get_architecture()                         // System overview
mcp4_get_system_prompt()                        // Dynamic prompt
mcp4_get_windsurfrules()                        // .windsurfrules
mcp4_system_diagnostic()                        // Health check

// NEXUS (Skills)
mcp4_list_nexus_skills()                        // List available skills
mcp4_get_nexus_skill({skill_name})              // Load skill prompt

// HANDOFF
mcp4_get_handoff_history({limit})               // Last N sessions
mcp4_validate_handoff({handoff_path})           // Quality check

// TELEMETRY
mcp4_search_telemetry_logs({limit, only_errors}) // Debug errors

// ⚠️ DEPRECATED: mcp4_search_web → Use mcp5_web_search_exa directly
```

---

## 🔄 ACTIVATION PROTOCOL

### When Starting Session
```
1. mcp4_get_full_context()        → Load identity
2. mcp4_get_handoff_history()     → Previous sessions
3. mcp4_get_tasks_summary()       → Current tasks
4. mcp18_sequentialthinking()     → Plan the session
```

### When MCP Not Available
If you need an MCP that's not active:

```markdown
⚠️ **MCP ACTIVATION REQUIRED**

I need the **[MCP_NAME]** MCP to complete this task.
Please activate it in Windsurf settings:
1. Open Settings → MCP Servers
2. Enable: [mcp_name]
3. Restart if needed

Once active, I'll continue with: [action]
```

### When MCP Fails
```typescript
1. DO NOT apologize
2. USE mcp4_search_telemetry_logs({only_errors: true})
3. ANALYZE the error
4. RETRY with corrected approach
```

---

## 🎼 DECISION TREE: Which MCP?

```
Need to...

├── PLAN/THINK complex task?
│   └── mcp18_sequentialthinking
│
├── ACCESS the codebase?
│   ├── Read file → mcp7_read_text_file
│   ├── Write file → mcp7_write_file
│   ├── Search → mcp7_search_files or grep_search
│   └── Directory → mcp7_list_directory
│
├── DATABASE operation?
│   ├── Schema → mcp20_list_tables
│   ├── Query → mcp20_execute_sql
│   ├── Migration → mcp20_apply_migration
│   └── Docs → mcp20_search_docs
│
├── EXTERNAL knowledge?
│   ├── Code examples → mcp5_get_code_context_exa
│   ├── Web search → mcp5_web_search_exa
│   ├── Protected site → brightdata (ativar sob demanda)
│   └── Local docs → local-rag (ativar sob demanda)
│
├── REMEMBER across sessions?
│   ├── Save entity → mcp13_create_entities
│   ├── Add info → mcp13_add_observations
│   └── Retrieve → mcp13_search_nodes
│
├── MANAGE tasks?
│   ├── List → mcp4_get_tasks_summary
│   ├── Add → mcp4_add_task
│   └── Complete → mcp4_update_task_status
│
├── TEST/VALIDATE?
│   ├── Browser test → mcp-playwright
│   ├── Screenshot → puppeteer
│   └── Security → snyk
│
└── DEPLOY?
    ├── Vercel → vercel MCP
    └── Render → render MCP
```

---

## 🔧 CUSTOM MCPs (egos-core)

### When to Create New Tools

Add to `backend/mcp-server/egos-core/` when:

1. **Repetitive Pattern**: Same sequence of actions >3 times
2. **External Integration**: New API/service connection
3. **Complex Logic**: Multi-step process that should be atomic

### How to Request New Tool

```markdown
## 📦 NEW MCP TOOL REQUEST

**Tool Name:** `mcp3_[action]_[resource]`
**Purpose:** [What it does]
**Input:** 
```json
{ "param1": "type", "param2": "type" }
```
**Output:** [Expected return]
**Priority:** P0/P1/P2
```

---

## 📊 MCP USAGE METRICS

Track which MCPs are used most to optimize:

| MCP | Daily Calls | Performance | Notes |
|-----|-------------|-------------|-------|
| sequential-thinking | ~20 | Fast | Always active |
| memory | ~10 | Fast | Always active |
| filesystem | ~50 | Fast | Always active |
| egos-core | ~30 | Fast | Always active |
| supabase | ~15 | Medium | Activate on DB work |
| exa | ~5 | Slow | External API |

---

## 🔴 MCPs SUBUTILIZADOS (Ação Necessária)

### Alta Prioridade para Intelink

| MCP | Status | Ação Recomendada |
|-----|--------|------------------|
| **local-rag (mcp9_)** | ❌ Não usado | Indexar documentos de investigação |
| **mcp-playwright** | ⚠️ Raro | Integrar em validação visual /315 |
| **snyk** | ❌ Não usado | Adicionar ao /end para security scan |

### Tools egos-core Subutilizadas

| Tool | Uso Atual | Potencial |
|------|-----------|-----------|
| `mcp4_create_pattern_worksheet` | Raramente | Terapêutico (EGOS principal) |
| `mcp4_save_web_knowledge` | Raramente | Preservar pesquisas úteis |
| `mcp4_submit_knowledge` | Nunca | Community feature (futuro) |
| `mcp4_get_nexus_skill` | Manual | Deve ser automático via triggers |

---

## 🚨 DEPRECATED TOOLS (NÃO USAR)

| Tool Antiga | Substituto | Motivo |
|-------------|------------|--------|
| `mcp4_search_web` | `mcp5_web_search_exa` | Exa é State of the Art para contexto de código |
| `mcp4_search_knowledge` | `mcp13_search_nodes` | **QUEBRADO** (erro pgvector) |
| `Context7` | `mcp13_*` (Memory Graph) | Obsoleto, substituído por Memory Graph |

### Regra de Ouro

```
Pesquisa Web → SEMPRE mcp5_web_search_exa
Memória     → SEMPRE mcp13_* (Memory Graph)
RAG Local   → local-rag (ativar sob demanda)
Arquivos    → SEMPRE mcp7_* (para arquivos restritos)
```

---

## 🧠 SEQUENTIAL THINKING: USO OBRIGATÓRIO

> Ver `.guarani/PREFERENCES.md` → Regra #2 para matriz completa.

### Resumo Rápido

| Situação | Thoughts |
|----------|----------|
| P0 | 7 |
| P1 | 5 |
| P2/Geral | 3 |
| Criar arquivo | 3 |
| Migração | 5 |

### Triggers Automáticos

Iniciar ST ao detectar: "criar", "novo", "migração", "refatorar", "P0", "P1"

---

## 🚨 LIMIT MANAGEMENT (100 Tools)

Windsurf has a **100 tool limit**. Strategy:

### Tier 1: Always Active (Core - ~30 tools)
- sequential-thinking, memory, filesystem, egos-core

### Tier 2: Project-Specific (~20 tools)
- supabase (if DB-heavy project)
- local-rag (if documentation-heavy)

### Tier 3: On-Demand (~50 tools available)
- Activate only when needed
- Deactivate when done

### Rotate Based on Task
```
Frontend work → Activate: playwright, puppeteer
Backend work → Activate: supabase, postgresql
Research → Activate: exa, brightdata
Deployment → Activate: vercel, render, github
```

---

*Remember: The best code is no code. Use MCPs.*
