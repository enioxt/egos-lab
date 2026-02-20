import { readdir, readFile } from "fs/promises";
import { join } from "path";

const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const GREEN = "\x1b[32m";
const RESET = "\x1b[0m";

// 📉 Shannon Entropy Calculation
function getEntropy(str: string): number {
    const len = str.length;
    const frequencies = new Map<string, number>();

    for (const char of str) {
        frequencies.set(char, (frequencies.get(char) || 0) + 1);
    }

    let entropy = 0;
    for (const count of frequencies.values()) {
        const p = count / len;
        entropy -= p * Math.log2(p);
    }
    return entropy;
}

// 🚫 Known Signatures (High Confidence)
const SECRET_PATTERNS = [
    { name: "OpenAI Key", regex: /sk-(proj-)?[a-zA-Z0-9]{20,}/ },
    { name: "Google API Key", regex: /AIza[0-9A-Za-z-_]{35}/ },
    { name: "Context7 Key", regex: /ctx7sk-[a-f0-9-]{36}/ },
    { name: "Supabase Key", regex: /sbp_[a-zA-Z0-9]{20,}/ },
    { name: "GitHub Token", regex: /ghp_[a-zA-Z0-9]{20,}/ },
    { name: "AWS Key", regex: /AKIA[0-9A-Z]{16}/ },
    { name: "Private Key", regex: /-----BEGIN [A-Z]+ PRIVATE KEY-----/ },
    { name: "Slack Token", regex: /xox[baprs]-([0-9a-zA-Z]{10,48})/ },
    { name: "Stripe Key", regex: /sk_live_[0-9a-zA-Z]{24}/ },
];

// 🧐 Heuristic Keywords (Medium Confidence)
// Look for assignments like: const apiKey = "..."
const HEURISTIC_REGEX = /(?:api_key|apikey|secret|token|password|auth|credential)s?\s*[:=]\s*['"`]([a-zA-Z0-9_\-]{8,})['"`]/gi;

// 🛑 Prompt Injection (Jailbreak) Patterns (APEX-SECURE)
const JAILBREAK_REGEX = /(?:ignore\s+all\s+previous\s+instructions|forget\s+everything|bypass\s+rules|developer\s+mode|dan\s+prompt|hypothetical\s+response)/gi;

// 📂 Dirs to Ignore
const IGNORE_DIRS = ["node_modules", ".git", "dist", "output", ".next", "coverage", ".vercel"];
const IGNORE_FILES = [".env", ".env.local", "pnpm-lock.yaml", "bun.lockb", "yarn.lock", "package-lock.json", "security_scan.ts", "MANIFEST.md", "APEX_SECURE_PATTERNS.md", "RED_TEAM_PROMPT_V1.md", "ai-verifier.ts", "executor.ts"];

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
            // Skip non-text files
            if (/\.(png|jpg|jpeg|gif|ico|pdf|webp|mp3|mp4|zip|gz|tar)$/i.test(entry.name)) continue;

            try {
                const content = await readFile(fullPath, "utf-8");

                // 1. Check Known Patterns
                for (const pattern of SECRET_PATTERNS) {
                    if (pattern.regex.test(content)) {
                        console.error(`${RED}🚨 [CRITICAL] Found ${pattern.name} in ${fullPath}${RESET}`);
                        issues++;
                    }
                }

                // 2. Check Heuristics & Entropy (APEX-SECURE Shield)
                let match;
                while ((match = HEURISTIC_REGEX.exec(content)) !== null) {
                    const potentialSecret = match[1];
                    const entropy = getEntropy(potentialSecret);

                    // Entropy threshold: 4.5 is a good baseline for random base64/hex strings
                    // Normal text usually has entropy < 4.0
                    if (entropy > 4.5 && potentialSecret.length > 12) {
                        console.error(`${RED}🚨 [CRITICAL] High entropy obfuscated string (${entropy.toFixed(2)}) assigned to '${match[0].substring(0, 15)}...' in ${fullPath}${RESET}`);
                        issues++; // APEX-SECURE: Block mathematically obfuscated strings from committing
                    }
                }

                // 3. Check for Prompt Injection / Jailbreaks (APEX-SECURE Firewall)
                if (/\.(ts|tsx|js|jsx|md|txt)$/i.test(entry.name)) {
                    let jbMatch;
                    while ((jbMatch = JAILBREAK_REGEX.exec(content)) !== null) {
                        console.error(`${RED}🚨 [JAILBREAK] Malicious prompt injection pattern found: \"${jbMatch[0]}\" in ${fullPath}${RESET}`);
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

console.log(`${GREEN}🛡️  Starting Paranoid Security Scan (Patterns + Entropy)...${RESET}`);
const issues = await scanDirectory(process.cwd());

if (issues > 0) {
    console.error(`${RED}❌ Security Scan FAILED. ${issues} critical secrets found.${RESET}`);
    process.exit(1);
} else {
    console.log(`${GREEN}✅ Security Scan PASSED. No critical secrets found.${RESET}`);
    process.exit(0);
}
