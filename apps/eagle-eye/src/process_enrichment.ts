/**
 * 🦅 Eagle Eye — Enrichment Processor
 * 
 * Iterates through scan results and enriches high-confidence opportunities
 * using Exa neural search.
 * 
 * Usage:
 *   bun apps/eagle-eye/src/process_enrichment.ts             # Enrich all new results
 *   bun apps/eagle-eye/src/process_enrichment.ts --min 80    # Confidence threshold
 */

import { enrichOpportunity } from './enrich_opportunity';
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const RESULTS_DIR = join(import.meta.dir, '../../../docs/eagle-eye-results');

interface ScanReport {
    scan_date: string;
    results: any[];
}

async function processEnrichment() {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║  🦅 EAGLE EYE — Enrichment Processor (Exa)               ║
╚═══════════════════════════════════════════════════════════╝
`);

    if (!existsSync(RESULTS_DIR)) {
        console.error(`❌ Results directory not found: ${RESULTS_DIR}`);
        process.exit(1);
    }

    const files = readdirSync(RESULTS_DIR).filter(f => f.endsWith('.json') && f.startsWith('scan_'));

    // Sort by date desc (newest first)
    files.sort().reverse();

    if (files.length === 0) {
        console.log('ℹ️  No scan results found to enrich.');
        return;
    }

    // Default: Process newest file only, unless --all flag (logic can be expanded)
    const targetFile = files[0];
    const filePath = join(RESULTS_DIR, targetFile);

    console.log(`📂 Processing: ${targetFile}`);

    const content = readFileSync(filePath, 'utf-8');
    const report: ScanReport = JSON.parse(content);

    let enrichedCount = 0;
    let totalCost = 0;

    for (const result of report.results) {
        for (const match of result.matches) {
            // Skip if already enriched or low confidence
            if (match.enrichment) continue;
            if (match.confidence < 80) continue;

            console.log(`\n🔍 Enriching: ${match.pattern_name} (${match.confidence}%)`);
            console.log(`   Gazette: ${result.gazette.territory_name} - ${result.gazette.date}`);

            // Construct query from pattern + reasoning keywords
            // e.g. "Licitação limpeza urbana Patos de Minas 2026 contratante"
            const keywords = match.matched_keywords.slice(0, 3).join(' ');
            const query = `${match.pattern_name} ${result.gazette.territory_name} ${keywords} ${result.gazette.date.substring(0, 4)}`;

            try {
                const enrichment = await enrichOpportunity(query);
                match.enrichment = enrichment;
                enrichedCount++;
                totalCost += enrichment.cost_usd;

                console.log(`   ✅ Found ${enrichment.results.length} context items`);

                // Save every 3 items to avoid data loss
                if (enrichedCount % 3 === 0) {
                    console.log(`   💾 Checkpoint: Saving ${enrichedCount} enrichments...`);
                    writeFileSync(filePath, JSON.stringify(report, null, 2));
                }

            } catch (err: any) {
                console.error(`   ❌ Enrichment failed: ${err.message}`);
            }
        }
    }

    if (enrichedCount > 0) {
        // Save back to file
        console.log(`\n💾 Saving ${enrichedCount} enrichments to ${targetFile}...`);
        writeFileSync(filePath, JSON.stringify(report, null, 2));
    } else {
        console.log('\nℹ️  No new high-confidence matches to enrich.');
    } // Newline added here

    console.log(`
${'═'.repeat(60)}
📊 ENRICHMENT COMPLETE
${'═'.repeat(60)}
   ✅ Enriched:          ${enrichedCount} opportunities
   💰 Est. cost:         $${totalCost.toFixed(4)}
`);
}

processEnrichment().catch(console.error);
