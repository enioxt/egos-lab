import type { VercelRequest, VercelResponse } from '../_types';

/**
 * AGENT HUB WEBHOOK GATEWAY
 * 
 * Central API to receive events from Carteira Livre, Intelink, or external services
 * to trigger EGOS autonomous agents.
 * 
 * This endpoint validates the request and pushes the task to a Redis queue
 * consumed by the 24/7 background worker (Oracle Cloud / Railway).
 * 
 * Endpoint: POST /api/agents/webhook
 */

const AGENT_WEBHOOK_SECRET = process.env.AGENT_WEBHOOK_SECRET;
const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

const TASK_QUEUE = 'agent:tasks';

async function pushToRedis(task: Record<string, unknown>): Promise<boolean> {
    if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
        console.warn('[Agent Gateway] Redis not configured — task logged but not queued');
        return false;
    }

    // Upstash REST API: LPUSH
    const res = await fetch(`${UPSTASH_REDIS_REST_URL}/lpush/${TASK_QUEUE}`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify([JSON.stringify(task)]),
    });

    if (!res.ok) {
        const text = await res.text();
        console.error(`[Agent Gateway] Redis push failed: ${res.status} — ${text}`);
        return false;
    }

    return true;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            error: { code: 'METHOD_NOT_ALLOWED', message: 'Only POST is allowed' }
        });
    }

    // 1. Authorization Check
    const authHeader = req.headers.authorization;
    if (!AGENT_WEBHOOK_SECRET || authHeader !== `Bearer ${AGENT_WEBHOOK_SECRET}`) {
        console.warn('[Agent Gateway] Unauthorized attempt or missing secret');
        return res.status(401).json({
            success: false,
            error: { code: 'UNAUTHORIZED', message: 'Invalid or missing API Key' }
        });
    }

    // 2. Parse Payload
    const { agent_id, repo_url, event_type, mode, payload } = req.body as {
        agent_id?: string;
        repo_url?: string;
        event_type?: string;
        mode?: string;
        payload?: any;
    };

    if (!agent_id || !event_type) {
        return res.status(400).json({
            success: false,
            error: { code: 'BAD_REQUEST', message: 'Missing agent_id or event_type' }
        });
    }

    try {
        const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        const task = {
            id: jobId,
            agentId: agent_id,
            repoUrl: repo_url || '',
            mode: mode || 'dry_run',
            eventType: event_type,
            payload,
            requestedAt: new Date().toISOString(),
        };

        // 3. Push to Redis queue (consumed by the 24/7 worker)
        const queued = await pushToRedis(task);

        console.log(`[Agent Gateway] Task ${queued ? 'queued' : 'logged'} for agent: ${agent_id}`, { event_type, jobId });

        return res.status(202).json({
            success: true,
            data: {
                status: queued ? 'queued' : 'accepted_no_queue',
                message: `Task ${queued ? 'queued' : 'accepted'} for agent '${agent_id}'`,
                job_id: jobId,
                queued_at: new Date().toISOString(),
            }
        });
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[Agent Gateway] Error queueing task:', msg);
        return res.status(500).json({
            success: false,
            error: { code: 'SERVER_ERROR', message: 'Failed to queue agent task' }
        });
    }
}
