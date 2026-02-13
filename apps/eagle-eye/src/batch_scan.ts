/**
 * 🦅 Eagle Eye — National Batch Scanner
 * 
 * Retroactive scan of Brazilian official gazettes (last 60 days)
 * Searches ALL territories with Tier 1 patterns
 * Results saved to docs/eagle-eye-results/
 * 
 * Usage:
 *   bun apps/eagle-eye/src/batch_scan.ts                    # Last 60 days
 *   bun apps/eagle-eye/src/batch_scan.ts --days 30          # Last 30 days
 *   bun apps/eagle-eye/src/batch_scan.ts --territory 3106200 # BH only
 */

import { fetchGazettes, fetchGazetteText } from './fetch_gazettes';
import { analyzeGazette } from './analyze_gazette';
import { KEYWORD_PATTERNS, buildQuerystring, getPatternsByTier } from './idea_patterns';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// ═══════════════════════════════════════════════════════════
// Configuration
// ═══════════════════════════════════════════════════════════

const RESULTS_DIR = join(import.meta.dir, '../../../docs/eagle-eye-results');
const MAX_PAGES = 5;          // Max pages to scan per search
const PAGE_SIZE = 10;         // Results per page
const MAX_ANALYSES = 20;      // Max AI analyses per run (cost control)

interface BatchConfig {
    days: number;
    territory_ids: string[];
    maxAnalyses: number;
}

function parseArgs(): BatchConfig {
    const args = process.argv.slice(2);
    const config: BatchConfig = {
        days: 60,
        territory_ids: [],
        maxAnalyses: MAX_ANALYSES,
    };

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--days' && args[i + 1]) {
            config.days = parseInt(args[i + 1], 10);
            i++;
        }
        if (args[i] === '--territory' && args[i + 1]) {
            config.territory_ids.push(args[i + 1]);
            i++;
        }
        if (args[i] === '--max' && args[i + 1]) {
            config.maxAnalyses = parseInt(args[i + 1], 10);
            i++;
        }
    }

    return config;
}

// ═══════════════════════════════════════════════════════════
// Main Batch Scanner
// ═══════════════════════════════════════════════════════════

async function runBatchScan() {
    const config = parseArgs();
    const sinceDate = new Date(Date.now() - config.days * 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0];

    console.log(`
╔═══════════════════════════════════════════════════════════╗
║  🦅 EAGLE EYE — National Batch Scanner                   ║
╚═══════════════════════════════════════════════════════════╝

📅 Period: ${sinceDate} → today
🌎 Territories: ${config.territory_ids.length > 0 ? config.territory_ids.join(', ') : 'ALL BRAZIL'}
🔍 Patterns: ${getPatternsByTier(1).length} Tier 1
🤖 Max analyses: ${config.maxAnalyses}
💰 Est. max cost: $${(config.maxAnalyses * 0.001).toFixed(2)}
`);

    // Ensure results directory
    if (!existsSync(RESULTS_DIR)) {
        mkdirSync(RESULTS_DIR, { recursive: true });
    }

    // Build query from Tier 1 patterns
    const querystring = buildQuerystring(getPatternsByTier(1));

    let totalGazettes = 0;
    let totalAnalyzed = 0;
    let totalCost = 0;
    const allResults: any[] = [];

    // Paginate through results
    for (let page = 0; page < MAX_PAGES; page++) {
        if (totalAnalyzed >= config.maxAnalyses) break;

        const offset = page * PAGE_SIZE;
        console.log(`\n📡 Fetching page ${page + 1}/${MAX_PAGES} (offset ${offset})...`);

        try {
            const searchResult = await fetchGazettes({
                querystring,
                territory_ids: config.territory_ids.length > 0 ? config.territory_ids : undefined,
                size: PAGE_SIZE,
                offset,
                published_since: sinceDate,
            });

            if (page === 0) {
                totalGazettes = searchResult.total_gazettes;
                console.log(`📊 Total matching gazettes: ${totalGazettes}`);
            }

            if (searchResult.gazettes.length === 0) {
                console.log('   No more results.');
                break;
            }

            for (const gazette of searchResult.gazettes) {
                if (totalAnalyzed >= config.maxAnalyses) {
                    console.log(`\n⚠️  Max analyses reached (${config.maxAnalyses}). Stopping.`);
                    break;
                }

                console.log(`\n${'─'.repeat(60)}`);
                console.log(`📰 ${gazette.date} — ${gazette.territory_name} (${gazette.state_code})`);

                try {
                    const result = await analyzeGazette(gazette);
                    totalAnalyzed++;
                    totalCost += result.analysis_cost_usd;
                    allResults.push(result);

                    if (result.matches.length === 0) {
                        console.log(`   ℹ️  No opportunities detected`);
                    } else {
                        console.log(`   ✅ ${result.matches.length} opportunities:`);
                        for (const match of result.matches) {
                            const emoji: Record<string, string> = { critical: '🔴', high: '🟠', medium: '🟡', low: '🟢' };
                            const icon = emoji[match.urgency] ?? '⚪';
                            console.log(`   ${icon} [${match.confidence}%] ${match.pattern_name}`);
                        }
                    }
                } catch (err: any) {
                    console.error(`   ❌ Analysis failed: ${err.message}`);
                }
            }
        } catch (err: any) {
            console.error(`❌ Fetch failed: ${err.message}`);
            break;
        }
    }

    // Save results
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `scan_${timestamp}.json`;
    const filepath = join(RESULTS_DIR, filename);

    const report = {
        scan_date: new Date().toISOString(),
        config: {
            days: config.days,
            since: sinceDate,
            territories: config.territory_ids.length > 0 ? config.territory_ids : 'ALL',
        },
        summary: {
            total_gazettes_found: totalGazettes,
            total_analyzed: totalAnalyzed,
            total_opportunities: allResults.reduce((acc, r) => acc + r.matches.length, 0),
            total_cost_usd: totalCost,
        },
        results: allResults,
    };

    writeFileSync(filepath, JSON.stringify(report, null, 2));

    console.log(`
${'═'.repeat(60)}
📊 SCAN COMPLETE
${'═'.repeat(60)}
   📰 Gazettes found:    ${totalGazettes}
   🔍 Analyzed:          ${totalAnalyzed}
   ✅ Opportunities:     ${report.summary.total_opportunities}
   💰 Total cost:        $${totalCost.toFixed(4)}
   📁 Results saved:     ${filepath}
`);
}

// Run
runBatchScan().catch(console.error);
