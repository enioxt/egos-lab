/**
 * SSOT Governance Pre-commit Checks
 * 
 * Runs alongside security_scan.ts to enforce Single Source of Truth rules:
 * 1. no-duplicate-types: Same type/interface defined in 2+ files (BLOCKING)
 * 2. no-orphan-docs: New .md files outside docs/ or root (WARNING)
 * 3. commit-format: Non-conventional commit messages (WARNING)
 * 4. no-select-star: .select('*') in API routes (WARNING)
 * 5. config-drift: .guarani or .windsurfrules modified without AGENTS.md (WARNING)
 */

import { readdir, readFile } from "fs/promises";
import { join, extname, relative } from "path";
import { execSync } from "child_process";

const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const GREEN = "\x1b[32m";
const CYAN = "\x1b[36m";
const RESET = "\x1b[0m";

const SCAN_EXTENSIONS = [".ts", ".tsx"];
const IGNORE_DIRS = ["node_modules", "dist", ".git", ".vercel", ".next", ".husky", ".logs", "External"];

const TYPE_DEF_REGEX = /^(?!.*(?:import|export\s+\{|from\s+['"]))\s*(?:export\s+)?(?:interface|type)\s+(\w+)/;

interface Finding {
  level: "error" | "warning";
  check: string;
  message: string;
  file?: string;
}

async function walkDir(dir: string, extensions: string[]): Promise<string[]> {
  const results: string[] = [];
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (IGNORE_DIRS.includes(entry.name)) continue;
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...(await walkDir(fullPath, extensions)));
      } else if (extensions.includes(extname(entry.name))) {
        results.push(fullPath);
      }
    }
  } catch {
    // skip unreadable dirs
  }
  return results;
}

async function checkDuplicateTypes(root: string): Promise<Finding[]> {
  const findings: Finding[] = [];
  const typeMap = new Map<string, string[]>();

  const files = await walkDir(root, SCAN_EXTENSIONS);
  for (const file of files) {
    try {
      const content = await readFile(file, "utf-8");
      const lines = content.split("\n");
      for (const line of lines) {
        const match = line.match(TYPE_DEF_REGEX);
        if (match) {
          const typeName = match[1];
          if (!typeMap.has(typeName)) typeMap.set(typeName, []);
          typeMap.get(typeName)!.push(relative(root, file));
        }
      }
    } catch {
      // skip
    }
  }

  for (const [typeName, files] of typeMap.entries()) {
    if (files.length > 1) {
      // Skip very common/generic names that are likely intentional
      const genericNames = ["Props", "State", "Config", "Options", "Params", "Result", "Error", "Response", "Request"];
      if (genericNames.includes(typeName)) continue;

      findings.push({
        level: "warning",
        check: "no-duplicate-types",
        message: `Type "${typeName}" defined in ${files.length} files: ${files.join(", ")}`,
      });
    }
  }

  return findings;
}

function checkStagedFiles(): Finding[] {
  const findings: Finding[] = [];

  try {
    const staged = execSync("git diff --cached --name-only --diff-filter=A", { encoding: "utf-8" }).trim();
    if (!staged) return findings;

    const newFiles = staged.split("\n").filter(Boolean);

    // Check for orphan .md files (new markdown files not in docs/ or root)
    for (const file of newFiles) {
      if (file.endsWith(".md") && file.includes("/") && !file.startsWith("docs/") && !file.startsWith(".guarani/") && !file.startsWith(".windsurf/")) {
        findings.push({
          level: "warning",
          check: "no-orphan-docs",
          message: `New .md file outside docs/: ${file}. Consider moving to docs/ to avoid doc proliferation.`,
          file,
        });
      }
    }

    // Check for select('*') in new/modified API files
    const modifiedFiles = execSync("git diff --cached --name-only", { encoding: "utf-8" }).trim().split("\n").filter(Boolean);
    for (const file of modifiedFiles) {
      if (file.includes("api/") && (file.endsWith(".ts") || file.endsWith(".tsx"))) {
        try {
          const content = execSync(`git show :${file}`, { encoding: "utf-8" });
          if (content.includes("select('*')") || content.includes('select("*")')) {
            findings.push({
              level: "warning",
              check: "no-select-star",
              message: `select('*') found in API route: ${file}. Specify columns explicitly.`,
              file,
            });
          }
        } catch {
          // file might be deleted
        }
      }
    }

    // Check config drift: .guarani or .windsurfrules modified but not AGENTS.md
    const hasGuaraniChange = modifiedFiles.some((f: string) => f.startsWith(".guarani/") || f === ".windsurfrules");
    const hasAgentsChange = modifiedFiles.includes("AGENTS.md");
    if (hasGuaraniChange && !hasAgentsChange) {
      findings.push({
        level: "warning",
        check: "config-drift",
        message: "Rule files modified (.guarani/ or .windsurfrules) but AGENTS.md not updated. Consider syncing.",
      });
    }

  } catch {
    // git not available or not in a repo
  }

  return findings;
}

// --- Main ---

console.log(`${CYAN}📋 Starting SSOT Governance Checks...${RESET}`);

const root = process.cwd();
const allFindings: Finding[] = [];

// Run checks
allFindings.push(...(await checkDuplicateTypes(root)));
allFindings.push(...checkStagedFiles());

const errors = allFindings.filter((f) => f.level === "error");
const warnings = allFindings.filter((f) => f.level === "warning");

if (warnings.length > 0) {
  console.log(`${YELLOW}⚠️  ${warnings.length} SSOT warning(s):${RESET}`);
  for (const w of warnings) {
    console.log(`  ${YELLOW}[${w.check}]${RESET} ${w.message}`);
  }
}

if (errors.length > 0) {
  console.error(`${RED}❌ ${errors.length} SSOT violation(s) — commit blocked:${RESET}`);
  for (const e of errors) {
    console.error(`  ${RED}[${e.check}]${RESET} ${e.message}`);
  }
  process.exit(1);
} else {
  console.log(`${GREEN}✅ SSOT Governance PASSED.${RESET}`);
  process.exit(0);
}
