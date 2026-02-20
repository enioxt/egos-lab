/**
 * SSOT Auditor Agent v2 — Structural Triage Engine
 * 
 * Performs STRUCTURAL analysis (not lexical) of the monorepo:
 * 
 * WHAT IT IS:
 * - AST-based structural triage for potential SSOT drift
 * - Detects duplicate type definitions across packages
 * - Classifies symbols by kind (interface, type alias, enum, class)
 * - Filters by scope (exported, cross-package, single-file)
 * - Assigns confidence scores per finding
 * 
 * WHAT IT IS NOT:
 * - Not a semantic SSOT verifier (no shape comparison yet)
 * - Not a replacement for manual review
 * - Not an LLM-based analysis ($0 API cost, local static pass)
 * 
 * v2 improvements over v1 (based on critical analysis):
 * 1. Uses TypeScript compiler API (AST) instead of regex
 * 2. Ignores comments, strings, and non-code tokens
 * 3. Separates symbols by kind (interface/type/enum/class)
 * 4. Filters by scope (exported vs local, cross-package)
 * 5. Assigns confidence score per finding
 * 6. Honest framing: "structural triage" not "violation"
 */

import * as ts from 'typescript';
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync, mkdirSync } from 'fs';
import { join, relative, extname, dirname, basename } from 'path';
import { runAgent, printResult, log, type RunContext, type Finding } from '../runtime/runner';
import { Topics } from '../runtime/event-bus';

// ─── Configuration ────────────────────────────────────────────

const SCAN_EXTENSIONS = ['.ts', '.tsx'];
const IGNORE_DIRS = ['node_modules', 'dist', '.git', '.vercel', '.next', '.husky', 'External', '.egos', '.logs', '__tests__', '__mocks__'];
const IGNORE_FILES = ['vite-env.d.ts', 'env.d.ts', 'global.d.ts'];

// Convention names that are expected to be repeated (framework patterns)
const CONVENTION_NAMES = new Set([
  'Props', 'State', 'Params', 'Config', 'Options', 'Context',
  'PageProps', 'LayoutProps', 'ServerProps', 'ClientProps',
  'Metadata', 'Route', 'Handler',
]);

// Generated file patterns
const GENERATED_PATTERNS = [/generated/, /prisma/, /openapi/, /\.d\.ts$/, /trpc/];

// ─── Types ────────────────────────────────────────────────────

type SymbolKind = 'interface' | 'type_alias' | 'enum' | 'class';
type ConfidenceLevel = 'high' | 'medium' | 'low';

interface StructuralSymbol {
  name: string;
  kind: SymbolKind;
  file: string;
  line: number;
  exported: boolean;
  package: string;      // Workspace package name (e.g. "egos-web", "shared")
  memberCount: number;  // Number of members/properties (for shape comparison)
  isGenerated: boolean;
}

interface SSOTFinding extends Finding {
  confidence: ConfidenceLevel;
  symbolKind?: SymbolKind;
  locations?: string[];
  packages?: string[];
}

// ─── Helpers ──────────────────────────────────────────────────

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
      } else if (
        SCAN_EXTENSIONS.includes(extname(entry)) &&
        !IGNORE_FILES.includes(entry) &&
        !entry.includes('.test.') &&
        !entry.includes('.spec.')
      ) {
        results.push(fullPath);
      }
    }
  } catch { /* skip */ }
  return results;
}

/**
 * Determine the workspace package name from a file path.
 * E.g.: "apps/egos-web/src/App.tsx" → "egos-web"
 *       "packages/shared/src/types.ts" → "shared"
 *       "agents/agents/foo.ts" → "agents"
 */
function getPackageName(filePath: string, repoRoot: string): string {
  const rel = relative(repoRoot, filePath);
  const parts = rel.split('/');
  // apps/X/... or packages/X/... → X
  if (['apps', 'packages'].includes(parts[0]) && parts.length > 1) {
    return parts[1];
  }
  // agents/... → "agents"
  return parts[0] || 'root';
}

function isGeneratedFile(filePath: string): boolean {
  return GENERATED_PATTERNS.some(p => p.test(filePath));
}

// ─── AST-Based Symbol Extraction ──────────────────────────────

/**
 * Extract type-level symbols from a TypeScript file using the compiler API.
 * This parses the REAL AST, not regex — so comments and strings are ignored.
 */
function extractStructuralSymbols(filePath: string, repoRoot: string): StructuralSymbol[] {
  const symbols: StructuralSymbol[] = [];

  let content: string;
  try {
    content = readFileSync(filePath, 'utf-8');
  } catch {
    return symbols;
  }

  const sourceFile = ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.Latest,
    true, // setParentNodes
    filePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );

  const pkg = getPackageName(filePath, repoRoot);
  const generated = isGeneratedFile(filePath);

  function visit(node: ts.Node) {
    // Interface declarations
    if (ts.isInterfaceDeclaration(node)) {
      const exported = hasExportModifier(node);
      symbols.push({
        name: node.name.text,
        kind: 'interface',
        file: filePath,
        line: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1,
        exported,
        package: pkg,
        memberCount: node.members.length,
        isGenerated: generated,
      });
    }

    // Type alias declarations
    if (ts.isTypeAliasDeclaration(node)) {
      const exported = hasExportModifier(node);
      symbols.push({
        name: node.name.text,
        kind: 'type_alias',
        file: filePath,
        line: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1,
        exported,
        package: pkg,
        memberCount: countTypeMembers(node.type),
        isGenerated: generated,
      });
    }

    // Enum declarations
    if (ts.isEnumDeclaration(node)) {
      const exported = hasExportModifier(node);
      symbols.push({
        name: node.name.text,
        kind: 'enum',
        file: filePath,
        line: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1,
        exported,
        package: pkg,
        memberCount: node.members.length,
        isGenerated: generated,
      });
    }

    // Class declarations (only named)
    if (ts.isClassDeclaration(node) && node.name) {
      const exported = hasExportModifier(node);
      symbols.push({
        name: node.name.text,
        kind: 'class',
        file: filePath,
        line: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1,
        exported,
        package: pkg,
        memberCount: node.members.length,
        isGenerated: generated,
      });
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return symbols;
}

function hasExportModifier(node: ts.Node): boolean {
  if (!ts.canHaveModifiers(node)) return false;
  const modifiers = ts.getModifiers(node);
  return modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword) ?? false;
}

function countTypeMembers(typeNode: ts.TypeNode): number {
  if (ts.isTypeLiteralNode(typeNode)) {
    return typeNode.members.length;
  }
  if (ts.isUnionTypeNode(typeNode) || ts.isIntersectionTypeNode(typeNode)) {
    return typeNode.types.length;
  }
  return 0;
}

// ─── Confidence Scoring ───────────────────────────────────────

/**
 * Computes a confidence score for a duplicate finding.
 * Based on the critical analysis recommendations.
 */
function computeConfidence(
  name: string,
  locations: StructuralSymbol[],
): ConfidenceLevel {
  let score = 0;

  // + exported symbols are more likely to be real drift
  const exportedCount = locations.filter(l => l.exported).length;
  if (exportedCount > 1) score += 3;

  // + appears in multiple packages (cross-package = higher risk)
  const packages = new Set(locations.map(l => l.package));
  if (packages.size > 1) score += 3;

  // + name is specific (not generic convention name)
  if (!CONVENTION_NAMES.has(name)) score += 2;

  // + name is long (more specific)
  if (name.length > 8) score += 1;

  // - convention name (expected duplication)
  if (CONVENTION_NAMES.has(name)) score -= 3;

  // - generated files involved
  const generatedCount = locations.filter(l => l.isGenerated).length;
  if (generatedCount > 0) score -= 2;

  // - all in same package (likely intentional local variants)
  if (packages.size === 1) score -= 1;

  // - generic single-char or two-char names
  if (name.length <= 2) score -= 3;

  if (score >= 5) return 'high';
  if (score >= 2) return 'medium';
  return 'low';
}

// ─── Agent Logic ──────────────────────────────────────────────

async function ssotAudit(ctx: RunContext): Promise<Finding[]> {
  const findings: SSOTFinding[] = [];
  const repoRoot = ctx.repoRoot;

  log(ctx, 'info', '🔬 SSOT Structural Triage v2 (AST-based)');
  log(ctx, 'info', 'Scanning TypeScript files...');

  const files = walkDir(repoRoot);
  log(ctx, 'info', `Found ${files.length} TypeScript files`);

  // Phase 1: Extract all structural symbols via AST
  log(ctx, 'info', 'Phase 1: AST extraction (TypeScript compiler API)...');
  const startExtract = performance.now();
  const allSymbols: StructuralSymbol[] = [];
  for (const file of files) {
    allSymbols.push(...extractStructuralSymbols(file, repoRoot));
  }
  const extractMs = Math.round(performance.now() - startExtract);
  log(ctx, 'info', `Extracted ${allSymbols.length} structural symbols in ${extractMs}ms`);

  // Stats by kind
  const byKind: Record<string, number> = {};
  for (const s of allSymbols) {
    byKind[s.kind] = (byKind[s.kind] || 0) + 1;
  }
  log(ctx, 'info', `  Breakdown: ${Object.entries(byKind).map(([k, v]) => `${k}=${v}`).join(', ')}`);

  // Phase 2: Detect duplicated type names (same name, different files)
  log(ctx, 'info', 'Phase 2: Duplicate detection with scope + kind classification...');
  const symbolsByName = new Map<string, StructuralSymbol[]>();
  for (const s of allSymbols) {
    const existing = symbolsByName.get(s.name) || [];
    existing.push(s);
    symbolsByName.set(s.name, existing);
  }

  const duplicates = [...symbolsByName.entries()]
    .filter(([, locs]) => locs.length > 1)
    .sort(([, a], [, b]) => b.length - a.length); // Most duplicated first

  for (const [name, locs] of duplicates) {
    const confidence = computeConfidence(name, locs);
    const packages = [...new Set(locs.map(l => l.package))];
    const kinds = [...new Set(locs.map(l => l.kind))];
    const exportedCount = locs.filter(l => l.exported).length;
    const locations = locs.map(l => `${relative(repoRoot, l.file)}:${l.line}`);

    // Determine severity based on confidence
    let severity: Finding['severity'];
    if (confidence === 'high') severity = locs.length > 2 ? 'error' : 'warning';
    else if (confidence === 'medium') severity = 'warning';
    else severity = 'info';

    const kindLabel = kinds.length === 1 ? kinds[0] : kinds.join('/');
    const scopeLabel = packages.length > 1
      ? `across ${packages.length} packages (${packages.join(', ')})`
      : `within "${packages[0]}"`;
    const exportLabel = exportedCount > 0 ? ` (${exportedCount} exported)` : ' (all local)';

    findings.push({
      severity,
      category: `ssot:duplicate_${kindLabel}`,
      message: `${kindLabel} "${name}" defined ${locs.length}x ${scopeLabel}${exportLabel}`,
      suggestion: confidence === 'high'
        ? `High confidence drift signal — consolidate into shared types or verify intentional divergence`
        : confidence === 'medium'
          ? `Medium signal — review if these represent the same entity or are intentionally distinct`
          : `Low signal — likely framework convention or local variant`,
      confidence,
      symbolKind: kinds.length === 1 ? kinds[0] : undefined,
      locations,
      packages,
    });
  }

  // Phase 3: Detect orphaned exported types
  log(ctx, 'info', 'Phase 3: Orphaned export detection...');
  const importedNames = new Set<string>();
  for (const file of files) {
    try {
      const content = readFileSync(file, 'utf-8');
      const importRegex = /import\s+(?:type\s+)?{([^}]+)}\s+from/g;
      for (const match of content.matchAll(importRegex)) {
        const names = match[1].split(',').map(n => n.trim().replace(/\s+as\s+\w+/, ''));
        for (const name of names) {
          if (name) importedNames.add(name);
        }
      }
    } catch { /* skip */ }
  }

  const exportedUnused = allSymbols.filter(s =>
    s.exported &&
    !importedNames.has(s.name) &&
    !s.isGenerated
  );

  for (const s of exportedUnused) {
    findings.push({
      severity: 'info',
      category: `ssot:orphaned_${s.kind}`,
      message: `Exported ${s.kind} "${s.name}" in ${s.package} is never imported`,
      file: relative(repoRoot, s.file),
      line: s.line,
      suggestion: 'Remove export if unused, or add to shared types if intended for reuse',
      confidence: 'low',
      symbolKind: s.kind,
    });
  }

  // ─── Summary & Stats ────────────────────────────────────────

  const highConf = findings.filter(f => f.confidence === 'high').length;
  const medConf = findings.filter(f => f.confidence === 'medium').length;
  const lowConf = findings.filter(f => f.confidence === 'low').length;
  const errorCount = findings.filter(f => f.severity === 'error' || f.severity === 'critical').length;
  const warnCount = findings.filter(f => f.severity === 'warning').length;
  const infoCount = findings.filter(f => f.severity === 'info').length;

  log(ctx, 'info', `Triage complete: ${errorCount} errors, ${warnCount} warnings, ${infoCount} info`);
  log(ctx, 'info', `Confidence: ${highConf} high, ${medConf} medium, ${lowConf} low/convention`);

  // Emit to Mycelium bus (only high/medium confidence)
  for (const f of findings.filter(f => f.confidence !== 'low')) {
    ctx.bus.emit(Topics.ARCH_SSOT_VIOLATION, {
      rule: f.category,
      message: f.message,
      severity: f.severity,
      confidence: f.confidence,
    }, 'ssot_auditor', ctx.correlationId);
  }

  // Write report
  if (ctx.mode === 'execute' && findings.length > 0) {
    const reportDir = join(repoRoot, 'docs', 'agentic', 'reports');
    if (!existsSync(reportDir)) mkdirSync(reportDir, { recursive: true });
    const report = generateReport(ctx, findings, files.length, allSymbols, byKind, extractMs);
    writeFileSync(join(reportDir, 'ssot-audit.md'), report);
    log(ctx, 'info', `Report written to docs/agentic/reports/ssot-audit.md`);
  }

  return findings;
}

// ─── Report Generator ─────────────────────────────────────────

function generateReport(
  ctx: RunContext,
  findings: SSOTFinding[],
  fileCount: number,
  allSymbols: StructuralSymbol[],
  byKind: Record<string, number>,
  extractMs: number,
): string {
  const highConf = findings.filter(f => f.confidence === 'high');
  const medConf = findings.filter(f => f.confidence === 'medium');
  const lowConf = findings.filter(f => f.confidence === 'low');

  const lines: string[] = [
    `# SSOT Structural Triage Report v2`,
    ``,
    `> ⚠️ **This is a triage report, not a verdict.** Findings are structural signals`,
    `> that require human review to confirm as actual SSOT violations.`,
    ``,
    `## Scan Metadata`,
    ``,
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Generated | ${ctx.startedAt} |`,
    `| Correlation | \`${ctx.correlationId}\` |`,
    `| Analysis Mode | AST-based (TypeScript compiler API) |`,
    `| API Cost | $0 (local static pass, no inference) |`,
    `| Files scanned | ${fileCount} |`,
    `| Symbols extracted | ${allSymbols.length} |`,
    `| Extraction time | ${extractMs}ms |`,
    `| Symbol breakdown | ${Object.entries(byKind).map(([k, v]) => `${k}: ${v}`).join(', ')} |`,
    ``,
    `## What This Report Proves`,
    ``,
    `1. **Proven:** Fast repo-wide structural triage with AST parsing`,
    `2. **Proven:** Symbol classification by kind (interface/type/enum/class)`,
    `3. **Proven:** Scope-aware filtering (exported, cross-package)`,
    `4. **Not yet proven:** Semantic shape comparison between duplicates`,
    `5. **Not yet proven:** Whether duplicates represent actual drift vs intentional variants`,
    ``,
    `---`,
    ``,
  ];

  // High confidence findings
  if (highConf.length > 0) {
    lines.push(`## 🔴 High Confidence Signals (${highConf.length})`);
    lines.push(`> These have the strongest indicators of potential SSOT drift:`);
    lines.push(`> exported, cross-package, specific names.`);
    lines.push(``);
    for (const f of highConf) {
      const icon = f.severity === 'error' ? '🔴' : '⚠️';
      lines.push(`### ${icon} ${f.message}`);
      lines.push(`- **Kind:** ${f.symbolKind || 'mixed'}`);
      lines.push(`- **Packages:** ${f.packages?.join(', ') || 'unknown'}`);
      if (f.locations) {
        lines.push(`- **Locations:**`);
        for (const loc of f.locations) {
          lines.push(`  - \`${loc}\``);
        }
      }
      lines.push(`- **Recommendation:** ${f.suggestion}`);
      lines.push(``);
    }
  }

  // Medium confidence
  if (medConf.length > 0) {
    lines.push(`## ⚠️ Medium Confidence Signals (${medConf.length})`);
    lines.push(`> Require validation — may be intentional or framework-driven.`);
    lines.push(``);
    for (const f of medConf) {
      lines.push(`- **${f.message}** — ${f.suggestion}`);
    }
    lines.push(``);
  }

  // Low confidence (collapsed)
  if (lowConf.length > 0) {
    lines.push(`## ℹ️ Low Confidence / Convention (${lowConf.length})`);
    lines.push(`> Likely framework conventions, local variants, or orphaned exports.`);
    lines.push(`> Review only if actively cleaning up the codebase.`);
    lines.push(``);
    for (const f of lowConf.slice(0, 20)) {
      lines.push(`- ${f.message}`);
    }
    if (lowConf.length > 20) {
      lines.push(`- ... and ${lowConf.length - 20} more`);
    }
    lines.push(``);
  }

  // Methodology note
  lines.push(`---`);
  lines.push(``);
  lines.push(`## Methodology`);
  lines.push(``);
  lines.push(`This report uses the TypeScript compiler API (\`ts.createSourceFile\`) to parse`);
  lines.push(`the AST of each file. Only structural type-level declarations are extracted:`);
  lines.push(`interfaces, type aliases, enums, and classes. Comments, strings, property keys,`);
  lines.push(`and variable names are **not** captured (fixing a known v1 issue).`);
  lines.push(``);
  lines.push(`### Confidence Scoring`);
  lines.push(``);
  lines.push(`Each finding receives a confidence score based on:`);
  lines.push(`- **+3** exported symbols in multiple locations`);
  lines.push(`- **+3** appears across multiple packages`);
  lines.push(`- **+2** name is specific (not framework convention)`);
  lines.push(`- **+1** name is long (>8 characters)`);
  lines.push(`- **-3** framework convention name (Props, State, etc.)`);
  lines.push(`- **-2** involves generated files`);
  lines.push(`- **-1** all in same package`);
  lines.push(`- **-3** very short name (≤2 chars)`);
  lines.push(``);
  lines.push(`### Known Limitations`);
  lines.push(``);
  lines.push(`1. No shape comparison yet — duplicate names may have identical or divergent shapes`);
  lines.push(`2. No cross-reference graph — can't trace re-exports through barrel files`);
  lines.push(`3. Framework conventions are heuristic-based, not exhaustive`);
  lines.push(``);

  return lines.join('\n');
}

// ─── CLI Entry ────────────────────────────────────────────────

const args = process.argv.slice(2);
const mode = args.includes('--exec') ? 'execute' as const : 'dry_run' as const;

runAgent('ssot_auditor', mode, ssotAudit).then(result => {
  printResult(result);
  process.exit(result.success ? 0 : 1);
});
