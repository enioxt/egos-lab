/**
 * 🦅 Eagle Eye — Opportunity Enrichment (Exa)
 * 
 * Uses Exa API to find supplementary context for opportunities:
 * - Company details (if mentioned)
 * - Market news related to the topic
 * - Competitor analysis
 */


// Simple local rate limiter
class RateLimiter {
    private queue: Array<() => void> = [];
    private processing = false;
    private lastRun = 0;

    constructor(private requestsPerMinute: number = 60, private interval: number = 60000) { }

    async waitForSlot(): Promise<void> {
        const now = Date.now();
        const timeSinceLast = now - this.lastRun;
        const minInterval = this.interval / this.requestsPerMinute;

        if (timeSinceLast < minInterval) {
            await new Promise(resolve => setTimeout(resolve, minInterval - timeSinceLast));
        }
        this.lastRun = Date.now();
    }
}

const EXA_API_KEY = process.env.EXA_API_KEY;
const EXA_BASE_URL = 'https://api.exa.ai/search';

// Rate limit: 60 req/min
const rateLimiter = new RateLimiter(60, 60000);

interface ExaResult {
    title: string;
    url: string;
    text: string;
    publishedDate?: string;
    author?: string;
    score?: number;
}

interface EnrichmentResult {
    query: string;
    results: ExaResult[];
    cost_usd: number; // Placeholder for now, Exa pricing varies
}

/**
 * Search Exa for context using "neural" search
 */
export async function enrichOpportunity(query: string, numResults: number = 3): Promise<EnrichmentResult> {
    if (!EXA_API_KEY) {
        throw new Error('Missing EXA_API_KEY env var');
    }

    await rateLimiter.waitForSlot();

    console.log(`🌐 Exa Search: "${query}"`);

    const response = await fetch(EXA_BASE_URL, {
        method: 'POST',
        headers: {
            'x-api-key': EXA_API_KEY,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            query,
            type: 'neural',
            useAutoprompt: true,
            numResults,
            contents: {
                text: true,
                highlights: { numSentences: 3 }
            }
        }),
    });

    if (!response.ok) {
        throw new Error(`Exa API error (${response.status}): ${await response.text()}`);
    }

    const data = await response.json();

    // Calculate estimated cost (very rough approximation)
    // Exa Neural search is ~$0.005 per request (base) + content cost
    const cost_usd = 0.01;

    return {
        query,
        results: data.results.map((r: any) => ({
            title: r.title,
            url: r.url,
            text: r.text, // or r.highlights[0] path
            publishedDate: r.publishedDate,
            author: r.author,
            score: r.score
        })),
        cost_usd
    };
}

// CLI Test
if (import.meta.url === `file://${process.argv[1]}`) {
    const query = process.argv[2] || 'Licitação limpeza urbana Patos de Minas';
    enrichOpportunity(query).then(res => {
        console.log(`✅ Results for "${res.query}":`);
        res.results.forEach(r => {
            console.log(`\n📄 ${r.title}\n   🔗 ${r.url}\n   📝 ${r.text.substring(0, 150)}...`);
        });
    }).catch(console.error);
}
