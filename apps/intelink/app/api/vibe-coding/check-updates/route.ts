import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const EGOS_ROOT = process.env.EGOS_ROOT || "/home/enio/EGOSv3";
const RESULTS_DIR = path.join(EGOS_ROOT, "scripts/vibe-coding/results");

export async function GET() {
  try {
    const lastCheckPath = path.join(RESULTS_DIR, "last_check.json");
    const summaryPath = path.join(RESULTS_DIR, "LATEST_SUMMARY.md");

    if (!fs.existsSync(lastCheckPath)) {
      return NextResponse.json({
        status: "no_data",
        message: "No innovation check has been run yet",
        hint: "Run: bun scripts/vibe-coding/innovation-watcher.ts"
      }, { status: 404 });
    }

    const lastCheck = JSON.parse(fs.readFileSync(lastCheckPath, "utf-8"));
    const summary = fs.existsSync(summaryPath) 
      ? fs.readFileSync(summaryPath, "utf-8") 
      : null;

    const allFindings = lastCheck.queries?.flatMap((q: any) => q.results) || [];
    const topFindings = allFindings.slice(0, 10).map((f: any) => ({
      title: f.title,
      url: f.url,
      date: f.publishedDate
    }));

    return NextResponse.json({
      status: "ok",
      lastCheck: lastCheck.timestamp,
      newFindings: lastCheck.newFindings,
      totalResults: allFindings.length,
      topFindings,
      queries: lastCheck.queries?.map((q: any) => ({
        query: q.query,
        resultCount: q.results?.length || 0
      })),
      summaryAvailable: !!summary
    });

  } catch (error) {
    console.error("Error reading vibe-coding updates:", error);
    return NextResponse.json({
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

export async function POST() {
  try {
    const { exec } = await import("child_process");

    exec(`cd ${EGOS_ROOT} && bun run scripts/vibe-coding/innovation-watcher.ts &`, 
      (error) => {
        if (error) console.error("Innovation watcher error:", error);
      }
    );

    return NextResponse.json({
      status: "triggered",
      message: "Innovation watcher started in background",
      checkResultsAt: "/api/vibe-coding/check-updates"
    });

  } catch (error) {
    console.error("Error triggering innovation check:", error);
    return NextResponse.json({
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
