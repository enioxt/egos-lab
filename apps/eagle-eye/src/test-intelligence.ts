
import { WebScraper } from './modules/tourism/web-scraper';

async function main() {
    console.log('🧪 Starting Eagle Eye Intelligence Test...');

    const scraper = new WebScraper();
    const opportunities = await scraper.searchTourismNews('Patos de Minas');

    console.log('\n--- 📊 Results ---');
    console.log(`Total Opportunities: ${opportunities.length}`);

    if (opportunities.length > 0) {
        console.log('\nSample Opportunity:');
        console.log(JSON.stringify(opportunities[0], null, 2));
    } else {
        console.error('❌ No opportunities found. Check scrapers.');
    }
}

main().catch(console.error);
