# 🔍 Diagnóstico Completo das APIs - Intelink

**Data:** 2025-12-04
**Total de Endpoints:** 55
**Total de Linhas:** ~7500

---

## 📊 Visão Geral por Categoria

| Categoria | Endpoints | Linhas | Status |
|-----------|:---------:|:------:|:------:|
| Auth | 4 | 548 | ✅ Bem organizado |
| Chat | 7 | 1162 | ✅ Bem organizado |
| Documents | 7 | 2102 | ✅ Bem organizado |
| Investigation | 5 | 635 | ⚠️ Duplicação |
| Intelink | 8 | 914 | ⚠️ Duplicação |
| Central | 4 | 374 | ⚠️ Duplicação |
| Outros | 20 | ~1800 | ⚠️ Fragmentado |

---

## 🔴 DUPLICAÇÕES IDENTIFICADAS

### 1. Stats (3 endpoints fazem coisas similares)

| Endpoint | Função | Linhas |
|----------|--------|:------:|
| `/api/stats` | Contagem básica (inv, entities, rel, evidence) | 31 |
| `/api/central/stats` | Contagem + units + members | 31 |
| `/api/analytics` | Contagem + métricas avançadas | 89 |

**RECOMENDAÇÃO:** Consolidar em `/api/stats` com query params:
```
GET /api/stats?scope=basic|central|full
```

### 2. Investigations (2 endpoints duplicados)

| Endpoint | Função | Linhas |
|----------|--------|:------:|
| `/api/investigations` | PATCH + GET com filtros | 84 |
| `/api/intelink/investigations` | GET simples para cross-ref | 32 |

**RECOMENDAÇÃO:** Mover funcionalidade para `/api/investigations`:
```
GET /api/investigations?for=cross-ref  # Lista simplificada
GET /api/investigations                 # Lista completa
```

### 3. Report (3 endpoints fragmentados)

| Endpoint | Função | Linhas |
|----------|--------|:------:|
| `/api/report` | Gerar relatório (POST) | 151 |
| `/api/report/generate` | Também gera relatório | 99 |
| `/api/investigation/[id]/report` | Relatório específico | 134 |

**RECOMENDAÇÃO:** Consolidar em `/api/reports`:
```
POST /api/reports                    # Criar relatório
POST /api/reports/generate           # Gerar com IA
GET  /api/reports/:id                # Buscar relatório
```

### 4. History (2 endpoints)

| Endpoint | Função | Linhas |
|----------|--------|:------:|
| `/api/history` | Histórico de operação | 49 |
| `/api/chat/history` | Histórico de chat | 131 |

**STATUS:** ✅ OK - São contextos diferentes

---

## ⚠️ APIs SEM DOCUMENTAÇÃO

| Endpoint | Linhas | Urgência |
|----------|:------:|:--------:|
| `/api/activities` | 98 | Média |
| `/api/entity/[id]/related` | 102 | Alta |
| `/api/findings` | 156 | Alta |
| `/api/jobs` | 86 | Média |
| `/api/notifications` | 93 | Média |
| `/api/session` | 47 | Baixa |

---

## 🎯 APIs BEM DOCUMENTADAS

| Endpoint | Comentários | Uso de Helpers |
|----------|:-----------:|:--------------:|
| `/api/documents/extract` | ✅ Excelente | ✅ |
| `/api/documents/embeddings` | ✅ Excelente | ✅ |
| `/api/documents/save` | ✅ Bom | ✅ |
| `/api/health` | ✅ Excelente | ✅ |
| `/api/chat` | ✅ Bom | ✅ |

---

## 🔧 OPORTUNIDADES DE OTIMIZAÇÃO

### 1. Consolidar Helpers (Já feito parcialmente)

```typescript
// ✅ Já existe: lib/api-utils.ts
import { getSupabaseAdmin, successResponse, errorResponse } from '@/lib/api-utils';
```

**Adoção atual:** ~70% das APIs usam os helpers

### 2. Adicionar Caching

APIs candidatas para cache (dados mudam pouco):
- `/api/stats` - Cache 5 min
- `/api/central/stats` - Cache 5 min
- `/api/roles` - Cache 1 hora
- `/api/units` (GET) - Cache 10 min

### 3. Adicionar Rate Limiting

APIs críticas que precisam de rate limit:
- `/api/documents/extract` - 10/min (custo LLM)
- `/api/documents/embeddings` - 20/min (custo embedding)
- `/api/chat` - 30/min (custo LLM)
- `/api/investigation/analyze` - 5/min (custo LLM)

---

## 📋 PLANO DE AÇÃO

### P0 - Crítico (Esta Semana)

| # | Ação | Impacto |
|:-:|------|---------|
| 1 | Consolidar `/api/stats` + `/api/central/stats` | Menos código |
| 2 | Remover `/api/intelink/investigations` (usar `/api/investigations`) | Menos duplicação |
| 3 | Documentar `/api/documents/*` (JSDoc) | Manutenibilidade |

### P1 - Importante (Próxima Semana)

| # | Ação | Impacto |
|:-:|------|---------|
| 4 | Consolidar `/api/report/*` | Menos fragmentação |
| 5 | Adicionar cache em `/api/stats` | Performance |
| 6 | Documentar `/api/findings` e `/api/entity/*` | Manutenibilidade |

### P2 - Melhoria (Backlog)

| # | Ação | Impacto |
|:-:|------|---------|
| 7 | Rate limiting em APIs de LLM | Custo |
| 8 | Migrar 100% para api-utils helpers | Consistência |
| 9 | Testes automatizados para APIs críticas | Qualidade |

---

## 📈 MÉTRICAS ATUAIS

| Métrica | Valor | Meta |
|---------|:-----:|:----:|
| Total de endpoints | 55 | 45 |
| Endpoints duplicados | 6 | 0 |
| APIs com JSDoc | 30% | 80% |
| APIs usando helpers | 70% | 100% |
| APIs com cache | 0% | 20% |
| APIs com rate limit | 0% | 30% |

---

## 🗂️ ESTRUTURA RECOMENDADA

```
apps/intelink/app/api/
├── auth/                    # 4 endpoints ✅
│   ├── me/
│   ├── phone/
│   ├── remember/
│   └── verify/
├── chat/                    # 7 endpoints ✅
│   ├── route.ts            # POST (main chat)
│   ├── conversations/
│   ├── history/
│   ├── messages/
│   └── share/
├── documents/               # 7 endpoints ✅
│   ├── route.ts            # (consolidar upload aqui)
│   ├── batch/
│   ├── embeddings/
│   ├── extract/
│   └── [id]/
├── investigations/          # CONSOLIDAR
│   ├── route.ts            # GET, POST, PATCH
│   ├── [id]/
│   │   ├── route.ts        # GET, DELETE
│   │   ├── report/
│   │   ├── restore/
│   │   └── timeline/
│   └── analyze/
├── entities/                # MOVER de /intelink
│   ├── route.ts
│   └── [id]/
├── central/                 # 4 endpoints ✅
│   ├── route.ts
│   ├── graph/
│   ├── alerts/
│   └── stats/              # REMOVER (consolidar em /stats)
├── stats/                   # CONSOLIDAR
│   └── route.ts            # scope=basic|central|full
└── health/                  # 1 endpoint ✅
    └── route.ts
```

---

**Próximo Passo:** Executar P0 para reduzir de 55 para ~50 endpoints

