/**
 * PHOTO HUNTER SERVICE (v2)
 * 
 * Now delegates to the full enrichment pipeline:
 * 1. Global Catalog → 2. Exa Web Search → 3. Nano Banana AI Gen → 4. Placeholder
 * 
 * This class provides a simple interface for quick image lookups.
 * For full product enrichment (score + suggestions), use `enrichProduct()` directly.
 */

import { searchProductImages } from './web-search';
import { generateProductImage } from './image-generator';

export interface PhotoResult {
    url: string;
    source: 'global_catalog' | 'web_search' | 'ai_generated' | 'placeholder';
    score: number;
    costUsd: number;
}

export class PhotoHunter {
    /**
     * Hunt for a product image using the full pipeline.
     */
    async hunt(productName: string, barcode?: string): Promise<PhotoResult> {
        console.log(`🔍 Hunting photo: "${productName}" (${barcode || 'no barcode'})`);

        // 1. Web Search via Exa
        const searchResults = await searchProductImages(productName, barcode);
        if (searchResults.results.length > 0 && searchResults.source === 'exa') {
            const best = searchResults.results[0];
            return {
                url: best.imageUrl,
                source: 'web_search',
                score: best.score,
                costUsd: 0.001,
            };
        }

        // 2. AI Generation via Nano Banana
        const generated = await generateProductImage(productName);
        if (generated) {
            return {
                url: generated.url,
                source: 'ai_generated',
                score: 70,
                costUsd: generated.estimatedCostUsd,
            };
        }

        // 3. Placeholder
        const encodedName = encodeURIComponent(productName.substring(0, 20));
        return {
            url: `https://placehold.co/400x400/f3f4f6/6b7280?text=${encodedName}`,
            source: 'placeholder',
            score: 0,
            costUsd: 0,
        };
    }
}
