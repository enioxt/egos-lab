import { readdir, readFile, appendFile } from "fs/promises";
import { join } from "path";

// 🧠 Disseminate Script (The "Harvester")
// Scans codebase for `@disseminate` tags and saves them to `docs/knowledge/HARVEST.md`.

const ROOT_DIR = process.cwd();
const KNOWLEDGE_FILE = join(ROOT_DIR, "docs", "knowledge", "HARVEST.md");

async function scanFiles(dir: string): Promise<string[]> {
    const entries = await readdir(dir, { withFileTypes: true });
    const files: string[] = [];

    for (const entry of entries) {
        const path = join(dir, entry.name);
        if (entry.isDirectory()) {
            if (entry.name === "node_modules" || entry.name === ".git" || entry.name === "dist") continue;
            files.push(...(await scanFiles(path)));
        } else {
            if (entry.name.endsWith(".ts") || entry.name.endsWith(".kt") || entry.name.endsWith(".md")) {
                files.push(path);
            }
        }
    }
    return files;
}

async function harvest() {
    console.log("🍄 Mycelium Harvester /disseminate v1.0");
    const files = await scanFiles(ROOT_DIR);
    let count = 0;

    for (const file of files) {
        const content = await readFile(file, "utf-8");
        const lines = content.split("\n");

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.includes("@disseminate")) {
                const comment = line.split("@disseminate")[1].trim().replace(/^[:\s]+/, "");
                const entry = `\n- **[${new Date().toISOString().split("T")[0]}]** ${comment} (File: \`${file.replace(ROOT_DIR, "")}:${i + 1}\`)`;

                await appendFile(KNOWLEDGE_FILE, entry);
                console.log(`✅ Harvested: ${comment}`);
                count++;
            }
        }
    }

    console.log(`\n🌾 Harvest Complete. ${count} item(s) saved to ${KNOWLEDGE_FILE}.`);
}

harvest().catch(console.error);
