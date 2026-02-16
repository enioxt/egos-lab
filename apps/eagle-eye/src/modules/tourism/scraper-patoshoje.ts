
import { TourismNews } from './types';

export class ScraperPatosHoje {
    private baseUrl = 'https://patoshoje.com.br';

    async scrape(): Promise<TourismNews[]> {
        console.log(`🦅 ScraperPatosHoje: Fetching ${this.baseUrl}...`);

        try {
            const response = await fetch(this.baseUrl);
            if (!response.ok) {
                console.error(`Failed to fetch Patos Hoje: ${response.status}`);
                return [];
            }

            const html = await response.text();
            const newsItems: TourismNews[] = [];
            const uniqueLinks = new Set<string>();

            // Regex for news links: <a href="/noticias/slug-id.html" ...>Title</a>
            // We want to capture the href and the inner text (title)
            const linkRegex = /<a[^>]+href=["'](\/noticias\/[\w-]+\-\d+\.html)["'][^>]*>(.*?)<\/a>/g;

            let match;
            while ((match = linkRegex.exec(html)) !== null) {
                const [_, href, innerHTML] = match;

                // Clean up title (remove tags inside if any)
                const title = innerHTML.replace(/<[^>]+>/g, '').trim();

                if (!title || title.length < 10) continue; // Skip empty or short titles

                const fullUrl = `https://patoshoje.com.br${href}`;

                if (uniqueLinks.has(fullUrl)) continue;
                uniqueLinks.add(fullUrl);

                newsItems.push({
                    id: crypto.randomUUID(),
                    title: title,
                    summary: 'Notícia capturada automaticamente do Patos Hoje.',
                    url: fullUrl,
                    source: 'Patos Hoje',
                    date: new Date().toISOString()
                });

                if (newsItems.length >= 15) break; // Limit items
            }

            console.log(`✅ ScraperPatosHoje found ${newsItems.length} items.`);
            return newsItems;

        } catch (error) {
            console.error('ScraperPatosHoje Error:', error);
            return [];
        }
    }
}
