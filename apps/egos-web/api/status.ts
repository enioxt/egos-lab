import type { VercelRequest, VercelResponse } from './_types';
import { costGuard } from './_cost-guard';

/**
 * GET /api/status — System-wide health dashboard
 * 
 * Returns the health of all EGOS subsystems:
 * - Vercel API (self-check)
 * - Railway Worker (HTTP health check)
 * - Supabase (connectivity test)
 * - AI Budget (daily spend tracking)
 */

const WORKER_URL = process.env.AGENT_WEBHOOK_URL || 'https://egos-lab-infrastructure-production.up.railway.app';
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

interface SubsystemStatus {
    status: 'healthy' | 'degraded' | 'down';
    latencyMs?: number;
    details?: Record<string, unknown>;
}

async function checkWorker(): Promise<SubsystemStatus> {
    try {
        const start = performance.now();
        const res = await fetch(`${WORKER_URL}/health`, { signal: AbortSignal.timeout(5000) });
        const latencyMs = Math.round(performance.now() - start);

        if (!res.ok) return { status: 'degraded', latencyMs, details: { statusCode: res.status } };

        let details = {};
        try { details = await res.json(); } catch { /* plain text response */ }

        return { status: 'healthy', latencyMs, details };
    } catch (err) {
        return { status: 'down', details: { error: err instanceof Error ? err.message : 'unreachable' } };
    }
}

async function checkSupabase(): Promise<SubsystemStatus> {
    if (!SUPABASE_URL || !SUPABASE_KEY) return { status: 'degraded', details: { error: 'Not configured' } };
    try {
        const start = performance.now();
        const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
            },
            signal: AbortSignal.timeout(5000),
        });
        const latencyMs = Math.round(performance.now() - start);
        return { status: res.ok ? 'healthy' : 'degraded', latencyMs };
    } catch (err) {
        return { status: 'down', details: { error: err instanceof Error ? err.message : 'unreachable' } };
    }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const [worker, supabase] = await Promise.all([
        checkWorker(),
        checkSupabase(),
    ]);

    const aiSpend = costGuard.getStats();
    const remoteCredits = await costGuard.checkRemoteCredits();

    const overall = [worker, supabase].every(s => s.status === 'healthy')
        ? 'healthy'
        : [worker, supabase].some(s => s.status === 'down')
            ? 'degraded'
            : 'operational';

    return res.status(200).json({
        status: overall,
        timestamp: new Date().toISOString(),
        subsystems: {
            vercel: { status: 'healthy', details: { region: process.env.VERCEL_REGION || 'unknown' } },
            worker,
            supabase,
        },
        ai: {
            dailySpend: aiSpend,
            remoteCredits,
        },
    });
}
