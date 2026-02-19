/**
 * EGOS Agent Worker — Persistent Background Worker
 * 
 * Runs 24/7 on Railway.
 * 1. HTTP Server (Bun.serve): Listens for Vercel webhooks and pushes to Redis queue.
 * 2. Background Loop: BRPOP from Redis queue, processes task, saves to Supabase.
 */

import { createClient, type RedisClientType } from 'redis';

// --- Configuration ---

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const AGENT_WEBHOOK_SECRET = process.env.AGENT_WEBHOOK_SECRET || 'dev_secret';
const PORT = parseInt(process.env.PORT || '3000', 10);
const TASK_QUEUE = 'agent:tasks';
const RESULT_CHANNEL = 'agent:results';

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

// --- Redis Connection ---

let redisSub: RedisClientType;
let redisPub: RedisClientType;

async function connectRedis(): Promise<void> {
    redisSub = createClient({ url: REDIS_URL });
    redisPub = createClient({ url: REDIS_URL });

    redisSub.on('error', err => console.error(`[WORKER:REDIS] Error: ${err.message}`));

    await Promise.all([redisSub.connect(), redisPub.connect()]);
    console.log(`[WORKER] ✅ Connected to Redis (Queue & PubSub) at ${REDIS_URL.split('@').pop()}`);
}

// --- Supabase Helper ---

async function saveResultToSupabase(result: AgentResult): Promise<void> {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return;
    try {
        const payload = {
            task_id: result.taskId,
            agent_id: result.agentId,
            repo_url: result.repoUrl,
            status: result.status,
            health_score: result.health,
            duration_ms: result.durationMs,
            completed_at: result.completedAt,
            error_message: result.error,
        };

        await fetch(`${SUPABASE_URL}/rest/v1/audit_results`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_SERVICE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                'Prefer': 'return=minimal',
            },
            body: JSON.stringify(payload),
        });
        console.log(`[WORKER] 💾 Saved result to Supabase (Task ${result.taskId})`);
    } catch (err) {
        console.error(`[WORKER] ❌ Supabase save error:`, err);
    }
}

// --- HTTP Server (Receives webhooks from Vercel) ---

function startHttpServer() {
    Bun.serve({
        port: PORT,
        async fetch(req) {
            if (req.method === 'GET' && new URL(req.url).pathname === '/health') {
                return new Response('OK', { status: 200 });
            }

            if (req.method === 'POST' && new URL(req.url).pathname === '/queue') {
                const auth = req.headers.get('authorization');
                if (auth !== `Bearer ${AGENT_WEBHOOK_SECRET}`) {
                    return new Response('Unauthorized', { status: 401 });
                }

                try {
                    const task = await req.json() as AgentTask;
                    await redisPub.lPush(TASK_QUEUE, JSON.stringify(task));
                    console.log(`[WORKER:HTTP] Received and queued task: ${task.id} for ${task.agentId}`);
                    return new Response(JSON.stringify({ queued: true, taskId: task.id }), {
                        headers: { 'Content-Type': 'application/json' }
                    });
                } catch (e) {
                    return new Response('Invalid JSON payload', { status: 400 });
                }
            }

            return new Response('Not Found', { status: 404 });
        }
    });
    console.log(`[WORKER] 🌐 HTTP server listening on port ${PORT}`);
}

// --- Task Processor ---

async function processTask(task: AgentTask): Promise<AgentResult> {
    const start = performance.now();
    console.log(`\n[WORKER] 🚀 Processing task ${task.id} | Agent: ${task.agentId} | Repo: ${task.repoUrl}`);

    try {
        // Simulate processing delay
        await new Promise(r => setTimeout(r, 2000 + Math.random() * 4000));

        return {
            taskId: task.id,
            agentId: task.agentId,
            repoUrl: task.repoUrl,
            status: 'success',
            health: Math.round(75 + Math.random() * 20),
            durationMs: Math.round(performance.now() - start),
            completedAt: new Date().toISOString(),
        };
    } catch (err: any) {
        return {
            taskId: task.id,
            agentId: task.agentId,
            repoUrl: task.repoUrl,
            status: 'error',
            durationMs: Math.round(performance.now() - start),
            completedAt: new Date().toISOString(),
            error: err.message,
        };
    }
}

// --- Main Worker Loop ---

async function workerLoop() {
    console.log('[WORKER] 👂 Background loop waiting for tasks...');
    while (true) {
        try {
            const response = await redisSub.brPop(TASK_QUEUE, 0);
            if (!response) continue;

            const task: AgentTask = JSON.parse(response.element);
            const result = await processTask(task);

            await redisPub.publish(RESULT_CHANNEL, JSON.stringify(result));
            await saveResultToSupabase(result);
        } catch (err) {
            console.error(`[WORKER:LOOP] Error processing task:`, err);
            await new Promise(r => setTimeout(r, 5000));
        }
    }
}

// --- Boot ---

async function main() {
    console.log('╔══════════════════════════════════════╗');
    console.log('║  EGOS Agent Worker v2.0 (Railway)    ║');
    console.log('╚══════════════════════════════════════╝');

    await connectRedis();
    startHttpServer();
    await workerLoop();
}

main().catch(err => {
    console.error(`[WORKER] Fatal error:`, err);
    process.exit(1);
});
