/**
 * 🦅 Eagle Eye — Supabase Migration Utility
 * 
 * Migrates local JSON scan results to Supabase database.
 * Usage: bun scripts/migrate_to_supabase.ts
 */

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createClient } from '@supabase/supabase-js';

// Load env explicitly if needed, or rely on bun's .env loading
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const RESULTS_DIR = join(import.meta.dir, '../docs/eagle-eye-results');

async function migrate() {
    console.log('🚀 Starting migration to Supabase...');

    if (!readdirSync(RESULTS_DIR).length) {
        console.log('ℹ️  No result files found.');
        return;
    }

    const files = readdirSync(RESULTS_DIR).filter(f => f.endsWith('.json') && f.startsWith('scan_'));

    for (const file of files) {
        console.log(`\n📂 Processing file: ${file}`);
        const content = readFileSync(join(RESULTS_DIR, file), 'utf-8');
        const report = JSON.parse(content);

        let savedGazettes = 0;
        let savedOpportunities = 0;

        for (const result of report.results) {
            const g = result.gazette;

            // 1. Upsert Gazette
            const { data: gazetteData, error: gazetteError } = await supabase
                .from('eagle_eye_gazettes')
                .upsert({
                    territory_id: g.territory_id,
                    territory_name: g.territory_name,
                    state_code: g.state_code,
                    date: g.date,
                    url: g.url,
                    txt_url: g.txt_url,
                    raw_text_length: result.raw_text_length,
                    analysis_cost_usd: result.analysis_cost_usd
                }, { onConflict: 'territory_id, date' })
                .select('id')
                .single();

            if (gazetteError) {
                console.error(`   ❌ Failed to save gazette ${g.territory_name}: ${gazetteError.message}`);
                continue;
            }

            savedGazettes++;
            const gazetteId = gazetteData.id;

            // 2. Insert Opportunities
            for (const match of result.matches) {
                const { error: oppError } = await supabase
                    .from('eagle_eye_opportunities')
                    .insert({
                        gazette_id: gazetteId,
                        pattern_id: match.pattern_id,
                        pattern_name: match.pattern_name,
                        confidence: match.confidence,
                        urgency: match.urgency,
                        matched_keywords: match.matched_keywords,
                        ai_reasoning: match.ai_reasoning,
                        effective_date: match.effective_date,
                        action_deadline: match.action_deadline,
                        enrichment_data: match.enrichment
                    });

                if (oppError) {
                    console.error(`   ❌ Failed to save opportunity: ${oppError.message}`);
                } else {
                    savedOpportunities++;
                }
            }
        }

        console.log(`   ✅ Saved: ${savedGazettes} gazettes, ${savedOpportunities} opportunities`);
    }

    console.log('\n✨ Migration complete!');
}

migrate().catch(console.error);
