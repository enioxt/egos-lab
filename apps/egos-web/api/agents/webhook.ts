import type { VercelRequest, VercelResponse } from '../_types';

/**
 * AGENT HUB WEBHOOK GATEWAY
 * 
 * Receives events from Carteira Livre, Intelink, or external services
 * to trigger EGOS autonomous agents.
 * 
 * Instead of long-running in Vercel, it forwards the task to the 
 * Railway Worker via HTTPS. The Railway Worker drops it into its internal Redis queue.
 * 
 * Endpoint: POST /api/agents/webhook
 */

const AGENT_WEBHOOK_SECRET = process.env.AGENT_WEBHOOK_SECRET || 'dev_secret';
const AGENT_WEBHOOK_URL = process.env.AGENT_WEBHOOK_URL || 'https://egos-lab-infrastructure-production.up.railway.app/queue';

async function forwardToWorker(task: Record<string, unknown>): Promise<boolean> {
    try {
        const res = await fetch(AGENT_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AGENT_WEBHOOK_SECRET}`,
            },
            body: JSON.stringify(task),
        });

        if (!res.ok) {
            const text = await res.text();
            console.error(`[Agent Gateway] Worker rejected task: ${res.status} — ${text}`);
            return false;
        }

        return true;
    } catch (err) {
        console.error(`[Agent Gateway] Failed to reach Worker at ${AGENT_WEBHOOK_URL}:`, err);
        return false;
    }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            error: { code: 'METHOD_NOT_ALLOWED', message: 'Only POST is allowed' }
        });
    }

    // 1. Authorization Check (Client -> Vercel)
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${AGENT_WEBHOOK_SECRET}`) {
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

        // 3. Forward to the 24/7 worker on Railway
        const queued = await forwardToWorker(task);

        console.log(`[Agent Gateway] Task ${queued ? 'forwarded' : 'failed'} for agent: ${agent_id}`, { event_type, jobId });

        if (!queued) {
            return res.status(502).json({
                success: false,
                error: { code: 'WORKER_UNAVAILABLE', message: 'Failed to queue task on the worker cluster' }
            });
        }

        return res.status(202).json({
            success: true,
            data: {
                status: 'queued',
                message: `Task queued for agent '${agent_id}'`,
                job_id: jobId,
                queued_at: new Date().toISOString(),
            }
        });
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[Agent Gateway] Error queuing task:', msg);
        return res.status(500).json({
            success: false,
            error: { code: 'SERVER_ERROR', message: 'Failed to queue agent task' }
        });
    }
}
