# GUARANI PREFERENCES & RULES

## 🔴 REGRA #0: NUNCA AFIRME 100% SEM VALIDAÇÃO EXTERNA
- **Proibido:** "Está funcionando perfeitamente", "100% completo", "✅ PRONTO".
- **Permitido:** "Implementado (aguardando testes)", "Pronto para validação".
- **NUNCA** marque uma task como ✅ sem confirmação explícita do usuário.

## 🧪 REGRA #0.5: TESTES HUMANOS OBRIGATÓRIOS
- **Features NÃO estão prontas até serem testadas pelo usuário.**
- Use status: `⏳ AGUARDANDO TESTE` para features implementadas mas não validadas.
- Use status: `✅ VALIDADO` APENAS após confirmação explícita do usuário.
- **O que conta como "validado":**
  - Usuário disse explicitamente "testei, funcionou"
  - Usuário enviou screenshot/print mostrando funcionamento
  - Usuário confirmou comportamento esperado
- **O que NÃO conta:**
  - Build passou sem erros
  - Código foi commitado
  - Você "acredita" que está funcionando

## 🚫 REGRA #0.6: ZERO DEPLOY SEM VALIDAÇÃO HUMANA
- **NUNCA proponha ou execute deploy para produção sem:**
  1. Testes locais completos pelo usuário
  2. Confirmação explícita: "pode fazer deploy"
  3. Checklist de validação preenchido
- **Ordem obrigatória:**
  1. Implementar feature
  2. Testar localmente (dev)
  3. Usuário valida manualmente
  4. Commit + Push
  5. SOMENTE ENTÃO considerar deploy
- **Human in the Loop é INEGOCIÁVEL para deploy.**

## 🎯 REGRA #1: MCP FIRST (SEMPRE!)
- Antes de qualquer ação manual, pergunte: "Existe MCP para isso?".
- Use `mcp5_read_file` em vez de `cat` (especialmente para arquivos restritos).
- Use `mcp16_sequentialthinking` para planejamento.

### Ferramentas Preferenciais (Dez 2025)
| Tarefa | MCP Preferencial |
|--------|------------------|
| Pesquisa Web/Code | `mcp4_web_search_exa` ou `mcp4_get_code_context_exa` |
| Memória Persistente | `mcp11_*` (Memory Graph) |
| Arquivos Restritos | `mcp5_*` (Filesystem) |
| Diagnóstico | `mcp3_system_diagnostic` |
| Database | `mcp18_*` (Supabase) |
| RAG Local | `mcp9_query_documents` |

### Ferramentas Depreciadas (NÃO USAR)
- ~~`mcp3_search_web`~~ → Use `mcp4_web_search_exa`
- ~~`mcp3_search_knowledge`~~ → Use `mcp11_search_nodes` ou `mcp9`
- ~~`Context7`~~ → Obsoleto, use `mcp11_*`

> **Referência completa:** `docs/technical/MCP_USE_CASES.md`
> **Memory MCP:** `mcp11_search_nodes({query: "MCP_Tool_Rules"})`

## 🧠 REGRA #2: SEQUENTIAL THINKING OBRIGATÓRIO

> **O Sequential Thinking NÃO é opcional. É a base da qualidade.**

### Matriz de Uso Obrigatório

| Situação | Thoughts Mínimos | Bloqueante? |
|----------|------------------|-------------|
| **Task P0 (Blocker)** | 7 | ✅ SIM |
| **Task P1 (Sprint)** | 5 | ✅ SIM |
| **Task P2 (Backlog)** | 3 | ⚠️ Recomendado |
| **Criar arquivo/componente** | 3 | ✅ SIM |
| **Migração de banco** | 5 | ✅ SIM |
| **Refatoração (>50 linhas)** | 5 | ✅ SIM |
| **Bug fix** | 3 | ✅ SIM |
| **Início de sessão (/start)** | 3 | ✅ SIM |
| **Fim de sessão (/end)** | 3 | ✅ SIM |
| **/prompt (criar prompt)** | 5 | ✅ SIM |
| **Resposta complexa (>500 tokens)** | 3 | ⚠️ Recomendado |

### Triggers Automáticos

O agente DEVE iniciar Sequential Thinking ao detectar:

1. **Palavras-chave de criação:** "criar", "novo", "adicionar", "implementar"
2. **Palavras-chave de risco:** "migração", "refatorar", "deletar", "remover"
3. **Prioridade alta:** Menção a P0 ou P1
4. **Complexidade:** Tarefa que afeta >3 arquivos
5. **Incerteza:** Quando não tem certeza do caminho

### Formato de Saída Esperado

Após completar o Sequential Thinking, o agente DEVE apresentar:

```markdown
## Análise Completa (X thoughts)

### Problema
[Resumo do problema]

### Abordagem Escolhida
[Solução selecionada e justificativa]

### Riscos Identificados
[Lista de riscos e mitigações]

### Próximos Passos
[Ações concretas a executar]
```

### Consequências de NÃO Usar

- ❌ **Proibido** prosseguir com tarefas P0/P1 sem ST documentado
- ❌ **Proibido** criar arquivos novos sem ST de 3+ thoughts
- ⚠️ Respostas sem ST em situações obrigatórias serão consideradas incompletas

## ⚡ MANDAMENTOS
1. **START:** Execute `/start` -> Briefing.
2. **READ:** "Já Concluído" -> NÃO REIMPLEMENTAR.
3. **UPDATE:** `task.md` baseado no briefing.
4. **THINK:** Sequential Thinking (min 5 thoughts).
5. **COMMIT:** Convencional (feat:/fix:) a cada 30-60min -> `/900` no fim.

## 🛠️ SELF-CORRECTION PROTOCOL
**If a tool fails or you encounter an error:**
1.  **DO NOT** simply apologize.
2.  **USE** `search_telemetry_logs({ only_errors: true })` to find the recent error details.
3.  **ANALYZE** the error log to understand the root cause.
4.  **RETRY** with corrected parameters or an alternative approach if possible.

## 📋 PROTOCOLO DE ATIVAÇÃO (Template OBRIGATÓRIO)
Quando executar `/start`, sua resposta DEVE seguir o template padrão definido nas regras do usuário.

## Tech Stack
- **Frontend:** Next.js, React, TailwindCSS (se solicitado), Shadcn/UI.
- **Backend:** Python (FastAPI/Flask se necessário), Supabase (PostgreSQL).
- **Tools:** MCP Servers, Composio, LangChain.

## 🎨 COMMUNICATION & FORMATTING STANDARDS (NOVO)

### Estilo Visual
1.  **Clean Markdown:** Evite poluição visual.
    -   ❌ **Não use:** Asteriscos de ação narrativa (ex: *verificando arquivos...*, *pensando*).
    -   ❌ **Não use:** Negrito excessivo em frases inteiras.
    -   ✅ **Use:** Cabeçalhos (`###`) para separar seções.
    -   ✅ **Use:** `> Blockquotes` para notas, avisos ou caminhos de arquivo importantes.

### Estrutura de Resposta
1.  **Contexto Imediato:** Comece direto ao ponto. Não diga "Vou verificar isso para você". Diga "Verifiquei X e o resultado é Y".
2.  **Hierarquia:**
    -   Use **Títulos (###)** para tópicos principais.
    -   Use **Listas** para dados.
    -   Use **Tabelas** se houver mais de 3 linhas de comparação.
3.  **Profissionalismo:** Mantenha o tom técnico, sóbrio e direto. Sem emojis excessivos (use apenas como ícones de seção se necessário).

### Exemplo de Layout
### Título da Seção
Resumo da ação realizada em texto corrido e limpo.

> **Destaque:** Informação crítica ou resultado.

* **Item 1:** Detalhe
* **Item 2:** Detalhe

---

## 💻 CODING STANDARDS
- **TypeScript:** Strict mode.
- **Python:** Type hints, docstrings.
- **Comments:** Explique o "porquê", não o "o quê".
- **Error Handling:** Robusto, sem falhas silenciosas.
