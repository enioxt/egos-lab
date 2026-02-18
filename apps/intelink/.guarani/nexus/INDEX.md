# 🧠 NEXUS SKILL LIBRARY

**Version:** 2.1.0 | **Updated:** 2025-12-03 | **Skills:** 6

O NEXUS é o sistema de "habilidades avançadas" do agente GUARANI. 
Cada skill é um Meta-Prompt especializado que pode ser carregado dinamicamente.

---

## 📋 SKILL ROUTER (Quando Usar Cada)

```
IF tarefa == "Criar Feature/Arquivo":
    LOAD "auditor.md"
    
IF tarefa == "Erro/Bug/Lentidão":
    LOAD "medic.md"
    
IF tarefa == "Iniciar/Terminar Sessão":
    LOAD "lifecycle.md"
    
IF tarefa == "Criar Meta-Prompt":
    LOAD "generator.md"
    
IF tarefa == "Instrução Complexa (P0/P1)":
    LOAD "NEXUS_ZERO.md"
    
IF tarefa == "Avaliar Qualidade":
    LOAD "evaluator.md"
```

---

## 🎯 SKILLS DISPONÍVEIS

### 1. NEXUS_ZERO (Prompt Compiler) 🔮
**Arquivo:** `NEXUS_ZERO.md`
**Uso:** Compilar instruções brutas em especificações de precisão ASML/F1
**Quando:** Tarefas P0/P1 que precisam de instrução estruturada
**Output:** Template 4 seções (Identity, Data Laws, Execution Kernel, Outputs)

### 2. AUDITOR (Anti-Duplicação) 🔍
**Arquivo:** `auditor.md`
**Uso:** Verificar se algo já existe antes de criar
**Quando:** Antes de criar arquivos, componentes ou features
**Output:** Decisão (REUSE, REFATORE, ou CRIE)

### 3. MEDIC (Diagnóstico) 🏥
**Arquivo:** `medic.md`
**Uso:** Diagnosticar e corrigir erros, lentidão, bugs
**Quando:** Erro reportado ou comportamento inesperado
**Output:** Diagnóstico + Correção + Validação

### 4. LIFECYCLE (Sessões) 🔄
**Arquivo:** `lifecycle.md`
**Uso:** Gerenciar início e fim de sessões
**Quando:** `/start` ou `/end`
**Output:** Briefing ou Handoff

### 5. GENERATOR (Meta-Prompts) ⚙️
**Arquivo:** `generator.md`
**Uso:** Criar novos skills para o Nexus
**Quando:** Padrão repetitivo que merece automação
**Output:** Novo arquivo .md no nexus/

### 6. EVALUATOR (QA Industrial) 📊 ← NOVO
**Arquivo:** `evaluator.md`
**Uso:** Avaliar qualidade de prompts e outputs (10 dimensões)
**Quando:** Após gerar prompts complexos, código P0/P1, migrações
**Output:** Score 0-10, validação cruzada, breaking changes

---

## 🔧 COMO USAR (MCP)

```typescript
// Listar skills disponíveis
mcp3_list_nexus_skills()

// Carregar skill específico
mcp3_get_nexus_skill({ skill_name: "NEXUS_ZERO" })
mcp3_get_nexus_skill({ skill_name: "auditor" })
mcp3_get_nexus_skill({ skill_name: "medic" })
mcp3_get_nexus_skill({ skill_name: "lifecycle" })
mcp3_get_nexus_skill({ skill_name: "generator" })
```

---

## 📊 HIERARQUIA DE PRECISÃO

```
NEXUS_ZERO (Máxima) ───┐
                       ├── Instruções F1/ASML
                       ├── Shannon Entropy < 2
                       └── Mathematical Proof

AUDITOR/MEDIC ─────────┐
                       ├── Protocolos Estruturados
                       └── Checklists Claros

LIFECYCLE/GENERATOR ───┐
                       ├── Processos Simples
                       └── Templates Básicos
```

---

## 🚀 ROADMAP

- [x] Auditor - Anti-duplicação
- [x] Medic - Diagnóstico
- [x] Lifecycle - Sessões
- [x] Generator - Criar skills
- [x] NEXUS_ZERO - Compilador de precisão
- [ ] **Evaluator** - QA Industrial (10 dimensões) ← PRÓXIMO
- [ ] NEXUS_ORACLE - Predição baseada em padrões
- [ ] NEXUS_BRIDGE - Integração entre sistemas
- [ ] NEXUS_SENTINEL - Segurança e auditoria

---

## 🧠 SEQUENTIAL THINKING: USO OBRIGATÓRIO

> Ver `.guarani/PREFERENCES.md` → Regra #2

| Situação | Thoughts |
|----------|----------|
| P0 | 7 |
| P1 | 5 |
| P2/Geral | 3 |
| Criar arquivo | 3 |
| Migração | 5 |

**Triggers:** "criar", "novo", "migração", "refatorar", "P0", "P1"

---

*"Load the right skill for the right task."*
