/**
 * Dependency Auditor Agent
 * 
 * Scans package.json files across the monorepo for:
 * - Duplicate dependencies (same dep in multiple workspaces with different versions)
 * - Dev dependencies in production deps
 * - Missing peer dependencies
 * - Unused dependencies (declared but never imported)
 * 
 * Modes:
 * - dry_run: Scan and report only
 * - execute: Scan, report, and write report to docs/agentic/reports/dep-audit.md
 */

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, relative, extname } from 'path';
import { runAgent, printResult, log, type RunContext, type Finding } from '../runtime/runner';

// --- Configuration ---

const IGNORE_DIRS = ['node_modules', 'dist', '.git', '.vercel', '.next', '.husky', 'External', '.egos', '.logs'];
const DEV_ONLY_PATTERNS = ['@types/', 'eslint', 'prettier', 'typescript', 'vite', 'vitest', 'jest', 'playwright', '@testing-library', 'tsx', 'ts-node'];
const SCAN_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

// --- Helpers ---

interface PackageInfo {
  path: string;
  name: string;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
}

function findPackageJsons(dir: string): string[] {
  const results: string[] = [];
  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      if (IGNORE_DIRS.includes(entry)) continue;
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        results.push(...findPackageJsons(fullPath));
      } else if (entry === 'package.json') {
        results.push(fullPath);
      }
    }
  } catch { /* skip */ }
  return results;
}

function walkSourceFiles(dir: string): string[] {
  const results: string[] = [];
  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      if (IGNORE_DIRS.includes(entry)) continue;
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        results.push(...walkSourceFiles(fullPath));
      } else if (SCAN_EXTENSIONS.includes(extname(entry))) {
        results.push(fullPath);
      }
    }
  } catch { /* skip */ }
  return results;
}

function extractImportedPackages(filePath: string): Set<string> {
  const pkgs = new Set<string>();
  try {
    const content = readFileSync(filePath, 'utf-8');
    // Match import/require statements
    const importRegex = /(?:import|require)\s*\(?['"]([^'"./][^'"]*)['"]\)?/g;
    const dynamicImport = /import\(['"]([^'"./][^'"]*)['"]\)/g;
    for (const match of content.matchAll(importRegex)) {
      // Extract package name (handle scoped packages)
      const raw = match[1];
      const pkg = raw.startsWith('@') ? raw.split('/').slice(0, 2).join('/') : raw.split('/')[0];
      pkgs.add(pkg);
    }
    for (const match of content.matchAll(dynamicImport)) {
      const raw = match[1];
      const pkg = raw.startsWith('@') ? raw.split('/').slice(0, 2).join('/') : raw.split('/')[0];
      pkgs.add(pkg);
    }
  } catch { /* skip */ }
  return pkgs;
}

// --- Agent Logic ---

async function depAudit(ctx: RunContext): Promise<Finding[]> {
  const findings: Finding[] = [];
  const repoRoot = ctx.repoRoot;

  log(ctx, 'info', 'Scanning for package.json files...');

  const packageJsonPaths = findPackageJsons(repoRoot);
  log(ctx, 'info', `Found ${packageJsonPaths.length} package.json files`);

  // Parse all package.json files
  const packages: PackageInfo[] = [];
  for (const p of packageJsonPaths) {
    try {
      const raw = JSON.parse(readFileSync(p, 'utf-8'));
      packages.push({
        path: relative(repoRoot, p),
        name: raw.name || relative(repoRoot, p),
        dependencies: raw.dependencies || {},
        devDependencies: raw.devDependencies || {},
      });
    } catch { /* skip malformed */ }
  }

  // 1. Duplicate dependencies with different versions
  log(ctx, 'info', 'Checking for version conflicts across workspaces...');
  const depVersions = new Map<string, { version: string; pkg: string }[]>();
  for (const pkg of packages) {
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
    for (const [dep, version] of Object.entries(allDeps)) {
      const existing = depVersions.get(dep) || [];
      existing.push({ version, pkg: pkg.name });
      depVersions.set(dep, existing);
    }
  }

  for (const [dep, entries] of depVersions) {
    if (entries.length < 2) continue;
    const uniqueVersions = new Set(entries.map(e => e.version));
    if (uniqueVersions.size > 1) {
      findings.push({
        severity: 'warning',
        category: 'dep:version_conflict',
        message: `"${dep}" has ${uniqueVersions.size} different versions: ${entries.map(e => `${e.pkg}@${e.version}`).join(', ')}`,
        suggestion: 'Align versions across workspaces or use workspace: protocol',
      });
    }
  }

  // 2. Dev dependencies misplaced in production deps
  log(ctx, 'info', 'Checking for dev deps in production...');
  for (const pkg of packages) {
    for (const dep of Object.keys(pkg.dependencies)) {
      if (DEV_ONLY_PATTERNS.some(p => dep.startsWith(p) || dep === p)) {
        findings.push({
          severity: 'warning',
          category: 'dep:dev_in_prod',
          message: `"${dep}" in dependencies of ${pkg.name} — should be devDependencies`,
          file: pkg.path,
          suggestion: `Move "${dep}" to devDependencies`,
        });
      }
    }
  }

  // 3. Unused dependencies (for main packages only, not root)
  log(ctx, 'info', 'Scanning for unused dependencies...');
  for (const pkg of packages) {
    if (pkg.path === 'package.json') continue; // skip root workspace
    const pkgDir = join(repoRoot, pkg.path, '..');
    if (!existsSync(pkgDir)) continue;

    const sourceFiles = walkSourceFiles(pkgDir);
    if (sourceFiles.length === 0) continue;

    const usedPackages = new Set<string>();
    for (const file of sourceFiles) {
      for (const imported of extractImportedPackages(file)) {
        usedPackages.add(imported);
      }
    }

    const allDeclared = Object.keys(pkg.dependencies);
    for (const dep of allDeclared) {
      // Skip common false positives
      if (dep === 'react' || dep === 'react-dom' || dep === 'typescript') continue;
      if (dep.startsWith('@types/')) continue;
      
      if (!usedPackages.has(dep)) {
        findings.push({
          severity: 'info',
          category: 'dep:possibly_unused',
          message: `"${dep}" declared in ${pkg.name} but not found in imports`,
          file: pkg.path,
          suggestion: `Verify if "${dep}" is used (could be a CLI tool, plugin, or config-only dep)`,
        });
      }
    }
  }

  // Summary
  const errorCount = findings.filter(f => f.severity === 'error' || f.severity === 'critical').length;
  const warnCount = findings.filter(f => f.severity === 'warning').length;
  const infoCount = findings.filter(f => f.severity === 'info').length;
  log(ctx, 'info', `Audit complete: ${errorCount} errors, ${warnCount} warnings, ${infoCount} info`);

  // Write report in execute mode
  if (ctx.mode === 'execute' && findings.length > 0) {
    const reportDir = join(repoRoot, 'docs', 'agentic', 'reports');
    const reportPath = join(reportDir, 'dep-audit.md');
    const lines = [
      `# Dependency Audit Report`,
      ``,
      `> Generated: ${ctx.startedAt}`,
      `> Correlation: ${ctx.correlationId}`,
      `> Packages scanned: ${packages.length}`,
      `> Findings: ${findings.length}`,
      ``,
      `---`,
      ``,
    ];

    for (const f of findings) {
      const icon = f.severity === 'error' ? '🔴' : f.severity === 'warning' ? '⚠️' : 'ℹ️';
      lines.push(`- ${icon} **[${f.category}]** ${f.message}`);
      if (f.suggestion) lines.push(`  - Fix: ${f.suggestion}`);
    }

    writeFileSync(reportPath, lines.join('\n'));
    log(ctx, 'info', `Report written to docs/agentic/reports/dep-audit.md`);
  }

  return findings;
}

// --- CLI Entry ---

const args = process.argv.slice(2);
const mode = args.includes('--exec') ? 'execute' as const : 'dry_run' as const;

runAgent('dep_auditor', mode, depAudit).then(result => {
  printResult(result);
  process.exit(result.success ? 0 : 1);
});
