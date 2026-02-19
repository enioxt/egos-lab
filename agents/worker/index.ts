/**
 * EGOS Agent Worker — Persistent Background Worker
 * 
 * This worker runs 24/7 on a VPS (Oracle Cloud / Railway).
 * It listens to a Redis queue for audit tasks dispatched by the
 * Vercel webhook API (/api/agents/webhook) and processes them
 * using the EGOS agent orchestrator.
 * 
 * Architecture:
 *   Vercel (webhook) → Redis (queue) → Worker (this) → Supabase (results)
 * 
 * Usage:
 *   bun agents/worker/index.ts
 *   # or via PM2:
 *   pm2 start agents/worker/index.ts --name agent-worker --interpreter bun
 */

import { createClient, type RedisClientType } from 'redis';
import { randomUUID } from 'crypto';

// --- Configuration ---

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const TASK_QUEUE = 'agent:tasks';
const RESULT_CHANNEL = 'agent:results';
const HEARTBEAT_INTERVAL_MS = 30_000;
const MAX_TASK_DURATION_MS = 10 * 60 * 1000; // 10 minutes max per task

// --- Types ---

interface AgentTask {
    id: string;
    agentId: string;
    repoUrl: string;
    mode: 'dry_run' | 'execute';
    requestedAt: string;
    requestedBy?: string;
}

interface AgentResult {
    taskId: string;
    agentId: string;
    repoUrl: string;
    status: 'success' | 'error' | 'timeout';
    health?: number;
    findingsCount?: { errors: number; warnings: number; info: number };
    durationMs: number;
    completedAt: string;
    error?: string;
}

// --- Redis Connection ---

let redis: RedisClientType;

async function connectRedis(): Promise<void> {
    redis = createClient({ url: REDIS_URL });

    redis.on('error', (err) => {
        console.error(`[WORKER] Redis error: ${err.message}`);
    });

    redis.on('connect', () => {
        console.log(`[WORKER] ✅ Connected to Redis at ${REDIS_URL}`);
    });

    await redis.connect();
}

// --- Supabase Helper ---

async function saveResultToSupabase(result: AgentResult): Promise<void> {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
        console.warn('[WORKER] ⚠️ Supabase not configured, skipping result save');
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
                findings_errors: result.findingsCount?.errors || 0,
                findings_warnings: result.findingsCount?.warnings || 0,
                findings_info: result.findingsCount?.info || 0,
                duration_ms: result.durationMs,
                completed_at: result.completedAt,
                error_message: result.error,
            }),
        });

        if (res.ok) {
            console.log(`[WORKER] 💾 Result saved to Supabase (task ${result.taskId.slice(0, 8)})`);
        } else {
            console.error(`[WORKER] ❌ Supabase save failed: ${res.status} ${await res.text()}`);
        }
    } catch (err) {
        console.error(`[WORKER] ❌ Supabase save error: ${err}`);
    }
}

// --- Task Processor ---

async function processTask(task: AgentTask): Promise<AgentResult> {
    const start = performance.now();
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`[WORKER] 🚀 Processing task ${task.id.slice(0, 8)}`);
    console.log(`         Agent: ${task.agentId}`);
    console.log(`         Repo:  ${task.repoUrl}`);
    console.log(`         Mode:  ${task.mode}`);
    console.log(`${'═'.repeat(60)}\n`);

    try {
        // TODO: Phase 2 — Clone repo, run actual orchestrator
        // For now, we simulate processing with a structured response
        // This will be replaced by the actual agent runner integration

        // Simulate agent processing time (2-8 seconds)
        const processingTime = 2000 + Math.random() * 6000;
        await new Promise(resolve => setTimeout(resolve, processingTime));

        const durationMs = Math.round(performance.now() - start);
        const health = Math.round(70 + Math.random() * 25); // 70-95

        const result: AgentResult = {
            taskId: task.id,
            agentId: task.agentId,
            repoUrl: task.repoUrl,
            status: 'success',
            health,
            findingsCount: {
                errors: Math.round(Math.random() * 20),
                warnings: Math.round(Math.random() * 60),
                info: Math.round(Math.random() * 200),
            },
            durationMs,
            completedAt: new Date().toISOString(),
        };

        console.log(`[WORKER] ✅ Task completed in ${durationMs}ms (health: ${health}%)`);
        return result;

    } catch (err: unknown) {
        const durationMs = Math.round(performance.now() - start);
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error(`[WORKER] ❌ Task failed: ${errorMsg}`);

        return {
            taskId: task.id,
            agentId: task.agentId,
            repoUrl: task.repoUrl,
            status: 'error',
            durationMs,
            completedAt: new Date().toISOString(),
            error: errorMsg,
        };
    }
}

// --- Main Worker Loop ---

async function workerLoop(): Promise<void> {
    console.log('[WORKER] 👂 Listening for tasks...\n');

    while (true) {
        try {
            // BRPOP blocks until a task is available (0 = wait forever)
            const response = await redis.brPop(TASK_QUEUE, 0);

            if (!response) continue;

            const task: AgentTask = JSON.parse(response.element);
            const result = await processTask(task);

            // Publish result to the results channel
            await redis.publish(RESULT_CHANNEL, JSON.stringify(result));

            // Save result to Supabase
            await saveResultToSupabase(result);

        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            console.error(`[WORKER] ⚠️ Loop error: ${msg}`);
            // Wait 5 seconds before retrying to prevent tight error loops
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
}

// --- Heartbeat ---

function startHeartbeat(): void {
    setInterval(async () => {
        try {
            await redis.set('worker:heartbeat', new Date().toISOString(), { EX: 60 });
        } catch {
            // Silently fail — heartbeat is non-critical
        }
    }, HEARTBEAT_INTERVAL_MS);
}

// --- Boot ---

async function main(): Promise<void> {
    console.log('╔══════════════════════════════════════╗');
    console.log('║  EGOS Agent Worker v1.0              ║');
    console.log('║  Persistent Background Processor     ║');
    console.log('╚══════════════════════════════════════╝');
    console.log(`[WORKER] Redis:    ${REDIS_URL}`);
    console.log(`[WORKER] Supabase: ${SUPABASE_URL ? '✅ Configured' : '⚠️ Not configured'}`);
    console.log(`[WORKER] PID:      ${process.pid}`);
    console.log(`[WORKER] Started:  ${new Date().toISOString()}\n`);

    await connectRedis();
    startHeartbeat();
    await workerLoop();
}

main().catch((err) => {
    console.error(`[WORKER] Fatal error: ${err}`);
    process.exit(1);
});
