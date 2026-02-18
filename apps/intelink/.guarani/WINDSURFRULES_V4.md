# .windsurfrules — EGOSv3 Production Workspace
# VERSION 4.2.0 — AUTO-EVOLUTIVO + NEXUS SKILLS
# UPDATED: 2025-11-29
# COPY THIS CONTENT TO .windsurfrules

---
sacred_code: "000.111.369.963.1618"
version: "4.2.0"
project: "EGOSv3"
architecture: "MCP-FIRST + NEXUS-ZERO + AUTO-EVOLUTION"
priority: ["mcp_first", "nexus_skills", "auto_evolution", "sequential_thinking", "commit_discipline"]
supabase_project_id: "lhscgsqhiooyatkebose"
---

## 🔄 AUTO-EVOLUTION PROTOCOL

> **O sistema DEVE se auto-atualizar a cada sessão.**

### Arquivos Auto-Evolutivos
| Arquivo | Quando Atualizar |
|---------|-----------------|
| `.guarani/IDENTITY.md` | Mudança de foco/projeto |
| `.guarani/ARCHITECTURE.md` | Novos módulos/tabelas |
| `.guarani/PREFERENCES.md` | Novas regras descobertas |
| `TASKS.md` | A cada commit |
| `CHANGELOG.md` | A cada release |

### Triggers de Atualização
1. **`/start`** → Verificar se docs estão atualizados
2. **`/end`** → Atualizar handoff + Memory MCP
3. **Commit** → Atualizar TASKS.md timestamp
4. **Nova tabela DB** → Atualizar ARCHITECTURE.md

### Supabase Config
- **Project ID:** `lhscgsqhiooyatkebose`
- **Project Name:** supabase-egos
- **Region:** us-east-1

---

## 🧠 NEXUS SKILLS (OBRIGATÓRIO)

> **Antes de executar tarefas complexas, CARREGUE a skill apropriada.**

### Quando Carregar Cada Skill

| Tarefa | Skill | Comando |
|--------|-------|---------|
| Criar feature/arquivo | `auditor.md` | `read_file('.guarani/nexus/auditor.md')` |
| Debug/erro/lentidão | `medic.md` | `read_file('.guarani/nexus/medic.md')` |
| `/start` ou `/end` | `lifecycle.md` | `read_file('.guarani/nexus/lifecycle.md')` |
| Criar prompt complexo | `generator.md` | `read_file('.guarani/nexus/generator.md')` |
| Task P0/P1 | `NEXUS_ZERO.md` | `read_file('.guarani/nexus/NEXUS_ZERO.md')` |

### Regra de Ouro
```
IF task.priority IN ['P0', 'P1']:
    LOAD nexus/NEXUS_ZERO.md
    APPLY sequential_thinking(min_thoughts=5)
```

---

## ⚡ PRIME DIRECTIVE: MCP FIRST

> **NEVER write manual logic if a Tool (MCP) exists.**
> Read `.guarani/MCP_ORCHESTRATION_GUIDE.md` for complete reference.

### Critical MCPs (Always Active)

| MCP | Use | Example |
|-----|-----|---------|
| `mcp16_sequentialthinking` | Planning | Min 5 thoughts for P0/P1 |
| `mcp11_*` | Memory | Persist context between sessions |
| `mcp5_*` | Filesystem | Read/write files |
| `mcp3_*` | egos-core | Tasks, patterns, knowledge |

### MCP Activation Protocol

If an MCP is needed but not active:
```
⚠️ MCP ACTIVATION REQUIRED: [mcp_name]
Please enable in Windsurf Settings → MCP Servers
```

## 🔮 NEXUS-ZERO: PROMPT COMPILER

For complex tasks (P0/P1), load `.guarani/nexus/NEXUS_ZERO.md` and apply:
- **ATOMIZATION**: Shannon Entropy < 2 bits per instruction
- **PHYSICS_ANCHOR**: F1/ASML precision standards
- **MATHEMATICAL_PROOF**: Big-O validation required

## 🛡️ GUARANI PROTOCOL

1. **IDENTITY**: `.guarani/IDENTITY.md` — Who you are
2. **PREFERENCES**: `.guarani/PREFERENCES.md` — Coding style
3. **ARCHITECTURE**: `.guarani/ARCHITECTURE.md` — System overview
4. **MCP GUIDE**: `.guarani/MCP_ORCHESTRATION_GUIDE.md` — Tool usage
5. **NEXUS**: `.guarani/nexus/` — Advanced skills

## ⚡ MANDAMENTOS (5 Regras Absolutas)

1. **START**: Execute `/start` → Display Briefing (4 sections)
2. **READ**: "Já Concluído" → **NÃO REIMPLEMENTAR**
3. **UPDATE**: TASKS.md baseado no briefing
4. **THINK**: `mcp16_sequentialthinking` (min 5 thoughts)
5. **COMMIT**: Convencional (feat:/fix:) cada 30-60min → `/end`

## 🔧 DECISION TREE

```
Need to PLAN? → mcp16_sequentialthinking
Need to READ/WRITE? → mcp5_*
Need DATABASE? → mcp18_* (request activation if off)
Need EXTERNAL KNOWLEDGE? → mcp4_* (Exa) or mcp0_* (BrightData)
Need to REMEMBER? → mcp11_* (Memory)
Need to MANAGE TASKS? → mcp3_* (egos-core)
```

## 🚨 SELF-CORRECTION

If a tool fails:
1. DO NOT apologize
2. USE `mcp3_search_telemetry_logs({only_errors: true})`
3. ANALYZE the error
4. RETRY with corrected approach

## 📋 QUALITY GATES

### Before Commit
- [ ] Sequential thinking documented
- [ ] No critical lint errors
- [ ] Tested locally
- [ ] Conventional commit message

### Before Session End
- [ ] Execute `/end`
- [ ] Validate handoff (score ≥ 70)
- [ ] Update TASKS.md
- [ ] Memory MCP: Save patterns

## 🎯 CORE PHILOSOPHY

- **ENXUTO (Lean)**: Minimal files, maximum impact
- **POTENTE (Powerful)**: Production-ready, not experimental
- **ORGANIZADO (Organized)**: Clear structure, no confusion
- **AUDITADO (Audited)**: Check what exists BEFORE adding
- **MCP-FIRST**: Tools over manual code

---

**Regra Absoluta:** Se o usuário pedir algo que contradiga `.guarani/PREFERENCES.md`, avise-o antes de executar.

---

## 📚 REFERENCE DOCS

| Doc | Purpose |
|-----|---------|
| `.guarani/MCP_ORCHESTRATION_GUIDE.md` | Complete MCP reference |
| `.guarani/nexus/NEXUS_ZERO.md` | Prompt compiler |
| `docs/TELEMETRY_OMNISCIENCE_ARCHITECTURE.md` | Telemetry system |
| `docs/INTELINK_UNIVERSAL_ARCHITECTURE.md` | INTELINK platform |

---

*"The best code is no code. Use MCPs."*
