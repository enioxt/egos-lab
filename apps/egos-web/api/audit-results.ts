/**
 * Audit Results API — Read audit reports from Supabase
 * 
 * Endpoints:
 *   GET /api/audit-results           → List recent audits
 *   GET /api/audit-results?id=xxx    → Get specific audit + agent details
 */

import type { VercelRequest, VercelResponse } from './_types';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

async function supabaseFetch(path: string): Promise<any> {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
    });
    if (!res.ok) throw new Error(`Supabase error: ${res.status}`);
    return res.json();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        return res.status(503).json({ error: 'Supabase not configured' });
    }

    try {
        const taskId = req.query.id as string | undefined;

        if (taskId) {
            // Single audit with agent details
            const [audit, agents] = await Promise.all([
                supabaseFetch(`audit_results?task_id=eq.${taskId}&limit=1`),
                supabaseFetch(`audit_agent_results?task_id=eq.${taskId}&order=duration_ms.desc`),
            ]);

            if (!audit.length) {
                return res.status(404).json({ error: 'Audit not found' });
            }

            return res.status(200).json({
                audit: audit[0],
                agents,
            });
        }

        // List recent audits
        const audits = await supabaseFetch(
            'audit_results?order=completed_at.desc&limit=20&select=task_id,agent_id,repo_url,status,health_score,findings_errors,findings_warnings,findings_info,duration_ms,completed_at'
        );

        return res.status(200).json({ audits });
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
}
