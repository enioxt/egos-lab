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
import { auditLimiter, getClientIp } from './_rate-limit';


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

    // Rate limit: 3 audits per minute per IP using strict audit limiter
    const ip = getClientIp(req.headers as Record<string, string | string[] | undefined>);
    if (auditLimiter.isLimited(ip)) {
        return res.status(429).json({ error: 'Rate limited. Try again in 1 minute.', retryAfterMs: 60_000 });
    }

    // Limit Payload Size (Vercel max body size is 4MB by default, but we should reject long strings early)
    const rawBodySize = JSON.stringify(req.body || {}).length;
    if (rawBodySize > 50_000) { // 50KB total payload max
        return res.status(413).json({ error: 'Payload Too Large. Maximum 50KB allowed.' });
    }

    // Guard: worker secret must be configured
    if (!AGENT_WEBHOOK_SECRET) {
        return res.status(503).json({ error: 'Service not configured' });
    }

    // Parse body
    const { repoUrl, agentId, githubToken } = req.body || {};

    if (!repoUrl || typeof repoUrl !== 'string' || repoUrl.length > 255) {
        return res.status(400).json({ error: 'Missing or malformed required field: repoUrl' });
    }

    if (!isValidGitHubUrl(repoUrl)) {
        return res.status(400).json({
            error: 'Invalid GitHub URL. Must be: https://github.com/owner/repo',
            example: 'https://github.com/enioxt/egos-lab'
        });
    }

    // Validate token if provided
    if (githubToken && (typeof githubToken !== 'string' || githubToken.length > 255)) {
        return res.status(400).json({ error: 'GitHub token must be a string under 255 characters' });
    }
    if (githubToken && !isValidGitHubToken(githubToken as string)) {
        return res.status(400).json({
            error: 'Invalid GitHub token format. Use a fine-grained PAT (github_pat_...) or classic token (ghp_...).'
        });
    }

    // --- BYOK (Bring Your Own Key) Protocol ---
    // Tier 1 Free Access: The user/agent provides their own LLM API Key.
    // We do not store this key; it is only passed through to the worker for inference.

    const authHeader = Array.isArray(req.headers['authorization']) ? req.headers['authorization'][0] : req.headers['authorization'];
    const openRouterHeader = Array.isArray(req.headers['x-openrouter-key']) ? req.headers['x-openrouter-key'][0] : req.headers['x-openrouter-key'];

    const openRouterKey = openRouterHeader || (authHeader?.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : undefined);

    // In a production setup, 'authorization' might be a JWT for a paid subscriber.
    // For this MVP, if there's no explicitly provided API key, we reject the request.
    if (!openRouterKey) {
        return res.status(401).json({
            error: 'Unauthorized: Missing API Key',
            message: 'Tier 1 Access requires your own OpenRouter API key. Pass it via the `x-openrouter-key` header.',
            action: 'Provide `x-openrouter-key` or upgrade to a Managed Plan.'
        });
    }
    // --- End BYOK Protocol ---

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
                'x-openrouter-key': openRouterKey as string, // Pass the user's key securely to the worker
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
