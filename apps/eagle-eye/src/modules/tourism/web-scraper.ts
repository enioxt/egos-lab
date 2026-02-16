
import { Opportunity, TourismNews } from './types';
import { ScraperPatosHoje } from './scraper-patoshoje';
import { ScraperPatosJa } from './scraper-patosja';
import { InfluencerDetector } from '../influencers/influencer-detector';
import { EventPatternMatcher } from '../events/event-pattern-matcher';

export class WebScraper {
    private apiKey: string;

    // Sub-modules
    private patosHojeScraper = new ScraperPatosHoje();
    private patosJaScraper = new ScraperPatosJa();
    private influencerDetector = new InfluencerDetector();
    private eventMatcher = new EventPatternMatcher();

    constructor() {
        this.apiKey = process.env.EXA_API_KEY || '';
        // We will prioritize local scraping first, Exa as fallback or enrichment
    }

    async searchTourismNews(city: string): Promise<Opportunity[]> {
        console.log(`🦅 WebScraper: Initiating Local Intelligence for ${city}...`);

        // 1. Scrape Local Portals
        const [phNews, pjNews] = await Promise.all([
            this.patosHojeScraper.scrape(),
            this.patosJaScraper.scrape()
        ]);

        const allNews = [...phNews, ...pjNews];
        console.log(`📊 Total items found: ${allNews.length}`);

        // 2. Discover Influencers
        const influencers = this.influencerDetector.detect(
            allNews.map(n => `${n.title} ${n.summary}`).join(' ')
        );
        console.log(`🌟 Potential Influencers detected: ${influencers.length}`);

        // 3. Detect Events
        const events = this.eventMatcher.detect(allNews);
        console.log(`📅 Recurring Events detected: ${events.length}`);

        // 4. Map to Opportunities (Standard Interface)
        return allNews.map(news => this.mapNewsToOpportunity(news));
    }

    private mapNewsToOpportunity(news: TourismNews): Opportunity {
        return {
            title: news.title,
            why: `Detected from local source: ${news.source}. May contain relevant tourism data.`,
            quick_wins: ['Validate date', 'Find contacts'],
            dependencies: [],
            cost_range_brl: [0, 0] // Unknown
        };
    }
}
