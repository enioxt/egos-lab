/**
 * AgentExecutor — Runs EGOS agents against a sandboxed repository
 * 
 * Reuses the existing agent orchestrator pattern (Bun.spawn per agent)
 * but targets an external repo instead of the EGOS monorepo itself.
 * 
 * Features:
 * - Per-agent timeout (2 min)
 * - Captures stdout/stderr
 * - Parses findings count from output
 * - Returns structured results
 */

import { existsSync } from 'fs';
import { join } from 'path';

// EGOS install directory (where agents live)
const EGOS_ROOT = join(import.meta.dir, '..', '..');

export interface AgentRunResult {
    agentId: string;
    agentName: string;
    status: 'pass' | 'fail' | 'skip' | 'error' | 'timeout';
    durationMs: number;
    findings: number;
    errors: number;
    warnings: number;
    info: number;
    criticals: number;
    output: string;
    errorMessage?: string;
}

interface AgentDef {
    id: string;
    name: string;
    entrypoint: string;
    status: string;
    run_modes: string[];
}

const AGENT_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes per agent

/**
 * Load the agent registry
 */
function loadAgentRegistry(): AgentDef[] {
    const registryPath = join(EGOS_ROOT, 'agents', 'registry', 'agents.json');
    if (!existsSync(registryPath)) return [];
    const raw = require(registryPath);
    return raw.agents || [];
}

/**
 * Run a single agent against a target directory
 */
async function runSingleAgent(agent: AgentDef, targetDir: string, mode: string): Promise<AgentRunResult> {
    const entrypoint = join(EGOS_ROOT, agent.entrypoint);

    if (!existsSync(entrypoint)) {
        return {
            agentId: agent.id,
            agentName: agent.name,
            status: 'skip',
            durationMs: 0,
            findings: 0, errors: 0, warnings: 0, info: 0, criticals: 0,
            output: '',
            errorMessage: `Entrypoint not found: ${agent.entrypoint}`,
        };
    }

    if (agent.status === 'disabled' || agent.status === 'placeholder') {
        return {
            agentId: agent.id,
            agentName: agent.name,
            status: 'skip',
            durationMs: 0,
            findings: 0, errors: 0, warnings: 0, info: 0, criticals: 0,
            output: '',
            errorMessage: `Agent status: ${agent.status}`,
        };
    }

    const start = performance.now();

    try {
        const proc = Bun.spawn(['bun', entrypoint, mode === 'execute' ? '--exec' : '--dry'], {
            cwd: targetDir, // KEY: run against the sandboxed repo
            stdout: 'pipe',
            stderr: 'pipe',
            env: {
                ...process.env,
                EGOS_TARGET_DIR: targetDir,
            },
        });

        // Enforce timeout
        const timeout = setTimeout(() => {
            try { proc.kill(); } catch { /* already dead */ }
        }, AGENT_TIMEOUT_MS);

        const [stdout, stderr, exitCode] = await Promise.all([
            new Response(proc.stdout).text(),
            new Response(proc.stderr).text(),
            proc.exited,
        ]);

        clearTimeout(timeout);

        const durationMs = Math.round(performance.now() - start);
        const output = stdout + stderr;

        // Check if it was killed by timeout
        if (durationMs >= AGENT_TIMEOUT_MS - 100) {
            return {
                agentId: agent.id,
                agentName: agent.name,
                status: 'timeout',
                durationMs,
                findings: 0, errors: 0, warnings: 0, info: 0, criticals: 0,
                output: output.slice(0, 2000),
                errorMessage: `Timed out after ${AGENT_TIMEOUT_MS / 1000}s`,
            };
        }

        // Parse findings from output
        const errorMatch = output.match(/(\d+)\s+error/);
        const warnMatch = output.match(/(\d+)\s+warning/);
        const infoMatch = output.match(/(\d+)\s+info/);
        const criticalMatch = output.match(/(\d+)\s+critical/);
        const findingsMatch = output.match(/(\d+)\s+finding/);

        const errors = errorMatch ? parseInt(errorMatch[1]) : 0;
        const warnings = warnMatch ? parseInt(warnMatch[1]) : 0;
        const info = infoMatch ? parseInt(infoMatch[1]) : 0;
        const criticals = criticalMatch ? parseInt(criticalMatch[1]) : 0;
        const findings = findingsMatch ? parseInt(findingsMatch[1]) : (errors + warnings + info + criticals);

        return {
            agentId: agent.id,
            agentName: agent.name,
            status: exitCode === 0 ? 'pass' : 'fail',
            durationMs,
            findings,
            errors,
            warnings,
            info,
            criticals,
            output: output.slice(0, 5000), // Cap output at 5KB
        };
    } catch (err: any) {
        return {
            agentId: agent.id,
            agentName: agent.name,
            status: 'error',
            durationMs: Math.round(performance.now() - start),
            findings: 0, errors: 0, warnings: 0, info: 0, criticals: 0,
            output: '',
            errorMessage: err.message,
        };
    }
}

/**
 * Execute agents against a sandboxed repo
 * 
 * @param sandboxPath - Path to the cloned repo
 * @param agentIds - Optional list of specific agents to run (default: all active)
 * @param mode - 'dry_run' or 'execute'
 */
export async function executeAgents(
    sandboxPath: string,
    agentIds?: string[],
    mode: string = 'dry_run'
): Promise<AgentRunResult[]> {
    const registry = loadAgentRegistry();

    // Filter to requested agents or all active ones
    const agents = agentIds
        ? registry.filter(a => agentIds.includes(a.id))
        : registry.filter(a => a.status === 'active' && a.run_modes.includes('dry_run'));

    const results: AgentRunResult[] = [];

    for (const agent of agents) {
        const result = await runSingleAgent(agent, sandboxPath, mode);
        results.push(result);
    }

    return results;
}
