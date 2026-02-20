import { spawn } from "child_process";
import { readFile, appendFile } from "fs/promises";
import { join } from "path";
import { analyzeWithAI } from "../packages/shared/src/ai-client";

// 🌐 Ambient Disseminator — Autonomous Evolution Engine
// Runs at the end of every session to read git diffs and auto-patch global rules.

const MAX_DIFF_CHARS = 12000;
const ROOT_DIR = process.cwd();

async function getAmbientDiff(): Promise<string> {
    return new Promise((resolve, reject) => {
        // Try to get the diff of the last 5 commits + uncommitted changes
        const git = spawn("git", ["diff", "HEAD~5", "HEAD", "--", ":!package-lock.json", ":!bun.lockb"]);
        let data = "";
        git.stdout.on("data", (chunk: Buffer) => data += chunk);
        git.on("close", (code: number) => {
            if (code === 0 && data.trim()) {
                resolve(data);
            } else {
                // Fallback to uncommitted only
                const git2 = spawn("git", ["diff", "HEAD", "--", ":!package-lock.json", ":!bun.lockb"]);
                let data2 = "";
                git2.stdout.on("data", (chunk: Buffer) => data2 += chunk);
                git2.on("close", (code2: number) => {
                    if (code2 === 0) resolve(data2);
                    else resolve("");
                });
            }
        });
    });
}

async function evolve() {
    console.log("\n🌌 Ambient Evolution Engine v1.0");

    const diff = await getAmbientDiff();
    if (!diff.trim()) {
        console.log("   ✅ No ambient changes detected.");
        return;
    }

    const rulesPatch = await readFile(join(ROOT_DIR, ".windsurfrules"), "utf-8").catch(() => "No .windsurfrules found.");
    const prefsPatch = await readFile(join(ROOT_DIR, ".guarani", "PREFERENCES.md"), "utf-8").catch(() => "No PREFERENCES.md found.");

    const truncatedDiff = diff.length > MAX_DIFF_CHARS
        ? diff.substring(0, MAX_DIFF_CHARS) + `\n... (truncated)`
        : diff;

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        console.log("   ⚠️  OPENROUTER_API_KEY not set. Ambient evolution skipped.");
        return;
    }

    console.log("   🧠 Analyzing daily diffs and SSOT contradictions...");

    const systemPrompt = `You are the Ambient Disseminator, an autonomous intelligence for the EGOS system.
Your job is to read the human's recent Git Diffs and the current SSOT governance rules.

Analyze the diffs. Did the human introduce a systemic fix, a new architectural pattern, or an IDE workaround?
Did they inadvertently contradict the existing rules?

If you discover a new, permanent pattern that MUST be disseminated, output exactly what needs to be appended to .windsurfrules or PREFERENCES.md.
If nothing systemic was changed, leave the appends empty.

Respond ONLY with this JSON format:
{
  "summary": "1-2 lines summarizing the evolution or zeroing it out if nothing major happened",
  "windsurfrules_append": "Markdown text to append to .windsurfrules (or empty string)",
  "preferences_append": "Markdown text to append to .guarani/PREFERENCES.md (or empty string)"
}`;

    const userPrompt = `### RECENT DIFFS:\n${truncatedDiff}\n\n### CURRENT WINDSURFRULES:\n${rulesPatch.substring(0, 3000)}\n\n### CURRENT PREFERENCES.md:\n${prefsPatch.substring(0, 3000)}`;

    try {
        const result = await analyzeWithAI({
            systemPrompt,
            userPrompt,
            maxTokens: 1500,
            temperature: 0.2, // Low temp for structured adherence
        });

        const patch = JSON.parse(result.content);
        console.log(`   📝 Insight: ${patch.summary}`);

        if (patch.windsurfrules_append) {
            await appendFile(join(ROOT_DIR, ".windsurfrules"), `\n\n## 🔄 Ambient Learned Rule (${new Date().toISOString().split('T')[0]})\n${patch.windsurfrules_append}`);
            console.log(`   ✅ Injected new intelligence into .windsurfrules`);
        }

        if (patch.preferences_append) {
            await appendFile(join(ROOT_DIR, ".guarani", "PREFERENCES.md"), `\n\n## 🔄 Ambient Learned Preference (${new Date().toISOString().split('T')[0]})\n${patch.preferences_append}`);
            console.log(`   ✅ Injected new intelligence into .guarani/PREFERENCES.md`);
        }

        if (!patch.windsurfrules_append && !patch.preferences_append) {
            console.log(`   ⚖️ Workspace rules represent current SSOT perfectly.`);
        }

    } catch (err: unknown) {
        console.log("   ❌ Ambient evolution failed: ", err instanceof Error ? err.message : String(err));
    }
}

evolve().catch(console.error);
