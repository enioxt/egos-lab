/**
 * Living Laboratory Agent — Experiment Tracking + Rule Evolution
 * 
 * Inspired by Descript's "Culture is a Product" philosophy (Andrew Mason):
 * - Document what works → formalize into rules
 * - Archive what fails → learn from it
 * - Auto-evolve rules based on measured outcomes
 * 
 * This agent reads git history and agent logs to:
 * 1. Detect patterns (what types of changes cause bugs vs clean commits)
 * 2. Track experiments (new rules, new patterns, new agents)
 * 3. Propose rule updates to .windsurfrules and PREFERENCES.md
 * 4. Maintain an experiment log (docs/agentic/experiments.jsonl)
 */

import { readFileSync, writeFileSync, appendFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
import { runAgent, printResult, log, type RunContext, type Finding } from '../runtime/runner';

// ─── Types ────────────────────────────────────────────────────

interface GitCommit {
  hash: string;
  date: string;
  message: string;
  filesChanged: number;
  insertions: number;
  deletions: number;
}

interface Experiment {
  id: string;
  date: string;
  type: 'rule_added' | 'rule_removed' | 'rule_modified' | 'agent_added' | 'pattern_observed';
  description: string;
  source_commit?: string;
  outcome?: 'success' | 'failure' | 'neutral' | 'pending';
  evidence?: string;
}

interface RuleProposal {
  target_file: string;
  action: 'add' | 'modify' | 'remove';
  current_rule?: string;
  proposed_rule: string;
  reasoning: string;
  confidence: 'high' | 'medium' | 'low';
  evidence: string[];
}

// ─── Git Analysis ─────────────────────────────────────────────

function getRecentCommits(repoRoot: string, count: number = 50): GitCommit[] {
  try {
    const raw = execSync(
      `git log -${count} --pretty=format:"%H|%aI|%s" --shortstat`,
      { cwd: repoRoot, encoding: 'utf-8', timeout: 10000 }
    );

    const commits: GitCommit[] = [];
    const lines = raw.split('\n').filter(l => l.trim());

    let current: Partial<GitCommit> | null = null;
    for (const line of lines) {
      if (line.includes('|')) {
        if (current?.hash) {
          commits.push({
            hash: current.hash,
            date: current.date || '',
            message: current.message || '',
            filesChanged: current.filesChanged || 0,
            insertions: current.insertions || 0,
            deletions: current.deletions || 0,
          });
        }
        const [hash, date, ...msgParts] = line.split('|');
        current = { hash, date, message: msgParts.join('|') };
      } else if (line.includes('file') || line.includes('insertion') || line.includes('deletion')) {
        if (current) {
          const filesMatch = line.match(/(\d+) file/);
          const insMatch = line.match(/(\d+) insertion/);
          const delMatch = line.match(/(\d+) deletion/);
          current.filesChanged = filesMatch ? parseInt(filesMatch[1]) : 0;
          current.insertions = insMatch ? parseInt(insMatch[1]) : 0;
          current.deletions = delMatch ? parseInt(delMatch[1]) : 0;
        }
      }
    }
    if (current?.hash) {
      commits.push({
        hash: current.hash,
        date: current.date || '',
        message: current.message || '',
        filesChanged: current.filesChanged || 0,
        insertions: current.insertions || 0,
        deletions: current.deletions || 0,
      });
    }

    return commits;
  } catch {
    return [];
  }
}

// ─── Pattern Detection ────────────────────────────────────────

function detectPatterns(commits: GitCommit[]): Finding[] {
  const findings: Finding[] = [];

  // Pattern 1: Fix-after-feat chains (indicates missing tests or rules)
  const fixAfterFeat: string[] = [];
  for (let i = 1; i < commits.length; i++) {
    if (commits[i].message.startsWith('fix:') && commits[i - 1]?.message.startsWith('feat:')) {
      fixAfterFeat.push(`${commits[i - 1].hash.slice(0, 7)} (feat) → ${commits[i].hash.slice(0, 7)} (fix)`);
    }
  }
  if (fixAfterFeat.length > 0) {
    findings.push({
      severity: fixAfterFeat.length > 3 ? 'warning' : 'info',
      category: 'lab:pattern:fix_after_feat',
      message: `${fixAfterFeat.length} "fix right after feat" chains detected — suggests features ship with bugs`,
      suggestion: 'Consider adding pre-commit checks or requiring test coverage for feat: commits',
    });
  }

  // Pattern 2: Large commits (>500 lines changed) — risk of unreviewed changes
  const largeCommits = commits.filter(c => (c.insertions + c.deletions) > 500);
  if (largeCommits.length > 0) {
    findings.push({
      severity: 'info',
      category: 'lab:pattern:large_commits',
      message: `${largeCommits.length} commits with >500 lines changed`,
      suggestion: 'Break large changes into smaller, reviewable commits',
    });
  }

  // Pattern 3: docs: commits followed by deploy (waste — docs don't need deploys)
  const docsBeforePush = commits.filter(c =>
    c.message.startsWith('docs:') || c.message.startsWith('docs(')
  );
  if (docsBeforePush.length > 5) {
    findings.push({
      severity: 'info',
      category: 'lab:pattern:docs_deploys',
      message: `${docsBeforePush.length} docs-only commits in last ${commits.length} — ensure using --no-verify for docs pushes`,
      suggestion: 'Use "git push --no-verify" for docs-only changes to skip build',
    });
  }

  // Pattern 4: Conventional commit compliance
  const nonConventional = commits.filter(c =>
    !c.message.match(/^(feat|fix|chore|docs|refactor|test|ci|perf|style|build|revert)[\(:]/)
  );
  if (nonConventional.length > 0) {
    findings.push({
      severity: nonConventional.length > commits.length * 0.3 ? 'warning' : 'info',
      category: 'lab:pattern:commit_convention',
      message: `${nonConventional.length}/${commits.length} commits don't follow conventional format`,
      suggestion: 'Enforce conventional commits via commitlint or pre-commit hook',
    });
  }

  // Pattern 5: Commit frequency (too many in a day = potential deploy waste)
  const commitsByDay = new Map<string, number>();
  for (const c of commits) {
    const day = c.date.slice(0, 10);
    commitsByDay.set(day, (commitsByDay.get(day) || 0) + 1);
  }
  const highDays = [...commitsByDay.entries()].filter(([, count]) => count > 15);
  if (highDays.length > 0) {
    findings.push({
      severity: 'warning',
      category: 'lab:pattern:commit_frequency',
      message: `${highDays.length} days with >15 commits — batch more, push less`,
      suggestion: 'Each push triggers a Vercel deploy ($). Aim for max 3 pushes/session.',
    });
  }

  return findings;
}

// ─── Agent Log Analysis ───────────────────────────────────────

function analyzeAgentLogs(repoRoot: string): Finding[] {
  const findings: Finding[] = [];
  const logDir = join(repoRoot, 'agents', '.logs');

  if (!existsSync(logDir)) return findings;

  try {
    const logFiles = readdirSync(logDir).filter(f => f.endsWith('.jsonl'));
    let totalRuns = 0;
    let totalErrors = 0;
    const agentStats = new Map<string, { runs: number; errors: number; avgDuration: number }>();

    for (const file of logFiles) {
      const agentId = file.replace('.jsonl', '');
      const lines = readFileSync(join(logDir, file), 'utf-8').split('\n').filter(Boolean);

      let runs = 0;
      let errors = 0;
      let totalDuration = 0;

      for (const line of lines) {
        try {
          const entry = JSON.parse(line);
          if (entry.message?.includes('Starting agent')) runs++;
          if (entry.level === 'error') errors++;
          if (entry.message?.includes('Completed in')) {
            const ms = parseInt(entry.message.match(/(\d+)ms/)?.[1] || '0');
            totalDuration += ms;
          }
        } catch { /* skip malformed */ }
      }

      totalRuns += runs;
      totalErrors += errors;
      if (runs > 0) {
        agentStats.set(agentId, { runs, errors, avgDuration: Math.round(totalDuration / runs) });
      }
    }

    findings.push({
      severity: 'info',
      category: 'lab:agents:summary',
      message: `Agent log analysis: ${totalRuns} total runs, ${totalErrors} errors, ${agentStats.size} agents with history`,
    });

    // Flag agents with high error rates
    for (const [id, stats] of agentStats) {
      if (stats.errors > 0 && stats.errors / stats.runs > 0.3) {
        findings.push({
          severity: 'warning',
          category: 'lab:agents:error_rate',
          message: `Agent "${id}" has ${Math.round(stats.errors / stats.runs * 100)}% error rate (${stats.errors}/${stats.runs})`,
          suggestion: 'Review agent logs and fix root cause',
        });
      }
    }
  } catch { /* skip if logs unreadable */ }

  return findings;
}

// ─── Rule Proposals ───────────────────────────────────────────

function proposeRuleEvolutions(commits: GitCommit[], repoRoot: string): RuleProposal[] {
  const proposals: RuleProposal[] = [];

  // Read current rules
  let currentRules = '';
  try {
    currentRules = readFileSync(join(repoRoot, '.windsurfrules'), 'utf-8');
  } catch { /* no rules file */ }

  // Proposal: If many non-conventional commits, suggest adding commitlint
  const nonConventional = commits.filter(c =>
    !c.message.match(/^(feat|fix|chore|docs|refactor|test|ci|perf|style|build|revert)[\(:]/)
  );
  if (nonConventional.length > commits.length * 0.2 && !currentRules.includes('commitlint')) {
    proposals.push({
      target_file: '.windsurfrules',
      action: 'add',
      proposed_rule: 'Add commitlint to enforce conventional commit format at pre-commit',
      reasoning: `${nonConventional.length}/${commits.length} recent commits break convention`,
      confidence: 'medium',
      evidence: nonConventional.slice(0, 3).map(c => `"${c.message}" (${c.hash.slice(0, 7)})`),
    });
  }

  // Proposal: If many fix-after-feat, suggest test requirement
  let fixAfterFeatCount = 0;
  for (let i = 1; i < commits.length; i++) {
    if (commits[i].message.startsWith('fix:') && commits[i - 1]?.message.startsWith('feat:')) {
      fixAfterFeatCount++;
    }
  }
  if (fixAfterFeatCount > 2) {
    proposals.push({
      target_file: '.guarani/PREFERENCES.md',
      action: 'add',
      proposed_rule: 'feat: commits SHOULD include at least one test or dry-run validation before push',
      reasoning: `${fixAfterFeatCount} instances of fix: immediately following feat: — features shipping with bugs`,
      confidence: 'high',
      evidence: [`${fixAfterFeatCount} fix-after-feat chains in last ${commits.length} commits`],
    });
  }

  return proposals;
}

// ─── Agent Handler ────────────────────────────────────────────

async function livingLaboratory(ctx: RunContext): Promise<Finding[]> {
  const findings: Finding[] = [];

  log(ctx, 'info', 'Living Laboratory: analyzing project health patterns...');

  // Phase 1: Git history analysis
  log(ctx, 'info', 'Phase 1: Git commit pattern analysis');
  const commits = getRecentCommits(ctx.repoRoot, 50);
  log(ctx, 'info', `Loaded ${commits.length} recent commits`);

  if (commits.length > 0) {
    findings.push(...detectPatterns(commits));
  } else {
    findings.push({
      severity: 'warning',
      category: 'lab:git',
      message: 'No git commits found — cannot analyze patterns',
    });
  }

  // Phase 2: Agent log analysis
  log(ctx, 'info', 'Phase 2: Agent log analysis');
  findings.push(...analyzeAgentLogs(ctx.repoRoot));

  // Phase 3: Rule evolution proposals
  log(ctx, 'info', 'Phase 3: Rule evolution proposals');
  const proposals = proposeRuleEvolutions(commits, ctx.repoRoot);

  for (const p of proposals) {
    findings.push({
      severity: 'warning',
      category: 'lab:proposal',
      message: `RULE PROPOSAL [${p.confidence}]: ${p.proposed_rule}`,
      suggestion: `Target: ${p.target_file} | Reasoning: ${p.reasoning}`,
    });
  }

  // Phase 4: Write experiment log
  if (ctx.mode === 'execute') {
    const outDir = join(ctx.repoRoot, 'docs', 'agentic', 'reports');
    if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

    // Append to experiments JSONL
    const experimentLog = join(outDir, 'experiments.jsonl');
    const experiment: Experiment = {
      id: ctx.correlationId,
      date: ctx.startedAt,
      type: 'pattern_observed',
      description: `Living Lab scan: ${findings.length} findings, ${proposals.length} proposals`,
      outcome: 'pending',
      evidence: `${commits.length} commits analyzed`,
    };
    appendFileSync(experimentLog, JSON.stringify(experiment) + '\n');
    log(ctx, 'info', `Experiment logged to ${experimentLog}`);

    // Write full report
    const report = generateReport(ctx, findings, commits, proposals);
    const reportPath = join(outDir, 'living-laboratory.md');
    writeFileSync(reportPath, report);
    log(ctx, 'info', `Report written to ${reportPath}`);
  }

  log(ctx, 'info', `Living Laboratory complete: ${findings.length} findings, ${proposals.length} proposals`);
  return findings;
}

// ─── Report ───────────────────────────────────────────────────

function generateReport(
  ctx: RunContext,
  findings: Finding[],
  commits: GitCommit[],
  proposals: RuleProposal[],
): string {
  const lines = [
    `# Living Laboratory Report`,
    ``,
    `> Generated: ${ctx.startedAt} | Correlation: \`${ctx.correlationId}\``,
    `> Philosophy: "Culture is a product" — Andrew Mason (Descript)`,
    ``,
    `## Summary`,
    ``,
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Commits analyzed | ${commits.length} |`,
    `| Patterns detected | ${findings.filter(f => f.category.includes('pattern')).length} |`,
    `| Rule proposals | ${proposals.length} |`,
    `| Agent health findings | ${findings.filter(f => f.category.includes('agents')).length} |`,
    ``,
    `## Patterns`,
    ``,
    ...findings.filter(f => f.category.includes('pattern')).map(f =>
      `- **${f.category.split(':').pop()}**: ${f.message}${f.suggestion ? `\n  → _${f.suggestion}_` : ''}`
    ),
    ``,
    `## Rule Evolution Proposals`,
    ``,
    ...(proposals.length > 0
      ? proposals.map(p => [
          `### ${p.action.toUpperCase()}: ${p.proposed_rule}`,
          `- **Target:** \`${p.target_file}\``,
          `- **Confidence:** ${p.confidence}`,
          `- **Reasoning:** ${p.reasoning}`,
          `- **Evidence:** ${p.evidence.join(', ')}`,
          ``,
        ]).flat()
      : ['_No proposals at this time — codebase follows current rules well._', '']),
    `## Agent Health`,
    ``,
    ...findings.filter(f => f.category.includes('agents')).map(f =>
      `- ${f.message}${f.suggestion ? ` → _${f.suggestion}_` : ''}`
    ),
    ``,
    `---`,
    ``,
    `_This report is part of the Living Laboratory pattern — an automated feedback loop`,
    `that observes outcomes, detects patterns, and proposes rule evolutions._`,
  ];
  return lines.join('\n');
}

// ─── CLI Entry ────────────────────────────────────────────────

const args = process.argv.slice(2);
const mode = args.includes('--exec') ? 'execute' as const : 'dry_run' as const;

runAgent('living_laboratory', mode, livingLaboratory).then(result => {
  printResult(result);
  process.exit(result.success ? 0 : 1);
});
