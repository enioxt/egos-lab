import { spawn } from "child_process";
import { readFile } from "fs/promises";
import { join } from "path";
import { analyzeWithAI } from "../packages/shared/src/ai-client";

// Cortex Reviewer — AI Code Reviewer using Gemini 2.0 Flash
// Uses packages/shared/ai-client.ts for LLM calls

const LEARNINGS_FILE = join(process.cwd(), "docs", "review", "LEARNINGS.md");
const MAX_DIFF_CHARS = 12000;

async function getDiff(): Promise<string> {
    return new Promise((resolve, reject) => {
        // Try staged first, fall back to HEAD diff
        const git = spawn("git", ["diff", "--cached", "--", ":!package-lock.json", ":!bun.lockb"]);
        let data = "";
        git.stdout.on("data", (chunk: Buffer) => data += chunk);
        git.on("close", (code: number) => {
            if (code === 0 && data.trim()) {
                resolve(data);
            } else {
                // Fall back to last commit diff
                const git2 = spawn("git", ["diff", "HEAD~1", "--", ":!package-lock.json", ":!bun.lockb"]);
                let data2 = "";
                git2.stdout.on("data", (chunk: Buffer) => data2 += chunk);
                git2.on("close", (code2: number) => {
                    if (code2 === 0) resolve(data2);
                    else reject(new Error(`Git diff failed with code ${code2}`));
                });
            }
        });
    });
}

async function review() {
    console.log("� Cortex Reviewer v2.0\n");

    const diff = await getDiff();
    if (!diff.trim()) {
        console.log("✅ No changes to review.");
        return;
    }

    const learnings = await readFile(LEARNINGS_FILE, "utf-8").catch(() => "No learnings file found.");
    const truncatedDiff = diff.length > MAX_DIFF_CHARS
        ? diff.substring(0, MAX_DIFF_CHARS) + `\n... (truncated, ${diff.length - MAX_DIFF_CHARS} chars omitted)`
        : diff;

    console.log(`  Diff: ${diff.length} chars (${diff.split('\n').length} lines)`);
    console.log(`  Learnings: ${learnings.split("\n").length} rules loaded`);

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        console.log("\n⚠️  OPENROUTER_API_KEY not set. Showing diff stats only.");
        console.log(`  Files changed: ${(diff.match(/^diff --git/gm) || []).length}`);
        console.log(`  Additions: ${(diff.match(/^\+[^+]/gm) || []).length}`);
        console.log(`  Deletions: ${(diff.match(/^-[^-]/gm) || []).length}`);
        return;
    }

    console.log("  Calling Gemini 2.0 Flash...\n");

    const systemPrompt = `You are Cortex, a senior AI code reviewer for the EGOS project.
You review git diffs and produce structured JSON feedback.

Rules:
- Focus on bugs, security issues, performance, and code quality
- Be concise — max 3 sentences per finding
- Severity: critical, error, warning, info
- If the code looks good, say so briefly

Context from project learnings:
${learnings.substring(0, 2000)}

Respond in JSON format:
{
  "summary": "one-line overall assessment",
  "findings": [
    { "severity": "warning", "file": "path", "message": "what's wrong", "suggestion": "how to fix" }
  ],
  "score": 0-100
}`;

    try {
        const result = await analyzeWithAI({
            systemPrompt,
            userPrompt: `Review this git diff:\n\n${truncatedDiff}`,
            maxTokens: 1500,
            temperature: 0.2,
        });

        console.log(`  Cost: $${result.cost_usd.toFixed(4)}`);
        console.log(`  Tokens: ${result.usage.total_tokens}\n`);

        try {
            const review = JSON.parse(result.content);
            console.log(`  Summary: ${review.summary}`);
            console.log(`  Score: ${review.score}/100\n`);

            if (review.findings && review.findings.length > 0) {
                const icons: Record<string, string> = { critical: '🚨', error: '🔴', warning: '⚠️', info: 'ℹ️' };
                for (const f of review.findings) {
                    const icon = icons[f.severity] || '•';
                    console.log(`  ${icon} [${f.severity}] ${f.message}`);
                    if (f.file) console.log(`     File: ${f.file}`);
                    if (f.suggestion) console.log(`     Fix: ${f.suggestion}`);
                    console.log();
                }
            } else {
                console.log("  ✅ No issues found.\n");
            }
        } catch {
            console.log("  Raw response:\n", result.content);
        }
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`  ❌ Review failed: ${msg}`);
    }
}

review().catch(console.error);
