/**
 * Auth & Roles Consistency Checker — P0.2
 * 
 * Detects role/permission inconsistencies across:
 * - Middleware guards (middleware.ts, route guards)
 * - UI rendering (sidebar, nav, conditional renders)
 * - API route session checks
 * - Supabase RLS references
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative, extname } from 'path';
import { runAgent, printResult, log, type RunContext, type Finding } from '../runtime/runner';

const SCAN_EXTENSIONS = ['.ts', '.tsx'];
const IGNORE_DIRS = ['node_modules', 'dist', '.git', '.vercel', '.next', '.husky', 'External', '.egos', '.logs'];

// Patterns that indicate role/auth logic
const ROLE_PATTERNS = [
    { regex: /role\s*[=!]==?\s*['"](\w+)['"]/g, type: 'role_check' },
    { regex: /session\?\.user\.role/g, type: 'session_role' },
    { regex: /user\.role\s*[=!]==?\s*['"](\w+)['"]/g, type: 'user_role_check' },
    { regex: /isAdmin|is_admin|isInstructor|is_instructor|isStudent|is_student/g, type: 'role_flag' },
    { regex: /getSession|getServerSession|createServerClient|createClient/g, type: 'auth_call' },
    { regex: /middleware.*auth|auth.*middleware/gi, type: 'middleware_auth' },
    { regex: /requireAuth|withAuth|protectedRoute|ProtectedRoute/g, type: 'auth_guard' },
    { regex: /supabase\.auth\./g, type: 'supabase_auth' },
];

// Patterns for public route declarations
const PUBLIC_ROUTE_PATTERN = /public.*routes?|unprotected|noAuth/gi;

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
            } else if (SCAN_EXTENSIONS.includes(extname(entry))) {
                results.push(fullPath);
            }
        }
    } catch { /* skip unreadable */ }
    return results;
}

interface AuthReference {
    file: string;
    line: number;
    type: string;
    match: string;
    context: string; // surrounding line
}

function scanFile(filePath: string): AuthReference[] {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const refs: AuthReference[] = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        for (const pattern of ROLE_PATTERNS) {
            const matches = [...line.matchAll(pattern.regex)];
            for (const match of matches) {
                refs.push({
                    file: filePath,
                    line: i + 1,
                    type: pattern.type,
                    match: match[0],
                    context: line.trim(),
                });
            }
        }
    }

    return refs;
}

async function authRolesCheck(ctx: RunContext): Promise<Finding[]> {
    const findings: Finding[] = [];
    const repoRoot = ctx.repoRoot;

    log(ctx, 'info', 'Scanning for auth/role patterns...');

    const files = walkDir(repoRoot);
    log(ctx, 'info', `Found ${files.length} TypeScript files to analyze`);

    // 1. Collect all auth references
    const allRefs: AuthReference[] = [];
    for (const file of files) {
        allRefs.push(...scanFile(file));
    }
    log(ctx, 'info', `Found ${allRefs.length} auth/role references`);

    // 2. Group by type
    const byType = new Map<string, AuthReference[]>();
    for (const ref of allRefs) {
        const existing = byType.get(ref.type) || [];
        existing.push(ref);
        byType.set(ref.type, existing);
    }

    // 3. Report: auth calls distribution
    for (const [type, refs] of byType) {
        const fileSet = new Set(refs.map(r => relative(repoRoot, r.file)));
        findings.push({
            severity: 'info',
            category: 'auth:distribution',
            message: `Pattern "${type}" found ${refs.length} times across ${fileSet.size} files`,
        });
    }

    // 4. Detect API routes WITHOUT auth checks
    const apiFiles = files.filter(f => f.includes('/api/') || f.includes('/route.'));
    const apiWithAuth = new Set<string>();
    const apiWithoutAuth: string[] = [];

    for (const apiFile of apiFiles) {
        const content = readFileSync(apiFile, 'utf-8');
        const hasAuth = /getSession|getServerSession|createServerClient|supabase\.auth\.|requireAuth|withAuth|authorization/i.test(content);
        const isPublic = PUBLIC_ROUTE_PATTERN.test(content);

        if (hasAuth || isPublic) {
            apiWithAuth.add(apiFile);
        } else {
            // Check if it's a webhook or public endpoint
            const isWebhook = /webhook|callback|health|ping/i.test(apiFile);
            if (!isWebhook) {
                apiWithoutAuth.push(apiFile);
            }
        }
    }

    for (const apiFile of apiWithoutAuth) {
        findings.push({
            severity: 'warning',
            category: 'auth:missing_api_auth',
            message: `API route has no auth check: ${relative(repoRoot, apiFile)}`,
            file: relative(repoRoot, apiFile),
            suggestion: 'Add session/auth verification or mark as intentionally public',
        });
    }

    if (apiFiles.length > 0) {
        const coverage = ((apiWithAuth.size / apiFiles.length) * 100).toFixed(0);
        findings.push({
            severity: apiWithAuth.size < apiFiles.length ? 'warning' : 'info',
            category: 'auth:api_coverage',
            message: `API auth coverage: ${apiWithAuth.size}/${apiFiles.length} routes (${coverage}%)`,
        });
    }

    // 5. Detect role string inconsistencies
    const roleStrings = new Map<string, string[]>();
    for (const ref of allRefs) {
        if (ref.type === 'role_check' || ref.type === 'user_role_check') {
            const roleMatch = ref.match.match(/['"](\w+)['"]/);
            if (roleMatch) {
                const role = roleMatch[1];
                const existing = roleStrings.get(role) || [];
                existing.push(relative(repoRoot, ref.file));
                roleStrings.set(role, existing);
            }
        }
    }

    if (roleStrings.size > 0) {
        const roleList = [...roleStrings.entries()].map(([role, files]) => `"${role}" (${files.length} refs)`).join(', ');
        findings.push({
            severity: 'info',
            category: 'auth:roles_found',
            message: `Roles detected: ${roleList}`,
            suggestion: 'Ensure these match your Supabase auth.users metadata and RLS policies',
        });
    }

    // 6. Detect middleware files
    const middlewareFiles = files.filter(f => f.includes('middleware'));
    if (middlewareFiles.length === 0) {
        findings.push({
            severity: 'warning',
            category: 'auth:no_middleware',
            message: 'No middleware file found — auth may not be enforced at the routing level',
            suggestion: 'Create middleware.ts to enforce auth on protected routes',
        });
    } else {
        for (const mw of middlewareFiles) {
            findings.push({
                severity: 'info',
                category: 'auth:middleware_found',
                message: `Middleware: ${relative(repoRoot, mw)}`,
                file: relative(repoRoot, mw),
            });
        }
    }

    // Summary
    const errors = findings.filter(f => f.severity === 'error' || f.severity === 'critical').length;
    const warnings = findings.filter(f => f.severity === 'warning').length;
    log(ctx, 'info', `Auth audit complete: ${errors} errors, ${warnings} warnings, ${findings.length} total`);

    return findings;
}

const mode = process.argv.includes('--exec') ? 'execute' as const : 'dry_run' as const;
runAgent('auth_roles_checker', mode, authRolesCheck).then(result => {
    printResult(result);
    process.exit(result.success ? 0 : 1);
});
