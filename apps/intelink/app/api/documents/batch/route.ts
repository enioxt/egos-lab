/**
 * POST /api/documents/batch
 * 
 * Batch document extraction using LLM
 * 
 * @see lib/prompts/documents/extraction.ts for centralized prompts
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withSecurity, AuthContext } from '@/lib/api-security';
import { checkRateLimit, RATE_LIMITS, getClientIP, rateLimitExceeded } from '@/lib/rate-limit';
import { getBatchPrompt } from '@/lib/prompts/documents/extraction';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const MAX_DOCUMENTS = 5;

interface DocumentInput {
    filename: string;
    text: string;
    type?: string;
}

interface ExtractionResult {
    filename: string;
    success: boolean;
    result?: any;
    error?: string;
    processingTime?: number;
}

interface CrossReference {
    entity_name: string;
    entity_type: string;
    existing_investigation_id: string;
    existing_investigation_title: string;
    match_type: 'exact_name' | 'cpf' | 'phone' | 'plate';
    confidence: number;
}

// Extrair texto do documento usando LLM
async function extractWithLLM(text: string, filename: string): Promise<any> {
    if (!OPENROUTER_API_KEY) {
        throw new Error('OPENROUTER_API_KEY não configurada');
    }

    const userPrompt = `Analise este documento de operação e extraia TODAS as informações no formato JSON especificado.

DOCUMENTO: ${filename}

CONTEÚDO:
${text}

Retorne APENAS o JSON, sem explicações ou markdown.`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://intelink.app',
            'X-Title': 'Intelink Batch Extraction'
        },
        body: JSON.stringify({
            model: 'google/gemini-2.0-flash-001',
            messages: [
                { role: 'system', content: getBatchPrompt() },
                { role: 'user', content: userPrompt }
            ],
            max_tokens: 8192,
            temperature: 0.1
        })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`API Error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    // Parse JSON da resposta
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error('Não foi possível extrair JSON da resposta');
}

// Verificar se entidade já existe na base
async function checkExistingEntities(
    entities: any[],
    currentInvestigationId: string
): Promise<CrossReference[]> {
    const crossReferences: CrossReference[] = [];
    
    for (const entity of entities) {
        // Buscar por nome exato
        const { data: byName } = await supabase
            .from('intelink_entities')
            .select(`
                id, name, type, investigation_id, metadata,
                investigation:intelink_investigations(id, title)
            `)
            .neq('investigation_id', currentInvestigationId)
            .ilike('name', entity.name)
            .limit(5);
        
        if (byName && byName.length > 0) {
            for (const match of byName) {
                crossReferences.push({
                    entity_name: entity.name,
                    entity_type: entity.type,
                    existing_investigation_id: match.investigation_id,
                    existing_investigation_title: (match.investigation as any)?.title || 'Desconhecida',
                    match_type: 'exact_name',
                    confidence: 0.95
                });
            }
        }
        
        // Buscar por CPF se disponível
        if (entity.metadata?.cpf) {
            const { data: byCpf } = await supabase
                .from('intelink_entities')
                .select(`
                    id, name, investigation_id,
                    investigation:intelink_investigations(id, title)
                `)
                .neq('investigation_id', currentInvestigationId)
                .eq('metadata->>cpf', entity.metadata.cpf)
                .limit(5);
            
            if (byCpf && byCpf.length > 0) {
                for (const match of byCpf) {
                    crossReferences.push({
                        entity_name: entity.name,
                        entity_type: entity.type,
                        existing_investigation_id: match.investigation_id,
                        existing_investigation_title: (match.investigation as any)?.title || 'Desconhecida',
                        match_type: 'cpf',
                        confidence: 1.0
                    });
                }
            }
        }
        
        // Buscar por telefone
        if (entity.metadata?.telefone || entity.type === 'PHONE') {
            const phone = entity.metadata?.telefone || entity.name;
            const normalizedPhone = phone.replace(/\D/g, '');
            
            const { data: byPhone } = await supabase
                .from('intelink_entities')
                .select(`
                    id, name, investigation_id,
                    investigation:intelink_investigations(id, title)
                `)
                .neq('investigation_id', currentInvestigationId)
                .or(`name.ilike.%${normalizedPhone}%,metadata->>telefone.ilike.%${normalizedPhone}%`)
                .limit(5);
            
            if (byPhone && byPhone.length > 0) {
                for (const match of byPhone) {
                    crossReferences.push({
                        entity_name: entity.name,
                        entity_type: entity.type,
                        existing_investigation_id: match.investigation_id,
                        existing_investigation_title: (match.investigation as any)?.title || 'Desconhecida',
                        match_type: 'phone',
                        confidence: 0.9
                    });
                }
            }
        }
        
        // Buscar por placa (veículos)
        if (entity.type === 'VEHICLE' && entity.metadata?.placa) {
            const { data: byPlate } = await supabase
                .from('intelink_entities')
                .select(`
                    id, name, investigation_id,
                    investigation:intelink_investigations(id, title)
                `)
                .neq('investigation_id', currentInvestigationId)
                .eq('metadata->>placa', entity.metadata.placa)
                .limit(5);
            
            if (byPlate && byPlate.length > 0) {
                for (const match of byPlate) {
                    crossReferences.push({
                        entity_name: entity.name,
                        entity_type: entity.type,
                        existing_investigation_id: match.investigation_id,
                        existing_investigation_title: (match.investigation as any)?.title || 'Desconhecida',
                        match_type: 'plate',
                        confidence: 1.0
                    });
                }
            }
        }
    }
    
    // Remover duplicatas
    const unique = crossReferences.filter((ref, index, self) =>
        index === self.findIndex(r =>
            r.entity_name === ref.entity_name &&
            r.existing_investigation_id === ref.existing_investigation_id
        )
    );
    
    return unique;
}

// Salvar achados investigativos
async function saveInvestigatorFindings(
    findings: any[],
    investigationId: string,
    sourceDocumentId: string | null
): Promise<number> {
    if (!findings || findings.length === 0) return 0;
    
    const records = findings.map(f => ({
        investigation_id: investigationId,
        finding_type: f.tipo || 'connection_hypothesis',
        title: f.titulo,
        description: f.descricao,
        subject_names: f.entidades_envolvidas || [],
        confidence: f.confidence || 0.7,
        suggested_action: f.acao_sugerida,
        source_document_id: sourceDocumentId,
        source_type: 'document_analysis',
        is_actionable: !!f.acao_sugerida
    }));
    
    const { error } = await supabase
        .from('intelink_investigator_findings')
        .insert(records);
    
    if (error) {
        console.error('Erro ao salvar achados:', error);
        return 0;
    }
    
    return records.length;
}

async function handlePost(request: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        // Rate limit: LLM-intensive batch processing (5 req/min per user)
        const ip = getClientIP(request);
        const rateLimitKey = auth.isAuthenticated ? `batch:user:${auth.memberId}` : `batch:ip:${ip}`;
        const rateLimitResult = checkRateLimit(rateLimitKey, RATE_LIMITS.llm_analysis);
        
        if (!rateLimitResult.success) {
            return rateLimitExceeded(rateLimitResult);
        }
        
        const body = await request.json();
        const { documents, investigation_id } = body as {
            documents: DocumentInput[];
            investigation_id: string;
        };
        
        // Validações
        if (!documents || !Array.isArray(documents)) {
            return NextResponse.json(
                { error: 'documents deve ser um array' },
                { status: 400 }
            );
        }
        
        if (documents.length > MAX_DOCUMENTS) {
            return NextResponse.json(
                { error: `Máximo de ${MAX_DOCUMENTS} documentos por vez` },
                { status: 400 }
            );
        }
        
        if (!investigation_id) {
            return NextResponse.json(
                { error: 'investigation_id é obrigatório' },
                { status: 400 }
            );
        }
        
        // Processar cada documento
        const results: ExtractionResult[] = [];
        const allCrossReferences: CrossReference[] = [];
        let totalEntities = 0;
        let totalRelationships = 0;
        let totalFindings = 0;
        
        for (const doc of documents) {
            const startTime = Date.now();
            
            try {
                // Criar registro do documento
                const { data: docRecord, error: docError } = await supabase
                    .from('intelink_evidence')
                    .insert({
                        investigation_id,
                        name: doc.filename,
                        type: doc.type || 'DOCUMENT',
                        file_type: doc.type || 'text',
                        status: 'processing',
                        extracted_text: doc.text.substring(0, 10000) // Primeiros 10k chars
                    })
                    .select('id')
                    .single();
                
                const documentId = docRecord?.id || null;
                
                // Extrair com LLM
                const extraction = await extractWithLLM(doc.text, doc.filename);
                
                // Atualizar status do documento
                if (documentId) {
                    await supabase
                        .from('intelink_evidence')
                        .update({ 
                            status: 'completed',
                            entities_extracted: extraction.entities?.length || 0
                        })
                        .eq('id', documentId);
                }
                
                // Verificar cross-references
                if (extraction.entities && extraction.entities.length > 0) {
                    const crossRefs = await checkExistingEntities(
                        extraction.entities,
                        investigation_id
                    );
                    allCrossReferences.push(...crossRefs);
                    totalEntities += extraction.entities.length;
                }
                
                if (extraction.relationships) {
                    totalRelationships += extraction.relationships.length;
                }
                
                // Salvar achados investigativos com document_id
                if (extraction.achados_investigativos) {
                    const savedFindings = await saveInvestigatorFindings(
                        extraction.achados_investigativos,
                        investigation_id,
                        documentId
                    );
                    totalFindings += savedFindings;
                }
                
                results.push({
                    filename: doc.filename,
                    success: true,
                    result: extraction,
                    processingTime: Date.now() - startTime
                });
                
            } catch (error: any) {
                results.push({
                    filename: doc.filename,
                    success: false,
                    error: error.message,
                    processingTime: Date.now() - startTime
                });
            }
            
            // Delay entre requests para evitar rate limit
            if (documents.indexOf(doc) < documents.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        
        // Gerar insights consolidados
        const consolidatedInsights: string[] = [];
        
        // Insight de cross-references
        if (allCrossReferences.length > 0) {
            const uniqueInvestigations = [...new Set(allCrossReferences.map(r => r.existing_investigation_title))];
            consolidatedInsights.push(
                `🔗 ${allCrossReferences.length} conexão(ões) encontrada(s) com ${uniqueInvestigations.length} outra(s) operação(ões): ${uniqueInvestigations.join(', ')}`
            );
        }
        
        // Insight de entidades
        if (totalEntities > 0) {
            consolidatedInsights.push(
                `👥 ${totalEntities} entidades extraídas de ${results.filter(r => r.success).length} documento(s)`
            );
        }
        
        // Insight de achados
        if (totalFindings > 0) {
            consolidatedInsights.push(
                `🔍 ${totalFindings} achados investigativos salvos para análise`
            );
        }
        
        return NextResponse.json({
            success: true,
            processed: results.length,
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            results,
            cross_references: allCrossReferences,
            consolidated_insights: consolidatedInsights,
            totals: {
                entities: totalEntities,
                relationships: totalRelationships,
                findings: totalFindings,
                cross_case_connections: allCrossReferences.length
            }
        });
        
    } catch (error: any) {
        console.error('Batch extraction error:', error);
        return NextResponse.json(
            { error: error.message || 'Erro interno' },
            { status: 500 }
        );
    }
}

// Protected: Only member+ can batch process documents
export const POST = withSecurity(handlePost, { requiredRole: 'member' });
