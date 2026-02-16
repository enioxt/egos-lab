import { readdir, readFile } from "fs/promises";
import { join } from "path";

const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const RESET = "\x1b[0m";

// 🚫 Patterns to Block
const SECRET_PATTERNS = [
    { name: "OpenAI Key", regex: /sk-proj-[a-zA-Z0-9]{20,}/ },
    { name: "Supabase Key", regex: /sbp_[a-zA-Z0-9]{20,}/ },
    { name: "GitHub Token", regex: /ghp_[a-zA-Z0-9]{20,}/ },
    { name: "AWS Key", regex: /AKIA[0-9A-Z]{16}/ },
    { name: "Private Key", regex: /-----BEGIN PRIVATE KEY-----/ },
    { name: "Generic API Key", regex: /(api_key|apikey|secret|token)\s*[:=]\s*['"`][a-zA-Z0-9]{20,}['"`]/i },
];

// 📂 Dirs to Ignore
const IGNORE_DIRS = ["node_modules", ".git", "dist", "output", ".next", "coverage"];
const IGNORE_FILES = [".env", ".env.local", "pnpm-lock.yaml", "bun.lockb", "security_scan.ts"];

async function scanDirectory(dir: string): Promise<number> {
    let issues = 0;
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = join(dir, entry.name);

        if (IGNORE_DIRS.includes(entry.name)) continue;

        if (entry.isDirectory()) {
            issues += await scanDirectory(fullPath);
        } else {
            if (IGNORE_FILES.includes(entry.name)) continue;
            // Skip non-text files heavily
            if (entry.name.endsWith(".png") || entry.name.endsWith(".jpg") || entry.name.endsWith(".pdf")) continue;

            try {
                const content = await readFile(fullPath, "utf-8");
                for (const pattern of SECRET_PATTERNS) {
                    if (pattern.regex.test(content)) {
                        console.error(`${RED}🚨 [SECURITY] Found ${pattern.name} in ${fullPath}${RESET}`);
                        issues++;
                    }
                }
            } catch (err) {
                // Ignore read errors
            }
        }
    }
    return issues;
}

console.log(`${GREEN}🛡️  Starting Egos Security Scan...${RESET}`);
const issues = await scanDirectory(process.cwd());

if (issues > 0) {
    console.error(`${RED}❌ Security Scan FAILED. ${issues} secrets found.${RESET}`);
    process.exit(1);
} else {
    console.log(`${GREEN}✅ Security Scan PASSED. No secrets found.${RESET}`);
    process.exit(0);
}
