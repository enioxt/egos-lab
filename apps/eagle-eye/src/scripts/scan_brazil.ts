/**
 * 🇧🇷 Eagle Eye — Scan Brazil (Major Cities)
 * 
 * Target: 10 High-Value Opportunities.
 * Filter: Priority Territories (Capitals/Hubs) + Tier 1 Keywords.
 */

import { fetchGazettes } from '../fetch_gazettes';
import { analyzeGazette, type AnalysisResult } from '../analyze_gazette';
import { getTerritoryIds, PRIORITY_TERRITORIES, type Territory } from '../data/territories';
import { buildQuerystring, getPatternsByTier } from '../idea_patterns';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
    console.log('🦅 Eagle Eye — Scanning Major Brazilian Cities...');
    console.log('═══════════════════════════════════════════════════════════');

    if (!process.env.OPENROUTER_API_KEY) {
        throw new Error('Missing OPENROUTER_API_KEY');
    }

    // 1. Configure Search
    const territoryIds = getTerritoryIds();
    const tier1Keywords = buildQuerystring(getPatternsByTier(1));
    const sinceDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // Last 7 days

    console.log(`🎯 Targeting ${territoryIds.length} priority territories (Capitals & Hubs).`);
    console.log(`📅 Since: ${sinceDate}`);
    console.log(`🔑 Keywords: Tier 1 (Procurement, Zoning, Legal)`);

    // 2. Fetch Candidates
    // Note: We might need to batch this if the query string is too long or if API limits URL length
    try {
        const response = await fetchGazettes({
            territory_ids: territoryIds,
            querystring: tier1Keywords,
            published_since: sinceDate,
            size: 20, // Fetch top 20 matches
            sort_by: 'descending_date'
        });

        console.log(`\n📋 Found ${response.total_gazettes} candidate gazettes.`);

        if (response.total_gazettes === 0) {
            console.log('❌ No gazettes found matching criteria. Try different keywords or date range.');
            return;
        }

        // 3. Analyze Candidates
        // Using 'any' in map to avoid strict typing issues with the partial object we are creating
        const opportunities: any[] = [];
        let processed = 0;
        const targetCount = 10;

        // Process sequentially to stop early
        for (const gazette of response.gazettes) {
            if (opportunities.length >= targetCount) break;

            const territory = PRIORITY_TERRITORIES.find((t: Territory) => t.id === gazette.territory_id);
            const cityName = territory ? `${territory.name}-${territory.state}` : gazette.territory_id;

            console.log(`\n🔎 Analyzing [${cityName}] ${gazette.date}...`);

            try {
                const result: AnalysisResult = await analyzeGazette(gazette);

                if (result.matches.length > 0) {
                    console.log(`   ✅ Matches: ${result.matches.length}`);
                    opportunities.push({
                        city: cityName,
                        date: gazette.date,
                        url: gazette.url,
                        matches: result.matches
                    });
                } else {
                    console.log(`   ⚪ No actionable opportunities.`);
                }
            } catch (err) {
                console.error(`   ❌ Failed to analyze:`, err);
            }
        }

        if (opportunities.length === 0) {
            console.log('\n⚠️  Analysis complete but found 0 high-confidence opportunities.');
            return;
        }

        // 4. Generate Report
        const reportDate = new Date().toISOString().split('T')[0];
        const reportDir = path.join(process.cwd(), 'docs', 'opportunities');
        if (!fs.existsSync(reportDir)) {
            fs.mkdirSync(reportDir, { recursive: true });
        }

        const reportPath = path.join(reportDir, `report_${reportDate}.md`);

        let reportContent = `# 🦅 Eagle Eye Opportunity Report\n\n`;
        reportContent += `**Date:** ${reportDate}\n`;
        reportContent += `**Scope:** Major Cities (Tier 1)\n`;
        reportContent += `**Found:** ${opportunities.length} opportunities\n\n`;
        reportContent += `---\n\n`;

        opportunities.forEach((opp, index) => {
            reportContent += `## ${index + 1}. [${opp.city}] ${opp.date}\n`;
            reportContent += `**Source:** [Link to Gazette](${opp.url})\n\n`;

            opp.matches.forEach((m: any) => {
                const urgencyIcon = m.urgency === 'critical' ? '🔴' : m.urgency === 'high' ? '🟠' : '🟡';
                const confidence = m.confidence !== undefined ? `${m.confidence}%` : 'N/A';

                reportContent += `### ${urgencyIcon} ${m.pattern_name} (${confidence})\n`;
                reportContent += `> **Reasoning:** ${m.ai_reasoning || 'No specific reasoning provided.'}\n\n`;
                if (m.action_deadline) {
                    reportContent += `- **Deadline:** ${m.action_deadline}\n`;
                }
                reportContent += `- **Keywords:** ${(m.matched_keywords || []).join(', ')}\n\n`;
            });
            reportContent += `---\n\n`;
        });

        fs.writeFileSync(reportPath, reportContent);
        console.log(`\n📄 Report saved to: ${reportPath}`);

    } catch (error) {
        console.error('❌ Fatal error in scan:', error);
    }
}

main().catch(console.error);
