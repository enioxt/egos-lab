# INTELINK - Guia de Deploy

## 📋 Visão Geral

O INTELINK é um sistema de inteligência policial composto por:
- **Web App** (Next.js 14) - Dashboard e grafos de vínculos
- **Telegram Bot** - Ingestão de dados e consultas
- **Supabase** - Banco de dados e storage

---

## 🔧 Requisitos

### Ambiente
- Node.js 18+
- pnpm ou npm
- PM2 (para processos em background)

### Serviços Externos
- **Supabase** - Banco PostgreSQL + Storage
- **OpenRouter** - API de LLMs (Gemini, Claude, GPT)
- **Groq** - Transcrição de áudio (Whisper)
- **Telegram** - Bot API

---

## 🔑 Variáveis de Ambiente

Criar arquivo `.env.local` em `apps/intelink/`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# LLM APIs
OPENROUTER_API_KEY=sk-or-v1-...
GROQ_API_KEY=gsk_...

# Telegram Bot
TELEGRAM_BOT_TOKEN_INTELINK=123456:ABC...

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

---

## 🗄️ Banco de Dados

### Tabelas Principais
| Tabela | Descrição |
|--------|-----------|
| `intelink_investigations` | Operações/casos |
| `intelink_entities` | Pessoas, veículos, locais |
| `intelink_relationships` | Vínculos entre entidades |
| `intelink_police_units` | Delegacias/unidades |
| `intelink_sessions` | Sessões do bot |
| `intelink_evidence` | Evidências anexadas |
| `intelink_telemetry` | Métricas de uso |

### Storage Buckets
- `intelink-evidence` - Arquivos de evidências (PDFs, imagens, áudios)

### Migrations Pendentes
```sql
-- Adicionar coluna para AI chat no bot
ALTER TABLE intelink_sessions 
ADD COLUMN IF NOT EXISTS ai_chat_enabled BOOLEAN DEFAULT FALSE;
```

---

## 🚀 Deploy Local

### 1. Instalar Dependências
```bash
cd apps/intelink
pnpm install
```

### 2. Configurar Variáveis
```bash
cp .env.example .env.local
# Editar .env.local com suas chaves
```

### 3. Iniciar Servidor Web
```bash
# Desenvolvimento
pnpm dev

# Ou via PM2 (produção)
pm2 start ecosystem.config.js --only intelink-app
```

### 4. Iniciar Bot Telegram
```bash
# Em outro terminal ou via PM2
npx tsx scripts/telegram-polling.ts

# Ou via PM2
pm2 start ecosystem.config.js --only telegram-polling
```

### 5. Verificar Status
```bash
pm2 list
# Deve mostrar: intelink-app (online), telegram-polling (online)
```

---

## 🌐 Deploy Produção (Vercel)

### 1. Conectar Repositório
- Importar projeto no Vercel
- Configurar diretório: `apps/intelink`

### 2. Configurar Variáveis
- Adicionar todas as variáveis do `.env.local` no Vercel

### 3. Build Settings
```
Framework: Next.js
Build Command: pnpm build
Output Directory: .next
Install Command: pnpm install
```

### 4. Webhook do Bot
Para o bot funcionar em produção, configurar webhook:
```bash
curl "https://api.telegram.org/bot{TOKEN}/setWebhook?url=https://{DOMAIN}/api/telegram/webhook"
```

---

## 📊 Monitoramento

### PM2
```bash
pm2 logs intelink-app      # Logs do servidor
pm2 logs telegram-polling  # Logs do bot
pm2 monit                  # Dashboard
```

### Telemetria
- Acessar: `/admin/telemetry` (requer autenticação)
- Dados salvos em `intelink_telemetry`

---

## 🔄 Atualizações

### Pull & Restart
```bash
git pull origin main
pnpm install
pm2 restart all
```

### Migrações
```bash
# Via Supabase CLI
supabase db push

# Ou manualmente no SQL Editor
```

---

## 🆘 Troubleshooting

### Bot não responde
1. Verificar `TELEGRAM_BOT_TOKEN_INTELINK`
2. Checar logs: `pm2 logs telegram-polling`
3. Testar: `curl http://localhost:3001/api/telegram/webhook`

### Grafo não carrega
1. Verificar `SUPABASE_SERVICE_ROLE_KEY`
2. Checar RLS policies
3. Testar API: `curl http://localhost:3001/api/central/graph`

### Erros de CORS
- Verificar `NEXT_PUBLIC_APP_URL`
- Adicionar domínio nas configurações do Supabase

---

## 📁 Estrutura de Arquivos

```
apps/intelink/
├── app/
│   ├── api/               # API Routes
│   │   ├── central/       # APIs da Central
│   │   ├── investigation/ # APIs de operações
│   │   └── telegram/      # Webhook do bot
│   ├── central/           # Páginas da Central
│   ├── investigation/     # Páginas de operação
│   └── page.tsx           # Dashboard principal
├── components/
│   └── intelink/          # Componentes específicos
├── lib/
│   ├── intelink-service.ts # Lógica do bot
│   └── intelink/          # Módulos auxiliares
├── scripts/
│   └── telegram-polling.ts # Script de polling
└── docs/
    └── DEPLOY.md          # Este arquivo
```

---

## 📞 Suporte

- **Repositório:** github.com/enioxt/EGOSv3
- **Bot Telegram:** @IntelinkBot
- **Desenvolvedor:** @enioxt

---

*Última atualização: 2025-11-29*
