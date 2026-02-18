/**
 * Multi-Provider Web Search — Smart Cascade
 * 
 * Priority order (cost-optimized):
 *   1. Serper.dev — Google results, cheapest ($1.3/1k, 2500 FREE queries)
 *   2. Brave Search — Independent index, good free tier ($5/1k)
 *   3. Exa — Semantic/AI search ($5/1k)
 *   4. Fallback — No results
 * 
 * The adapter tries each provider in order.
 * If a provider's API key is missing, it's skipped.
 * If a provider fails or returns 0 results, the next one is tried.
 * 
 * Environment Variables:
 *   SERPER_API_KEY   — Get free at https://serper.dev (2500 free queries)
 *   BRAVE_API_KEY    — Get free at https://api.search.brave.com
 *   EXA_API_KEY      — Get at https://exa.ai
 */

export interface ImageSearchResult {
    title: string;
    url: string;
    imageUrl: string;
    score: number;
}

export interface WebSearchResponse {
    results: ImageSearchResult[];
    query: string;
    source: 'serper' | 'brave' | 'exa' | 'none';
    latencyMs: number;
}

// ─── Provider 1: Serper.dev (Google) ───────────────────
async function searchSerper(query: string, num: number): Promise<WebSearchResponse | null> {
    const key = process.env.SERPER_API_KEY;
    if (!key) return null;

    const start = Date.now();
    try {
        const res = await fetch('https://google.serper.dev/images', {
            method: 'POST',
            headers: { 'X-API-KEY': key, 'Content-Type': 'application/json' },
            body: JSON.stringify({ q: query, num, gl: 'br', hl: 'pt-br' }),
            signal: AbortSignal.timeout(8_000),
        });

        if (!res.ok) return null;
        const data = await res.json();
        const images = (data.images || []).slice(0, num);

        if (images.length === 0) return null;

        return {
            results: images.map((img: any, i: number) => ({
                title: img.title || '',
                url: img.link || img.source || '',
                imageUrl: img.imageUrl || img.thumbnailUrl || img.link || '',
                score: Math.max(50, 100 - i * 10),
            })),
            query,
            source: 'serper',
            latencyMs: Date.now() - start,
        };
    } catch {
        return null;
    }
}

// ─── Provider 2: Brave Search ───────────────────────────
async function searchBrave(query: string, num: number): Promise<WebSearchResponse | null> {
    const key = process.env.BRAVE_API_KEY;
    if (!key) return null;

    const start = Date.now();
    try {
        const params = new URLSearchParams({
            q: query,
            count: String(num),
            search_lang: 'pt',
            country: 'BR',
            safesearch: 'moderate',
        });

        const res = await fetch(`https://api.search.brave.com/res/v1/images/search?${params}`, {
            headers: { 'Accept': 'application/json', 'X-Subscription-Token': key },
            signal: AbortSignal.timeout(8_000),
        });

        if (!res.ok) return null;
        const data = await res.json();
        const images = (data.results || []).slice(0, num);

        if (images.length === 0) return null;

        return {
            results: images.map((img: any, i: number) => ({
                title: img.title || '',
                url: img.page_url || img.url || '',
                imageUrl: img.thumbnail?.src || img.properties?.url || img.url || '',
                score: Math.max(50, 95 - i * 10),
            })),
            query,
            source: 'brave',
            latencyMs: Date.now() - start,
        };
    } catch {
        return null;
    }
}

// ─── Provider 3: Exa (Semantic) ─────────────────────────
async function searchExa(query: string, num: number): Promise<WebSearchResponse | null> {
    const key = process.env.EXA_API_KEY;
    if (!key) return null;

    const start = Date.now();
    try {
        const res = await fetch('https://api.exa.ai/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': key },
            body: JSON.stringify({
                query,
                numResults: num,
                type: 'auto',
                useAutoprompt: true,
                text: { maxCharacters: 200 },
            }),
            signal: AbortSignal.timeout(10_000),
        });

        if (!res.ok) return null;
        const data = await res.json();
        const results = (data.results || []).slice(0, num);

        if (results.length === 0) return null;

        return {
            results: results.map((r: any, i: number) => ({
                title: r.title || '',
                url: r.url || '',
                imageUrl: r.image || r.url || '',
                score: Math.round((r.score || 0.5) * 100),
            })),
            query,
            source: 'exa',
            latencyMs: Date.now() - start,
        };
    } catch {
        return null;
    }
}

// ─── Main Cascade ─────────────────────────────────────

/**
 * Search for product images across multiple providers.
 * Tries Serper → Brave → Exa, returns first successful result.
 */
export async function searchProductImages(
    productName: string,
    barcode?: string,
    numResults = 3
): Promise<WebSearchResponse> {
    const query = barcode
        ? `${productName} produto foto embalagem EAN ${barcode}`
        : `${productName} produto foto embalagem`;

    // Try each provider in cost order
    const providers = [searchSerper, searchBrave, searchExa];

    for (const provider of providers) {
        const result = await provider(query, numResults);
        if (result && result.results.length > 0) {
            console.log(`  🔍 [${result.source}] Found ${result.results.length} images in ${result.latencyMs}ms`);
            return result;
        }
    }

    return { results: [], query, source: 'none', latencyMs: 0 };
}

/**
 * Get a summary of which providers are configured.
 */
export function getSearchProviderStatus(): Record<string, boolean> {
    return {
        serper: !!process.env.SERPER_API_KEY,
        brave: !!process.env.BRAVE_API_KEY,
        exa: !!process.env.EXA_API_KEY,
    };
}
