/**
 * Regression Watcher Agent — Layer 4
 * 
 * Compares test results across runs to detect:
 * - REGRESSION: test that passed before but fails now
 * - FLAKY: test that passes/fails intermittently
 * - FIXED: test that failed before but passes now
 * - NEW_ISSUE: new failure in previously untested area
 * 
 * Reads JSONL logs from contract_tester, integration_tester, ai_verifier.
 * Groups by correlation_id → extracts pass/fail per test → compares runs.
 * 
 * Modes:
 * - dry_run: Show available history and what would be compared
 * - execute: Run full regression analysis
 */

import { runAgent, printResult, log, type RunContext, type Finding } from '../runtime/runner';
import { readFileSync, existsSync, appendFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const EGOS_ROOT = join(import.meta.dir, '..', '..');
const LOG_DIR = join(EGOS_ROOT, 'agents', '.logs');
const HISTORY_FILE = join(LOG_DIR, 'test-history.jsonl');

const TEST_AGENTS = ['contract_tester', 'integration_tester', 'ai_verifier'] as const;

interface TestResult {
  testId: string;
  passed: boolean;
  score?: number;
  category: string;
  message: string;
}

interface TestRun {
  correlationId: string;
  agentId: string;
  timestamp: string;
  mode: string;
  results: TestResult[];
}

interface HistoryEntry {
  timestamp: string;
  runs: {
    agentId: string;
    correlationId: string;
    passed: number;
    failed: number;
    tests: Record<string, boolean>;
  }[];
}

function parseLogFile(agentId: string): TestRun[] {
  const logPath = join(LOG_DIR, `${agentId}.jsonl`);
  if (!existsSync(logPath)) return [];

  const content = readFileSync(logPath, 'utf-8').trim();
  if (!content) return [];

  const lines = content.split('\n').filter(Boolean);
  const runMap = new Map<string, TestRun>();

  for (const line of lines) {
    try {
      const entry = JSON.parse(line);
      if (entry.mode !== 'execute') continue;

      const corrId = entry.correlation_id;
      if (!runMap.has(corrId)) {
        runMap.set(corrId, {
          correlationId: corrId,
          agentId: entry.agent_id,
          timestamp: entry.timestamp,
          mode: entry.mode,
          results: [],
        });
      }

      const run = runMap.get(corrId)!;
      const cat = entry.category || '';
      const msg = entry.message || '';

      // Extract test ID from message: [test-id] or category patterns
      const testIdMatch = msg.match(/\[([^\]]+)\]/);
      if (!testIdMatch) continue;
      const testId = testIdMatch[1];

      // Determine pass/fail from category
      let passed: boolean | null = null;
      if (cat.includes(':pass')) passed = true;
      else if (cat.includes(':fail')) passed = false;
      else if (cat.includes('test:pass')) passed = true;
      else if (cat.includes('test:fail')) passed = false;

      if (passed === null) continue;

      // Extract score if present
      const scoreMatch = msg.match(/Score:\s*(\d+)\/10/);
      const score = scoreMatch ? parseInt(scoreMatch[1]) : undefined;

      run.results.push({ testId, passed, score, category: cat, message: msg });
    } catch {
      // Skip malformed lines
    }
  }

  return Array.from(runMap.values());
}

function getLatestRun(runs: TestRun[]): TestRun | undefined {
  if (runs.length === 0) return undefined;
  return runs.sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0];
}

function getPreviousRun(runs: TestRun[]): TestRun | undefined {
  if (runs.length < 2) return undefined;
  const sorted = runs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  return sorted[1];
}

function detectFlaky(runs: TestRun[], testId: string): boolean {
  // A test is flaky if it has both passed and failed across runs
  let seenPass = false;
  let seenFail = false;
  for (const run of runs) {
    for (const result of run.results) {
      if (result.testId === testId) {
        if (result.passed) seenPass = true;
        else seenFail = true;
      }
    }
  }
  return seenPass && seenFail;
}

function saveHistory(entry: HistoryEntry): void {
  if (!existsSync(LOG_DIR)) mkdirSync(LOG_DIR, { recursive: true });
  appendFileSync(HISTORY_FILE, JSON.stringify(entry) + '\n');
}

async function regressionWatcher(ctx: RunContext): Promise<Finding[]> {
  const findings: Finding[] = [];

  // Load all test logs
  const allRuns: Record<string, TestRun[]> = {};
  for (const agent of TEST_AGENTS) {
    allRuns[agent] = parseLogFile(agent);
  }

  const totalRuns = Object.values(allRuns).reduce((sum, runs) => sum + runs.length, 0);

  if (ctx.mode === 'dry_run') {
    findings.push({
      severity: 'info',
      category: 'regression:overview',
      message: `Found ${totalRuns} total test runs across ${TEST_AGENTS.length} test agents`,
    });

    for (const agent of TEST_AGENTS) {
      const runs = allRuns[agent];
      const latest = getLatestRun(runs);
      findings.push({
        severity: 'info',
        category: 'regression:history',
        message: `${agent}: ${runs.length} run(s)${latest ? ` — latest: ${latest.timestamp.slice(0, 19)}` : ' — no execute runs yet'}`,
      });
    }

    // Check if history file exists
    const hasHistory = existsSync(HISTORY_FILE);
    findings.push({
      severity: 'info',
      category: 'regression:history',
      message: `Test history file: ${hasHistory ? 'exists' : 'will be created on first execute run'}`,
    });

    return findings;
  }

  // Execute mode
  log(ctx, 'info', `Analyzing ${totalRuns} test runs across ${TEST_AGENTS.length} agents`);

  let totalRegressions = 0;
  let totalFixed = 0;
  let totalFlaky = 0;
  let totalNew = 0;

  const historyEntry: HistoryEntry = { timestamp: new Date().toISOString(), runs: [] };

  for (const agent of TEST_AGENTS) {
    const runs = allRuns[agent];
    const latest = getLatestRun(runs);
    const previous = getPreviousRun(runs);

    if (!latest) {
      findings.push({
        severity: 'info',
        category: `regression:skip:${agent}`,
        message: `No execute runs found for ${agent} — skipping`,
      });
      continue;
    }

    log(ctx, 'info', `Comparing ${agent}: latest=${latest.correlationId.slice(0, 8)} vs previous=${previous?.correlationId.slice(0, 8) || 'none'}`);

    // Build test maps
    const latestMap = new Map<string, boolean>();
    for (const r of latest.results) latestMap.set(r.testId, r.passed);

    const previousMap = new Map<string, boolean>();
    if (previous) {
      for (const r of previous.results) previousMap.set(r.testId, r.passed);
    }

    // Record history
    const passCount = [...latestMap.values()].filter(Boolean).length;
    const failCount = [...latestMap.values()].filter(v => !v).length;
    historyEntry.runs.push({
      agentId: agent,
      correlationId: latest.correlationId,
      passed: passCount,
      failed: failCount,
      tests: Object.fromEntries(latestMap),
    });

    // Compare
    for (const [testId, passed] of latestMap) {
      const wasPassed = previousMap.get(testId);
      const isFlaky = detectFlaky(runs, testId);

      if (wasPassed === undefined) {
        // New test — no previous data
        if (!passed) {
          totalNew++;
          findings.push({
            severity: 'warning',
            category: `regression:new_issue:${agent}`,
            message: `NEW_ISSUE [${testId}] — first run and already failing`,
            suggestion: `Investigate ${testId} in ${agent}`,
          });
        }
      } else if (wasPassed && !passed) {
        // REGRESSION
        totalRegressions++;
        findings.push({
          severity: 'error',
          category: `regression:regression:${agent}`,
          message: `REGRESSION [${testId}] — was PASS, now FAIL`,
          suggestion: `Check recent changes that may have broken ${testId}`,
        });
      } else if (!wasPassed && passed) {
        // FIXED
        totalFixed++;
        findings.push({
          severity: 'info',
          category: `regression:fixed:${agent}`,
          message: `FIXED [${testId}] — was FAIL, now PASS ✨`,
        });
      }

      if (isFlaky && runs.length >= 3) {
        totalFlaky++;
        findings.push({
          severity: 'warning',
          category: `regression:flaky:${agent}`,
          message: `FLAKY [${testId}] — inconsistent results across ${runs.length} runs`,
          suggestion: `Investigate flaky behavior in ${testId}`,
        });
      }
    }

    // Check for tests that existed before but are now missing
    if (previous) {
      for (const [testId] of previousMap) {
        if (!latestMap.has(testId)) {
          findings.push({
            severity: 'warning',
            category: `regression:removed:${agent}`,
            message: `REMOVED [${testId}] — test existed in previous run but not in latest`,
          });
        }
      }
    }

    // Agent summary
    findings.push({
      severity: 'info',
      category: `regression:summary:${agent}`,
      message: `${agent}: ${passCount} passed, ${failCount} failed (from ${runs.length} historical runs)`,
    });
  }

  // Save history
  saveHistory(historyEntry);
  log(ctx, 'info', `Saved test history snapshot to ${HISTORY_FILE}`);

  // Overall summary
  const summaryParts = [];
  if (totalRegressions > 0) summaryParts.push(`${totalRegressions} regressions`);
  if (totalFixed > 0) summaryParts.push(`${totalFixed} fixed`);
  if (totalFlaky > 0) summaryParts.push(`${totalFlaky} flaky`);
  if (totalNew > 0) summaryParts.push(`${totalNew} new issues`);
  const summaryText = summaryParts.length > 0 ? summaryParts.join(', ') : 'no changes detected';

  findings.push({
    severity: totalRegressions > 0 ? 'error' : 'info',
    category: 'regression:overall',
    message: `Regression analysis complete: ${summaryText}`,
  });

  return findings;
}

const args = process.argv.slice(2);
const mode = args.includes('--exec') ? 'execute' as const : 'dry_run' as const;

runAgent('regression_watcher', mode, regressionWatcher).then(result => {
  printResult(result);
  process.exit(result.success ? 0 : 1);
});
