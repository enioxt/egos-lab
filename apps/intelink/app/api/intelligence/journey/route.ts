/**
 * Intelligence Journey API
 * 
 * Analyzes an investigator's navigation path (journey) to find missed connections,
 * hidden patterns, and suggest new leads based on investigation context.
 * 
 * Based on: i2 Analyst's Notebook + Palantir Gotham
 * Model: OpenRouter → Google Gemini 2.0 Flash
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { JourneyStep } from '@/lib/types/journey';
import { JOURNEY_ANALYST_PROMPT, promptConfig } from '@/lib/prompts/journey/analyst';
import { fetchWithRetry, TIMEOUTS, RETRY_PRESETS } from '@/lib/adaptive-retry';
import { validateAIResponse } from '@/lib/content-guardian';

// ============================================================================
// TYPES
// ============================================================================

interface JourneyAnalysisRequest {
    journeyId: string;
    context: string;
    steps: JourneyStep[];
}

interface EntityConnection {
    id: string;
    name: string;
    type: string;
    relationship: string;
}

// ============================================================================
// SUPABASE
// ============================================================================

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================================================
// SYSTEM PROMPT - Now imported from lib/prompts/journey/analyst.ts
// ============================================================================

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function fetch2ndDegreeConnections(entityIds: string[]): Promise<EntityConnection[]> {
    if (entityIds.length === 0) return [];
    
    // Get all relationships where visited entities are source or target
    const { data: directRels, error: directError } = await supabase
        .from('intelink_relationships')
        .select(`
            id,
            type,
            source_id,
            target_id,
            source:intelink_entities!source_id(id, name, type),
            target:intelink_entities!target_id(id, name, type)
        `)
        .or(entityIds.map(id => `source_id.eq.${id},target_id.eq.${id}`).join(','));
    
    if (directError) {
        console.error('[Journey] Error fetching 2nd degree:', directError);
        return [];
    }
    
    // Extract connected entities that weren't visited
    const connections: EntityConnection[] = [];
    const visitedSet = new Set(entityIds);
    
    for (const rel of directRels || []) {
        // Handle Supabase join results (can be array or object)
        const sourceData = Array.isArray(rel.source) ? rel.source[0] : rel.source;
        const targetData = Array.isArray(rel.target) ? rel.target[0] : rel.target;
        
        const source = sourceData as { id: string; name: string; type: string } | null;
        const target = targetData as { id: string; name: string; type: string } | null;
        
        if (source && !visitedSet.has(source.id)) {
            connections.push({
                id: source.id,
                name: source.name,
                type: source.type,
                relationship: rel.type,
            });
        }
        if (target && !visitedSet.has(target.id)) {
            connections.push({
                id: target.id,
                name: target.name,
                type: target.type,
                relationship: rel.type,
            });
        }
    }
    
    // Dedupe by id
    const seen = new Set<string>();
    return connections.filter(c => {
        if (seen.has(c.id)) return false;
        seen.add(c.id);
        return true;
    });
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
    try {
        const body: JourneyAnalysisRequest = await request.json();
        const { journeyId, context, steps } = body;
        
        if (!context || !steps || steps.length < 2) {
            return NextResponse.json(
                { error: 'Contexto e pelo menos 2 passos são necessários' },
                { status: 400 }
            );
        }
        
        // Extract visited entity IDs
        const visitedEntityIds = steps.map(s => s.entityId);
        
        // Fetch 2nd degree connections (entities not clicked but connected)
        const hiddenConnections = await fetch2ndDegreeConnections(visitedEntityIds);
        
        // Build the prompt
        const userMessage = `## Investigation Context
"${context}"

## Journey Steps (${steps.length} steps)
${steps.map((s, i) => `${i + 1}. ${s.entityType}: "${s.entityName}" ${s.source === 'click_relationship' ? `(via ${s.relationshipType})` : ''}`).join('\n')}

## Hidden Connections (2nd Degree - Not Clicked)
${hiddenConnections.length > 0 
    ? hiddenConnections.map(c => `- ${c.type}: "${c.name}" (${c.relationship})`).join('\n')
    : 'Nenhuma conexão de 2º grau encontrada.'
}

## Visible Connections Snapshots
${steps.map((s, i) => {
    if (!s.visibleConnectionsSnapshot?.length) return '';
    return `Step ${i + 1} (${s.entityName}):
${s.visibleConnectionsSnapshot.map(c => `  - ${c.type}: "${c.name}" (${c.relationship})`).join('\n')}`;
}).filter(Boolean).join('\n\n')}

Analyze this journey and provide insights in Portuguese.`;

        // Call OpenRouter API with adaptive retry (Fibonacci backoff)
        const openRouterResponse = await fetchWithRetry(
            'https://openrouter.ai/api/v1/chat/completions',
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://intelink.ia.br',
                    'X-Title': 'Intelink Journey Analysis',
                },
                body: JSON.stringify({
                    model: 'google/gemini-2.0-flash-001',
                    messages: [
                        { role: 'system', content: JOURNEY_ANALYST_PROMPT },
                        { role: 'user', content: userMessage },
                    ],
                    temperature: 0.3,
                    max_tokens: 2000,
                }),
                // Adaptive retry config
                timeout: TIMEOUTS.llm,
                ...RETRY_PRESETS.important,
                onRetry: (attempt, error, delay) => {
                    console.warn(`[Journey] Retry ${attempt}: ${error.message}, next in ${delay}ms`);
                }
            }
        );
        
        if (!openRouterResponse.ok) {
            const errorText = await openRouterResponse.text();
            console.error('[Journey] OpenRouter error:', errorText);
            return NextResponse.json(
                { error: 'Falha na análise com IA' },
                { status: 500 }
            );
        }
        
        const aiResult = await openRouterResponse.json();
        const rawAnalysis = aiResult.choices?.[0]?.message?.content || 'Análise não disponível';
        
        // Validate AI response before returning
        const { isValid, response: analysis, report } = validateAIResponse(rawAnalysis);
        if (!isValid) {
            console.warn('[Journey] AI response flagged:', report.violations.map(v => v.message));
        }
        
        // Update journey in database
        await supabase
            .from('intelink_journeys')
            .update({
                context,
                ai_analysis: analysis,
                ai_model: 'google/gemini-2.0-flash-001',
                ai_analyzed_at: new Date().toISOString(),
            })
            .eq('id', journeyId);
        
        return NextResponse.json({
            analysis,
            model: 'google/gemini-2.0-flash-001',
            stepsAnalyzed: steps.length,
            hiddenConnectionsFound: hiddenConnections.length,
        });
        
    } catch (error) {
        console.error('[Journey] Analysis error:', error);
        return NextResponse.json(
            { error: 'Erro interno na análise' },
            { status: 500 }
        );
    }
}
