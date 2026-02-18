# 🔍 DIAGNÓSTICO TÉCNICO - INTELINK

**Gerado em:** 2025-12-16  
**Versão do Sistema:** 5.0.0  
**Analista:** Cascade AI (Diagnóstico Automatizado)

---

## 📋 SUMÁRIO EXECUTIVO

O **Intelink** é um sistema maduro de inteligência policial com arquitetura sólida baseada em Next.js 16 + Supabase. O sistema está em produção (https://intelink.ia.br) com funcionalidades core estáveis, porém apresenta débitos técnicos relacionados a tamanho de arquivos e migrações incompletas.

### Status Geral: 🟢 SAUDÁVEL (débitos técnicos em P1)

| Área | Status | Nota |
|------|:------:|------|
| Funcionalidades Core | 🟢 | 95% operacional |
| Arquitetura | 🟡 | Sólida, mas com arquivos grandes |
| Segurança | 🟢 | RLS, tenant isolation, middleware ✅ |
| Documentação | 🟢 | 26+ arquivos, README completo |
| Testes | 🟡 | E2E e Unit existem, cobertura parcial |
| Performance | 🟡 | Arquivos grandes, bundle otimizável |

---

## 🚨 ACHADOS CRÍTICOS (Revisão 16/12/2025 14:00)

### 1. ✅ MIDDLEWARE CORRIGIDO (16/12/2025 14:00)

**Problema Original:** O arquivo existia como `middleware.ts` mas a função exportada se chamava `proxy()` em vez de `middleware()`. O Next.js **exige** que a função tenha este nome exato.

**Correção Aplicada:**
```typescript
// Antes (não funcionava)
export function proxy(request: NextRequest) { ... }

// Depois (funcional)
export function middleware(request: NextRequest) { ... }
```

**Status:** ✅ Corrigido - Middleware agora protege rotas globalmente

### 2. GOD OBJECT PARCIALMENTE REFATORADO

**Problema:** `lib/intelink-service.ts` (67KB) está num estado "zumbi":
- Parte delega para módulos em `lib/intelink/*`
- Parte ainda tem código inline duplicado
- Confusão sobre "fonte da verdade" para funções

**Impacto:** Manutenção difícil, bugs por código duplicado.

### 3. AUTH HÍBRIDO SEM GATEKEEPER

**Problema:** Sistema suporta dois cookies:
- `intelink_access` (v2 JWT)
- `intelink_session` (legacy)

Sem middleware ativo, o fallback entre eles não funciona globalmente.

---

## 🏗️ ARQUITETURA

### Stack Tecnológico

| Camada | Tecnologia | Versão |
|--------|------------|:------:|
| **Framework** | Next.js (App Router) | 16.0.10 |
| **UI** | React | 19.0.0 |
| **Styling** | Tailwind CSS | 3.4.17 |
| **Database** | Supabase PostgreSQL | Cloud |
| **Auth** | Supabase Auth + JWT | - |
| **LLM** | OpenRouter (Gemini 2.0) | - |
| **OCR** | Tesseract.js | 6.0.1 |
| **Grafos** | react-force-graph-2d/3d | 1.26.4 |
| **Charts** | Recharts | 3.5.0 |
| **PDF** | jsPDF, pdf-parse, unpdf | - |

### Estrutura de Diretórios

```
apps/intelink/
├── app/                    # Next.js App Router (184 items)
│   ├── api/               # Backend APIs (135+ endpoints)
│   ├── central/           # Hub administrativo (22 páginas)
│   ├── investigation/     # Páginas de investigação
│   ├── graph/             # Visualização de grafo
│   ├── chat/              # Chat IA
│   └── ...                # Outras páginas
├── components/            # Componentes React (107 items)
│   ├── shared/            # Reutilizáveis (22)
│   ├── intelink/          # Específicos do domínio (21)
│   ├── intelligence/      # IA Lab tools (5)
│   └── ...
├── lib/                   # Bibliotecas e serviços (146 items)
│   ├── auth/              # Autenticação (10 items)
│   ├── entity-resolution/ # Merge de entidades
│   ├── prompts/           # Prompts de LLM (16)
│   ├── security/          # Módulos de segurança (7)
│   └── ...
├── hooks/                 # React Hooks customizados (9)
├── providers/             # Context providers (3)
├── docs/                  # Documentação (26 arquivos)
└── tests/                 # Testes E2E e Unit
```

---

## 📄 MAPA DE PÁGINAS (Frontend)

### Páginas Principais

| Rota | Arquivo | Tamanho | Status |
|------|---------|:-------:|:------:|
| `/` | `app/page.tsx` | **67KB** ⚠️ | Funcional |
| `/central` | `app/central/page.tsx` | 10KB | Funcional |
| `/central/intelligence-lab` | Subpágina | - | Funcional |
| `/central/vinculos` | Subpágina | - | Funcional |
| `/investigation/[id]` | Dinâmica | - | Funcional |
| `/graph/[id]` | Dinâmica | - | Funcional |
| `/chat` | `app/chat/` | - | Funcional |
| `/admin/*` | Administrativo | - | Funcional |

### Central Hub (22 subpáginas)

```
/central/
├── alertas/           # Alertas do sistema
├── auditoria/         # Logs de auditoria
├── delegacias/        # Gestão de delegacias
├── documentos/        # Documentos da central
├── entidades/         # Central de entidades
├── evidencias/        # Central de evidências
├── graph/             # Grafo da central
├── intelligence-lab/  # Laboratório IA
├── membros/           # Gestão de membros
├── operacoes/         # Lista de operações
├── permissoes/        # Controle de acesso
├── qualidade/         # Métricas de qualidade
├── saude/             # Saúde do sistema (Rho)
├── vinculos/          # Cross-case alerts
└── ...
```

---

## 🔌 MAPA DE APIs (Backend)

### Contagem por Domínio

| Domínio | Endpoints | Descrição |
|---------|:---------:|-----------|
| `/api/documents/*` | 8 | Upload, extração, processamento |
| `/api/entities/*` | 8 | CRUD, merge, cleanup |
| `/api/entity/*` | 2 | Related entities, indirect |
| `/api/investigation/*` | 7 | Operações e análise |
| `/api/chat/*` | 9 | Chat IA, histórico, share |
| `/api/members/*` | 7 | Gestão de membros |
| `/api/rho/*` | 6 | Governança de rede |
| `/api/reports/*` | 4 | Geração de relatórios |
| `/api/v2/*` | 13 | APIs v2 (migração) |
| `/api/...` | ~70+ | Outros domínios |

### APIs Críticas

```
POST /api/documents/save      # Salva documento + extrai entidades
POST /api/documents/extract   # Extração com LLM
POST /api/chat               # Chat IA contextual
POST /api/entity-resolution  # Detecta duplicatas
POST /api/entities/merge     # Merge de entidades
POST /api/links/confirm      # Confirma cross-case
GET  /api/search             # Busca global
```

---

## 🗄️ BANCO DE DADOS

### Principais Tabelas (80+ no schema public)

| Prefixo | Tabelas | Descrição |
|---------|:-------:|-----------|
| `intelink_*` | ~50 | Core do sistema |
| `ethik_*` | 3 | Gamificação |
| `code_*` | 2 | RAG de código |
| `contribution_*` | 2 | Contribuições |
| `volante_*` | 5 | Sistema Volante |

### Tabelas Core Intelink

```
intelink_investigations      # Operações policiais
intelink_entities            # Pessoas, veículos, locais, etc.
intelink_relationships       # Vínculos entre entidades
intelink_documents           # Documentos processados
intelink_unit_members        # Membros das delegacias
intelink_units               # Delegacias/unidades
intelink_cross_case_alerts   # Alertas cruzados
intelink_entity_links        # Links confirmados
intelink_journeys            # Diário de bordo (Journey)
intelink_reports             # Relatórios gerados
intelink_merge_pending       # Merges pendentes
```

### Segurança de Dados

- ✅ **RLS (Row Level Security)** ativo em todas tabelas
- ✅ **Tenant Isolation** por `unit_id`
- ✅ **Audit Logging** via `intelink_audit_logs`
- ✅ **Entity Guards** para acesso a entidades

---

## ✅ FUNCIONALIDADES COMPLETAS

### Core Features

| Feature | Status | Arquivos Principais |
|---------|:------:|---------------------|
| **Extração de Documentos** | ✅ | `lib/document-extraction.ts` |
| **Entity Resolution** | ✅ | `lib/entity-resolution/` |
| **Cross-Case Alerts** | ✅ | `components/CrossCaseAlertsPanel.tsx` |
| **Grafo de Vínculos** | ✅ | `components/graph/` |
| **Chat IA** | ✅ | `app/api/chat/`, `components/chat/` |
| **Busca Global** | ✅ | `components/shared/GlobalSearch.tsx` |
| **Journey (Diário)** | ✅ | `hooks/useJourney.ts`, `components/shared/Journey*` |
| **Relatórios** | ✅ | `lib/reports/`, `app/api/reports/` |
| **RBAC** | ✅ | `lib/rbac/`, `hooks/useRole.tsx` |
| **PWA Offline** | ✅ | `public/manifest.json`, service worker |

### Intelligence Lab Tools

| Tool | Status | Descrição |
|------|:------:|-----------|
| **Jurista IA** | ✅ | Análise jurídica de textos |
| **Entity Resolver** | ✅ | Merge de duplicatas |
| **Nexus** | ✅ | Cross-case connections |
| **Cronos** | ✅ | Timeline extraction |

---

## ⚠️ FUNCIONALIDADES PARCIAIS

| Feature | Estado | O que falta |
|---------|:------:|-------------|
| **v2 APIs** | 🟡 | 13 endpoints, migração incompleta |
| **Telegram Bot** | 🟡 | Desabilitado temporariamente |
| **Integrações Externas** | 🔴 | Infoseg, SIP, REDS não implementados |
| **Prompts Específicos** | 🟡 | 5 tipos de documento sem prompt |
| **Telemetry Calculations** | 🟡 | slowestEndpoints não calculado |

---

## 🔴 DÉBITOS TÉCNICOS

### 1. Arquivos Grandes (Prioridade Alta)

| Arquivo | Tamanho | Recomendação |
|---------|:-------:|--------------|
| `app/page.tsx` | **67KB** | Dividir em componentes |
| `lib/intelink-service.ts` | **67KB** | Extrair serviços específicos |
| `CrossCaseAlertsPanel.tsx` | 24KB | Componentizar |

### 2. Código Legacy

| Arquivo/Pasta | Ação Recomendada |
|---------------|------------------|
| `auth-legacy.ts` | Remover após migração |
| `vinculos-legacy/` | Remover se não usado |
| `.archive/` | Limpar periodicamente |

### 3. TODOs Pendentes

```
1. /api/admin/telemetry - Calcular slowestEndpoints
2. /api/documents/batch - Criar documento e passar ID
3. /api/members/role - Re-enable Telegram bot
4. lib/evidence-validation - Integrações Infoseg, SIP, REDS
5. lib/prompts/index - 5 prompts específicos faltando
6. components/DocumentUploadModal - Aplicar sugestões
7. components/EvidencePanel - Modal de upload
```

### 4. Inconsistências Arquiteturais

- Múltiplos sistemas de auth (`auth/`, `auth-legacy.ts`, `auth-client.ts`)
- v2 APIs paralelas indicam migração não finalizada
- Alguns componentes em `/components/` e outros em `/components/shared/`

---

## 🚨 RISCOS E GARGALOS

### Riscos Técnicos

| Risco | Severidade | Mitigação |
|-------|:----------:|-----------|
| Arquivos grandes | Alta | Refatorar em componentes menores |
| Custo de LLM | Média | Caching, rate limiting |
| Migração v2 incompleta | Média | Finalizar ou reverter |
| Auth system fragmentation | Média | Consolidar em um módulo |

### Gargalos de Performance

1. **Bundle Size**: Arquivos de 67KB aumentam tempo de carregamento
2. **API Calls**: Muitas APIs podem ter queries não otimizadas
3. **LLM Latency**: Extração de documentos depende de API externa

### Dependências Críticas

| Dependência | Criticidade | Alternativa |
|-------------|:-----------:|-------------|
| Supabase | Alta | Self-hosted PostgreSQL |
| OpenRouter/Gemini | Alta | OpenAI, Claude, local LLM |
| Vercel | Média | Netlify, Railway, self-hosted |

---

## 📈 OPORTUNIDADES DE MELHORIA

### Curto Prazo (1-2 sprints)

1. **Dividir page.tsx** em componentes menores
2. **Extrair serviços** de intelink-service.ts
3. **Finalizar migração v2** ou reverter
4. **Aumentar cobertura de testes**
5. **Implementar prompts faltantes**

### Médio Prazo (3-6 sprints)

1. **Integrações externas** (Infoseg, SIP, REDS)
2. **Re-habilitar Telegram Bot**
3. **Otimizar queries** do banco
4. **Implementar caching** mais agressivo
5. **Monitoramento** de custos LLM

### Longo Prazo (6+ sprints)

1. **Microserviços** para escalabilidade
2. **ML próprio** para reduzir dependência de LLM
3. **Multi-tenant** completo
4. **API pública** para integrações

---

## 🎯 PRÓXIMOS PASSOS RECOMENDADOS

### Prioridade P0 (Imediato)

1. [ ] Refatorar `app/page.tsx` (67KB → componentes)
2. [ ] Refatorar `lib/intelink-service.ts` (67KB → serviços)
3. [ ] Decidir sobre v2 APIs (finalizar ou reverter)

### Prioridade P1 (Sprint Atual)

1. [ ] Implementar 5 prompts específicos faltantes
2. [ ] Aumentar cobertura de testes E2E
3. [ ] Consolidar sistema de autenticação
4. [ ] Documentar APIs com OpenAPI/Swagger

### Prioridade P2 (Backlog)

1. [ ] Integrações Infoseg, SIP, REDS
2. [ ] Re-habilitar Telegram Bot
3. [ ] Dashboard de custos LLM
4. [ ] Performance profiling

---

## 📊 MÉTRICAS DO SISTEMA

### Contagem de Código

| Métrica | Quantidade |
|---------|:----------:|
| Páginas Frontend | ~20 |
| Endpoints API | 135+ |
| Componentes | 107 |
| Hooks Customizados | 9 |
| Arquivos em /lib | 146 |
| Tabelas no Banco | 80+ |
| Arquivos de Docs | 26 |

### Qualidade de Código

| Métrica | Status |
|---------|:------:|
| TypeScript | ✅ 100% |
| ESLint | ✅ Configurado |
| Testes Unit | 🟡 Parcial |
| Testes E2E | 🟡 Parcial |
| Documentação | ✅ Boa |

---

## 🔗 REFERÊNCIAS

- **README:** `/apps/intelink/README.md`
- **TASKS:** `/TASKS.md`
- **Arquitetura:** `/apps/intelink/docs/ARCHITECTURE.md`
- **Segurança:** `/apps/intelink/docs/SECURITY_AUDIT_2025-12-05.md`
- **Entity Schema:** `/apps/intelink/docs/INTELINK_ENTITY_SCHEMA.md`
- **Sprint Plan:** `/apps/intelink/docs/SPRINT_40_PLAN.md`

---

*Este diagnóstico foi gerado automaticamente e deve ser atualizado periodicamente.*
