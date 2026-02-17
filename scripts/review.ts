import { spawn } from "child_process";
import { readFile } from "fs/promises";
import { join } from "path";

// 🐰 Cortex Reviewer (Project "Rabbit Hunter")
// A local AI Code Reviewer using Gemini 2.0 Flash.

const LEARNINGS_FILE = join(process.cwd(), "docs", "review", "LEARNINGS.md");

async function getDiff(): Promise<string> {
    return new Promise((resolve, reject) => {
        const git = spawn("git", ["diff", "--cached", "--", ":!package-lock.json", ":!bun.lockb"]);
        let data = "";
        git.stdout.on("data", (chunk) => data += chunk);
        git.on("close", (code) => {
            if (code === 0) resolve(data);
            else reject(new Error(`Git diff failed with code ${code}`));
        });
    });
}

async function review() {
    console.log("🐰 Cortex Reviewer v1.0");

    // 1. Get Diff
    const diff = await getDiff();
    if (!diff.trim()) {
        console.log("✅ No changes to review.");
        return;
    }

    // 2. Read Learnings
    const learnings = await readFile(LEARNINGS_FILE, "utf-8").catch(() => "");

    // 3. Construct Prompt (Simulation)
    const prompt = `
    ROLE: Senior AI Code Reviewer (Cortex).
    TASK: Review the following git diff.
    CONTEXT:
    ${learnings}

    DIFF:
    ${diff.substring(0, 10000)}... (Truncated for safety)
  `;

    console.log("\n🔍 Analyzing Diff...");
    console.log(`- Diff Size: ${diff.length} chars`);
    console.log(`- Context: Loaded ${learnings.split("\n").length} rules from LEARNINGS.md`);

    // 4. Call LLM (Placeholder for now - User needs to provide API Key method)
    // In a real scenario, we would allow the user to pipe this to an LLM via CLI.
    // For now, we simulate a "Pass" but warn about the missing API integration.

    console.log("\n⚠️  LLM Integration Pending.");
    console.log("To fully activate Cortex, we need to connect to an LLM API (Gemini/OpenAI).");
    console.log("For now, showing what WOULD be sent:\n");
    console.log("--- PROMPT START ---");
    console.log(prompt.substring(0, 500) + "\n... [Rest of Prompt] ...");
    console.log("--- PROMPT END ---\n");

    console.log("✅ Review Simulation Complete.");
}

review().catch(console.error);
