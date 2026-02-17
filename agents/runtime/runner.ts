/**
 * Agent Runner — Core runtime for EGOS agents
 * 
 * Features:
 * - Registry-based agent discovery
 * - Dry-run and execute modes
 * - Correlation ID per execution
 * - JSONL structured logging
 * - Idempotency support
 */

import { readFileSync, appendFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';

// --- Types ---

export interface AgentDefinition {
  id: string;
  name: string;
  area: string;
  description: string;
  owner: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  entrypoint: string;
  tools_allowed: string[];
  data_access: { pii: boolean; secrets_scan: boolean };
  triggers: string[];
  memory_mode: 'none' | 'session' | 'persistent';
  eval_suite: string[];
  run_modes: ('dry_run' | 'execute')[];
  status: 'active' | 'placeholder' | 'pending' | 'disabled';
  migrated_from?: string;
}

export interface RunContext {
  correlationId: string;
  mode: 'dry_run' | 'execute';
  agentId: string;
  startedAt: string;
  repoRoot: string;
}

export interface RunResult {
  success: boolean;
  correlationId: string;
  agentId: string;
  mode: string;
  durationMs: number;
  findings: Finding[];
  error?: string;
}

export interface Finding {
  severity: 'info' | 'warning' | 'error' | 'critical';
  category: string;
  message: string;
  file?: string;
  line?: number;
  suggestion?: string;
}

export type AgentHandler = (ctx: RunContext) => Promise<Finding[]>;

// --- Registry ---

const TARGET_ROOT = process.cwd();
// Registry lives in EGOS install dir, not target dir
const EGOS_ROOT = join(import.meta.dir, '..', '..');
const REGISTRY_PATH = join(EGOS_ROOT, 'agents', 'registry', 'agents.json');
const LOG_DIR = join(EGOS_ROOT, 'agents', '.logs');

function loadRegistry(): AgentDefinition[] {
  const raw = readFileSync(REGISTRY_PATH, 'utf-8');
  const data = JSON.parse(raw);
  return data.agents as AgentDefinition[];
}

export function getAgent(id: string): AgentDefinition | undefined {
  return loadRegistry().find(a => a.id === id);
}

export function listAgents(): AgentDefinition[] {
  return loadRegistry();
}

// --- Logger ---

function ensureLogDir() {
  if (!existsSync(LOG_DIR)) {
    mkdirSync(LOG_DIR, { recursive: true });
  }
}

export function log(ctx: RunContext, level: string, message: string, data?: Record<string, unknown>) {
  ensureLogDir();
  const entry = {
    timestamp: new Date().toISOString(),
    correlation_id: ctx.correlationId,
    agent_id: ctx.agentId,
    mode: ctx.mode,
    level,
    message,
    ...data,
  };
  const line = JSON.stringify(entry) + '\n';

  // Write to agent-specific log file
  const logFile = join(LOG_DIR, `${ctx.agentId}.jsonl`);
  appendFileSync(logFile, line);

  // Also print to console with color
  const colors: Record<string, string> = {
    info: '\x1b[36m',
    warning: '\x1b[33m',
    error: '\x1b[31m',
    critical: '\x1b[41m\x1b[37m',
  };
  const color = colors[level] || '\x1b[0m';
  const reset = '\x1b[0m';
  console.log(`${color}[${level.toUpperCase()}]${reset} [${ctx.correlationId.slice(0, 8)}] ${message}`);
}

// --- Runner ---

export async function runAgent(
  agentId: string,
  mode: 'dry_run' | 'execute',
  handler: AgentHandler
): Promise<RunResult> {
  const agent = getAgent(agentId);
  if (!agent) {
    // Fallback: run without registry (external repo mode)
    const correlationId = crypto.randomUUID();
    const start = performance.now();
    const ctx: RunContext = {
      agentId,
      correlationId,
      mode,
      repoRoot: TARGET_ROOT,
      startedAt: new Date().toISOString(),
    };
    log(ctx, 'info', `Starting agent "${agentId}" in ${mode} mode (standalone — no registry)`);
    try {
      const findings = await handler(ctx);
      const durationMs = Math.round(performance.now() - start);
      log(ctx, 'info', `Completed in ${durationMs}ms with ${findings.length} findings`);
      return { success: true, correlationId, agentId, mode, durationMs, findings };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, correlationId, agentId, mode, durationMs: Math.round(performance.now() - start), findings: [], error: msg };
    }
  }

  if (!agent.run_modes.includes(mode)) {
    return {
      success: false,
      correlationId: 'none',
      agentId,
      mode,
      durationMs: 0,
      findings: [],
      error: `Agent "${agentId}" does not support mode "${mode}". Supported: ${agent.run_modes.join(', ')}`,
    };
  }

  if (agent.status === 'disabled') {
    return {
      success: false,
      correlationId: 'none',
      agentId,
      mode,
      durationMs: 0,
      findings: [],
      error: `Agent "${agentId}" is disabled`,
    };
  }

  const ctx: RunContext = {
    correlationId: randomUUID(),
    mode,
    agentId,
    startedAt: new Date().toISOString(),
    repoRoot: TARGET_ROOT,
  };

  log(ctx, 'info', `Starting agent "${agent.name}" in ${mode} mode`);
  const start = Date.now();

  try {
    const findings = await handler(ctx);
    const durationMs = Date.now() - start;

    log(ctx, 'info', `Completed in ${durationMs}ms with ${findings.length} findings`);

    // Log each finding
    for (const f of findings) {
      log(ctx, f.severity, f.message, { category: f.category, file: f.file, line: f.line });
    }

    return {
      success: true,
      correlationId: ctx.correlationId,
      agentId,
      mode,
      durationMs,
      findings,
    };
  } catch (err: unknown) {
    const durationMs = Date.now() - start;
    const errorMsg = err instanceof Error ? err.message : String(err);
    log(ctx, 'error', `Agent failed: ${errorMsg}`);

    return {
      success: false,
      correlationId: ctx.correlationId,
      agentId,
      mode,
      durationMs,
      findings: [],
      error: errorMsg,
    };
  }
}

// --- CLI ---

export function printResult(result: RunResult) {
  console.log('\n' + '═'.repeat(60));
  console.log(`  Agent:       ${result.agentId}`);
  console.log(`  Mode:        ${result.mode}`);
  console.log(`  Correlation: ${result.correlationId}`);
  console.log(`  Duration:    ${result.durationMs}ms`);
  console.log(`  Status:      ${result.success ? '✅ Success' : '❌ Failed'}`);
  if (result.error) {
    console.log(`  Error:       ${result.error}`);
  }
  console.log('═'.repeat(60));

  if (result.findings.length > 0) {
    console.log(`\n  📋 Findings (${result.findings.length}):\n`);
    const icons: Record<string, string> = { info: 'ℹ️', warning: '⚠️', error: '🔴', critical: '🚨' };
    for (const f of result.findings) {
      const icon = icons[f.severity] || '•';
      const loc = f.file ? ` (${f.file}${f.line ? ':' + f.line : ''})` : '';
      console.log(`  ${icon} [${f.category}] ${f.message}${loc}`);
      if (f.suggestion) {
        console.log(`     → ${f.suggestion}`);
      }
    }
  } else if (result.success) {
    console.log('\n  ✅ No issues found.\n');
  }
}
