#!/usr/bin/env bun
/**
 * SMART IMPORT — AI-Enriched Product Ingestion
 * 
 * Pipeline per product:
 *   1. Check Global Catalog (free, instant)
 *   2. Exa Web Search (cheap, ~$0.001)
 *   3. Nano Banana AI Generation (~$0.04)
 *   4. Score + Suggestions
 *   5. Upsert to Supabase
 * 
 * Usage: bun apps/nexus-web/scripts/smart-import.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { enrichProduct, type RawProduct, type EnrichedProduct } from '@nexus/shared';

// Load env from monorepo root
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in root .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

// ───────────────────────────────────────────────
// Realistic dataset — Patos de Minas, MG, Brazil
// ───────────────────────────────────────────────
const PRODUCTS: RawProduct[] = [
    { name: 'Coca-Cola 2L', barcode: '7894900011517', price: 10.49, category: 'bebidas' },
    { name: 'Arroz Tio João 5kg', barcode: '7893500018469', price: 28.90, category: 'grãos' },
    { name: 'Feijão Carioca Kicaldo 1kg', barcode: '7896266700010', price: 8.49, category: 'grãos' },
    { name: 'Leite Integral Italac 1L', barcode: '7898080640116', price: 5.99, category: 'laticínios' },
    { name: 'Açúcar Cristal União 1kg', barcode: '7891910000197', price: 4.89, category: 'mercearia' },
    { name: 'Óleo de Soja Soya 900ml', barcode: '7891107100259', price: 7.29, category: 'mercearia' },
    { name: 'Café Melitta Tradicional 500g', barcode: '7891021002202', price: 16.90, category: 'bebidas' },
    { name: 'Sabão em Pó Omo 800g', barcode: '7891150026698', price: 14.99, category: 'limpeza' },
    { name: 'Macarrão Espaguete Barilla 500g', barcode: '8076800195057', price: 7.99, category: 'mercearia' },
    { name: 'Queijo Minas Frescal São Vicente', barcode: '', price: 25.90, category: 'laticínios' },
    { name: 'Pão Francês (kg)', barcode: '', price: 14.90, category: 'padaria' },
    { name: 'Banana Prata (kg)', barcode: '', price: 6.99, category: 'hortifrúti' },
    { name: 'Desodorante Rexona 150ml', barcode: '7891150019379', price: 12.50, category: 'higiene' },
    { name: 'Detergente Ypê 500ml', barcode: '7896098900017', price: 2.79, category: 'limpeza' },
    { name: 'Cerveja Brahma 350ml', barcode: '7891149108206', price: 3.49, category: 'bebidas' },
];

// ───────────────────────────────────────────────
// Global Catalog helpers (injected into enricher)
// ───────────────────────────────────────────────
async function lookupGlobalCatalog(barcode: string): Promise<{ image_url: string } | null> {
    const { data } = await supabase
        .from('nexusmkt_global_catalog')
        .select('image_url')
        .eq('ean', barcode)
        .single();
    return data;
}

async function saveToGlobalCatalog(barcode: string, imageUrl: string, source: string): Promise<void> {
    const { error } = await supabase
        .from('nexusmkt_global_catalog')
        .upsert({
            ean: barcode,
            name: PRODUCTS.find(p => p.barcode === barcode)?.name || 'Unknown',
            image_url: imageUrl,
            image_source: source,
            ai_generated_image: source === 'ai_generated',
            data_quality_score: source === 'web_search' ? 85 : 70,
        }, { onConflict: 'ean' });

    if (error) console.warn(`  ⚠ Could not save to Global Catalog: ${error.message}`);
    else console.log(`  📦 Saved to Global Catalog (${source})`);
}

// ───────────────────────────────────────────────
// Main import pipeline
// ───────────────────────────────────────────────
async function main() {
    console.log('══════════════════════════════════════════════════');
    console.log('🚀 NEXUS MARKET — Smart Import with AI Enrichment');
    console.log('══════════════════════════════════════════════════\n');

    // 1. Ensure demo merchant exists
    const { data: merchant } = await supabase
        .from('nexusmkt_merchants')
        .select('id')
        .eq('slug', 'nexus-demo-store')
        .single();

    let merchantId = merchant?.id;

    if (!merchantId) {
        console.log('📋 Creating demo merchant...');
        const { data: newMerchant, error } = await supabase
            .from('nexusmkt_merchants')
            .insert({
                name: 'Nexus Demo Store — Patos de Minas',
                slug: 'nexus-demo-store',
                address: { city: 'Patos de Minas', state: 'MG', country: 'BR' },
            })
            .select('id')
            .single();

        if (error) {
            console.error('❌ Failed to create merchant:', error.message);
            return;
        }
        merchantId = newMerchant!.id;
    }

    console.log(`🏪 Merchant: ${merchantId}\n`);

    // 2. Process each product through AI pipeline
    let totalCost = 0;
    const stats = { web: 0, ai: 0, placeholder: 0, catalog: 0 };

    for (const product of PRODUCTS) {
        console.log(`━━━ ${product.name} ━━━`);

        const enriched = await enrichProduct(
            product,
            lookupGlobalCatalog,
            saveToGlobalCatalog,
        );

        totalCost += enriched.enrichment_cost_usd;
        stats[enriched.image_source === 'web_search' ? 'web'
            : enriched.image_source === 'ai_generated' ? 'ai'
                : enriched.image_source === 'global_catalog' ? 'catalog'
                    : 'placeholder']++;

        // 3. Insert to Supabase
        const { error } = await supabase
            .from('nexusmkt_products')
            .insert({
                merchant_id: merchantId,
                name: enriched.name,
                barcode: enriched.barcode || null,
                price: enriched.price,
                category: enriched.category || null,
                image_url: enriched.image_url,
                data_quality_score: enriched.data_quality_score,
                ai_suggestions: enriched.ai_suggestions,
                is_available: true,
            });

        if (error) {
            console.log(`  ❌ Save failed: ${error.message}`);
        } else {
            console.log(`  ✅ Score: ${enriched.data_quality_score}/100 | Source: ${enriched.image_source}`);
        }

        if (enriched.ai_suggestions.length > 0) {
            for (const s of enriched.ai_suggestions) {
                const icon = s.severity === 'critical' ? '🔴' : s.severity === 'warning' ? '🟡' : '💡';
                console.log(`  ${icon} ${s.message}`);
            }
        }
        console.log('');
    }

    // 4. Summary
    console.log('══════════════════════════════════════════════════');
    console.log('📊 IMPORT COMPLETE');
    console.log('══════════════════════════════════════════════════');
    console.log(`  Products:     ${PRODUCTS.length}`);
    console.log(`  From Catalog: ${stats.catalog}`);
    console.log(`  Web Search:   ${stats.web}`);
    console.log(`  AI Generated: ${stats.ai}`);
    console.log(`  Placeholder:  ${stats.placeholder}`);
    console.log(`  Total Cost:   $${totalCost.toFixed(4)}`);
    console.log('══════════════════════════════════════════════════\n');
}

main().catch(console.error);
