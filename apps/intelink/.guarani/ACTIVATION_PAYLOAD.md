# ACTIVATION PAYLOAD — MINIMAL CONTEXT RELOAD
# Use quando: Contexto baixo, mid-session refresh, ou perda de contexto detectada
# Tamanho: ~50 linhas (~500 tokens)
# LAST_UPDATE: 2025-12-19T09:00:00-03:00

sacred_code: "000.111.369.963.1618"
version: "5.4.0"
project: "EGOSv3"
sprint: "Multi-Project (Intelink + Carteira Livre)"

## CURRENT STATUS (2025-12-22 16:40)

### Intelink (apps/intelink)
- **CORTEX Hub:** 7/7 ✅ COMPLETO
- **Security Hardening:** ✅ COMPLETO
- **Porta:** 3001

### Carteira Livre (apps/carteira-livre)
- **Infra de Testes:** ✅ COMPLETO (Vitest + 119 testes)
- **Compliance 2025:** ✅ MÓDULOS CORE (GPS, Seguro, Lucratividade)
- **Growth Engine:** ✅ COMPLETO (embaixadores, influencers)
- **Porta:** 3004

## ÚLTIMAS FEATURES (Carteira Livre 22/12)
- ✅ **GPS (CONTRAN 1.020):** `lib/gps.ts` + `TrackMap.tsx`
- ✅ **Seguro Pay-Per-Lesson:** `lib/insurance.ts` + `InsuranceBadge.tsx`
- ✅ **Painel Lucratividade:** `lib/profitability.ts` + `ProfitabilityCard.tsx`
- ✅ **Testes:** 119 testes unitários/integração (Coverage >90% em cores libs)
- ✅ **Docs:** `docs/TESTING_GUIDE.md` criado

## PRIME DIRECTIVE
> NEVER write manual logic if a Tool (MCP) exists.

## 7 MANDAMENTOS
1. START → `/start` antes de trabalhar
2. READ → "Já Concluído" = NÃO REIMPLEMENTAR
3. SSOT → Tasks APENAS em `TASKS.md`
4. THINK → Sequential Thinking (P0=7, P1=5, P2=3)
5. PORT → Intelink=3001
6. COMMIT → Convencional cada 30-60min
7. END → `/end` ao finalizar

## MCPs CRÍTICOS
| Prefixo | Tool |
|---------|------|
| mcp18_ | Sequential Thinking |
| mcp13_ | Memory Graph |
| mcp7_ | Filesystem |
| mcp4_ | Egos-Core |
| mcp5_ | Exa (Web/Code) |
| mcp20_ | Supabase |

## REGRAS CRÍTICAS
- Arquivos restritos → Use mcp7_read_text_file
- Validação humana OBRIGATÓRIA antes de deploy
- NÃO afirme 100% sem testes do usuário

## PONTEIROS (Carregar sob demanda)
- MCPs detalhados → `.guarani/MCP_ORCHESTRATION_GUIDE.md`
- Regras código → `.guarani/PREFERENCES.md`
- Criar arquivo → `.guarani/nexus/auditor.md`
- Debug → `.guarani/nexus/medic.md`

## AUTO-REFRESH TRIGGERS
- 15+ mensagens → Lembrar `/refresh`
- 25+ mensagens → RE-LER este arquivo
- Task P0 → RE-LER antes de executar
- Usuário corrige comportamento → RE-LER imediatamente

---
*Reativação completa: Leia `.windsurfrules`*
