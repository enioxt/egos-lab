import type { VercelRequest, VercelResponse } from '../_types';
import { webhookLimiter, getClientIp } from '../_rate-limit';

/**
 * AGENT HUB WEBHOOK GATEWAY
 * 
 * Receives events and forwards to the Railway Worker via HTTPS.
 * Features: rate limiting, auth validation, body size guard.
 * 
 * Endpoint: POST /api/agents/webhook
 */

const AGENT_WEBHOOK_SECRET = process.env.AGENT_WEBHOOK_SECRET;
const AGENT_WEBHOOK_URL = process.env.AGENT_WEBHOOK_URL || 'https://egos-lab-infrastructure-production.up.railway.app/queue';

async function forwardToWorker(task: Record<string, unknown>): Promise<boolean> {
    if (!AGENT_WEBHOOK_SECRET) return false;
    try {
        const res = await fetch(AGENT_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AGENT_WEBHOOK_SECRET}`,
            },
            body: JSON.stringify(task),
            signal: AbortSignal.timeout(10_000),
        });
        if (!res.ok) {
            console.error(`[Agent Gateway] Worker rejected: ${res.status} — ${await res.text()}`);
            return false;
        }
        return true;
    } catch (err) {
        console.error(`[Agent Gateway] Worker unreachable:`, err);
        return false;
    }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'Only POST' } });
    }

    // Guard: secret must be configured in production
    if (!AGENT_WEBHOOK_SECRET) {
        return res.status(503).json({ success: false, error: { code: 'NOT_CONFIGURED', message: 'Webhook secret not set' } });
    }

    // Rate limit
    const ip = getClientIp(req.headers as Record<string, string | string[] | undefined>);
    if (webhookLimiter.isLimited(ip)) {
        return res.status(429).json({ success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests', retryAfterMs: 60_000 } });
    }

    // Auth
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${AGENT_WEBHOOK_SECRET}`) {
        return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid API key' } });
    }

    // Body size guard (rough check via content-length)
    const contentLength = parseInt(req.headers['content-length'] as string || '0', 10);
    if (contentLength > 10240) {
        return res.status(413).json({ success: false, error: { code: 'PAYLOAD_TOO_LARGE', message: 'Max 10KB' } });
    }

    // Parse
    const { agent_id, repo_url, event_type, mode, payload } = req.body as {
        agent_id?: string; repo_url?: string; event_type?: string; mode?: string; payload?: unknown;
    };

    if (!agent_id || !event_type) {
        return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Missing agent_id or event_type' } });
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

        const queued = await forwardToWorker(task);

        if (!queued) {
            return res.status(502).json({ success: false, error: { code: 'WORKER_UNAVAILABLE', message: 'Worker unreachable' } });
        }

        return res.status(202).json({
            success: true,
            data: { status: 'queued', job_id: jobId, queued_at: new Date().toISOString() },
        });
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[Agent Gateway] Error:', msg);
        return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Internal error' } });
    }
}
