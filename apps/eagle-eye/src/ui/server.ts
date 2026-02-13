
import { serve } from "bun";
import fs from "fs";
import path from "path";

const PORT = 3001;
const UI_DIR = path.join(import.meta.dir, ".");
const DATA_DIR = path.join(import.meta.dir, "../../../../docs/eagle-eye-results");
let isScanning = false;

console.log(`🦅 Eagle Eye Dashboard running at http://localhost:${PORT}`);
console.log(`📂 Serving UI from: ${UI_DIR}`);
console.log(`📂 Serving Data from: ${DATA_DIR}`);

// ═══════════════════════════════════════════════════════════
// Automation & Scheduling
// ═══════════════════════════════════════════════════════════

async function runFullScan() {
    if (isScanning) {
        console.warn('⚠️ Scan already in progress.');
        return;
    }

    try {
        isScanning = true;
        console.log('🚀 Starting Full Eagle Eye Scan...');

        // 1. Fetch
        console.log('📡 Step 1/3: Fetching Gazettes...');
        const fetchProc = Bun.spawn(["bun", "apps/eagle-eye/src/fetch_gazettes.ts"], {
            stdout: "inherit",
            stderr: "inherit"
        });
        await fetchProc.exited;

        // 2. Analyze
        console.log('🧠 Step 2/3: Analyzing Opportunities...');
        const analyzeProc = Bun.spawn(["bun", "apps/eagle-eye/src/analyze_opportunities.ts"], {
            stdout: "inherit",
            stderr: "inherit"
        });
        await analyzeProc.exited;

        // 3. Enrich (Optional, but part of the pipeline)
        // console.log('💎 Step 3/3: Enriching Data...');
        // const enrichProc = Bun.spawn(["bun", "apps/eagle-eye/src/enrich_opportunities.ts"], { stdout: "inherit" });
        // await enrichProc.exited;

        console.log('✅ Scan Complete!');
    } catch (error) {
        console.error('❌ Scan failed:', error);
    } finally {
        isScanning = false;
    }
}

// Daily Scheduler (Check every minute)
setInterval(() => {
    const now = new Date();
    // Run at 14:00:00 (approx)
    if (now.getHours() === 14 && now.getMinutes() === 0 && now.getSeconds() < 10) {
        runFullScan();
    }
}, 10000);

serve({
    port: PORT,
    async fetch(req) {
        const url = new URL(req.url);
        let filePath = url.pathname;

        // API: Trigger Scan
        if (filePath === "/api/scan/now" && req.method === "POST") {
            if (isScanning) {
                return new Response(JSON.stringify({ status: "error", message: "Scan in progress" }), { status: 409 });
            }
            // Run in background
            runFullScan();
            return new Response(JSON.stringify({ status: "success", message: "Scan started" }));
        }

        // API: Analyze Viability (On-demand)
        if (filePath === "/api/analyze/viability" && req.method === "POST") {
            const body = await req.json();
            const { id } = body;
            if (!id) return new Response("Missing ID", { status: 400 });

            console.log(`🧠 Requesting Viability Analysis for ${id}...`);

            // Check if report already exists
            const reportPath = path.join(DATA_DIR, "viability", `${id}.json`);
            if (fs.existsSync(reportPath)) {
                const report = JSON.parse(fs.readFileSync(reportPath, "utf-8"));
                return new Response(JSON.stringify(report), { headers: { "Content-Type": "application/json" } });
            }

            // Run analysis script
            const proc = Bun.spawn(["bun", "apps/eagle-eye/src/analyze_viability.ts", id], {
                stdout: "inherit",
                stderr: "inherit"
            });

            await proc.exited;

            // Read result
            if (fs.existsSync(reportPath)) {
                const report = JSON.parse(fs.readFileSync(reportPath, "utf-8"));
                return new Response(JSON.stringify(report), { headers: { "Content-Type": "application/json" } });
            } else {
                return new Response(JSON.stringify({ error: "Analysis failed to generate report" }), { status: 500 });
            }
        }

        // API: Status
        if (filePath === "/api/status") {
            return new Response(JSON.stringify({
                scanning: isScanning,
                next_scheduled: "14:00 Today/Tomorrow"
            }), { headers: { "Content-Type": "application/json" } });
        }

        // API: List scan results
        if (filePath === "/api/scans") {
            if (!fs.existsSync(DATA_DIR)) {
                console.warn(`⚠️ DATA_DIR not found: ${DATA_DIR}`);
                return new Response("[]", { headers: { "Content-Type": "application/json" } });
            }
            const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith(".json")).reverse();
            // console.log(`📂 Found ${files.length} scans in ${DATA_DIR}`); // Commented out as per instruction
            return new Response(JSON.stringify(files), { headers: { "Content-Type": "application/json" } });
        }

        // API: Get specific scan result
        if (filePath.startsWith("/api/scan/")) {
            const fileName = filePath.replace("/api/scan/", "");
            const fullPath = path.join(DATA_DIR, fileName);
            if (fs.existsSync(fullPath)) {
                return new Response(fs.readFileSync(fullPath), { headers: { "Content-Type": "application/json" } });
            }
            return new Response("Not found", { status: 404 });
        }

        // Default to dashboard.html
        if (filePath === "/" || filePath === "/index.html") {
            filePath = "/dashboard.html";
        }

        const fullPath = path.join(UI_DIR, filePath);

        if (fs.existsSync(fullPath)) {
            const content = fs.readFileSync(fullPath);
            const ext = path.extname(fullPath);
            const contentType = {
                ".html": "text/html",
                ".css": "text/css",
                ".js": "text/javascript",
                ".json": "application/json",
                ".png": "image/png",
                ".svg": "image/svg+xml"
            }[ext] || "text/plain";

            return new Response(content, {
                headers: { "Content-Type": contentType },
            });
        }

        return new Response("Not Found", { status: 404 });
    },
});
