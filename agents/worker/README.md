# EGOS Agent Worker

> Persistent background worker for running EGOS agents 24/7 on Railway.

## Architecture

```
[Vercel /api/agents/webhook]
    │ Rate limit (30/min) + Auth
    ▼
[Railway Worker — POST /queue]
    │ Auth + Queue depth guard (max 100)
    ▼
[Redis Queue (BRPOP)]
    ▼
[SandboxManager] → git clone --depth=1 into /tmp
    ▼
[AgentExecutor] → Bun.spawn per agent (2min timeout)
    ▼
[ResultsAggregator] → Rho health score
    ▼
[Supabase audit_results]
    ▼
[Sandbox Cleanup] → rm -rf /tmp/egos-sandbox-*
```

## Modular Layers

| Layer | File | Responsibility |
|---|---|---|
| **SandboxManager** | `sandbox.ts` | Git clone, temp dir lifecycle, size limits, cleanup |
| **AgentExecutor** | `executor.ts` | Runs agents via Bun.spawn, per-agent timeout, output parsing |
| **ResultsAggregator** | `aggregator.ts` | Rho health score, findings aggregation, Supabase formatter |
| **Task Router** | `index.ts` | HTTP server, Redis queue, orchestrates pipeline |

## Deployment

The worker runs on **Railway** (`egos-lab-infrastructure` project).

```bash
# Manual deploy (from local machine, after `railway login`)
unset RAILWAY_TOKEN && railway up -d

# CI/CD — Auto-deploys via GitHub Actions when agents/ code changes
# See: .github/workflows/deploy-worker.yml
```

## Environment Variables (set on Railway)

| Variable | Required | Description |
|---|---|---|
| `REDIS_URL` | Auto | Injected by Railway Redis plugin |
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key |
| `OPENROUTER_API_KEY` | Yes | For AI-powered agents |
| `AGENT_WEBHOOK_SECRET` | Yes | Auth token for webhook↔worker |
| `PORT` | Auto | Railway injects this |
| `GITHUB_TOKEN` | No | For cloning private repos |

## API Endpoints (on Railway)

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/health` | None | Uptime, queue depth, task metrics, Redis status |
| `GET` | `/metrics` | None | Prometheus-compatible metrics |
| `POST` | `/queue` | Bearer token | Queue an agent task |

## Monitoring

```bash
# Railway logs (structured JSON)
railway logs

# Health check
curl https://egos-lab-infrastructure-production.up.railway.app/health

# Prometheus metrics
curl https://egos-lab-infrastructure-production.up.railway.app/metrics

# Queue depth (via health endpoint)
curl -s .../health | jq .queueDepth
```

## Local Development

```bash
# 1. Start Redis locally
docker run -d -p 6379:6379 redis:alpine

# 2. Set env vars
export REDIS_URL=redis://localhost:6379
export AGENT_WEBHOOK_SECRET=dev_secret
export SUPABASE_URL=https://your-project.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=your-key

# 3. Run the worker
bun agents/worker/index.ts

# 4. Send a test task
curl -X POST http://localhost:3000/queue \
  -H "Authorization: Bearer dev_secret" \
  -H "Content-Type: application/json" \
  -d '{"id":"test-001","agentId":"ssot_auditor","repoUrl":"https://github.com/enioxt/egos-lab","mode":"dry_run","requestedAt":"2026-01-01T00:00:00Z"}'
```
