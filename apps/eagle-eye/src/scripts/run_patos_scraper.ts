
import { fetchGazettes } from '../fetch_gazettes';
import { analyzeGazette } from '../analyze_gazette';

console.log('🦅 Eagle Eye — Tourism Scraper (Debug Mode)');
console.log('═══════════════════════════════════════════════════════════\n');

const KEYWORDS = 'turismo | festa | evento | show | publicidade | marketing | cultura | milho';
// Belo Horizonte ID: 3106200 (More likely to have data)
// Patos de Minas ID: 3148004
const CITIES = [
    { name: 'Patos de Minas', id: '3148004' },
    { name: 'Belo Horizonte', id: '3106200' }
];

async function run() {
    try {
        for (const city of CITIES) {
            console.log(`\n🔍 Checking data for ${city.name} (${city.id})...`);

            // Check simply if ANY gazette exists in 2025/2026
            // Let's go back 1 year to be safe
            const recent = await fetchGazettes({
                territory_ids: [city.id],
                size: 1,
                published_since: '2025-01-01',
                sort_by: 'descending_date'
            });

            console.log(`   📅 Gazettes since Jan 1, 2025: ${recent.total_gazettes}`);

            if (recent.total_gazettes > 0) {
                console.log(`   ✅ Data available! Running keyword search...`);
                const gazettes = await fetchGazettes({
                    territory_ids: [city.id],
                    querystring: KEYWORDS,
                    published_since: '2025-01-01',
                    size: 3,
                    sort_by: 'descending_date'
                });
                console.log(`   🎯 Keyword matches: ${gazettes.total_gazettes}`);

                if (gazettes.total_gazettes > 0) {
                    await analyzeList(gazettes.gazettes);
                    return; // Stop after first successful city analysis
                }
            } else {
                console.log(`   ❌ No data found for ${city.name}.`);
            }
        }

    } catch (e) {
        console.error('❌ Error:', e);
    }
}

async function analyzeList(list: any[]) {
    for (const g of list) {
        console.log(`\n📄 Analyzing Gazette: ${g.date} (${g.territory_name})...`);
        const result = await analyzeGazette(g);

        if (result.matches.length > 0) {
            console.log(`   🎯 found ${result.matches.length} opportunities!`);
            result.matches.forEach(m => {
                console.log(`      - [${m.confidence}%] ${m.pattern_name}: ${m.ai_reasoning.substring(0, 150)}...`);
            });
        } else {
            console.log(`   ⚪ No patterns matched.`);
        }
    }
}

run();
