# EGOS Agent Worker

Persistent background worker for running EGOS agents 24/7.

## Architecture

```
Vercel (webhook) → Redis LPUSH → Worker BRPOP → Process → Supabase INSERT
```

## Setup (Oracle Cloud / Railway / Any VPS)

```bash
# 1. Install dependencies
sudo apt update && sudo apt install -y redis-server
curl -fsSL https://bun.sh/install | bash
npm i -g pm2

# 2. Clone and install
git clone https://github.com/enioxt/egos-lab.git
cd egos-lab && bun install

# 3. Configure environment
cp agents/worker/.env.example agents/worker/.env
# Edit .env with your Redis URL, Supabase credentials

# 4. Start with PM2
pm2 start agents/worker/index.ts --name agent-worker --interpreter bun
pm2 save
pm2 startup  # Auto-start on reboot
```

## Environment Variables

| Variable | Required | Default |
|---|---|---|
| `REDIS_URL` | No | `redis://localhost:6379` |
| `SUPABASE_URL` | Yes | — |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | — |

## Monitoring

```bash
pm2 logs agent-worker        # Live logs
pm2 monit                    # CPU/Memory dashboard
redis-cli LLEN agent:tasks   # Queue depth
redis-cli GET worker:heartbeat  # Last heartbeat
```

## Testing Locally

```bash
# Terminal 1: Start the worker
bun agents/worker/index.ts

# Terminal 2: Push a test task
redis-cli LPUSH agent:tasks '{"id":"test-001","agentId":"ssot-auditor","repoUrl":"https://github.com/enioxt/egos-lab","mode":"dry_run","requestedAt":"2026-02-19T00:00:00Z"}'
```
