/**
 * 🦅 Eagle Eye — Gazette Fetcher
 * 
 * Corrected API integration with Querido Diário
 * Base URL: https://api.queridodiario.ok.org.br
 * Sort: descending_date (not date + sort_direction)
 * Rate limit: 60 req/min
 */

import { RateLimiter } from '@egos-lab/shared';
import type { GazetteItem, GazetteSearchResponse } from '@egos-lab/shared';
import { buildQuerystring, getPatternsByTier, ALL_PATTERNS } from './idea_patterns';

// ═══════════════════════════════════════════════════════════
// API Configuration — CORRECTED
// ═══════════════════════════════════════════════════════════

const API_BASE = 'https://api.queridodiario.ok.org.br';
const rateLimiter = new RateLimiter(60, 60_000); // 60 req/min

// Default territories: empty = national (all Brazil), configurable via EAGLE_EYE_TERRITORIES env
const DEFAULT_TERRITORIES: string[] = process.env.EAGLE_EYE_TERRITORIES
    ? process.env.EAGLE_EYE_TERRITORIES.split(',')
    : []; // Empty = no filter = all of Brazil

interface FetchOptions {
    territory_ids?: string[];
    querystring?: string;
    published_since?: string; // YYYY-MM-DD
    published_until?: string; // YYYY-MM-DD
    sort_by?: 'relevance' | 'descending_date' | 'ascending_date';
    size?: number;
    excerpt_size?: number;
    number_of_excerpts?: number;
    offset?: number;
}

/**
 * Fetch gazettes from Querido Diário API
 */
export async function fetchGazettes(options: FetchOptions = {}): Promise<GazetteSearchResponse> {
    await rateLimiter.waitForSlot();

    const params = new URLSearchParams();

    // Territory IDs
    const territories = options.territory_ids ?? DEFAULT_TERRITORIES;
    territories.forEach(id => params.append('territory_ids', id));

    // Sort — CORRECTED: single enum param, not two params
    params.set('sort_by', options.sort_by ?? 'descending_date');

    // Search
    if (options.querystring) {
        params.set('querystring', options.querystring);
    }

    // Date range
    if (options.published_since) {
        params.set('published_since', options.published_since);
    }
    if (options.published_until) {
        params.set('published_until', options.published_until);
    }

    // Pagination & excerpts
    params.set('size', String(options.size ?? 10));
    params.set('offset', String(options.offset ?? 0));

    if (options.querystring) {
        params.set('excerpt_size', String(options.excerpt_size ?? 500));
        params.set('number_of_excerpts', String(options.number_of_excerpts ?? 3));
    }

    const url = `${API_BASE}/gazettes?${params}`;
    console.log(`📡 Fetching: ${url}`);

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`API error (${response.status}): ${await response.text()}`);
    }

    return response.json() as Promise<GazetteSearchResponse>;
}

/**
 * Fetch gazette full text via txt_url
 */
export async function fetchGazetteText(gazette: GazetteItem): Promise<string> {
    if (!gazette.txt_url) {
        throw new Error(`No txt_url for gazette: ${gazette.territory_name} ${gazette.date}`);
    }

    await rateLimiter.waitForSlot();
    const response = await fetch(gazette.txt_url);

    if (!response.ok) {
        throw new Error(`Failed to fetch text (${response.status}): ${gazette.txt_url}`);
    }

    return response.text();
}

/**
 * Search available cities by name
 */
export async function searchCities(cityName: string): Promise<any[]> {
    await rateLimiter.waitForSlot();
    const url = `${API_BASE}/cities?city_name=${encodeURIComponent(cityName)}`;
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Cities API error (${response.status})`);
    }

    const data = await response.json();
    return data.cities ?? [];
}

// ═══════════════════════════════════════════════════════════
// CLI Entry Point — Self-test
// ═══════════════════════════════════════════════════════════

if (import.meta.url === `file://${process.argv[1]}`) {
    console.log('🦅 Eagle Eye — Gazette Fetcher');
    console.log('═══════════════════════════════════════════════════════════');

    // Build querystring from Tier 1 patterns (most relevant)
    const tier1Query = buildQuerystring(getPatternsByTier(1));
    console.log(`🔍 Tier 1 Querystring: "${tier1Query.substring(0, 100)}..."`);
    console.log('');

    try {
        // Test 1: Fetch recent gazettes (no keyword filter)
        console.log('📋 Test 1: Fetching 3 most recent gazettes...');
        const recent = await fetchGazettes({ size: 3 });
        console.log(`   ✅ Found ${recent.total_gazettes} total gazettes`);

        for (const g of recent.gazettes) {
            console.log(`   📰 ${g.date} — ${g.territory_name} (${g.state_code})`);
        }
        console.log('');

        // Test 2: Keyword search with Tier 1 patterns
        console.log('📋 Test 2: Searching with procurement keywords...');
        const searchResult = await fetchGazettes({
            querystring: 'licitação | pregão',
            size: 3,
            published_since: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        });
        console.log(`   ✅ Found ${searchResult.total_gazettes} matching gazettes`);

        for (const g of searchResult.gazettes) {
            console.log(`   📰 ${g.date} — ${g.territory_name}`);
            if (g.excerpts?.length) {
                console.log(`      Excerpt: "${g.excerpts[0].substring(0, 100)}..."`);
            }
        }
        console.log('');

        // Test 3: City search
        console.log('📋 Test 3: Searching cities...');
        const cities = await searchCities('Patos de Minas');
        console.log(`   ✅ Found ${cities.length} matching cities`);
        for (const c of cities) {
            console.log(`   🏙️  ${c.territory_name} (${c.state_code}) — ID: ${c.territory_id}`);
        }

        console.log('\n✅ All tests passed!');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}
