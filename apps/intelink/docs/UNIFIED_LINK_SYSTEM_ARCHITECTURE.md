# 🧠 Sistema Unificado de Vínculos - Arquitetura

**Data:** 2025-12-05  
**Versão:** 1.0.0  
**Status:** PLANEJAMENTO

---

## 1. VISÃO GERAL

### Objetivo
Unificar os sistemas `/jobs`, `/central/alertas` e `entity-matcher` em uma plataforma coesa de detecção de vínculos em tempo real.

### Princípio Fundamental
> **"Toda entrada de dados deve gerar telemetria e passar por análise de vínculos automaticamente"**

---

## 2. STATE OF THE ART (Pesquisa)

### Papers de Referência

| Paper | Conceito | Aplicabilidade |
|-------|----------|----------------|
| **COMEM** (arXiv:2405.16884) | LLM para Entity Matching com 3 estratégias | Verificar matches duvidosos |
| **MERAI** (arXiv:2508.03767) | Pipeline Enterprise para ER em larga escala | Arquitetura resiliente |
| **BoostER** (arXiv:2403.06434) | LLM como verificador otimizado | Perguntas ótimas para LLM |
| **Incremental ER** (arXiv:2412.09355) | Model Reuse via Feature Distribution | Reusar modelos, não re-treinar |
| **FastER** (arXiv:2504.01557) | On-Demand ER em Property Graphs | Real-time ER |

### Estratégias de Cache (SOTA)

1. **Bloom Filters** - Verificação rápida de existência
2. **LSH (Locality-Sensitive Hashing)** - Busca por similaridade
3. **Embedding Cache** - Vetores pré-computados
4. **Incremental Index** - Atualização em tempo real

---

## 3. ARQUITETURA DE CAMADAS

```
┌──────────────────────────────────────────────────────────────┐
│                    ENTRADA DE DADOS                          │
│  (Upload, Texto Livre, Bot Telegram, API Externa)            │
└──────────────────────────┬───────────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────────┐
│                 TELEMETRY LAYER                              │
│  - Registra origem, timestamp, tamanho, hash                 │
│  - Classifica tipo de documento (LLM/Regex)                  │
│  - Gera trace_id para auditoria                              │
└──────────────────────────┬───────────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────────┐
│              ENTITY EXTRACTION LAYER                         │
│  - Regex: CPF, CNPJ, Placas, Telefones (instantâneo)        │
│  - LLM: Nomes, Endereços, Contexto (async)                  │
│  - NER: spaCy/Hugging Face (opcional)                       │
└──────────────────────────┬───────────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────────┐
│              MATCHING ENGINE (CACHE-FIRST)                   │
│  - Cache L1: In-memory (entidades recentes, 1000 max)       │
│  - Cache L2: IndexedDB (sessão do browser)                  │
│  - Cache L3: Postgres (persistente)                         │
│  - Algoritmo: Exact Match → Fuzzy Match → LLM Verify        │
└──────────────────────────┬───────────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────────┐
│              ALERT GENERATION LAYER                          │
│  - Cria Jobs se confiança < 100%                            │
│  - Cria Alertas Cruzados se entidade existe                 │
│  - Notifica investigadores relevantes                       │
└──────────────────────────┬───────────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────────┐
│              FEEDBACK LOOP (HUMAN-IN-THE-LOOP)               │
│  - Confirmação manual alimenta scores                       │
│  - Scores de confiança ajustados dinamicamente              │
│  - Regras novas criadas automaticamente                     │
└──────────────────────────────────────────────────────────────┘
```

---

## 4. NÍVEIS DE CONFIANÇA

### Sistema de Scoring Atômico

| Critério | Confiança | Descrição |
|----------|-----------|-----------|
| CPF Exato | 100% | Identificador único, match garantido |
| CNPJ Exato | 100% | Identificador único, match garantido |
| RG Exato | 100% | Identificador único, match garantido |
| Placa Exata | 100% | Identificador único, match garantido |
| Nome + Data Nascimento | 95% | Muito alta confiança |
| Nome + Filiação (Mãe) | 90% | Alta confiança |
| Telefone | 85% | Pode ser compartilhado |
| Endereço Similar (>90%) | 80% | Pode mudar |
| Nome Similar (Jaro-Winkler >0.9) | 70% | Requer verificação |
| Nome Similar (Jaro-Winkler >0.85) | 60% | Provável falso positivo |

### Combinação de Critérios

```
Confiança Final = MAX(critérios_100%) OR SUM(critérios_parciais) / COUNT
```

---

## 5. CACHE STRATEGY

### L1 - In-Memory (Frontend)

```typescript
interface EntityCache {
  entities: Map<string, CachedEntity>;  // key = normalized_value
  maxSize: 1000;
  ttl: 30 * 60 * 1000; // 30 minutos
}
```

### L2 - IndexedDB (Sessão)

- Persiste entre recarregamentos de página
- Sincroniza com L1 no início da sessão
- Limite: 50MB por domínio

### L3 - Postgres (Persistente)

- Tabelas: `intelink_entities`, `intelink_entity_index`
- Índices: GIN para JSONB, btree para CPF/CNPJ
- pg_trgm para similaridade de nomes

### Bloom Filter (Verificação Rápida)

- Usa hash de CPF/CNPJ/Placa
- Falso positivo possível, falso negativo nunca
- Evita queries desnecessárias ao banco

---

## 6. WORKFLOW UNIFICADO

```
[Entrada de Dados]
        │
        ▼
[Telemetry: Registra trace_id]
        │
        ▼
[Extração: Regex + LLM]
        │
        ▼
[Cache L1 Hit?] ──Sim──▶ [Match Imediato]
        │
       Não
        │
        ▼
[Cache L2 Hit?] ──Sim──▶ [Match Rápido]
        │
       Não
        │
        ▼
[Bloom Filter: Existe?] ──Não──▶ [Entidade Nova]
        │
       Sim
        │
        ▼
[Query Postgres]
        │
        ▼
[Match Encontrado?]
        │
       Sim
        │
        ▼
[Confiança ≥ 100%?]
    │         │
   Sim       Não
    │         │
    ▼         ▼
[Vínculo     [Criar Job
 Automático]  para Verificação]
```

---

## 7. UNIFICAÇÃO DAS PÁGINAS

### Antes (Separado)

- `/jobs` - Tarefas de correção (gamificação)
- `/central/alertas` - Cross-reference de entidades
- `entity-matcher` - API de matching em tempo real

### Depois (Unificado)

```
/central/vinculos
    │
    ├── Tab: Alertas Pendentes (< 100% confiança)
    │   └── Botão: "Verificar" → Modal de confirmação
    │
    ├── Tab: Jobs de Correção
    │   └── Jobs gerados automaticamente de alertas
    │
    ├── Tab: Vínculos Confirmados
    │   └── Histórico de matches confirmados
    │
    └── Sidebar: Real-time Matches
        └── Streaming de novos matches detectados
```

---

## 8. APIs NECESSÁRIAS

### Existentes

- `GET /api/jobs` - Lista jobs
- `PATCH /api/jobs` - Atualiza status
- `GET /api/intelink/cross-references` - Lista alertas
- `POST /api/intelink/match-entities` - Match em tempo real

### Novas

- `POST /api/links/confirm` - Confirmar vínculo
- `POST /api/links/reject` - Rejeitar match
- `GET /api/links/stream` - SSE para real-time
- `POST /api/telemetry/ingest` - Registrar entrada
- `GET /api/cache/stats` - Status do cache

---

## 9. TABELAS DE BANCO

### Novas

```sql
-- Tabela de vínculos confirmados
CREATE TABLE intelink_entity_links (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    source_entity_id uuid REFERENCES intelink_entities(id),
    target_entity_id uuid REFERENCES intelink_entities(id),
    confidence_score integer NOT NULL,
    match_criteria jsonb NOT NULL,
    status varchar(20) DEFAULT 'pending', -- pending, confirmed, rejected
    confirmed_by uuid[],
    rejected_by uuid[],
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Tabela de telemetria de entradas
CREATE TABLE intelink_data_ingestion_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    trace_id varchar(64) NOT NULL,
    source varchar(50) NOT NULL, -- upload, text_libre, telegram, api
    document_type varchar(50),
    file_hash varchar(64),
    entities_extracted integer DEFAULT 0,
    matches_found integer DEFAULT 0,
    processing_time_ms integer,
    created_at timestamptz DEFAULT now(),
    created_by uuid
);
```

---

## 10. MÉTRICAS DE SUCESSO

| Métrica | Meta | Atual |
|---------|------|-------|
| Tempo de match (L1) | < 10ms | - |
| Tempo de match (L2) | < 50ms | - |
| Tempo de match (L3) | < 200ms | - |
| Precisão de matches | > 95% | - |
| Recall de matches | > 90% | - |
| Jobs auto-gerados/dia | > 10 | - |
| Taxa de confirmação | > 80% | - |

---

## 11. PRÓXIMOS PASSOS

1. **P0:** Corrigir erros do modelo anterior (auth/page.tsx)
2. **P0:** Implementar Telemetry Layer
3. **P1:** Implementar Cache L1 (in-memory)
4. **P1:** Unificar UI de /jobs e /alertas
5. **P2:** Integrar LLM Verifier
6. **P2:** Dashboard de telemetria

---

## 12. REFERÊNCIAS

- [COMEM Paper](https://arxiv.org/abs/2405.16884)
- [MERAI Paper](https://arxiv.org/abs/2508.03767)
- [BoostER Paper](https://arxiv.org/abs/2403.06434)
- [FastER Paper](https://arxiv.org/abs/2504.01557)
- [Bloom Filter Explained](https://en.wikipedia.org/wiki/Bloom_filter)
- [pg_trgm Documentation](https://www.postgresql.org/docs/current/pgtrgm.html)
