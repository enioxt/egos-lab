/**
 * Product Enricher — The AI Brain of Nexus Market
 * 
 * Pipeline: Raw Product → Global Catalog Check → Web Search → AI Generate → Score
 * 
 * This is the single entry point for all product enrichment.
 * It orchestrates WebSearch, NanoBanana, and the Global Catalog.
 */

import { searchProductImages } from './web-search';
import { generateProductImage } from './image-generator';

export interface RawProduct {
    name: string;
    barcode?: string;
    price: number;
    category?: string;
    description?: string;
    image_url?: string;
    expiry_date?: string;
}

export interface EnrichedProduct extends RawProduct {
    image_url: string;
    image_source: 'existing' | 'global_catalog' | 'web_search' | 'ai_generated' | 'placeholder';
    data_quality_score: number;
    ai_suggestions: AISuggestion[];
    enrichment_cost_usd: number;
}

export interface AISuggestion {
    field: string;
    severity: 'critical' | 'warning' | 'info';
    message: string;
}

/**
 * Enrich a raw product with AI-powered data filling.
 * 
 * @param product - Raw product from ERP/CSV import
 * @param globalCatalogLookup - Optional function to check global catalog (injected by caller who has Supabase)
 * @param globalCatalogSave - Optional function to save to global catalog
 */
export async function enrichProduct(
    product: RawProduct,
    globalCatalogLookup?: (barcode: string) => Promise<{ image_url: string } | null>,
    globalCatalogSave?: (barcode: string, imageUrl: string, source: string) => Promise<void>,
): Promise<EnrichedProduct> {
    let imageUrl = product.image_url || '';
    let imageSource: EnrichedProduct['image_source'] = 'existing';
    let enrichmentCost = 0;
    const suggestions: AISuggestion[] = [];

    // === STEP 1: Score what we already have ===
    let score = 0;
    if (product.name) score += 20;
    if (product.price > 0) score += 15;
    if (product.barcode) score += 10;
    if (product.category) score += 10;
    if (product.description) score += 10;
    if (product.expiry_date) score += 15;

    // === STEP 2: Find image ===
    if (!imageUrl) {
        // 2a. Check Global Catalog (free, instant)
        if (product.barcode && globalCatalogLookup) {
            const catalogEntry = await globalCatalogLookup(product.barcode);
            if (catalogEntry?.image_url) {
                imageUrl = catalogEntry.image_url;
                imageSource = 'global_catalog';
                score += 20;
                console.log(`  📦 Found in Global Catalog`);
            }
        }

        // 2b. Web Search (cheap, ~$0.001 per query via Exa)
        if (!imageUrl) {
            const searchResults = await searchProductImages(product.name, product.barcode);
            if (searchResults.results.length > 0) {
                imageUrl = searchResults.results[0].imageUrl;
                imageSource = 'web_search';
                score += 15;
                enrichmentCost += 0.001;
                console.log(`  🔍 Found via web search`);

                // Save to Global Catalog for future merchants
                if (product.barcode && globalCatalogSave) {
                    await globalCatalogSave(product.barcode, imageUrl, 'web_search');
                }
            }
        }

        // 2c. AI Generate (more expensive, ~$0.04 per image)
        if (!imageUrl) {
            const generated = await generateProductImage(product.name, product.category);
            if (generated) {
                imageUrl = generated.url;
                imageSource = 'ai_generated';
                score += 10;
                enrichmentCost += generated.estimatedCostUsd;
                console.log(`  🎨 Generated with AI ($${generated.estimatedCostUsd})`);

                if (product.barcode && globalCatalogSave) {
                    await globalCatalogSave(product.barcode, imageUrl, 'ai_generated');
                }
            }
        }

        // 2d. Placeholder (free, but low quality)
        if (!imageUrl) {
            imageUrl = `https://placehold.co/400x400/f3f4f6/6b7280?text=${encodeURIComponent(product.name.substring(0, 20))}`;
            imageSource = 'placeholder';
        }
    } else {
        score += 20; // Already had image
    }

    // === STEP 3: Generate AI suggestions ===
    if (!product.image_url && imageSource === 'placeholder') {
        suggestions.push({
            field: 'image_url',
            severity: 'critical',
            message: 'Produto sem foto. Adicione uma imagem para aumentar vendas em até 3x.',
        });
    }

    if (!product.expiry_date) {
        suggestions.push({
            field: 'expiry_date',
            severity: 'warning',
            message: 'Data de validade não informada. Necessário para controle de perdas.',
        });
    }

    if (!product.category) {
        suggestions.push({
            field: 'category',
            severity: 'info',
            message: 'Categorize o produto para melhor organização na vitrine.',
        });
    }

    if (!product.description) {
        suggestions.push({
            field: 'description',
            severity: 'info',
            message: 'Adicione uma descrição para melhorar o SEO e ajudar o cliente.',
        });
    }

    if (product.price <= 0) {
        suggestions.push({
            field: 'price',
            severity: 'critical',
            message: 'Preço inválido. Corrija antes de publicar.',
        });
    }

    return {
        ...product,
        image_url: imageUrl,
        image_source: imageSource,
        data_quality_score: Math.min(100, score),
        ai_suggestions: suggestions,
        enrichment_cost_usd: enrichmentCost,
    };
}
