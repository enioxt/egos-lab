/**
 * Agent Orchestrator — Runs ALL registered agents and generates a combined report
 * 
 * This is the "prove it works" command. It:
 * 1. Loads all agents from registry
 * 2. Runs each one that supports dry_run
 * 3. Collects timing, findings, pass/fail status
 * 4. Generates a combined markdown report
 * 5. Exits with non-zero if any agent fails
 * 
 * Usage:
 *   bun agent:all          # dry-run all agents
 *   bun agent:all --exec   # execute mode (writes reports)
 *   bun agent:all --json   # output JSON summary
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { listAgents, type AgentDefinition } from '../runtime/runner';
import { getGlobalBus, Topics, type MyceliumBus } from '../runtime/event-bus';

interface AgentResult {
  id: string;
  name: string;
  status: 'pass' | 'fail' | 'skip' | 'error';
  durationMs: number;
  findings: number;
  errors: number;
  warnings: number;
  info: number;
  errorMessage?: string;
}

const EGOS_ROOT = join(import.meta.dir, '..', '..');

async function runSingleAgent(agent: AgentDefinition): Promise<AgentResult> {
  const entrypoint = join(EGOS_ROOT, agent.entrypoint);

  if (!existsSync(entrypoint)) {
    return {
      id: agent.id,
      name: agent.name,
      status: 'skip',
      durationMs: 0,
      findings: 0, errors: 0, warnings: 0, info: 0,
      errorMessage: `Entrypoint not found: ${agent.entrypoint}`,
    };
  }

  if (agent.status === 'disabled' || agent.status === 'placeholder') {
    return {
      id: agent.id,
      name: agent.name,
      status: 'skip',
      durationMs: 0,
      findings: 0, errors: 0, warnings: 0, info: 0,
      errorMessage: `Agent status: ${agent.status}`,
    };
  }

  const start = performance.now();

  try {
    const proc = Bun.spawn(['bun', entrypoint], {
      cwd: EGOS_ROOT,
      stdout: 'pipe',
      stderr: 'pipe',
      env: { ...process.env },
    });

    const stdout = await new Response(proc.stdout).text();
    const stderr = await new Response(proc.stderr).text();
    const exitCode = await proc.exited;
    const durationMs = Math.round(performance.now() - start);

    const output = stdout + stderr;

    // Parse findings from output
    const errorMatch = output.match(/(\d+)\s+error/);
    const warnMatch = output.match(/(\d+)\s+warning/);
    const infoMatch = output.match(/(\d+)\s+info/);
    const findingsMatch = output.match(/(\d+)\s+finding/);

    const errors = errorMatch ? parseInt(errorMatch[1]) : 0;
    const warnings = warnMatch ? parseInt(warnMatch[1]) : 0;
    const info = infoMatch ? parseInt(infoMatch[1]) : 0;
    const findings = findingsMatch ? parseInt(findingsMatch[1]) : (errors + warnings + info);

    return {
      id: agent.id,
      name: agent.name,
      status: exitCode === 0 ? 'pass' : 'fail',
      durationMs,
      findings,
      errors,
      warnings,
      info,
      errorMessage: exitCode !== 0 ? `Exit code ${exitCode}` : undefined,
    };
  } catch (err: unknown) {
    const durationMs = Math.round(performance.now() - start);
    return {
      id: agent.id,
      name: agent.name,
      status: 'error',
      durationMs,
      findings: 0, errors: 0, warnings: 0, info: 0,
      errorMessage: err instanceof Error ? err.message : String(err),
    };
  }
}

function generateReport(results: AgentResult[], totalMs: number): string {
  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const skipped = results.filter(r => r.status === 'skip').length;
  const errored = results.filter(r => r.status === 'error').length;
  const totalFindings = results.reduce((sum, r) => sum + r.findings, 0);

  const lines: string[] = [
    `# Agent Orchestrator Report`,
    ``,
    `> **Generated:** ${new Date().toISOString()}`,
    `> **Duration:** ${totalMs}ms`,
    `> **Agents:** ${results.length} total | ${passed} passed | ${failed} failed | ${skipped} skipped | ${errored} errors`,
    `> **Total Findings:** ${totalFindings}`,
    ``,
    `---`,
    ``,
    `## Results`,
    ``,
    `| Agent | Status | Duration | Findings | Errors | Warnings |`,
    `|-------|--------|----------|----------|--------|----------|`,
  ];

  for (const r of results) {
    const icon = r.status === 'pass' ? '✅' : r.status === 'fail' ? '❌' : r.status === 'skip' ? '⏭️' : '💥';
    lines.push(`| ${icon} ${r.name} | ${r.status} | ${r.durationMs}ms | ${r.findings} | ${r.errors} | ${r.warnings} |`);
  }

  lines.push('');

  // Details for failed/errored agents
  const problems = results.filter(r => r.status === 'fail' || r.status === 'error');
  if (problems.length > 0) {
    lines.push(`## Issues`);
    lines.push('');
    for (const r of problems) {
      lines.push(`### ${r.name} (${r.status})`);
      lines.push(`- Error: ${r.errorMessage || 'Unknown'}`);
      lines.push('');
    }
  }

  // Health score
  const healthScore = Math.round((passed / (results.length - skipped)) * 100) || 0;
  lines.push(`## Health Score: ${healthScore}%`);
  lines.push('');
  lines.push(`- ${passed}/${results.length - skipped} agents passed`);
  lines.push(`- ${totalFindings} total findings across all agents`);
  lines.push(`- Total execution time: ${totalMs}ms`);

  return lines.join('\n');
}

// --- Main ---

async function main() {
  const args = process.argv.slice(2);
  const mode = args.includes('--exec') ? 'execute' : 'dry_run';
  const jsonOutput = args.includes('--json');

  console.log('\n' + '═'.repeat(60));
  console.log('  🤖 EGOS Agent Orchestrator');
  console.log('  Mode: ' + mode);
  console.log('═'.repeat(60) + '\n');

  const agents = listAgents();
  console.log(`📋 Found ${agents.length} registered agents\n`);

  // Initialize Mycelium Event Bus
  const bus = getGlobalBus();
  bus.reset();

  console.log('🌐 Mycelium Event Bus: ACTIVE\n');

  const results: AgentResult[] = [];
  const totalStart = performance.now();

  for (const agent of agents) {
    const icon = agent.status === 'active' ? '🟢' : agent.status === 'pending' ? '🟡' : '⚪';
    process.stdout.write(`  ${icon} Running ${agent.name}...`);

    // Emit agent lifecycle start event
    bus.emit(Topics.AGENT_STARTED, { agentId: agent.id }, 'orchestrator', 'orch-run');

    const result = await runSingleAgent(agent);
    results.push(result);

    // Emit agent lifecycle completion event
    const completionTopic = result.status === 'fail' || result.status === 'error'
      ? Topics.AGENT_FAILED
      : Topics.AGENT_COMPLETED;
    bus.emit(completionTopic, {
      agentId: agent.id,
      status: result.status,
      durationMs: result.durationMs,
      findingsCount: result.findings,
    }, 'orchestrator', 'orch-run');

    const statusIcon = result.status === 'pass' ? '✅' : result.status === 'skip' ? '⏭️' : '❌';
    console.log(` ${statusIcon} ${result.durationMs}ms (${result.findings} findings)`);
  }

  const totalMs = Math.round(performance.now() - totalStart);

  // Summary
  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail' || r.status === 'error').length;
  const skipped = results.filter(r => r.status === 'skip').length;
  const totalFindings = results.reduce((sum, r) => sum + r.findings, 0);

  console.log('\n' + '═'.repeat(60));
  console.log(`  ✅ Passed: ${passed}  ❌ Failed: ${failed}  ⏭️ Skipped: ${skipped}`);
  console.log(`  📊 Total findings: ${totalFindings}`);
  console.log(`  ⏱️  Total time: ${totalMs}ms`);

  const healthScore = Math.round((passed / (results.length - skipped)) * 100) || 0;
  console.log(`  💚 Health Score: ${healthScore}%`);

  // Mycelium Event Bus Summary
  const busStats = bus.stats();
  console.log(`  🌐 Mycelium Events: ${busStats.total} total`);
  if (Object.keys(busStats.byTopic).length > 0) {
    for (const [topic, count] of Object.entries(busStats.byTopic)) {
      console.log(`     📡 ${topic}: ${count}`);
    }
  }
  console.log('═'.repeat(60) + '\n');

  // Write report
  if (mode === 'execute' || !jsonOutput) {
    const reportDir = join(EGOS_ROOT, 'docs', 'agentic', 'reports');
    if (!existsSync(reportDir)) mkdirSync(reportDir, { recursive: true });
    const reportPath = join(reportDir, 'orchestrator-report.md');
    writeFileSync(reportPath, generateReport(results, totalMs));
    console.log(`📝 Report: docs/agentic/reports/orchestrator-report.md\n`);
  }

  if (jsonOutput) {
    console.log(JSON.stringify({ healthScore, totalMs, results }, null, 2));
  }

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Orchestrator failed:', err);
  process.exit(1);
});
