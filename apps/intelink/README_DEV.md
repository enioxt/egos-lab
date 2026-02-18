# 🛡️ INTELINK - Developer Guide

> Sistema de Inteligência Policial | Police Intelligence System

**Versão:** 2.0.0  
**Última Atualização:** 2025-12-09  
**Maintainer:** Enio Xavier (@enioxt)

---

## 📋 Índice

1. [Quick Start](#-quick-start)
2. [Arquitetura](#-arquitetura)
3. [Stack Tecnológico](#-stack-tecnológico)
4. [Estrutura de Pastas](#-estrutura-de-pastas)
5. [Padrões de Código](#-padrões-de-código)
6. [APIs](#-apis)
7. [Banco de Dados](#-banco-de-dados)
8. [Autenticação](#-autenticação)
9. [Segurança](#-segurança)
10. [Testes](#-testes)
11. [Deploy](#-deploy)
12. [Troubleshooting](#-troubleshooting)

---

## 🚀 Quick Start

### Pré-requisitos

- **Node.js** >= 18.x
- **npm** >= 9.x (ou Bun >= 1.0)
- **Supabase** account (projeto configurado)
- **Telegram Bot** (opcional, para autenticação 2FA)

### Setup Local

```bash
# 1. Clone o repositório
git clone https://github.com/enioxt/EGOSv3.git
cd EGOSv3/apps/intelink

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais

# 4. Inicie o servidor de desenvolvimento
npm run dev
```

### Variáveis de Ambiente Obrigatórias

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Telegram (para 2FA)
TELEGRAM_BOT_TOKEN_INTELINK=8570192341:AAH...

# OpenRouter (para LLM)
OPENROUTER_API_KEY=sk-or-v1-...

# Google Maps (opcional)
GOOGLE_MAPS_API_KEY=AIza...
```

### Portas

| Serviço | Porta |
|---------|-------|
| Intelink (Dev) | `3001` |
| EGOS Framework | `3000` |

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (Next.js 16)                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Pages     │  │  Components │  │       Hooks         │  │
│  │  /central   │  │  Modals     │  │  usePermissions     │  │
│  │  /graph     │  │  Panels     │  │  useRole            │  │
│  │  /chat      │  │  Forms      │  │  useToast           │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      API ROUTES (/api)                       │
│  ┌─────────────────────────────────────────────────────┐    │
│  │             withSecurity() Middleware                │    │
│  │  - Rate Limiting                                     │    │
│  │  - Authentication                                    │    │
│  │  - Zod Validation                                    │    │
│  │  - Audit Logging                                     │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE (PostgreSQL)                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Tables    │  │   RLS       │  │     Functions       │  │
│  │  entities   │  │  Policies   │  │  check_duplicates   │  │
│  │  relations  │  │  per unit   │  │  cross_case_alert   │  │
│  │  members    │  │             │  │                     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Stack Tecnológico

| Camada | Tecnologia |
|--------|------------|
| **Framework** | Next.js 16 (App Router) |
| **Linguagem** | TypeScript 5.x |
| **Estilo** | TailwindCSS + shadcn/ui |
| **Banco de Dados** | Supabase (PostgreSQL + pgvector) |
| **Autenticação** | Custom (Telegram 2FA) |
| **LLM** | OpenRouter (Gemini 2.0 Flash) |
| **Gráficos** | react-force-graph |
| **Testes** | Vitest + Playwright |

---

## 📁 Estrutura de Pastas

```
apps/intelink/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── auth/          # Autenticação
│   │   ├── investigation/ # Operações CRUD
│   │   ├── intelink/      # Análise inteligente
│   │   └── central/       # Visão cross-case
│   ├── central/           # Páginas da Central
│   ├── investigation/     # Páginas de Operação
│   └── graph/             # Visualização de grafo
├── components/            # Componentes React
│   ├── intelink/          # Específicos do produto
│   └── shared/            # Compartilhados
├── hooks/                 # React Hooks customizados
├── lib/                   # Utilitários e serviços
│   ├── security/          # Middleware de segurança
│   ├── intelink/          # Lógica de negócio
│   └── api-utils.ts       # Helpers de API
└── docs/                  # Documentação local
```

---

## 📐 Padrões de Código

### API Routes

**SEMPRE use `withSecurity()` em rotas protegidas:**

```typescript
// ✅ CORRETO
import { withSecurity, SecureContext } from '@/lib/security/middleware';
import { z } from 'zod';

const schema = z.object({
    title: z.string().min(3),
});

async function handler(req: NextRequest, context: SecureContext<z.infer<typeof schema>>) {
    const { user, body } = context;
    // user já está autenticado
    // body já foi validado
}

export const POST = withSecurity(handler, {
    auth: true,
    rateLimit: 'default',
    validation: schema,
});

// ❌ ERRADO - Rota sem proteção
export async function POST(req: NextRequest) {
    // SEM autenticação, SEM rate limit, SEM validação
}
```

### Wrappers Disponíveis

| Wrapper | Auth | Rate Limit | Uso |
|---------|------|------------|-----|
| `withSecurity` | Configurável | Configurável | Rotas gerais |
| `withAuth` | Não | Auth | Login/Registro |
| `withPublic` | Não | Default | Rotas públicas |
| `withLLM` | Sim | LLM | Chat/Análise |
| `withUpload` | Sim | Upload | Documentos |
| `withAdmin` | Sim (admin) | Default | Admin-only |

### Componentes React

```typescript
// ✅ Padrão para componentes
'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/intelink/Toast';

interface MyComponentProps {
    title: string;
    onAction?: () => void;
}

export default function MyComponent({ title, onAction }: MyComponentProps) {
    const { showToast } = useToast();
    
    return (
        <div className="bg-slate-900 rounded-lg p-4">
            <h2 className="text-white font-bold">{title}</h2>
        </div>
    );
}
```

---

## 🔌 APIs

### Principais Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/investigations` | Lista operações |
| `POST` | `/api/investigation/analyze` | Análise de grafo |
| `GET` | `/api/central` | Estatísticas globais |
| `POST` | `/api/documents/extract` | OCR + Extração |
| `GET` | `/api/chat/history/[id]` | Histórico de chat |

### Padrão de Resposta

```typescript
// Sucesso
{ success: true, data: {...} }

// Erro
{ error: { code: 'VALIDATION_ERROR', message: '...' } }
```

---

## 🗄️ Banco de Dados

### Tabelas Principais

| Tabela | Descrição |
|--------|-----------|
| `intelink_investigations` | Operações/Casos |
| `intelink_entities` | Pessoas, Veículos, etc. |
| `intelink_entity_relationships` | Vínculos entre entidades |
| `intelink_unit_members` | Membros da equipe |
| `intelink_police_units` | Delegacias/Unidades |
| `intelink_sessions` | Sessões de autenticação |
| `intelink_cross_case_alerts` | Alertas automáticos |

### RLS (Row Level Security)

Todas as tabelas têm RLS habilitado. Políticas baseadas em `unit_id`:

```sql
-- Exemplo: Membros só veem sua própria unidade
CREATE POLICY "unit_isolation" ON intelink_entities
    FOR ALL USING (
        unit_id = (SELECT unit_id FROM intelink_unit_members WHERE id = auth.uid())
    );
```

---

## 🔐 Autenticação

### Fluxo de Login

```
1. Usuário digita telefone
2. Sistema verifica senha
3. OTP enviado via Telegram (2FA)
4. Sessão criada (JWT + Cookie HTTP-only)
```

### Roles do Sistema

| Role | Descrição | Permissões |
|------|-----------|------------|
| `super_admin` | Administrador global | Tudo |
| `unit_admin` | Admin da delegacia | Gerenciar unidade |
| `member` | Membro regular | Operações |
| `intern` | Estagiário | Apenas leitura |
| `visitor` | Visitante | Demonstração |

---

## 🛡️ Segurança

### Checklist de Segurança

- [x] Rate limiting em todas as rotas
- [x] Autenticação 2FA (Telegram)
- [x] HTTPS obrigatório em produção
- [x] Headers de segurança (CSP, CORS)
- [x] Audit logging
- [ ] Pentest externo (Planejado)

### Relatório de Vulnerabilidades

Encontrou um bug de segurança? Email: security@egos.ai (privado)

---

## 🧪 Testes

### Executar Testes

```bash
# Unit tests
npm run test

# E2E tests (Playwright)
npm run test:e2e

# Coverage report
npm run test:coverage
```

### Estrutura de Testes

```
tests/
├── unit/           # Testes unitários
├── integration/    # Testes de API
└── e2e/           # Testes Playwright
```

---

## 🚀 Deploy

### Vercel (Produção)

```bash
# Deploy manual
vercel --prod

# CI/CD automático
# Push para `main` → Deploy automático
```

### Variáveis de Ambiente (Produção)

Configurar no Vercel Dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `TELEGRAM_BOT_TOKEN_INTELINK`
- `OPENROUTER_API_KEY`

---

## 🔧 Troubleshooting

### Erro: "Supabase connection failed"

```bash
# Verifique as variáveis de ambiente
cat .env.local | grep SUPABASE
```

### Erro: "Rate limit exceeded"

```
# Aguarde 60 segundos ou use outro IP
# Em desenvolvimento, pode desabilitar temporariamente
```

### Erro: "Build failed"

```bash
# Limpe o cache
rm -rf .next node_modules
npm install
npm run build
```

### Logs de Debug

```bash
# Ver logs do PM2
pm2 logs intelink

# Ver logs do Next.js
npm run dev -- --verbose
```

---

## 📚 Recursos Adicionais

- **Master Plan:** `docs/INTELINK_MASTER_PLAN_2025.md`
- **Schema de Entidades:** `docs/INTELINK_ENTITY_SCHEMA.md`
- **Security Module:** `apps/intelink/docs/SECURITY_MODULE.md`

---

## 🤝 Contribuição

1. Fork o repositório
2. Crie uma branch: `git checkout -b feat/minha-feature`
3. Commit: `git commit -m "feat: descrição"`
4. Push: `git push origin feat/minha-feature`
5. Abra um Pull Request

### Convenção de Commits

```
feat: nova funcionalidade
fix: correção de bug
docs: documentação
refactor: refatoração
test: testes
chore: manutenção
```

---

*Documento gerado por Cascade Agent - EGOSv3*
