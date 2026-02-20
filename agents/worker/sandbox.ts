/**
 * SandboxManager — Secure Git Clone & Temp Directory Lifecycle
 * 
 * Handles:
 * - Shallow git clone to isolated temp directory
 * - GitHub token injection for private repos
 * - Disk size limits (500MB max)
 * - Timeout enforcement (60s for clone)
 * - Cleanup (always, even on error)
 */

import { existsSync, statSync, readdirSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';

const SANDBOX_BASE = '/tmp/egos-sandbox';
const MAX_CLONE_TIMEOUT_MS = 60_000;
const MAX_REPO_SIZE_MB = 500;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.GITHUB_PERSONAL_ACCESS_TOKEN || '';

export interface SandboxInfo {
    id: string;
    path: string;
    repoUrl: string;
    cloneDurationMs: number;
    sizeMB: number;
}

/**
 * Inject auth token into a GitHub HTTPS URL for private repo access
 */
function injectToken(repoUrl: string): string {
    if (!GITHUB_TOKEN) return repoUrl;
    // Only inject for github.com HTTPS URLs
    if (repoUrl.startsWith('https://github.com/')) {
        return repoUrl.replace('https://github.com/', `https://${GITHUB_TOKEN}@github.com/`);
    }
    return repoUrl;
}

/**
 * Calculate directory size recursively (in MB)
 */
function getDirSizeMB(dirPath: string): number {
    let totalBytes = 0;
    try {
        const entries = readdirSync(dirPath, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = join(dirPath, entry.name);
            if (entry.name === '.git') continue; // skip .git for size calculation
            if (entry.isDirectory()) {
                totalBytes += getDirSizeMB(fullPath) * 1024 * 1024;
            } else {
                totalBytes += statSync(fullPath).size;
            }
        }
    } catch { /* ignore unreadable */ }
    return totalBytes / (1024 * 1024);
}

/**
 * Create a sandbox: clone a repo into an isolated temp directory
 */
export async function createSandbox(repoUrl: string, taskId?: string): Promise<SandboxInfo> {
    const id = taskId || randomUUID().slice(0, 12);
    const sandboxPath = join(SANDBOX_BASE, `sandbox-${id}`);

    // Ensure base dir exists
    const mkdirProc = Bun.spawn(['mkdir', '-p', SANDBOX_BASE]);
    await mkdirProc.exited;

    const authUrl = injectToken(repoUrl);
    const start = performance.now();

    // Shallow clone with timeout
    const cloneProc = Bun.spawn(
        ['git', 'clone', '--depth=1', '--single-branch', authUrl, sandboxPath],
        {
            stdout: 'pipe',
            stderr: 'pipe',
            env: {
                ...process.env,
                GIT_TERMINAL_PROMPT: '0', // Never prompt for credentials
            },
        }
    );

    // Enforce timeout
    const timeout = setTimeout(() => {
        try { cloneProc.kill(); } catch { /* already dead */ }
    }, MAX_CLONE_TIMEOUT_MS);

    const exitCode = await cloneProc.exited;
    clearTimeout(timeout);

    const cloneDurationMs = Math.round(performance.now() - start);

    if (exitCode !== 0) {
        const stderr = await new Response(cloneProc.stderr).text();
        // Clean up partial clone
        await destroySandbox(sandboxPath);
        throw new Error(`Git clone failed (exit ${exitCode}): ${stderr.slice(0, 200)}`);
    }

    // Check size
    const sizeMB = Math.round(getDirSizeMB(sandboxPath) * 10) / 10;
    if (sizeMB > MAX_REPO_SIZE_MB) {
        await destroySandbox(sandboxPath);
        throw new Error(`Repo too large: ${sizeMB}MB exceeds ${MAX_REPO_SIZE_MB}MB limit`);
    }

    return { id, path: sandboxPath, repoUrl, cloneDurationMs, sizeMB };
}

/**
 * Destroy a sandbox: remove the temp directory
 */
export async function destroySandbox(sandboxPath: string): Promise<void> {
    if (!sandboxPath.startsWith(SANDBOX_BASE)) {
        throw new Error(`Security: refusing to delete path outside sandbox base: ${sandboxPath}`);
    }
    if (!existsSync(sandboxPath)) return;

    const proc = Bun.spawn(['rm', '-rf', sandboxPath]);
    await proc.exited;
}

/**
 * List all active sandboxes (for monitoring)
 */
export function listSandboxes(): string[] {
    try {
        return readdirSync(SANDBOX_BASE).filter(d => d.startsWith('sandbox-'));
    } catch {
        return [];
    }
}
