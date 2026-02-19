/**
 * EGOS Agent Worker v3.0 — Hardened Production Worker
 * 
 * Runs 24/7 on Railway with:
 * - Rate limiting on inbound HTTP
 * - Structured JSON logging with correlation IDs
 * - Health + metrics endpoints
 * - Queue depth guard (max 100 pending tasks)
 * - Task timeout (10 min max)
 * - Heartbeat to Redis
 */

import { createClient, type RedisClientType } from 'redis';

// --- Configuration ---

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const AGENT_WEBHOOK_SECRET = process.env.AGENT_WEBHOOK_SECRET;
const PORT = parseInt(process.env.PORT || '3000', 10);
const TASK_QUEUE = 'agent:tasks';
const RESULT_CHANNEL = 'agent:results';
const MAX_QUEUE_DEPTH = 100;
const TASK_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW_MS = 60_000;

// --- Startup guard ---

if (!AGENT_WEBHOOK_SECRET) {
    console.error('[WORKER] ❌ FATAL: AGENT_WEBHOOK_SECRET is not set. Refusing to start insecure.');
    process.exit(1);
}

// --- Types ---

interface AgentTask {
    id: string;
    agentId: string;
    repoUrl: string;
    mode: 'dry_run' | 'execute';
    requestedAt: string;
}

interface AgentResult {
    taskId: string;
    agentId: string;
    repoUrl: string;
    status: 'success' | 'error' | 'timeout';
    health?: number;
    durationMs: number;
    completedAt: string;
    error?: string;
}

// --- Metrics ---

const metrics = {
    startedAt: new Date().toISOString(),
    tasksProcessed: 0,
    tasksSucceeded: 0,
    tasksFailed: 0,
    tasksTimedOut: 0,
    httpRequestsTotal: 0,
    httpRequestsRejected: 0,
    lastTaskAt: null as string | null,
};

// --- Structured Logger ---

function log(level: 'info' | 'warn' | 'error', message: string, data?: Record<string, unknown>) {
    const entry = {
        ts: new Date().toISOString(),
        level,
        service: 'egos-worker',
        msg: message,
        ...data,
    };
    console.log(JSON.stringify(entry));
}

// --- Rate Limiter (in-memory) ---

const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
    const now = Date.now();
    const bucket = rateBuckets.get(ip);
    if (!bucket || now > bucket.resetAt) {
        rateBuckets.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
        return false;
    }
    bucket.count++;
    return bucket.count > RATE_LIMIT_MAX;
}

// Cleanup stale buckets every 5 min
setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of rateBuckets) {
        if (now > bucket.resetAt) rateBuckets.delete(key);
    }
}, 5 * 60_000);

// --- Redis Connection ---

let redisSub: RedisClientType;
let redisPub: RedisClientType;

async function connectRedis(): Promise<void> {
    redisSub = createClient({ url: REDIS_URL });
    redisPub = createClient({ url: REDIS_URL });

    redisSub.on('error', err => log('error', 'Redis subscriber error', { error: err.message }));
    redisPub.on('error', err => log('error', 'Redis publisher error', { error: err.message }));

    await Promise.all([redisSub.connect(), redisPub.connect()]);
    log('info', 'Connected to Redis', { host: REDIS_URL.split('@').pop() });
}

// --- Supabase Helper ---

async function saveResultToSupabase(result: AgentResult): Promise<void> {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
        log('warn', 'Supabase not configured, skipping save');
        return;
    }
    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/audit_results`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_SERVICE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                'Prefer': 'return=minimal',
            },
            body: JSON.stringify({
                task_id: result.taskId,
                agent_id: result.agentId,
                repo_url: result.repoUrl,
                status: result.status,
                health_score: result.health,
                duration_ms: result.durationMs,
                completed_at: result.completedAt,
                error_message: result.error,
            }),
        });
        if (res.ok) {
            log('info', 'Result saved to Supabase', { taskId: result.taskId });
        } else {
            log('error', 'Supabase save failed', { status: res.status, body: await res.text() });
        }
    } catch (err: any) {
        log('error', 'Supabase save error', { error: err.message });
    }
}

// --- HTTP Server ---

function startHttpServer() {
    Bun.serve({
        port: PORT,
        async fetch(req) {
            metrics.httpRequestsTotal++;
            const url = new URL(req.url);
            const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

            // Health check (no auth needed)
            if (req.method === 'GET' && url.pathname === '/health') {
                const queueDepth = await redisPub.lLen(TASK_QUEUE).catch(() => -1);
                return Response.json({
                    status: 'healthy',
                    uptime: Math.round((Date.now() - new Date(metrics.startedAt).getTime()) / 1000),
                    queueDepth,
                    metrics,
                    redis: redisPub.isOpen ? 'connected' : 'disconnected',
                });
            }

            // Metrics (Prometheus format placeholder)
            if (req.method === 'GET' && url.pathname === '/metrics') {
                const queueDepth = await redisPub.lLen(TASK_QUEUE).catch(() => 0);
                const lines = [
                    `# HELP egos_worker_tasks_total Total tasks processed`,
                    `# TYPE egos_worker_tasks_total counter`,
                    `egos_worker_tasks_total{status="success"} ${metrics.tasksSucceeded}`,
                    `egos_worker_tasks_total{status="failed"} ${metrics.tasksFailed}`,
                    `egos_worker_tasks_total{status="timeout"} ${metrics.tasksTimedOut}`,
                    `# HELP egos_worker_queue_depth Current queue depth`,
                    `# TYPE egos_worker_queue_depth gauge`,
                    `egos_worker_queue_depth ${queueDepth}`,
                    `# HELP egos_worker_http_requests_total Total HTTP requests`,
                    `# TYPE egos_worker_http_requests_total counter`,
                    `egos_worker_http_requests_total ${metrics.httpRequestsTotal}`,
                    `egos_worker_http_requests_rejected ${metrics.httpRequestsRejected}`,
                ].join('\n');
                return new Response(lines, { headers: { 'Content-Type': 'text/plain' } });
            }

            // Queue endpoint (requires auth + rate limit)
            if (req.method === 'POST' && url.pathname === '/queue') {
                // Rate limit
                if (isRateLimited(clientIp)) {
                    metrics.httpRequestsRejected++;
                    log('warn', 'Rate limited', { ip: clientIp });
                    return Response.json({ error: 'Rate limit exceeded' }, { status: 429 });
                }

                // Auth
                const auth = req.headers.get('authorization');
                if (auth !== `Bearer ${AGENT_WEBHOOK_SECRET}`) {
                    metrics.httpRequestsRejected++;
                    log('warn', 'Unauthorized request', { ip: clientIp });
                    return new Response('Unauthorized', { status: 401 });
                }

                // Body size check (max 10KB)
                const contentLength = parseInt(req.headers.get('content-length') || '0', 10);
                if (contentLength > 10240) {
                    return Response.json({ error: 'Payload too large (max 10KB)' }, { status: 413 });
                }

                // Queue depth guard
                const queueDepth = await redisPub.lLen(TASK_QUEUE).catch(() => 0);
                if (queueDepth >= MAX_QUEUE_DEPTH) {
                    log('warn', 'Queue full, rejecting task', { queueDepth });
                    return Response.json({ error: 'Queue full, try again later' }, { status: 503 });
                }

                try {
                    const task = await req.json() as AgentTask;
                    await redisPub.lPush(TASK_QUEUE, JSON.stringify(task));
                    log('info', 'Task queued', { taskId: task.id, agent: task.agentId, queueDepth: queueDepth + 1 });
                    return Response.json({ queued: true, taskId: task.id, queueDepth: queueDepth + 1 });
                } catch {
                    return Response.json({ error: 'Invalid JSON payload' }, { status: 400 });
                }
            }

            return new Response('Not Found', { status: 404 });
        },
    });
    log('info', 'HTTP server started', { port: PORT });
}

// --- Task Processor ---

async function processTask(task: AgentTask): Promise<AgentResult> {
    const start = performance.now();
    log('info', 'Processing task', { taskId: task.id, agent: task.agentId, repo: task.repoUrl });

    try {
        // TODO: Replace with real agent orchestrator
        // Phase 3: Import and run actual agents from ../runtime/runner.ts
        const result = await Promise.race([
            (async () => {
                await new Promise(r => setTimeout(r, 2000 + Math.random() * 4000));
                return {
                    taskId: task.id,
                    agentId: task.agentId,
                    repoUrl: task.repoUrl,
                    status: 'success' as const,
                    health: Math.round(75 + Math.random() * 20),
                    durationMs: Math.round(performance.now() - start),
                    completedAt: new Date().toISOString(),
                };
            })(),
            new Promise<AgentResult>((_, reject) =>
                setTimeout(() => reject(new Error('Task timeout')), TASK_TIMEOUT_MS)
            ),
        ]);

        metrics.tasksSucceeded++;
        return result;
    } catch (err: any) {
        const isTimeout = err.message === 'Task timeout';
        if (isTimeout) metrics.tasksTimedOut++;
        else metrics.tasksFailed++;

        return {
            taskId: task.id,
            agentId: task.agentId,
            repoUrl: task.repoUrl,
            status: isTimeout ? 'timeout' : 'error',
            durationMs: Math.round(performance.now() - start),
            completedAt: new Date().toISOString(),
            error: err.message,
        };
    } finally {
        metrics.tasksProcessed++;
        metrics.lastTaskAt = new Date().toISOString();
    }
}

// --- Worker Loop ---

async function workerLoop() {
    log('info', 'Worker loop started, waiting for tasks');
    while (true) {
        try {
            const response = await redisSub.brPop(TASK_QUEUE, 0);
            if (!response) continue;

            const task: AgentTask = JSON.parse(response.element);
            const result = await processTask(task);

            await redisPub.publish(RESULT_CHANNEL, JSON.stringify(result));
            await saveResultToSupabase(result);

            log('info', 'Task completed', {
                taskId: result.taskId,
                status: result.status,
                durationMs: result.durationMs,
                health: result.health,
            });
        } catch (err: any) {
            log('error', 'Worker loop error', { error: err.message });
            await new Promise(r => setTimeout(r, 5000));
        }
    }
}

// --- Heartbeat ---

function startHeartbeat() {
    setInterval(async () => {
        try {
            await redisPub.set('worker:heartbeat', JSON.stringify({
                ts: new Date().toISOString(),
                pid: process.pid,
                tasksProcessed: metrics.tasksProcessed,
            }), { EX: 60 });
        } catch { /* non-critical */ }
    }, 30_000);
}

// --- Boot ---

async function main() {
    log('info', '═══ EGOS Agent Worker v3.0 (Railway) ═══', {
        port: PORT,
        redis: REDIS_URL.split('@').pop(),
        supabase: SUPABASE_URL ? 'configured' : 'not configured',
        pid: process.pid,
    });

    await connectRedis();
    startHttpServer();
    startHeartbeat();
    await workerLoop();
}

main().catch(err => {
    log('error', 'Fatal error', { error: err.message, stack: err.stack });
    process.exit(1);
});
