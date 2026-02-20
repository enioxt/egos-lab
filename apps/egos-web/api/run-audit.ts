/**
 * Run Audit API — Trigger a new agent audit on a GitHub repository
 * 
 * POST /api/run-audit
 * Body: { repoUrl: string, agentId?: string, githubToken?: string }
 * 
 * Supports:
 * - Public repos: no token needed
 * - Private repos: provide a fine-grained GitHub PAT with read-only access
 * 
 * Security:
 * - Token is forwarded to the Worker over HTTPS and used only for cloning
 * - Token is NEVER stored, logged, or persisted
 * - Sandbox is destroyed after analysis
 */

import type { VercelRequest, VercelResponse } from './_types';
import { chatLimiter, getClientIp } from './_rate-limit';

const WORKER_URL = process.env.AGENT_WORKER_URL || 'https://egos-lab-infrastructure-production.up.railway.app';
const AGENT_WEBHOOK_SECRET = process.env.AGENT_WEBHOOK_SECRET || '';

// --- Validation ---

const GITHUB_URL_REGEX = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+(\.git)?$/;

function isValidGitHubUrl(url: string): boolean {
    return GITHUB_URL_REGEX.test(url);
}

/**
 * Validate a GitHub PAT format (classic or fine-grained)
 * Classic: ghp_xxxxx (40+ chars)
 * Fine-grained: github_pat_xxxxx
 */
function isValidGitHubToken(token: string): boolean {
    if (!token || typeof token !== 'string') return false;
    if (token.length < 10) return false;
    // Accept classic (ghp_), fine-grained (github_pat_), or OAuth tokens
    return /^(ghp_|github_pat_|gho_|ghs_)/.test(token) || token.length >= 30;
}

// --- Handler ---

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Only POST allowed' });
    }

    // Rate limit: 5 audits per minute per IP
    const ip = getClientIp(req.headers as Record<string, string | string[] | undefined>);
    if (chatLimiter.isLimited(ip)) {
        return res.status(429).json({ error: 'Rate limited. Try again in 1 minute.', retryAfterMs: 60_000 });
    }

    // Guard: worker secret must be configured
    if (!AGENT_WEBHOOK_SECRET) {
        return res.status(503).json({ error: 'Service not configured' });
    }

    // Parse body
    const { repoUrl, agentId, githubToken } = req.body || {};

    if (!repoUrl || typeof repoUrl !== 'string') {
        return res.status(400).json({ error: 'Missing required field: repoUrl' });
    }

    if (!isValidGitHubUrl(repoUrl)) {
        return res.status(400).json({
            error: 'Invalid GitHub URL. Must be: https://github.com/owner/repo',
            example: 'https://github.com/enioxt/egos-lab'
        });
    }

    // Validate token if provided
    if (githubToken && !isValidGitHubToken(githubToken)) {
        return res.status(400).json({
            error: 'Invalid GitHub token format. Use a fine-grained PAT (github_pat_...) or classic token (ghp_...).'
        });
    }

    // Create task
    const taskId = `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const task: Record<string, any> = {
        id: taskId,
        agentId: agentId || 'orchestrator',
        repoUrl: repoUrl.replace(/\.git$/, ''),
        mode: 'dry_run',
        requestedAt: new Date().toISOString(),
    };

    // Pass token securely — Worker will use it for cloning and then discard
    if (githubToken) {
        task.githubToken = githubToken;
        task.isPrivate = true;
    }

    // Forward to Railway Worker
    try {
        const workerRes = await fetch(`${WORKER_URL}/queue`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AGENT_WEBHOOK_SECRET}`,
            },
            body: JSON.stringify(task),
            signal: AbortSignal.timeout(10_000),
        });

        if (!workerRes.ok) {
            const errText = await workerRes.text().catch(() => 'Unknown error');
            return res.status(502).json({
                error: 'Worker rejected the task',
                detail: errText,
                status: workerRes.status,
            });
        }

        const result = await workerRes.json();

        return res.status(202).json({
            accepted: true,
            taskId,
            repoUrl: task.repoUrl,
            isPrivate: !!githubToken,
            message: githubToken
                ? 'Private repo audit queued. Your token is used only for cloning and is never stored.'
                : 'Audit queued. Results will appear in /api/audit-results shortly.',
            queueDepth: result.queueDepth,
            checkUrl: `/api/audit-results?id=${taskId}`,
        });
    } catch (err: any) {
        return res.status(502).json({
            error: 'Worker unreachable',
            detail: err.message,
        });
    }
}
