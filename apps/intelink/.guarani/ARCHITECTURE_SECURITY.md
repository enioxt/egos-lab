# Arquitetura de Segurança e Auditoria - Intelink

> **Princípio Fundamental:** "Confiança através de Transparência e Controle Granular."

Este documento define como o Intelink gerencia acesso a dados sensíveis, auditoria e compartilhamento entre unidades.

---

## 1. Modelo de Segurança (RLS-First)

O Intelink utiliza **Row Level Security (RLS)** do PostgreSQL como a fonte única da verdade para permissões. O frontend nunca deve filtrar dados por segurança; o banco de dados é quem decide o que retornar.

### Níveis de Acesso
1.  **Unit Level:** Usuário vê tudo de sua unidade (Delegacia).
2.  **Operation Level:** Usuário vê operações específicas onde foi incluído.
3.  **Cross-Case (Visibilidade Parcial):** Metadados públicos (ex: "Existe uma coincidência na Op. X") são visíveis, mas o conteúdo (detalhes, anexos) é bloqueado.

---

## 2. Sistema de Auditoria ("Caixa Preta")

Toda ação relevante deve ser registrada. O log de auditoria é imutável.

### Estrutura do Log (`intelink_audit_log`)
| Campo | Descrição |
|-------|-----------|
| `actor_id` | Quem fez a ação (UUID) |
| `action` | O que foi feito (VIEW, SEARCH, CREATE, UPDATE, DELETE, AI_PROMPT) |
| `resource` | Qual recurso (operation, evidence, person) |
| `resource_id` | ID do recurso alvo |
| `metadata` | Contexto extra (IP, Justificativa, Termo de busca) |
| `diff` | Mudanças (old_value vs new_value) |

### Gatilhos de Auditoria
1.  **Automático (DB Triggers):** INSERT/UPDATE/DELETE em tabelas críticas geram log automaticamente.
2.  **Aplicação (Hooks):** Ações de leitura sensível (abrir dossiê) e buscas são logadas via API.

---

## 3. Protocolo "Break the Glass" (Compartilhamento)

Para eliminar burocracia sem perder segurança:

1.  **Descoberta:** O sistema avisa que existe um vínculo em outra operação (ex: "Arma igual na Op. Tsunami").
2.  **Solicitação:**
    *   **Mesma Unidade:** Acesso imediato mediante **Justificativa Obrigatória** (auditada).
    *   **Outra Unidade:** Solicitação enviada ao dono da operação.
3.  **Auditoria:** O acesso via "Break the Glass" gera um alerta de auditoria nível HIGH.

---

## 4. Chat IA Seguro (RAG Security)

A IA não tem "God Mode". Ela vê o mundo através dos olhos do usuário.

### Fluxo de Consulta
1.  Usuário pergunta: "Quem é o vulgo Batata?"
2.  Sistema recupera permissões do usuário (`allowed_operation_ids`).
3.  Busca Vetorial (RAG) adiciona filtro obrigatório:
    ```json
    filter: {
      operation_id: { $in: user.allowed_operation_ids }
    }
    ```
4.  IA responde apenas com fatos permitidos.

---

## 5. Central de Evidências

Inventário global pesquisável de artefatos.
*   **Visibilidade:** Apenas evidências de operações acessíveis + Itens públicos internos.
*   **Filtros:** Tipo, Calibre, Cor, Data Apreensão.
