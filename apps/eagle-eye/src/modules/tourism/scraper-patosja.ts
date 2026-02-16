
import { TourismNews } from './types';

export class ScraperPatosJa {
    private baseUrl = 'https://patosja.com.br';

    async scrape(): Promise<TourismNews[]> {
        console.log(`🦅 ScraperPatosJa: Fetching ${this.baseUrl}...`);

        try {
            const response = await fetch(this.baseUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; EagleEye/1.0; +http://enio.dev)'
                }
            });

            if (!response.ok) {
                console.error(`Failed to fetch Patos Já: ${response.status}`);
                return [];
            }

            const html = await response.text();
            const newsItems: TourismNews[] = [];
            const uniqueLinks = new Set<string>();

            // Regex generic for links, refining for Patos Já structure if specific
            // Assuming standard links. If they use specific classes, we might need adjustments.
            // For MVP, capturing all links that look like news is safer than specific classes.
            // Patos Já links might be absolute or relative.

            const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>(.*?)<\/a>/g;

            let match;
            while ((match = linkRegex.exec(html)) !== null) {
                const [_, href, innerHTML] = match;

                // Heuristic: News often have >30 chars in title and href length is significant
                // Exclude obvious navigation links
                const title = innerHTML.replace(/<[^>]+>/g, '').trim();
                if (!title || title.length < 15) continue;
                if (href.includes('javascript:') || href === '#' || href === '/') continue;

                // Adjust relative URLs
                const fullUrl = href.startsWith('http') ? href : `${this.baseUrl}${href.startsWith('/') ? '' : '/'}${href}`;

                if (!fullUrl.includes('patosja.com.br')) continue; // Strict domain check for safety

                // Deduplicate
                if (uniqueLinks.has(fullUrl)) continue;
                uniqueLinks.add(fullUrl);

                newsItems.push({
                    id: crypto.randomUUID(),
                    title: title,
                    summary: 'Notícia capturada automaticamente do Patos Já.',
                    url: fullUrl,
                    source: 'Patos Já',
                    date: new Date().toISOString()
                });

                if (newsItems.length >= 10) break;
            }

            console.log(`✅ ScraperPatosJa found ${newsItems.length} items.`);
            return newsItems;

        } catch (error) {
            console.error('ScraperPatosJa Error:', error);
            return [];
        }
    }
}
