/**
 * Dead Code Detector Agent
 * 
 * Finds dead code across the monorepo:
 * - Exported functions never imported anywhere
 * - Exported constants never referenced
 * - Files with 0 imports (potential orphans)
 * - Empty files (0 exports, 0 logic)
 * 
 * Modes:
 * - dry_run: Scan and report only
 * - execute: Scan, report, and write report
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, relative, extname, basename } from 'path';
import { runAgent, printResult, log, type RunContext, type Finding } from '../runtime/runner';

// --- Configuration ---

const SCAN_EXTENSIONS = ['.ts', '.tsx'];
const IGNORE_DIRS = ['node_modules', 'dist', '.git', '.vercel', '.next', '.husky', 'External', '.egos', '.logs'];
const IGNORE_FILES = ['vite-env.d.ts', 'env.d.ts', 'global.d.ts'];

// --- Helpers ---

function walkDir(dir: string): string[] {
  const results: string[] = [];
  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      if (IGNORE_DIRS.includes(entry)) continue;
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        results.push(...walkDir(fullPath));
      } else if (SCAN_EXTENSIONS.includes(extname(entry)) && !IGNORE_FILES.includes(entry)) {
        results.push(fullPath);
      }
    }
  } catch { /* skip */ }
  return results;
}

interface ExportedSymbol {
  name: string;
  file: string;
  line: number;
  kind: 'function' | 'const' | 'class' | 'component';
}

function extractExports(filePath: string): ExportedSymbol[] {
  const exports: ExportedSymbol[] = [];
  try {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // export function name
      const fnMatch = line.match(/^export\s+(?:async\s+)?function\s+(\w+)/);
      if (fnMatch) {
        exports.push({ name: fnMatch[1], file: filePath, line: i + 1, kind: 'function' });
        continue;
      }

      // export const name
      const constMatch = line.match(/^export\s+const\s+(\w+)/);
      if (constMatch) {
        const name = constMatch[1];
        // Check if it's a React component (starts with uppercase)
        const kind = name[0] === name[0].toUpperCase() ? 'component' : 'const';
        exports.push({ name, file: filePath, line: i + 1, kind });
        continue;
      }

      // export class name
      const classMatch = line.match(/^export\s+class\s+(\w+)/);
      if (classMatch) {
        exports.push({ name: classMatch[1], file: filePath, line: i + 1, kind: 'class' });
        continue;
      }

      // export default function name
      const defaultFnMatch = line.match(/^export\s+default\s+function\s+(\w+)/);
      if (defaultFnMatch) {
        exports.push({ name: defaultFnMatch[1], file: filePath, line: i + 1, kind: 'function' });
      }
    }
  } catch { /* skip */ }
  return exports;
}

function extractAllImportedNames(files: string[]): Set<string> {
  const imported = new Set<string>();
  const importPattern = /import\s+(?:type\s+)?(?:{([^}]+)}|(\w+))/g;
  const dynamicPattern = /import\(['"]([^'"]+)['"]\)/g;

  for (const file of files) {
    try {
      const content = readFileSync(file, 'utf-8');
      for (const match of content.matchAll(importPattern)) {
        if (match[1]) {
          // Named imports: { a, b, c as d }
          const names = match[1].split(',').map(n => n.trim().split(/\s+as\s+/)[0].trim());
          for (const name of names) {
            if (name) imported.add(name);
          }
        }
        if (match[2]) {
          // Default import
          imported.add(match[2]);
        }
      }
      // Also check JSX usage: <ComponentName
      const jsxPattern = /<(\w+)[\s/>]/g;
      for (const match of content.matchAll(jsxPattern)) {
        imported.add(match[1]);
      }
    } catch { /* skip */ }
  }
  return imported;
}

// --- Agent Logic ---

async function deadCodeDetect(ctx: RunContext): Promise<Finding[]> {
  const findings: Finding[] = [];
  const repoRoot = ctx.repoRoot;

  log(ctx, 'info', 'Scanning TypeScript files...');
  const files = walkDir(repoRoot);
  log(ctx, 'info', `Found ${files.length} files to analyze`);

  // 1. Extract all exports
  const allExports: ExportedSymbol[] = [];
  for (const file of files) {
    allExports.push(...extractExports(file));
  }
  log(ctx, 'info', `Found ${allExports.length} exported symbols`);

  // 2. Extract all imports
  const allImported = extractAllImportedNames(files);
  log(ctx, 'info', `Found ${allImported.size} unique imported names`);

  // 3. Find dead exports
  for (const exp of allExports) {
    // Skip test files, index re-exports, entry points
    const relPath = relative(repoRoot, exp.file);
    if (relPath.includes('.test.') || relPath.includes('.spec.')) continue;
    if (basename(exp.file) === 'index.ts' || basename(exp.file) === 'index.tsx') continue;
    if (relPath.includes('cli.ts') || relPath.endsWith('.d.ts')) continue;
    // Skip common patterns
    if (['default', 'handler', 'GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(exp.name)) continue;
    if (exp.name.startsWith('use') && exp.kind === 'function') continue; // hooks
    if (exp.name === 'metadata' || exp.name === 'config') continue; // Next.js

    if (!allImported.has(exp.name)) {
      findings.push({
        severity: exp.kind === 'component' ? 'warning' : 'info',
        category: `dead:${exp.kind}`,
        message: `Exported ${exp.kind} "${exp.name}" is never imported`,
        file: relPath,
        line: exp.line,
        suggestion: 'Remove export if unused, or mark as @public API',
      });
    }
  }

  // 4. Find empty files (< 5 non-empty lines, no exports)
  log(ctx, 'info', 'Checking for empty/stub files...');
  for (const file of files) {
    try {
      const content = readFileSync(file, 'utf-8');
      const nonEmptyLines = content.split('\n').filter(l => l.trim().length > 0).length;
      if (nonEmptyLines < 3 && !content.includes('export')) {
        findings.push({
          severity: 'info',
          category: 'dead:empty_file',
          message: `File has ${nonEmptyLines} non-empty lines and no exports`,
          file: relative(repoRoot, file),
          suggestion: 'Delete if unused or add TODO comment',
        });
      }
    } catch { /* skip */ }
  }

  // Summary
  const warnCount = findings.filter(f => f.severity === 'warning').length;
  const infoCount = findings.filter(f => f.severity === 'info').length;
  log(ctx, 'info', `Scan complete: ${warnCount} warnings, ${infoCount} info`);

  // Write report in execute mode
  if (ctx.mode === 'execute' && findings.length > 0) {
    const reportPath = join(repoRoot, 'docs', 'agentic', 'reports', 'dead-code.md');
    const lines = [
      `# Dead Code Report`,
      ``,
      `> Generated: ${ctx.startedAt}`,
      `> Correlation: ${ctx.correlationId}`,
      `> Files scanned: ${files.length}`,
      `> Exports found: ${allExports.length}`,
      `> Dead symbols: ${findings.length}`,
      ``,
      `---`,
      ``,
    ];

    const grouped = new Map<string, Finding[]>();
    for (const f of findings) {
      const existing = grouped.get(f.category) || [];
      existing.push(f);
      grouped.set(f.category, existing);
    }

    for (const [cat, items] of grouped) {
      lines.push(`## ${cat} (${items.length})`);
      lines.push('');
      for (const f of items) {
        lines.push(`- ${f.message} — \`${f.file}:${f.line}\``);
      }
      lines.push('');
    }

    writeFileSync(reportPath, lines.join('\n'));
    log(ctx, 'info', `Report written to docs/agentic/reports/dead-code.md`);
  }

  return findings;
}

// --- CLI Entry ---

const args = process.argv.slice(2);
const mode = args.includes('--exec') ? 'execute' as const : 'dry_run' as const;

runAgent('dead_code_detector', mode, deadCodeDetect).then(result => {
  printResult(result);
  process.exit(result.success ? 0 : 1);
});
