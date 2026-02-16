
import { SocialSignal } from './types';

// Placeholder for a real search API (e.g., Exa, SerpApi)
// For MVP, we simulated the logic of finding signals.

export class SocialListener {
    constructor(private city: string) { }

    async searchSocialSignals(topic: string = "turismo"): Promise<SocialSignal[]> {
        console.log(`📡 SocialListener: Searching for '${topic}' in ${this.city}...`);

        // Mock Data - In real life, this would call Exa.ai or Google Search API
        const mockSignals: SocialSignal[] = [
            {
                platform: 'instagram',
                sentiment: 'positive',
                url: `https://instagram.com/explore/tags/${this.city.replace(/\s/g, '')}`,
                description: `Found 50+ recent posts about "Cachoeira Secreta" in ${this.city}`
            },
            {
                platform: 'news',
                sentiment: 'neutral',
                url: `https://news.google.com/search?q=${this.city}+turismo`,
                description: "Local news mentions new pavement on access road."
            },
            {
                platform: 'reddit',
                sentiment: 'negative',
                url: `https://reddit.com/r/brasil/search?q=${this.city}`,
                description: "User complaint about lack of hotel options on weekends."
            }
        ];

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));

        return mockSignals;
    }

    async analyzeSentiment(text: string): Promise<'positive' | 'neutral' | 'negative'> {
        // Mock sentiment analysis
        if (text.toLowerCase().includes('ruim') || text.toLowerCase().includes('falta')) return 'negative';
        if (text.toLowerCase().includes('lindo') || text.toLowerCase().includes('top')) return 'positive';
        return 'neutral';
    }
}
