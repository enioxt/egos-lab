/**
 * POST /api/documents/save
 * 
 * Salva documento processado e suas entidades no banco
 * Cria entidades na operação após aprovação
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, errorResponse, successResponse, validationError } from '@/lib/api-utils';
import { withSecurity, AuthContext } from '@/lib/api-security';
import { 
    calculateNameSimilarity, 
    isValidCpf, 
    shouldAutoMerge,
    mergeMetadata,
    DEFAULT_AUTO_MERGE_CONFIG
} from '@/lib/entity-resolution/auto-merge';
import {
    createCrossCaseAlert,
    classifyFinding,
    SaveDocumentRequest,
    DuplicateResult,
    MatchType,
} from '@/lib/documents';

const supabase = getSupabaseAdmin();

// Mapeamento de tipos de evidência (inglês → português)
const EVIDENCE_TYPE_MAP: Record<string, string> = {
    'DRUG': 'droga',
    'DEVICE': 'dispositivo',
    'MONEY': 'dinheiro',
    'DOCUMENT': 'documento',
    'OTHER': 'outro'
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DETECÇÃO DE DUPLICADOS E CROSS-CASE
// DuplicateResult imported from @/lib/documents
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function checkForDuplicate(
    supabase: any,
    entity: { type: string; name: string; metadata?: Record<string, unknown> },
    currentInvestigationId: string
): Promise<DuplicateResult> {
    const result: DuplicateResult = { found: false, sameInvestigation: false };
    
    // 1. Check by CPF for PERSON (usando nova validação)
    if (entity.type === 'PERSON' && entity.metadata?.cpf) {
        const cpfString = String(entity.metadata.cpf);
        const cpf = cpfString.replace(/\D/g, '');
        
        // Usar a nova função de validação de CPF
        if (isValidCpf(cpfString)) {
            // PRIMEIRO: buscar na MESMA investigação (para reutilizar)
            const { data: sameInvMatches } = await supabase
                .from('intelink_entities')
                .select('id, name, investigation_id, metadata')
                .eq('type', 'PERSON')
                .eq('investigation_id', currentInvestigationId)
                .ilike('metadata->>cpf', `%${cpf}%`)
                .limit(1);
            
            if (sameInvMatches && sameInvMatches.length > 0) {
                const match = sameInvMatches[0];
                result.found = true;
                result.sameInvestigation = true;
                result.existingEntity = {
                    id: match.id,
                    name: match.name,
                    investigation_id: match.investigation_id
                };
                result.matchType = 'cpf';
                result.matchReason = `CPF: ${entity.metadata.cpf}`;
                return result;
            }
            
            // DEPOIS: buscar em OUTRAS investigações (para cross-case alert)
            const { data: otherInvMatches } = await supabase
                .from('intelink_entities')
                .select('id, name, investigation_id, metadata')
                .eq('type', 'PERSON')
                .neq('investigation_id', currentInvestigationId)
                .ilike('metadata->>cpf', `%${cpf}%`)
                .limit(1);
            
            if (otherInvMatches && otherInvMatches.length > 0) {
                const match = otherInvMatches[0];
                result.found = true;
                result.sameInvestigation = false;
                result.existingEntity = {
                    id: match.id,
                    name: match.name,
                    investigation_id: match.investigation_id
                };
                result.matchType = 'cpf';
                result.matchReason = `CPF: ${entity.metadata.cpf}`;
                return result;
            }
        }
    }
    
    // 2. Check by plate for VEHICLE
    if (entity.type === 'VEHICLE' && entity.metadata?.placa) {
        const placa = String(entity.metadata.placa).replace(/\W/g, '').toUpperCase();
        if (placa.length >= 6) {
            // PRIMEIRO: buscar na MESMA investigação
            const { data: sameInvMatches } = await supabase
                .from('intelink_entities')
                .select('id, name, investigation_id, metadata')
                .eq('type', 'VEHICLE')
                .eq('investigation_id', currentInvestigationId)
                .ilike('metadata->>placa', `%${placa}%`)
                .limit(1);
            
            if (sameInvMatches && sameInvMatches.length > 0) {
                const match = sameInvMatches[0];
                result.found = true;
                result.sameInvestigation = true;
                result.existingEntity = {
                    id: match.id,
                    name: match.name,
                    investigation_id: match.investigation_id
                };
                result.matchType = 'placa';
                result.matchReason = `Placa: ${entity.metadata.placa}`;
                return result;
            }
            
            // DEPOIS: buscar em OUTRAS investigações
            const { data: otherInvMatches } = await supabase
                .from('intelink_entities')
                .select('id, name, investigation_id, metadata')
                .eq('type', 'VEHICLE')
                .neq('investigation_id', currentInvestigationId)
                .ilike('metadata->>placa', `%${placa}%`)
                .limit(1);
            
            if (otherInvMatches && otherInvMatches.length > 0) {
                const match = otherInvMatches[0];
                result.found = true;
                result.sameInvestigation = false;
                result.existingEntity = {
                    id: match.id,
                    name: match.name,
                    investigation_id: match.investigation_id
                };
                result.matchType = 'placa';
                result.matchReason = `Placa: ${entity.metadata.placa}`;
                return result;
            }
        }
    }
    
    // 3. Check by exact name (case insensitive, accent-normalized)
    // IMPORTANTE: Só criar match por nome se AMBAS entidades NÃO têm CPF
    // Se CPFs são diferentes = pessoas diferentes = sem match
    let newCpf = entity.metadata?.cpf ? String(entity.metadata.cpf).replace(/\D/g, '') : null;
    
    // Sanitizar CPF inválido
    const INVALID_CPFS_NAME = ['XXXX', '0000', '00000000000'];
    if (newCpf && (newCpf.length < 11 || INVALID_CPFS_NAME.some(inv => newCpf!.includes(inv)))) {
        newCpf = null;
    }
    
    // Normalizar nome para busca (remover acentos)
    const normalizedSearchName = entity.name
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
    
    // PRIMEIRO: buscar na MESMA investigação por nome (busca mais ampla)
    const { data: sameInvNameMatches } = await supabase
        .from('intelink_entities')
        .select('id, name, investigation_id, metadata')
        .eq('type', entity.type)
        .eq('investigation_id', currentInvestigationId)
        .limit(50); // Buscar mais para filtrar depois
    
    if (sameInvNameMatches && sameInvNameMatches.length > 0) {
        for (const match of sameInvNameMatches) {
            // Normalizar nome existente para comparação
            const normalizedExistingName = match.name
                .toUpperCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .trim();
            
            // Verificar se nomes normalizados são iguais ou muito similares
            const nameSimilarity = calculateNameSimilarity(entity.name, match.name);
            if (normalizedExistingName !== normalizedSearchName && nameSimilarity < 0.95) {
                continue; // Nomes muito diferentes
            }
            
            let existingCpf = match.metadata?.cpf ? String(match.metadata.cpf).replace(/\D/g, '') : null;
            if (existingCpf && (existingCpf.length < 11 || INVALID_CPFS_NAME.some(inv => existingCpf!.includes(inv)))) {
                existingCpf = null;
            }
            
            // Se ambos têm CPF e são diferentes = pessoas diferentes, pular
            if (newCpf && existingCpf && newCpf !== existingCpf) {
                continue;
            }
            
            // Match válido na mesma investigação
            result.found = true;
            result.sameInvestigation = true;
            result.existingEntity = {
                id: match.id,
                name: match.name,
                investigation_id: match.investigation_id
            };
            result.matchType = 'nome';
            result.matchReason = `Nome ${nameSimilarity === 1 ? 'idêntico' : `similar (${Math.round(nameSimilarity * 100)}%)`}: ${entity.name}`;
            return result;
        }
    }
    
    // DEPOIS: buscar em OUTRAS investigações por nome (limitado para performance)
    const { data: otherInvNameMatches } = await supabase
        .from('intelink_entities')
        .select('id, name, investigation_id, metadata')
        .eq('type', entity.type)
        .neq('investigation_id', currentInvestigationId)
        .limit(100);
    
    if (otherInvNameMatches && otherInvNameMatches.length > 0) {
        for (const match of otherInvNameMatches) {
            // Normalizar nome existente para comparação
            const normalizedExistingName = match.name
                .toUpperCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .trim();
            
            // Verificar se nomes normalizados são iguais ou muito similares
            const nameSimilarity = calculateNameSimilarity(entity.name, match.name);
            if (normalizedExistingName !== normalizedSearchName && nameSimilarity < 0.95) {
                continue; // Nomes muito diferentes
            }
            
            let existingCpf = match.metadata?.cpf ? String(match.metadata.cpf).replace(/\D/g, '') : null;
            if (existingCpf && (existingCpf.length < 11 || INVALID_CPFS_NAME.some(inv => existingCpf!.includes(inv)))) {
                existingCpf = null;
            }
            
            // Se ambos têm CPF e são diferentes = pessoas diferentes, pular
            if (newCpf && existingCpf && newCpf !== existingCpf) {
                continue;
            }
            
            // Match válido em outra investigação (cross-case)
            result.found = true;
            result.sameInvestigation = false;
            result.existingEntity = {
                id: match.id,
                name: match.name,
                investigation_id: match.investigation_id
            };
            result.matchType = 'nome';
            result.matchReason = `Nome ${nameSimilarity === 1 ? 'idêntico' : `similar (${Math.round(nameSimilarity * 100)}%)`}: ${entity.name}`;
            return result;
        }
    }
    
    return result;
}

// createCrossCaseAlert, classifyFinding, SaveDocumentRequest imported from @/lib/documents

async function handlePost(request: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        const body: SaveDocumentRequest = await request.json();
        const { investigation_id, document_type, extraction, file_info, stats } = body;

        if (!investigation_id || !extraction) {
            return NextResponse.json(
                { error: 'investigation_id e extraction são obrigatórios' },
                { status: 400 }
            );
        }

        // TENANT ISOLATION: Verify access to investigation
        const { guardInvestigation } = await import('@/lib/tenant-guard');
        const accessDenied = await guardInvestigation(auth, investigation_id);
        if (accessDenied) return accessDenied;

        // 0. DUPLICATE CHECK: Block if same hash already exists in this investigation
        if (file_info?.hash) {
            const { data: existingDoc } = await supabase
                .from('intelink_documents')
                .select('id, title, created_at')
                .eq('investigation_id', investigation_id)
                .eq('file_hash', file_info.hash)
                .is('deleted_at', null)
                .limit(1)
                .single();
            
            if (existingDoc) {
                console.log(`[Duplicate Block] Hash ${file_info.hash.substring(0, 8)}... already exists as ${existingDoc.title}`);
                return NextResponse.json({
                    success: false,
                    error: 'Documento duplicado',
                    duplicate: true,
                    existing_document: {
                        id: existingDoc.id,
                        title: existingDoc.title,
                        created_at: existingDoc.created_at
                    },
                    message: `Este documento já foi adicionado: "${existingDoc.title}"`
                }, { status: 409 }); // 409 Conflict
            }
        }

        // 1. Criar documento
        const { data: doc, error: docError } = await supabase
            .from('intelink_documents')
            .insert({
                investigation_id,
                document_type,
                title: file_info?.name || `Documento ${document_type}`,
                numero_ocorrencia: extraction.numero_ocorrencia || null,
                natureza: extraction.natureza || null,
                data_fato: extraction.data_fato || null,
                summary: extraction.summary,
                historico_completo: extraction.historico_completo,
                raw_text: extraction.historico_completo || extraction.analise_completa, // Fallback para texto livre
                original_filename: file_info?.name,
                original_size_bytes: file_info?.size,
                original_mime_type: file_info?.type,
                file_hash: file_info?.hash || null, // CRITICAL: Save file hash for duplicate detection
                extraction_time_ms: stats?.processing_time_ms,
                extraction_cost_usd: stats?.cost_usd,
                extraction_tokens_input: stats?.tokens_input,
                extraction_tokens_output: stats?.tokens_output,
                status: 'extracted',
                metadata: {
                    warnings: extraction.warnings || [],
                    insights: extraction.insights || []
                }
            })
            .select('id')
            .single();

        if (docError) {
            console.error('Error creating document:', docError);
            return NextResponse.json(
                { error: 'Erro ao criar documento', details: docError.message },
                { status: 500 }
            );
        }

        const documentId = doc.id;
        const createdEntities: string[] = [];
        const linkedEntities: string[] = []; // Entidades que já existiam
        const createdRelationships: string[] = [];
        const crossCaseAlerts: Array<{ entity: string; matchReason: string; existingInvestigation: string }> = [];

        // 2. Criar entidades na operação e na tabela de staging
        console.log(`[SAVE] Document ${documentId}: Entities received:`, extraction.entities?.length || 0);
        
        if (extraction.entities && extraction.entities.length > 0) {
            console.log(`[SAVE] Processing ${extraction.entities.length} entities`);
            for (const entity of extraction.entities) {
                console.log(`[SAVE] Entity: ${entity.type} - ${entity.name}`);
                // VERIFICAR DUPLICADOS antes de criar
                const duplicate = await checkForDuplicate(supabase, entity, investigation_id);
                
                let entityId: string;
                let wasCreated = false;
                
                if (duplicate.found && duplicate.sameInvestigation) {
                    // MESMA operação: usar entidade existente + AUTO-MERGE metadados
                    entityId = duplicate.existingEntity!.id;
                    linkedEntities.push(entityId);
                    
                    // AUTO-MERGE: Combinar metadados usando a nova lógica
                    if (entity.metadata && Object.keys(entity.metadata).length > 0) {
                        const { data: existingEntity } = await supabase
                            .from('intelink_entities')
                            .select('name, metadata')
                            .eq('id', entityId)
                            .single();
                        
                        if (existingEntity) {
                            const existingMeta = existingEntity.metadata || {};
                            const newMeta = entity.metadata || {};
                            
                            // Usar a nova função de merge inteligente
                            const { merged: mergedMeta, fieldsUpdated } = mergeMetadata(
                                existingMeta as Record<string, unknown>,
                                newMeta as Record<string, unknown>,
                                DEFAULT_AUTO_MERGE_CONFIG
                            );
                            
                            // Adicionar tracking adicional
                            mergedMeta._last_enriched_at = new Date().toISOString();
                            mergedMeta._enriched_from_doc = documentId;
                            mergedMeta._merge_reason = duplicate.matchReason || 'Auto-merge';
                            
                            // Calcular similaridade de nome para registro
                            const nameSimilarity = calculateNameSimilarity(
                                existingEntity.name || '', 
                                entity.name
                            );
                            mergedMeta._name_similarity = nameSimilarity;
                            
                            // Atualizar entidade com metadados mergeados
                            await supabase
                                .from('intelink_entities')
                                .update({ metadata: mergedMeta })
                                .eq('id', entityId);
                            
                            // Registrar merge na tabela de histórico/notificações
                            await supabase
                                .from('intelink_merge_pending')
                                .insert({
                                    target_entity_id: entityId,
                                    source_entity_id: null, // Same entity enriched
                                    investigation_id,
                                    merge_type: 'auto',
                                    match_reason: duplicate.matchReason || 'Auto-merge',
                                    similarity_score: nameSimilarity,
                                    cpf_match: duplicate.matchType === 'cpf',
                                    fields_to_update: fieldsUpdated,
                                    metadata_preview: mergedMeta,
                                    status: 'auto_applied',
                                    required_votes: 0,
                                    current_votes: 0
                                });
                            
                            console.log(`[Auto-Merge] Enriched ${entity.name} (merge #${mergedMeta._merge_count}, ${fieldsUpdated.length} fields updated, ${Math.round(nameSimilarity * 100)}% name similarity)`);
                        }
                    }
                    
                    console.log(`[Duplicate] Linked to existing: ${entity.name} (${duplicate.matchReason})`);
                } else {
                    // Criar nova entidade com rastreamento de origem
                    const { data: newEntity, error: entityError } = await supabase
                        .from('intelink_entities')
                        .insert({
                            investigation_id,
                            type: entity.type,
                            name: entity.name,
                            metadata: {
                                role: entity.role,
                                ...entity.metadata
                            },
                            // Source tracking: de onde veio essa entidade
                            source_type: 'extraction',
                            source_document_id: documentId,
                            source_context: (entity as any).source_context || null,
                        })
                        .select('id')
                        .single();

                    if (entityError || !newEntity) {
                        console.error('Error creating entity:', entityError);
                        continue;
                    }
                    
                    entityId = newEntity.id;
                    createdEntities.push(entityId);
                    wasCreated = true;
                    
                    // CROSS-CASE: Se duplicado em OUTRA operação, criar alerta
                    if (duplicate.found && !duplicate.sameInvestigation) {
                        await createCrossCaseAlert(
                            supabase,
                            entityId,
                            duplicate.existingEntity!.id,
                            duplicate.matchType!,
                            duplicate.matchReason!,
                            investigation_id,
                            duplicate.existingEntity!.investigation_id
                        );
                        crossCaseAlerts.push({
                            entity: entity.name,
                            matchReason: duplicate.matchReason!,
                            existingInvestigation: duplicate.existingEntity!.investigation_id
                        });
                        console.log(`[Cross-Case Alert] ${entity.name}: ${duplicate.matchReason}`);
                    }
                }

                // Registrar na tabela de staging (para auditoria)
                await supabase
                    .from('intelink_document_entities')
                    .insert({
                        document_id: documentId,
                        entity_id: entityId,
                        entity_type: entity.type,
                        name: entity.name,
                        role: entity.role,
                        confidence: entity.confidence || 1.0,
                        metadata: entity.metadata || {},
                        status: wasCreated ? 'approved' : 'merged'
                    });
            }
        }

        // 3. Criar relacionamentos
        if (extraction.relationships && extraction.relationships.length > 0) {
            // Buscar entidades criadas para mapear nomes para IDs
            const { data: entities } = await supabase
                .from('intelink_entities')
                .select('id, name')
                .eq('investigation_id', investigation_id);

            const entityMap = new Map(entities?.map(e => [e.name.toLowerCase(), e.id]) || []);

            for (const rel of extraction.relationships) {
                const sourceId = entityMap.get(rel.source.toLowerCase());
                const targetId = entityMap.get(rel.target.toLowerCase());

                if (sourceId && targetId) {
                    const { data: newRel, error: relError } = await supabase
                        .from('intelink_relationships')
                        .insert({
                            investigation_id,
                            source_id: sourceId,
                            target_id: targetId,
                            type: rel.type,
                            description: rel.description,
                            metadata: {
                                confidence: rel.confidence || 0.8,
                                status: rel.status || 'confirmado'
                            }
                        })
                        .select('id')
                        .single();

                    if (!relError && newRel) {
                        createdRelationships.push(newRel.id);

                        // Registrar na tabela de staging
                        await supabase
                            .from('intelink_document_relationships')
                            .insert({
                                document_id: documentId,
                                relationship_id: newRel.id,
                                source_entity_name: rel.source,
                                target_entity_name: rel.target,
                                relationship_type: rel.type,
                                description: rel.description,
                                confidence: rel.confidence || 0.8,
                                relationship_status: rel.status || 'confirmado',
                                status: 'approved'
                            });
                    }
                }
            }
        }

        // 3.5 CROSS-OCCURRENCE: Criar vínculos automáticos entre entidades do mesmo documento
        const allEntityIds = [...new Set([...createdEntities, ...linkedEntities])];
        if (allEntityIds.length >= 2) {
            console.log(`[Cross-Occurrence] Creating automatic links between ${allEntityIds.length} entities from same document`);
            
            // Criar relacionamento APPEARED_TOGETHER para cada par de entidades
            for (let i = 0; i < allEntityIds.length; i++) {
                for (let j = i + 1; j < allEntityIds.length; j++) {
                    const sourceId = allEntityIds[i];
                    const targetId = allEntityIds[j];
                    
                    // Verificar se já existe relacionamento entre eles
                    const { data: existingRel } = await supabase
                        .from('intelink_relationships')
                        .select('id')
                        .eq('investigation_id', investigation_id)
                        .or(`and(source_id.eq.${sourceId},target_id.eq.${targetId}),and(source_id.eq.${targetId},target_id.eq.${sourceId})`)
                        .limit(1);
                    
                    if (!existingRel || existingRel.length === 0) {
                        // Criar relacionamento de co-ocorrência
                        const { data: newRel } = await supabase
                            .from('intelink_relationships')
                            .insert({
                                investigation_id,
                                source_id: sourceId,
                                target_id: targetId,
                                type: 'APPEARED_TOGETHER',
                                description: `Mencionados no mesmo documento: ${file_info?.name || extraction.numero_ocorrencia || 'documento'}`
                            })
                            .select('id')
                            .single();
                        
                        if (newRel) {
                            createdRelationships.push(newRel.id);
                        }
                    }
                }
            }
        }

        // 4. Criar evidências na tabela principal E na tabela de staging
        const createdEvidences: string[] = [];
        if (extraction.evidences && extraction.evidences.length > 0) {
            for (const ev of extraction.evidences) {
                // Normalizar tipo para português
                const evidenceType = EVIDENCE_TYPE_MAP[ev.type] || ev.type.toLowerCase();
                
                // Criar na tabela principal de evidências
                const { data: newEvidence, error: evError } = await supabase
                    .from('intelink_evidence')
                    .insert({
                        investigation_id,
                        type: evidenceType,
                        description: ev.description,
                        metadata: {
                            quantity: ev.quantity,
                            original_type: ev.type,
                            ...ev.details
                        }
                    })
                    .select('id')
                    .single();

                if (!evError && newEvidence) {
                    createdEvidences.push(newEvidence.id);

                    // Registrar na tabela de staging (para auditoria)
                    await supabase
                        .from('intelink_document_evidences')
                        .insert({
                            document_id: documentId,
                            evidence_id: newEvidence.id,
                            evidence_type: evidenceType,
                            description: ev.description,
                            quantity: ev.quantity,
                            details: ev.details || {},
                            status: 'approved'
                        });
                }
            }
        }

        // 5. Registrar o próprio documento como evidência tipo DOCUMENT
        if (file_info?.name) {
            const { data: docEvidence } = await supabase
                .from('intelink_evidence')
                .insert({
                    investigation_id,
                    type: 'documento',
                    description: `Documento processado: ${file_info.name}`,
                    metadata: {
                        filename: file_info.name,
                        size_bytes: file_info.size,
                        mime_type: file_info.type,
                        document_id: documentId,
                        document_type,
                        file_hash: file_info.hash
                    }
                })
                .select('id')
                .single();

            if (docEvidence) {
                createdEvidences.push(docEvidence.id);
            }
        }

        // 6. Salvar insights como investigator_findings
        const createdFindings: string[] = [];
        
        // 6a. Processar insights genéricos
        if (extraction.insights && extraction.insights.length > 0) {
            for (const insight of extraction.insights) {
                const findingType = classifyFinding(insight);
                const { data: finding } = await supabase
                    .from('investigator_findings')
                    .insert({
                        investigation_id,
                        finding_type: findingType,
                        title: insight.substring(0, 100),
                        description: insight,
                        confidence_level: 0.7,
                        source_document_id: documentId,
                        metadata: { source: 'extraction_insight' }
                    })
                    .select('id')
                    .single();

                if (finding) {
                    createdFindings.push(finding.id);
                }
            }
        }

        // 6b. Processar hipóteses de CS
        if (extraction.hipoteses && extraction.hipoteses.length > 0) {
            for (const hipotese of extraction.hipoteses) {
                const { data: finding } = await supabase
                    .from('investigator_findings')
                    .insert({
                        investigation_id,
                        finding_type: 'connection_hypothesis',
                        title: hipotese.descricao.substring(0, 100),
                        description: hipotese.descricao,
                        confidence_level: hipotese.confidence || 0.6,
                        source_document_id: documentId,
                        metadata: { 
                            source: 'cs_hypothesis',
                            base: hipotese.base
                        }
                    })
                    .select('id')
                    .single();

                if (finding) {
                    createdFindings.push(finding.id);
                }
            }
        }

        // 6c. Processar análises técnicas
        if (extraction.analises_tecnicas && extraction.analises_tecnicas.length > 0) {
            for (const analise of extraction.analises_tecnicas) {
                const { data: finding } = await supabase
                    .from('investigator_findings')
                    .insert({
                        investigation_id,
                        finding_type: 'technical_analysis',
                        title: `${analise.tipo}: ${analise.descricao.substring(0, 80)}`,
                        description: analise.resultados || analise.descricao,
                        confidence_level: 0.85,
                        source_document_id: documentId,
                        metadata: { 
                            source: 'cs_technical_analysis',
                            analysis_type: analise.tipo
                        }
                    })
                    .select('id')
                    .single();

                if (finding) {
                    createdFindings.push(finding.id);
                }
            }
        }

        // 7. Atualizar status do documento
        await supabase
            .from('intelink_documents')
            .update({ status: 'approved' })
            .eq('id', documentId);

        // 8. Gerar embeddings para cross-investigation intelligence (async, não bloqueia)
        let embeddingResult = null;
        if (extraction.historico_completo || extraction.summary) {
            const contentForEmbedding = extraction.historico_completo || extraction.summary || '';
            if (contentForEmbedding.length > 100) {
                try {
                    // Fire-and-forget para não atrasar a resposta
                    fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/api/documents/embeddings`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            document_id: documentId,
                            investigation_id,
                            content: contentForEmbedding.slice(0, 8000),
                            find_similar: true
                        })
                    }).then(async (res) => {
                        if (res.ok) {
                            const data = await res.json();
                            console.log(`Embeddings generated for document ${documentId}:`, 
                                data.connections_found ? `${data.connections_found} connections found` : 'no connections');
                        }
                    }).catch(err => console.error('Embedding generation failed:', err));
                    
                    embeddingResult = { status: 'processing' };
                } catch (embErr) {
                    console.error('Error triggering embedding generation:', embErr);
                }
            }
        }

        return NextResponse.json({
            success: true,
            document_id: documentId,
            created: {
                entities: createdEntities.length,
                linked_entities: linkedEntities.length,
                relationships: createdRelationships.length,
                evidences: createdEvidences.length,
                findings: createdFindings.length
            },
            cross_case_alerts: crossCaseAlerts.length > 0 ? crossCaseAlerts : undefined,
            warnings: crossCaseAlerts.length > 0 
                ? [`⚠️ ${crossCaseAlerts.length} entidade(s) encontrada(s) em outras operações!`]
                : undefined
        });

    } catch (error) {
        console.error('Save document error:', error);
        return NextResponse.json(
            { error: 'Erro ao salvar documento', details: String(error) },
            { status: 500 }
        );
    }
}

// Protected: Only member+ can save documents
export const POST = withSecurity(handlePost, { requiredRole: 'member' });
