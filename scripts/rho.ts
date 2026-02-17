
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

// --- Types ---

interface GitLogEntry {
    hash: string;
    author: string;
    date: string;
    files: string[];
}

interface RhoMetrics {
    rho: number;
    authority: number;
    diversity: number;
    totalCommits: number;
    activeContributors: number;
    busFactor: number;
    fileConcentration: number;
    status: 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'EXTREME';
}

// --- Configuration ---

const REPO_ROOT = process.cwd(); // Assumes running from repo root
const LOOKBACK_DAYS = 30; // Analyze last 30 days by default

// --- Helpers ---

async function getGitLog(days: number): Promise<GitLogEntry[]> {
    try {
        // Format: Hash|Author|Date --name-only
        const cmd = `git log --since="${days} days ago" --pretty=format:"%h|%an|%ad" --name-only`;
        const { stdout } = await execAsync(cmd, { cwd: REPO_ROOT, maxBuffer: 10 * 1024 * 1024 });

        const entries: GitLogEntry[] = [];
        const lines = stdout.split('\n');

        let currentEntry: GitLogEntry | null = null;

        for (const line of lines) {
            if (!line.trim()) continue;

            if (line.includes('|')) {
                // New commit header
                if (currentEntry) entries.push(currentEntry);
                const [hash, author, date] = line.split('|');
                currentEntry = { hash, author, date, files: [] };
            } else if (currentEntry) {
                // File path
                currentEntry.files.push(line.trim());
            }
        }
        if (currentEntry) entries.push(currentEntry);

        return entries;
    } catch (error) {
        console.error("Error reading git log:", error);
        return [];
    }
}

function calculateGiniCoefficient(values: number[]): number {
    if (values.length === 0) return 0;
    values.sort((a, b) => a - b);
    const n = values.length;
    let sum = 0;
    let mean = 0;

    for (let i = 0; i < n; i++) {
        sum += (2 * (i + 1) - n - 1) * values[i];
        mean += values[i];
    }
    mean /= n;

    if (mean === 0) return 0;
    return sum / (n * n * mean);
}

// --- Logic ---

function calculateRho(logs: GitLogEntry[]): RhoMetrics {
    const totalCommits = logs.length;
    if (totalCommits === 0) {
        return {
            rho: 0, authority: 0, diversity: 0, totalCommits: 0,
            activeContributors: 0, busFactor: 0, fileConcentration: 0, status: 'EXTREME'
        };
    }

    // 1. Authority (A): Concentration of edits per file
    // High Authority = Few files get all the attention (bad for distributed systems)
    const fileCounts: Record<string, number> = {};
    logs.forEach(log => {
        log.files.forEach(file => {
            fileCounts[file] = (fileCounts[file] || 0) + 1;
        });
    });
    const fileEdits = Object.values(fileCounts);
    const authority = calculateGiniCoefficient(fileEdits); // 0 = distributed, 1 = concentrated

    // 2. Diversity (D): Spread of commits across authors
    // High Diversity = Balanced team contribution (good)
    const authorCounts: Record<string, number> = {};
    logs.forEach(log => {
        authorCounts[log.author] = (authorCounts[log.author] || 0) + 1;
    });
    const authors = Object.keys(authorCounts);
    const activeContributors = authors.length;

    // Calculate Bus Factor (simplistic: authors with > 10% of commits)
    const busFactorThreshold = totalCommits * 0.10;
    const busFactor = authors.filter(a => authorCounts[a] > busFactorThreshold).length;

    // Diversity Score (1 - Gini of authors)
    // If 1 person does everything, Gini is 1, Diversity is 0.
    // If 2 people do 50/50, Gini is 0, Diversity is 1.
    const authorCommits = Object.values(authorCounts);
    const diversity = 1 - calculateGiniCoefficient(authorCommits);

    // 3. Rho (p) = Authority / (Diversity + epsilon)
    // We want Authority LOW and Diversity HIGH.
    // Low Rho is GOOD. High Rho is BAD.
    // If Diversity is 0 (1 dev), Rho explodes.
    const epsilon = 0.01;
    let rho = authority / (diversity + epsilon);

    // Normalize Rho to 0-1 range roughly for readability? 
    // Actually, distinct values matter more. 
    // If A=0.3, D=0.01 -> Rho = 0.3 / 0.02 = 15.0 (Extreme)
    // If A=0.2, D=0.5 -> Rho = 0.2 / 0.51 = 0.39 (Good)

    // Let's cap/scale for the "Score" visual
    // p > 1.0 = Extreme
    // p < 0.1 = Healthy

    let status: RhoMetrics['status'] = 'HEALTHY';
    if (rho > 1.0) status = 'EXTREME';
    else if (rho > 0.5) status = 'CRITICAL';
    else if (rho > 0.1) status = 'WARNING';

    return {
        rho,
        authority,
        diversity,
        totalCommits,
        activeContributors,
        busFactor,
        fileConcentration: authority, // Alias
        status
    };
}

// --- Main ---

async function main() {
    console.log(`\n🌀 Calculating Project Rho (Lookback: ${LOOKBACK_DAYS} days)...\n`);

    const logs = await getGitLog(LOOKBACK_DAYS);
    const metrics = calculateRho(logs);

    console.log(`╔════════════════════════════════════════════════════╗`);
    console.log(`║  Rho Score (ρ):       ${metrics.rho.toFixed(4).padEnd(29)}║`);
    console.log(`║  Authority (A):       ${metrics.authority.toFixed(4).padEnd(29)}║`);
    console.log(`║  Diversity (D):       ${metrics.diversity.toFixed(4).padEnd(29)}║`);
    console.log(`║  Status:              ${getStatusEmoji(metrics.status)} ${metrics.status.padEnd(20)}║`);
    console.log(`╠════════════════════════════════════════════════════╣`);
    console.log(`║  Commits:             ${metrics.totalCommits.toString().padEnd(29)}║`);
    console.log(`║  Contributors:        ${metrics.activeContributors.toString().padEnd(29)}║`);
    console.log(`║  Bus Factor:          ${metrics.busFactor.toString().padEnd(29)}║`);
    console.log(`╚════════════════════════════════════════════════════╝\n`);

    if (metrics.status === 'EXTREME' || metrics.status === 'CRITICAL') {
        console.log(`⚠️  ACTION REQUIRED: System is too centralized.`);
        console.log(`   - Delegate modules`);
        console.log(`   - Invite contributors`);
        console.log(`   - Document core logic\n`);
    } else {
        console.log(`✅ System is decentralized and healthy.\n`);
    }
}

function getStatusEmoji(status: string) {
    switch (status) {
        case 'EXTREME': return '⚫';
        case 'CRITICAL': return '🔴';
        case 'WARNING': return '🟡';
        case 'HEALTHY': return '🟢';
        default: return '⚪';
    }
}

main();
