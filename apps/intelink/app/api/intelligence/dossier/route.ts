/**
 * Intelligence Dossier API - Quantum Search
 * 
 * GET: Search for entities
 * POST: Build dossier and optionally generate narrative with LLM
 * 
 * @route /api/intelligence/dossier
 */

import { NextRequest, NextResponse } from 'next/server';
import { GraphAggregatorService } from '@/lib/intelligence/graph-aggregator';
import { 
    NARRATIVE_DOSSIER_SYSTEM_PROMPT, 
    buildDossierContext, 
    generateFallbackNarrative 
} from '@/lib/intelligence/narrative-prompt';
import { fetchWithRetry, TIMEOUTS, RETRY_PRESETS } from '@/lib/adaptive-retry';
import { validateAIResponse } from '@/lib/content-guardian';

export const dynamic = 'force-dynamic';

const graphAggregator = new GraphAggregatorService();

/**
 * GET - Search for entities
 * Query params: q (search query), limit (max results)
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q')?.trim() || '';
        const limit = parseInt(searchParams.get('limit') || '10');

        if (query.length < 2) {
            return NextResponse.json({ 
                error: 'Query must be at least 2 characters',
                results: [] 
            }, { status: 400 });
        }

        const results = await graphAggregator.searchEntities(query, limit);

        return NextResponse.json({
            query,
            results: results.entities,
            total: results.total
        });

    } catch (error) {
        console.error('Intelligence search error:', error);
        return NextResponse.json({ 
            error: 'Search failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

/**
 * POST - Build dossier for an entity
 * Body: { entity_id: string, generate_narrative: boolean, use_ai: boolean }
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { entity_id, generate_narrative = true, use_ai = false } = body;

        if (!entity_id) {
            return NextResponse.json({ 
                error: 'entity_id is required' 
            }, { status: 400 });
        }

        // Build the dossier (graph aggregation)
        const dossier = await graphAggregator.buildDossier(entity_id);

        if (!dossier) {
            return NextResponse.json({ 
                error: 'Entity not found or dossier could not be built' 
            }, { status: 404 });
        }

        let narrative: string | null = null;

        // Generate narrative if requested
        if (generate_narrative) {
            if (use_ai && process.env.OPENROUTER_API_KEY) {
                // Use Gemini via OpenRouter to generate narrative
                try {
                    const context = buildDossierContext(dossier);
                    
                    const response = await fetchWithRetry(
                        'https://openrouter.ai/api/v1/chat/completions',
                        {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                                'Content-Type': 'application/json',
                                'HTTP-Referer': 'https://intelink.app',
                                'X-Title': 'Intelink Intelligence Dossier'
                            },
                            body: JSON.stringify({
                                model: 'google/gemini-2.0-flash-exp',
                                messages: [
                                    { role: 'system', content: NARRATIVE_DOSSIER_SYSTEM_PROMPT },
                                    { role: 'user', content: context }
                                ],
                                max_tokens: 8000,
                                temperature: 0.3
                            }),
                            // Adaptive retry with Fibonacci backoff
                            timeout: TIMEOUTS.llm,
                            ...RETRY_PRESETS.important,
                            onRetry: (attempt, error, delay) => {
                                console.warn(`[Dossier] Retry ${attempt}: ${error.message}, next in ${delay}ms`);
                            }
                        }
                    );

                    if (response.ok) {
                        const data = await response.json();
                        const rawNarrative = data.choices?.[0]?.message?.content || generateFallbackNarrative(dossier);
                        
                        // Validate AI response
                        const { isValid, response: validatedNarrative, report } = validateAIResponse(rawNarrative);
                        if (!isValid) {
                            console.warn('[Dossier] AI response flagged:', report.violations.map(v => v.message));
                        }
                        narrative = validatedNarrative;
                    } else {
                        console.error('OpenRouter error:', await response.text());
                        narrative = generateFallbackNarrative(dossier);
                    }
                } catch (aiError) {
                    console.error('AI narrative generation failed:', aiError);
                    narrative = generateFallbackNarrative(dossier);
                }
            } else {
                // Generate simple narrative without AI
                narrative = generateFallbackNarrative(dossier);
            }
        }

        return NextResponse.json({
            success: true,
            dossier,
            narrative,
            metadata: {
                generated_at: new Date().toISOString(),
                ai_used: use_ai && !!narrative,
                entity_id
            }
        });

    } catch (error) {
        console.error('Intelligence dossier error:', error);
        return NextResponse.json({ 
            error: 'Failed to build dossier',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
