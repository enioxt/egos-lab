import { fetchGazettes } from '../fetch_gazettes';

console.log('🦅 Eagle Eye — Coverage Check');
console.log('═══════════════════════════════════════════════════════════\n');

async function run() {
    try {
        // Check broadly for "turismo" in ANY territory to validate API is working
        console.log(`🔍 Checking "turismo" usage globally...`);
        const globalCheck = await fetchGazettes({
            querystring: 'turismo',
            size: 3,
            sort_by: 'descending_date'
        });
        console.log(`   ✅ Global 'turismo' matches: ${globalCheck.total_gazettes}`);
        if (globalCheck.gazettes.length > 0) {
            console.log(`   📅 Latest: ${globalCheck.gazettes[0].date} - ${globalCheck.gazettes[0].territory_name}`);
        }

    } catch (e) {
        console.error('❌ Error:', e);
    }
}

run();
