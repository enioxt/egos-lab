import { WebScraper } from '../modules/tourism/web-scraper';
import 'dotenv/config'; // Load env vars

async function runTest() {
    console.log('🧪 Testing WebScraper for "Patos de Minas"...');

    const scraper = new WebScraper();
    const city = "Patos de Minas";

    const opportunities = await scraper.searchTourismNews(city);

    console.log(`\n✅ Found ${opportunities.length} opportunities from Web Search:`);

    opportunities.forEach((opp, index) => {
        console.log(`\n--- [${index + 1}] ${opp.title} ---`);
        console.log(`🔗 URL: ${opp.url}`);
        console.log(`📝 Snippet: ${opp.description.substring(0, 150)}...`);
    });

    if (opportunities.length > 0) {
        console.log('\n🦅 WebScraper Test PASSED!');
    } else {
        console.error('\n❌ WebScraper Test FAILED (No results). Check API Key or Query.');
    }
}

runTest();
