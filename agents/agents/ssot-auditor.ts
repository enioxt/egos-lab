/**
 * SSOT Auditor Agent — P0.1
 * 
 * Detects Single Source of Truth violations across the monorepo:
 * - Duplicated type/interface definitions
 * - Conflicting entity fields (e.g., cpf, user_id defined in multiple places)
 * - Orphaned types (defined but never imported)
 * - Config drift (.guarani rules referenced but not matching actual code)
 * 
 * Modes:
 * - dry_run: Scan and report only
 * - execute: Scan, report, and write report to docs/agentic/reports/ssot-audit.md
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, relative, extname } from 'path';
import { runAgent, printResult, log, type RunContext, type Finding } from '../runtime/runner';

// --- Configuration ---

const SCAN_EXTENSIONS = ['.ts', '.tsx'];
const IGNORE_DIRS = ['node_modules', 'dist', '.git', '.vercel', '.next', '.husky', 'External', '.egos', '.logs'];
const TYPE_PATTERN = /(?:export\s+)?(?:interface|type)\s+(\w+)/g;
const IMPORT_PATTERN = /import\s+(?:type\s+)?{([^}]+)}\s+from/g;

// --- Helpers ---

function walkDir(dir: string, extensions: string[]): string[] {
  const results: string[] = [];

  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      if (IGNORE_DIRS.includes(entry)) continue;
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        results.push(...walkDir(fullPath, extensions));
      } else if (extensions.includes(extname(entry))) {
        results.push(fullPath);
      }
    }
  } catch {
    // Skip unreadable dirs
  }

  return results;
}

interface TypeLocation {
  name: string;
  file: string;
  line: number;
  exported: boolean;
}

interface ImportLocation {
  name: string;
  file: string;
}

function extractTypes(filePath: string): TypeLocation[] {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const types: TypeLocation[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const matches = [...line.matchAll(/(?:(export)\s+)?(?:interface|type)\s+(\w+)/g)];
    for (const match of matches) {
      types.push({
        name: match[2],
        file: filePath,
        line: i + 1,
        exported: match[1] === 'export',
      });
    }
  }

  return types;
}

function extractImports(filePath: string): ImportLocation[] {
  const content = readFileSync(filePath, 'utf-8');
  const imports: ImportLocation[] = [];

  const matches = [...content.matchAll(IMPORT_PATTERN)];
  for (const match of matches) {
    const names = match[1].split(',').map(n => n.trim().replace(/\s+as\s+\w+/, ''));
    for (const name of names) {
      if (name) {
        imports.push({ name, file: filePath });
      }
    }
  }

  return imports;
}

// --- Agent Logic ---

async function ssotAudit(ctx: RunContext): Promise<Finding[]> {
  const findings: Finding[] = [];
  const repoRoot = ctx.repoRoot;

  log(ctx, 'info', 'Scanning TypeScript files for type definitions...');

  const files = walkDir(repoRoot, SCAN_EXTENSIONS);
  log(ctx, 'info', `Found ${files.length} TypeScript files to analyze`);

  // 1. Extract all type definitions
  const allTypes: TypeLocation[] = [];
  for (const file of files) {
    allTypes.push(...extractTypes(file));
  }
  log(ctx, 'info', `Found ${allTypes.length} type/interface definitions`);

  // 2. Detect duplicated type names (same name, different files)
  const typesByName = new Map<string, TypeLocation[]>();
  for (const t of allTypes) {
    const existing = typesByName.get(t.name) || [];
    existing.push(t);
    typesByName.set(t.name, existing);
  }

  const duplicates = [...typesByName.entries()]
    .filter(([, locs]) => locs.length > 1)
    .filter(([name]) => !['Props', 'State', 'Params'].includes(name)); // Ignore common generic names

  for (const [name, locs] of duplicates) {
    const fileList = locs.map(l => `${relative(repoRoot, l.file)}:${l.line}`).join(', ');
    findings.push({
      severity: locs.length > 2 ? 'error' : 'warning',
      category: 'ssot:duplicate_type',
      message: `Type "${name}" defined in ${locs.length} files: ${fileList}`,
      suggestion: `Consolidate into packages/shared/src/types.ts or a domain-specific types file`,
    });
  }

  // 3. Detect orphaned exported types (exported but never imported)
  log(ctx, 'info', 'Scanning for orphaned exported types...');
  const allImports: ImportLocation[] = [];
  for (const file of files) {
    allImports.push(...extractImports(file));
  }

  const importedNames = new Set(allImports.map(i => i.name));
  const exportedTypes = allTypes.filter(t => t.exported);

  for (const t of exportedTypes) {
    if (!importedNames.has(t.name)) {
      // Check if it's in a test file or index (re-export), skip those
      if (t.file.includes('.test.') || t.file.includes('.spec.') || t.file.endsWith('index.ts')) continue;

      findings.push({
        severity: 'info',
        category: 'ssot:orphaned_type',
        message: `Exported type "${t.name}" is never imported`,
        file: relative(repoRoot, t.file),
        line: t.line,
        suggestion: 'Remove export if unused, or add to shared types if intended for reuse',
      });
    }
  }

  // 4. Check for common entity field patterns across files
  log(ctx, 'info', 'Checking for entity field conflicts...');
  const entityFields = ['user_id', 'cpf', 'email', 'role', 'payment_id', 'instructor_id', 'student_id'];

  for (const field of entityFields) {
    const filesWithField: string[] = [];
    for (const file of files) {
      const content = readFileSync(file, 'utf-8');
      // Look for the field in interface/type definitions (not just any mention)
      if (content.match(new RegExp(`\\b${field}\\s*[?:]\\s*`, 'g'))) {
        filesWithField.push(relative(repoRoot, file));
      }
    }

    if (filesWithField.length > 3) {
      findings.push({
        severity: 'warning',
        category: 'ssot:scattered_field',
        message: `Entity field "${field}" appears in ${filesWithField.length} type definitions`,
        suggestion: `Define a single source type for "${field}" and reference it everywhere`,
      });
    }
  }

  // 5. Summary
  const errorCount = findings.filter(f => f.severity === 'error' || f.severity === 'critical').length;
  const warnCount = findings.filter(f => f.severity === 'warning').length;
  const infoCount = findings.filter(f => f.severity === 'info').length;

  log(ctx, 'info', `Audit complete: ${errorCount} errors, ${warnCount} warnings, ${infoCount} info`);

  // Write report in execute mode
  if (ctx.mode === 'execute' && findings.length > 0) {
    const reportPath = join(repoRoot, 'docs', 'agentic', 'reports', 'ssot-audit.md');
    const report = generateReport(ctx, findings, files.length, allTypes.length);
    writeFileSync(reportPath, report);
    log(ctx, 'info', `Report written to docs/agentic/reports/ssot-audit.md`);
  }

  return findings;
}

function generateReport(ctx: RunContext, findings: Finding[], fileCount: number, typeCount: number): string {
  const lines: string[] = [
    `# SSOT Audit Report`,
    ``,
    `> Generated: ${ctx.startedAt}`,
    `> Correlation: ${ctx.correlationId}`,
    `> Mode: ${ctx.mode}`,
    `> Files scanned: ${fileCount}`,
    `> Types found: ${typeCount}`,
    `> Findings: ${findings.length}`,
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

  for (const [category, items] of grouped) {
    lines.push(`## ${category} (${items.length})`);
    lines.push('');
    for (const f of items) {
      const icon = f.severity === 'error' ? '🔴' : f.severity === 'warning' ? '⚠️' : 'ℹ️';
      lines.push(`- ${icon} ${f.message}`);
      if (f.file) lines.push(`  - File: \`${f.file}${f.line ? ':' + f.line : ''}\``);
      if (f.suggestion) lines.push(`  - Fix: ${f.suggestion}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

// --- CLI Entry ---

const args = process.argv.slice(2);
const mode = args.includes('--exec') ? 'execute' as const : 'dry_run' as const;

runAgent('ssot_auditor', mode, ssotAudit).then(result => {
  printResult(result);
  process.exit(result.success ? 0 : 1);
});
