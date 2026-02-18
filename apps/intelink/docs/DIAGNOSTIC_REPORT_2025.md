# 🏥 DIAGNOSTIC REPORT 2025 - EGOSv3 (Intelink)
**Data:** 12/12/2025
**Autor:** Cascade (AI System Architect)
**Status:** 🔴 CRÍTICO

Este relatório detalha as 20 inconsistências e pontos de fragilidade mais críticos identificados no sistema Intelink, com foco em integridade de dados, UX e manutenibilidade.

---

## 🚨 Top 5 - Prioridade Imediata (Bloqueantes)

### 1. Duplicidade de Modais de Entidade
**Problema:** O sistema mantém dois conjuntos de componentes para exibir detalhes de entidades:
- `EntityDetailModal.tsx` (Novo, padronizado, usado pela Busca Global)
- `PersonModal.tsx`, `VehicleModal.tsx`, etc. (Antigos, usados nas páginas de Investigação e Grafo)
**Impacto:** Correções aplicadas em um não se refletem no outro (ex: bug de conexões). UI inconsistente.
**Ação:** Migrar **todas** as chamadas para `EntityDetailModal` e deletar os modais específicos.

### 2. Estratégia de Evidências Híbrida
**Problema:** Existe confusão entre `intelink_documents` (tabela), `intelink_evidence` (tabela) e Entidades do tipo `EVIDENCE` (conceito).
- O upload salva em `documents` E `evidence`.
- O Histórico busca em `evidence`.
- A Timeline busca em `evidence`?
**Impacto:** "0 evidências" no histórico mesmo após upload. Dados desnormalizados e propensos a dessincronia.
**Ação:** Definir SSOT (Single Source of Truth). Recomendação: `intelink_documents` para arquivos, `intelink_evidence` para itens físicos/lógicos extraídos.

### 3. Falha em JOINs no Frontend (Supabase Client)
**Problema:** O cliente JS do Supabase no browser falha silenciosamente ao resolver JOINs complexos (`select('*, relation(*)')`), retornando null para as relações.
**Impacto:** Modais mostravam "0 conexões".
**Ação:** (JÁ INICIADA) Refatorar queries de frontend para fazer fetches separados (split queries) em vez de confiar no JOIN do PostgREST via JS client.

### 4. Gestão de Estado de Navegação Fragmentada
**Problema:**
- `GlobalSearch` gerencia histórico no `localStorage`.
- `EntityDetailModal` gerencia histórico interno em state.
- Páginas de Investigação gerenciam histórico de modais em state da página.
**Impacto:** Ao recarregar a página, perde-se o contexto de navegação "Drill-down".
**Ação:** Centralizar navegação em um `NavigationContext` ou usar URL params (`?modal=id&prev=id`) para persistência.

### 5. Inconsistência de IDs e Rotas
**Problema:** A navegação por teclado na busca passava parâmetros incompletos, gerando telas de "DESCONHECIDO".
**Ação:** (CORRIGIDO) Garantir que todo objeto de navegação tenha `{id, type, title}` completos.

---

## ⚠️ Top 10 - Manutenibilidade e Robustez

### 6. Hardcoded Strings (Tipos e Relacionamentos)
**Problema:** Strings como `'PERSON'`, `'MEMBER_OF'`, `'suspect'` estão espalhadas por dezenas de arquivos.
**Risco:** Erros de digitação (`'person'` vs `'PERSON'`) quebram lógica silenciosamente.
**Ação:** Centralizar em `libs/constants.ts` ou `types/enums.ts`.

### 7. Internacionalização Mista (PT-BR / EN)
**Problema:** Código mistura `relatedPeople` com `pessoasRelacionadas`, `role: 'suspect'` com label "Suspeito".
**Risco:** Confusão mental para devs e bugs de mapeamento.
**Ação:** Padronizar código em Inglês, UI em Português via dicionários de tradução centralizados.

### 8. Tipagem Fraca (`any`)
**Problema:** Muitos componentes usam `any` para entidades e respostas de API.
**Risco:** Runtime errors não detectados pelo TypeScript.
**Ação:** Definir interfaces estritas `IEntity`, `IRelationship`, `IDocument` e usar Zod para validação de API.

### 9. Tratamento de Erros Silencioso
**Problema:** Catch blocks frequentemente fazem apenas `console.error` e deixam a UI em estado de loading infinito ou vazio.
**Ação:** Implementar `ErrorBoundary` global e notificações de toast (`sonner`) para falhas de API.

### 10. Performance de Queries (N+1)
**Problema:** Alguns loops de renderização ou efeitos (`useEffect`) podem estar disparando requests duplicados.
**Ação:** Usar `React Query` (TanStack Query) para cache e dedup de requests em vez de `useEffect` + `fetch` manual.

---

## 🔍 Pontos Cegos e Oportunidades

### 11. Acessibilidade (a11y)
**Diagnóstico:** Modais sem focus trap, botões sem `aria-label`. Navegação por teclado era bugada.
**Melhoria:** Audit de acessibilidade automatizado.

### 12. Segurança de Upload
**Diagnóstico:** Validação de arquivo confia na extensão e MIME type enviado pelo browser.
**Melhoria:** Validação de "Magic Bytes" no server-side para garantir que um .exe não seja renomeado para .pdf.

### 13. Testes Automatizados
**Diagnóstico:** Ausência de testes E2E para fluxos críticos (Upload -> Extração -> Salvamento).
**Melhoria:** Implementar Playwright para smoke tests.

### 14. Código Morto (Zombie Code)
**Diagnóstico:** Componentes antigos (`LocationModal`, `VehicleModal`) ficarão obsoletos com o Modal 2.0.
**Melhoria:** Script para detectar e remover exports não utilizados (`ts-prune`).

### 15. Padronização de API Responses
**Diagnóstico:** Algumas rotas retornam `{ data: ... }`, outras `{ result: ... }`, outras o objeto direto.
**Melhoria:** Wrapper padrão `ApiResponse<T>`.

### 16. Logs de Auditoria
**Diagnóstico:** Verificar se a visualização de detalhes de entidade (LGPD/Sigilo) está gerando logs de auditoria.
**Melhoria:** Middleware de auditoria para `GET /api/entities/:id`.

### 17. Indices de Banco de Dados
**Diagnóstico:** Verificar se as colunas usadas em filtros (`metadata->>'cpf'`, `name` ilike) têm índices GIN/B-tree adequados.
**Melhoria:** `EXPLAIN ANALYZE` nas queries lentas.

### 18. Reuso de Lógica de Negócio
**Diagnóstico:** Lógica de "Quem é a entidade principal" duplicada em `NarrativeSummary` e `QuickStats`.
**Melhoria:** Extrair para `lib/intelligence/analysis.ts`.

### 19. Mobile Experience
**Diagnóstico:** `GlobalSearch` tem renderização condicional complexa para mobile.
**Melhoria:** Componentes responsivos via CSS (Tailwind) em vez de lógica JS condicional onde possível.

### 20. Documentação Viva
**Diagnóstico:** `README.md` desatualiza rápido.
**Melhoria:** Gerar documentação de API via Swagger/OpenAPI a partir do código.

---

## 📅 Plano de Ação Sugerido

1.  **Fase 1 (Já em andamento):** Fixar bugs funcionais (Conexões, Navegação).
2.  **Fase 2 (Próxima):** Unificação de Modais (Modal 2.0).
3.  **Fase 3:** Refatoração de Evidências (Backend).
4.  **Fase 4:** Limpeza de código e Tipagem (TypeScript).

---
*Relatório gerado por Cascade em 12/12/2025*
