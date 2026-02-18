# SYSTEM INDEX — EGOSv3 Subsystems Registry

**Sacred Code:** 000.111.369.963.1618
**Versão:** 1.0.0
**Última Atualização:** 2025-12-08

---

## PROPÓSITO

Este arquivo é o **índice central** de todos os subsistemas do EGOSv3.
Qualquer agente de IA que inicie sem contexto DEVE ler este arquivo primeiro.

---

## SUBSISTEMAS ATIVOS

| ID | Nome | Path | Versão | Status | Função |
|----|------|------|--------|--------|--------|
| 01 | **Windsurfrules** | `.windsurfrules` | 5.0.0 | 🟢 ACTIVE | Entry point, regras globais |
| 02 | **Guarani Core** | `.guarani/` | 1.0 | 🟢 ACTIVE | Identidade, preferências, arquitetura |
| 03 | **Activation Payload** | `.guarani/ACTIVATION_PAYLOAD.md` | 1.0 | 🟢 ACTIVE | Reload rápido de contexto |
| 04 | **MCP Orchestration** | `.guarani/MCP_ORCHESTRATION_GUIDE.md` | 2.0 | 🟢 ACTIVE | Guia de uso de MCPs |
| 05 | **Workflows** | `.windsurf/workflows/` | - | 🟢 ACTIVE | Automações (/start, /end, etc) |
| 06 | **Health Check** | `scripts/health/` | 1.0 | 🟢 ACTIVE | Score de saúde 0-100 |
| 07 | **Handoff System** | `scripts/handoff-qa/` | 1.0 | 🟢 ACTIVE | Transferência de contexto |
| 08 | **Pre-commit Hooks** | `.githooks/` | 1.0 | 🟢 ACTIVE | Validação antes de commit |
| 09 | **Tasks SSOT** | `TASKS.md` | - | 🟢 ACTIVE | Única fonte de tasks |
| 10 | **Memory MCP** | `memory_db/` | - | 🟢 ACTIVE | Persistência entre sessões |
| 11 | **Nexus Skills** | `.guarani/nexus/` | 1.0 | 🟢 ACTIVE | Meta-prompts especializados |
| 12 | **Intent Refinery** | `.guarani/refinery/` | 1.1 | 🟢 ACTIVE | Classificação de intenções |

---

## WORKFLOWS DISPONÍVEIS

| Comando | Função | Quando Usar |
|---------|--------|-------------|
| `/start` | Ativação completa | Início de sessão |
| `/end` | Salvar e handoff | Fim de sessão |
| `/refresh` | Reload leve | Contexto baixo |
| `/health` | Check de saúde | Verificar status |
| `/pre` | Pre-processar instrução | Instrução vaga |

---

## OBSOLETOS (NÃO USAR)

| Nome | Path | Motivo | Substituído Por |
|------|------|--------|-----------------|
| Context7 (mcp3) | - | Quebrado | mcp2_get-library-docs |
| search_knowledge (mcp3) | - | pgvector error | mcp13_search_nodes |
| WINDSURFRULES_V4.md | `.guarani/` | Desatualizado | `.windsurfrules` v5.0 |

---

## REGRAS DE GOVERNANÇA

### Ao Criar Novo Subsistema

1. Adicionar entrada neste INDEX
2. Criar README no diretório
3. Adicionar workflow se aplicável
4. Atualizar `.windsurfrules` se crítico
5. Commit com `feat: add [subsystem-name]`

### Ao Deprecar Subsistema

1. Mover para seção OBSOLETOS
2. Indicar substituto
3. NÃO deletar imediatamente (manter 1 sprint)
4. Commit com `chore: deprecate [subsystem-name]`

### Verificação de Integridade

```bash
# Rodar health check
/health

# Listar workflows
ls .windsurf/workflows/

# Verificar guarani
ls .guarani/
```

---

## MÉTRICAS DE ESTABILIDADE

| Métrica | Valor Aceitável | Valor Ideal |
|---------|-----------------|-------------|
| Health Score | > 70 | > 90 |
| TASKS.md lines | < 500 | < 300 |
| Handoff age | < 24h | < 8h |
| Subsystems documented | 100% | 100% |

---

## QUANDO O SISTEMA ESTÁ ESTÁVEL?

✅ Health Score > 85
✅ Todos subsistemas documentados aqui
✅ Nenhum obsoleto sem substituto
✅ /start funciona sem erros
✅ /health retorna Grade A ou B

**Status Atual:** 🟡 Em evolução (Health: 40/100)

---

*Atualizado automaticamente pelo agente. Última revisão: 2025-12-08*
