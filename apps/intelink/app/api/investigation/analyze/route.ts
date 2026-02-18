/**
 * POST /api/investigation/analyze
 * 
 * Gera análise completa da operação usando IA:
 * - Artigos criminais aplicáveis
 * - Linhas de operação sugeridas
 * - Análise de risco
 * - Diligências recomendadas
 * - Resumo executivo
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/api-utils';
import { 
    ANALYSIS_SYSTEM_PROMPT, 
    buildAnalysisPrompt,
    AnalysisInput,
    AnalysisResult 
} from '@/lib/intelink/analysis-prompts';
import { withSecurity, AuthContext } from '@/lib/api-security';
import { fetchWithRetry, TIMEOUTS, RETRY_PRESETS } from '@/lib/adaptive-retry';
import { validateAIResponse } from '@/lib/content-guardian';

const supabase = getSupabaseAdmin();

async function handlePost(request: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        const { investigation_id } = await request.json();

        if (!investigation_id) {
            return NextResponse.json(
                { error: 'investigation_id é obrigatório' },
                { status: 400 }
            );
        }

        // 1. Buscar dados da operação
        const { data: investigation, error: invError } = await supabase
            .from('intelink_investigations')
            .select('id, title, description, created_at')
            .eq('id', investigation_id)
            .single();

        if (invError || !investigation) {
            return NextResponse.json(
                { error: 'Operação não encontrada' },
                { status: 404 }
            );
        }

        // 2. Buscar entidades
        const { data: entities } = await supabase
            .from('intelink_entities')
            .select('id, type, name, role, metadata')
            .eq('investigation_id', investigation_id);

        // 3. Buscar relacionamentos
        const { data: relationships } = await supabase
            .from('intelink_relationships')
            .select('source_entity_id, target_entity_id, type, description')
            .eq('investigation_id', investigation_id);

        // 4. Buscar evidências
        const { data: evidence } = await supabase
            .from('intelink_evidence')
            .select('type, description, source_document_id')
            .eq('investigation_id', investigation_id);

        // 5. Buscar documentos processados
        const { data: documents } = await supabase
            .from('intelink_documents')
            .select('document_type, original_filename, extracted_text')
            .eq('investigation_id', investigation_id);

        // 6. Buscar timeline (se existir)
        const { data: timeline } = await supabase
            .from('intelink_timeline')
            .select('event_date, description')
            .eq('investigation_id', investigation_id)
            .order('event_date', { ascending: true });

        // 7. Mapear relacionamentos para nomes de entidades
        const entityMap = new Map(entities?.map(e => [e.id, e.name]) || []);
        const mappedRelationships = relationships?.map(r => ({
            source: entityMap.get(r.source_entity_id) || r.source_entity_id,
            target: entityMap.get(r.target_entity_id) || r.target_entity_id,
            type: r.type,
            description: r.description
        })) || [];

        // 8. Construir input para análise
        const analysisInput: AnalysisInput = {
            investigation: {
                id: investigation.id,
                title: investigation.title,
                description: investigation.description,
                created_at: investigation.created_at
            },
            entities: entities?.map(e => ({
                type: e.type,
                name: e.name,
                role: e.role,
                metadata: e.metadata
            })) || [],
            relationships: mappedRelationships,
            evidence: evidence?.map(e => ({
                type: e.type,
                description: e.description,
                source_document: e.source_document_id
            })) || [],
            documents: documents?.map(d => ({
                type: d.document_type,
                title: d.original_filename,
                extracted_text: d.extracted_text?.slice(0, 3000) // Limitar para não estourar tokens
            })) || [],
            timeline: timeline?.map(t => ({
                date: t.event_date,
                description: t.description
            })) || []
        };

        // 9. Construir prompt
        const userPrompt = buildAnalysisPrompt(analysisInput);

        // 10. Chamar LLM with adaptive retry
        const model = process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-001';
        
        const llmResponse = await fetchWithRetry(
            'https://openrouter.ai/api/v1/chat/completions',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    'HTTP-Referer': process.env.NEXTAUTH_URL || 'http://localhost:3001',
                    'X-Title': 'INTELINK Analysis'
                },
                body: JSON.stringify({
                    model,
                    messages: [
                        { role: 'system', content: ANALYSIS_SYSTEM_PROMPT },
                        { role: 'user', content: userPrompt }
                    ],
                    temperature: 0.3,
                    max_tokens: 4000
                }),
                // Adaptive retry config - critical analysis
                timeout: TIMEOUTS.llm,
                ...RETRY_PRESETS.critical,
                onRetry: (attempt, error, delay) => {
                    console.warn(`[Analysis API] Retry ${attempt}: ${error.message}, next in ${delay}ms`);
                }
            }
        );

        if (!llmResponse.ok) {
            const errorData = await llmResponse.json().catch(() => ({}));
            console.error('LLM API error:', errorData);
            return NextResponse.json(
                { error: 'Erro ao gerar análise', details: errorData },
                { status: 500 }
            );
        }

        const llmData = await llmResponse.json();
        const rawContent = llmData.choices?.[0]?.message?.content;
        
        // Validate AI response for ethical compliance
        const { isValid, response: content, report } = validateAIResponse(rawContent || '');
        if (!isValid) {
            console.warn('[Analysis API] AI response flagged:', report.violations.map(v => v.message));
        }

        if (!content) {
            return NextResponse.json(
                { error: 'Resposta vazia da IA' },
                { status: 500 }
            );
        }

        // 11. Parse JSON da resposta
        let analysis: AnalysisResult;
        try {
            // Extrair JSON da resposta (pode vir com markdown)
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('JSON não encontrado na resposta');
            }
            analysis = JSON.parse(jsonMatch[0]);
        } catch (parseError) {
            console.error('JSON parse error:', parseError, 'Content:', content.slice(0, 500));
            return NextResponse.json(
                { error: 'Erro ao interpretar análise da IA', raw_content: content.slice(0, 1000) },
                { status: 500 }
            );
        }

        // 12. Salvar análise na tabela investigator_findings
        const findingsToInsert = [];

        // Artigos criminais
        for (const article of analysis.criminal_articles || []) {
            findingsToInsert.push({
                investigation_id,
                finding_type: 'criminal_article',
                title: `${article.code} - ${article.article}`,
                description: article.description,
                confidence: article.confidence,
                metadata: {
                    code: article.code,
                    qualification: article.qualification,
                    basis: article.basis
                },
                source: 'ai_analysis',
                created_at: new Date().toISOString()
            });
        }

        // Linhas de operação
        for (const line of analysis.investigation_lines || []) {
            findingsToInsert.push({
                investigation_id,
                finding_type: 'investigation_line',
                title: line.title,
                description: line.description,
                priority: line.priority,
                metadata: {
                    suggested_actions: line.suggested_actions
                },
                source: 'ai_analysis',
                created_at: new Date().toISOString()
            });
        }

        // Diligências sugeridas
        for (const diligence of analysis.suggested_diligences || []) {
            findingsToInsert.push({
                investigation_id,
                finding_type: 'suggested_diligence',
                title: `${diligence.type}: ${diligence.description.slice(0, 100)}`,
                description: diligence.description,
                priority: diligence.priority,
                metadata: {
                    type: diligence.type,
                    target: diligence.target,
                    justification: diligence.justification
                },
                source: 'ai_analysis',
                created_at: new Date().toISOString()
            });
        }

        // Análise de risco (como um único finding)
        if (analysis.risk_analysis) {
            findingsToInsert.push({
                investigation_id,
                finding_type: 'risk_analysis',
                title: 'Análise de Risco',
                description: `Fuga: ${analysis.risk_analysis.flight_risk}, Reincidência: ${analysis.risk_analysis.recidivism_risk}, Periculosidade: ${analysis.risk_analysis.danger_level}`,
                metadata: analysis.risk_analysis,
                source: 'ai_analysis',
                created_at: new Date().toISOString()
            });
        }

        // Resumo executivo
        if (analysis.executive_summary) {
            findingsToInsert.push({
                investigation_id,
                finding_type: 'executive_summary',
                title: 'Resumo Executivo',
                description: analysis.executive_summary.overview,
                metadata: {
                    key_findings: analysis.executive_summary.key_findings,
                    critical_gaps: analysis.executive_summary.critical_gaps,
                    recommendations: analysis.executive_summary.recommendations
                },
                source: 'ai_analysis',
                created_at: new Date().toISOString()
            });
        }

        // Inserir todos os findings
        if (findingsToInsert.length > 0) {
            const { error: insertError } = await supabase
                .from('investigator_findings')
                .insert(findingsToInsert);

            if (insertError) {
                console.error('Error inserting findings:', insertError);
                // Não falha, apenas loga - a análise ainda é retornada
            }
        }

        // 13. Retornar análise completa
        return NextResponse.json({
            success: true,
            investigation_id,
            analysis,
            findings_saved: findingsToInsert.length,
            input_stats: {
                entities: analysisInput.entities.length,
                relationships: analysisInput.relationships.length,
                evidence: analysisInput.evidence.length,
                documents: analysisInput.documents.length
            }
        });

    } catch (error: any) {
        console.error('Analysis error:', error);
        return NextResponse.json(
            { error: 'Erro ao analisar operação', details: error.message },
            { status: 500 }
        );
    }
}

// Protected: Only member+ can analyze investigations
export const POST = withSecurity(handlePost, { requiredRole: 'member' });
