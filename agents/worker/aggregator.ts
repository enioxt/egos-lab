/**
 * ResultsAggregator — Combines agent run results into a unified audit report
 * 
 * Calculates:
 * - Rho health score (0-100)
 * - Total findings by severity
 * - Per-agent summary
 * - Structured JSON for Supabase and API consumers
 */

import type { AgentRunResult } from './executor';

export interface AuditReport {
    taskId: string;
    repoUrl: string;
    mode: string;
    healthScore: number;
    totalAgents: number;
    agentsPassed: number;
    agentsFailed: number;
    agentsSkipped: number;
    agentsTimedOut: number;
    totalFindings: number;
    findingsByLevel: {
        criticals: number;
        errors: number;
        warnings: number;
        info: number;
    };
    totalDurationMs: number;
    agentResults: AgentRunResult[];
    completedAt: string;
}

/**
 * Calculate Rho health score
 * 
 * Formula:
 * - Base: (passed / runnable) * 100
 * - Penalty: -5 per critical, -2 per error, -0.5 per warning
 * - Clamped to 0-100
 */
function calculateRhoScore(results: AgentRunResult[]): number {
    const runnable = results.filter(r => r.status !== 'skip');
    if (runnable.length === 0) return 0;

    const passed = runnable.filter(r => r.status === 'pass').length;
    const base = (passed / runnable.length) * 100;

    // Penalty based on severity
    const totalCriticals = results.reduce((sum, r) => sum + r.criticals, 0);
    const totalErrors = results.reduce((sum, r) => sum + r.errors, 0);
    const totalWarnings = results.reduce((sum, r) => sum + r.warnings, 0);

    const penalty = (totalCriticals * 5) + (totalErrors * 2) + (totalWarnings * 0.5);

    return Math.max(0, Math.min(100, Math.round(base - penalty)));
}

/**
 * Aggregate agent results into a complete audit report
 */
export function aggregateResults(
    results: AgentRunResult[],
    taskId: string,
    repoUrl: string,
    mode: string
): AuditReport {
    return {
        taskId,
        repoUrl,
        mode,
        healthScore: calculateRhoScore(results),
        totalAgents: results.length,
        agentsPassed: results.filter(r => r.status === 'pass').length,
        agentsFailed: results.filter(r => r.status === 'fail' || r.status === 'error').length,
        agentsSkipped: results.filter(r => r.status === 'skip').length,
        agentsTimedOut: results.filter(r => r.status === 'timeout').length,
        totalFindings: results.reduce((sum, r) => sum + r.findings, 0),
        findingsByLevel: {
            criticals: results.reduce((sum, r) => sum + r.criticals, 0),
            errors: results.reduce((sum, r) => sum + r.errors, 0),
            warnings: results.reduce((sum, r) => sum + r.warnings, 0),
            info: results.reduce((sum, r) => sum + r.info, 0),
        },
        totalDurationMs: results.reduce((sum, r) => sum + r.durationMs, 0),
        agentResults: results,
        completedAt: new Date().toISOString(),
    };
}

/**
 * Format an audit report as a Supabase-ready row
 */
export function toSupabaseRow(report: AuditReport) {
    return {
        task_id: report.taskId,
        agent_id: 'orchestrator', // Full audit
        repo_url: report.repoUrl,
        status: report.agentsFailed > 0 ? 'error' : 'success',
        health_score: report.healthScore,
        duration_ms: report.totalDurationMs,
        completed_at: report.completedAt,
        error_message: report.agentsFailed > 0
            ? `${report.agentsFailed} agent(s) failed`
            : null,
    };
}
