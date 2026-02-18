# 🧠 INTELINK System Prompts Registry

**Versão:** 1.0.0  
**Última Atualização:** 2025-12-14  
**Mantido por:** EGOS System

---

## 📋 Visão Geral

Este é o catálogo centralizado de todos os system prompts utilizados no Intelink.
Cada prompt deve ser registrado aqui para facilitar manutenção, auditoria e evolução.

---

## 🗂️ Estrutura de Diretórios

```
/lib/prompts/
├── PROMPT_REGISTRY.md      # Este arquivo (catálogo)
├── index.ts                 # Exportações centralizadas
├── types.ts                 # Tipos TypeScript
├── registry.ts              # Registro programático
│
├── chat/                    # Prompts de conversação
│   ├── intelink-system.ts   # Chat principal INTELINK
│   ├── vision.ts            # Análise de imagens
│   └── debate.ts            # Debate Tsun-Cha
│
├── extraction/              # Extração de documentos
│   ├── reds.ts              # REDS/Boletim de Ocorrência
│   ├── comunicacao.ts       # Comunicação de Serviço
│   ├── inquerito.ts         # Inquérito Policial
│   ├── depoimento.ts        # Oitivas/Depoimentos
│   └── free-text.ts         # Texto livre
│
├── analysis/                # Análise de inteligência
│   ├── operation.ts         # Análise de operação
│   ├── entity-synthesis.ts  # Síntese de entidades
│   └── risk-assessment.ts   # Análise de risco
│
├── journey/                 # Jornada investigativa
│   └── analyst.ts           # Análise de trajeto
│
└── reports/                 # Geração de relatórios
    ├── intelligence.ts      # Relatório de inteligência
    ├── dossier.ts           # Dossiê de alvo
    └── executive.ts         # Resumo executivo
```

---

## 📊 Catálogo de Prompts

### Chat

| ID | Nome | Arquivo | Versão | Modelo | Status |
|----|------|---------|--------|--------|--------|
| `chat.main` | INTELINK System Prompt | `intelink-system-prompt.ts` | 5.0 | Gemini 2.0 | ✅ Ativo |
| `chat.vision` | Vision Analysis | `chat/vision.ts` | 1.0 | Gemini 2.0 | ✅ Ativo |
| `chat.debate` | Tsun-Cha Debate | `chat/debate.ts` | 1.0 | Gemini 2.0 | ✅ Ativo |

### Documents

| ID | Nome | Arquivo | Versão | Modelo | Status |
|----|------|---------|--------|--------|--------|
| `documents.guardian` | Guardian AI | `documents/guardian.ts` | 1.0 | Gemini 2.0 | ✅ Ativo |

### Extraction

| ID | Nome | Arquivo | Versão | Modelo | Status |
|----|------|---------|--------|--------|--------|
| `extraction.reds` | REDS Extraction | `extraction/reds.ts` | 3.0 | Gemini 2.0 | ✅ Ativo |
| `extraction.cs` | Comunicação de Serviço | `extraction/comunicacao.ts` | 2.0 | Gemini 2.0 | ✅ Ativo |
| `extraction.inquerito` | Inquérito Policial | `extraction/inquerito.ts` | - | - | 🔜 Pendente |
| `extraction.depoimento` | Oitiva/Depoimento | `extraction/depoimento.ts` | - | - | 🔜 Pendente |
| `extraction.free` | Texto Livre | `extraction/free-text.ts` | - | - | 🔜 Pendente |

### Analysis

| ID | Nome | Arquivo | Versão | Modelo | Status |
|----|------|---------|--------|--------|--------|
| `analysis.operation` | Análise de Operação | `analysis/operation.ts` | 1.1 | Gemini 2.0 | ✅ Ativo |
| `analysis.entity` | Síntese de Entidade | `analysis/entity-synthesis.ts` | 1.0 | Gemini 2.0 | ✅ Ativo |
| `analysis.risk` | Avaliação de Risco | `analysis/risk-assessment.ts` | 1.0 | Gemini 2.0 | 🔜 Pendente |

### Journey

| ID | Nome | Arquivo | Versão | Modelo | Status |
|----|------|---------|--------|--------|--------|
| `journey.analyst` | Journey Analyst | `journey/analyst.ts` | 1.0 | Gemini 2.0 | ✅ Ativo |

### Reports

| ID | Nome | Arquivo | Versão | Modelo | Status |
|----|------|---------|--------|--------|--------|
| `report.intelligence` | Relatório de Inteligência | `reports/intelligence.ts` | 1.0 | Gemini 2.0 | ✅ Ativo |
| `report.dossier` | Dossiê de Alvo | `reports/dossier.ts` | 1.0 | Gemini 2.0 | ✅ Ativo |
| `report.executive` | Resumo Executivo | `reports/executive.ts` | 1.0 | Gemini 2.0 | 🔜 Pendente |

---

## 📐 Padrões de Prompt

### Estrutura Padrão

Todo prompt deve seguir esta estrutura:

```typescript
/**
 * [Nome do Prompt]
 * 
 * @id [categoria.nome]
 * @version [X.Y.Z]
 * @model [modelo recomendado]
 * @updated [YYYY-MM-DD]
 * @author [autor]
 */

export const PROMPT_ID = `[conteúdo do prompt]`;

export const promptConfig = {
    id: 'categoria.nome',
    name: 'Nome Legível',
    version: '1.0.0',
    model: 'google/gemini-2.0-flash-001',
    temperature: 0.3,
    maxTokens: 4000,
};

export function buildPrompt(params: PromptParams): string {
    // Builder function para personalização
}
```

### Regras de Estilo

1. **Idioma:** Português BR para outputs ao usuário
2. **Formatação:** NÃO usar asteriscos (*) para ênfase - usar MAIÚSCULAS
3. **Estrutura:** Dividir em seções claras com cabeçalhos
4. **Tom:** Profissional, técnico, policial
5. **Output:** Definir formato esperado (JSON, Markdown, etc.)

---

## 🔄 Processo de Atualização

1. Editar arquivo do prompt
2. Atualizar versão no arquivo
3. Atualizar este registro
4. Testar em ambiente de desenvolvimento
5. Commit com mensagem: `chore(prompts): update [prompt-id] to vX.Y.Z`

---

## 📈 Métricas

Cada prompt deve ser monitorado para:
- Taxa de sucesso (respostas válidas)
- Tokens médios consumidos
- Tempo de resposta
- Feedback dos usuários

---

## 🔗 APIs que Consomem Prompts

| Prompt ID | API Route |
|-----------|-----------|
| `chat.main` | `/api/chat` |
| `chat.vision` | `/api/chat/vision` |
| `chat.debate` | `/api/debate` |
| `extraction.*` | `/api/documents/extract`, `/api/documents/batch` |
| `analysis.operation` | `/api/investigation/analyze` |
| `journey.analyst` | `/api/intelligence/journey` |
| `report.intelligence` | `/api/report`, `/api/investigation/[id]/report` |
| `report.dossier` | `/api/intelligence/dossier` |

---

*"System prompts are the soul of AI agents. Keep them organized, versioned, and evolved."*
