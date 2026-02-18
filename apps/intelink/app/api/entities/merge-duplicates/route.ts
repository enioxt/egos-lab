/**
 * POST /api/entities/merge-duplicates
 * 
 * Merge duplicatas de entidades retroativamente.
 * Identifica entidades com mesmo nome+tipo na mesma investigação
 * e faz merge mantendo a mais antiga com metadados combinados.
 * 
 * Body:
 * - investigation_id?: string (opcional - se não informado, processa todas)
 * - dry_run?: boolean (default: true) - se true, apenas lista o que seria merged
 * 
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, successResponse, errorResponse } from '@/lib/api-utils';
import { withSecurity, AuthContext } from '@/lib/api-security';

interface DuplicateGroup {
    name: string;
    type: string;
    investigation_id: string;
    entities: Array<{
        id: string;
        metadata: Record<string, any>;
        created_at: string;
        source_document_id: string | null;
    }>;
}

async function handlePost(req: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        const supabase = getSupabaseAdmin();
        const body = await req.json();
        
        const { investigation_id, dry_run = true } = body;
        
        // 1. Encontrar duplicatas
        let query = supabase
            .from('intelink_entities')
            .select('id, name, type, investigation_id, metadata, created_at, source_document_id')
            .is('deleted_at', null)
            .order('created_at', { ascending: true });
        
        if (investigation_id) {
            query = query.eq('investigation_id', investigation_id);
        }
        
        const { data: entities, error: fetchError } = await query;
        
        if (fetchError || !entities) {
            return errorResponse('Erro ao buscar entidades', 500);
        }
        
        // 2. Agrupar por nome+tipo+investigation normalizado
        const groups: Map<string, DuplicateGroup> = new Map();
        
        for (const entity of entities) {
            const key = `${entity.investigation_id}::${entity.type}::${entity.name.toUpperCase().trim()}`;
            
            if (!groups.has(key)) {
                groups.set(key, {
                    name: entity.name,
                    type: entity.type,
                    investigation_id: entity.investigation_id,
                    entities: []
                });
            }
            
            groups.get(key)!.entities.push({
                id: entity.id,
                metadata: entity.metadata || {},
                created_at: entity.created_at,
                source_document_id: entity.source_document_id
            });
        }
        
        // 3. Filtrar apenas grupos com duplicatas (2+ entidades)
        const duplicateGroups = Array.from(groups.values()).filter(g => g.entities.length > 1);
        
        if (duplicateGroups.length === 0) {
            return successResponse({
                success: true,
                message: 'Nenhuma duplicata encontrada',
                dry_run,
                duplicates_found: 0,
                merges_performed: 0
            });
        }
        
        let mergesPerformed = 0;
        const mergeResults: Array<{
            name: string;
            type: string;
            kept_id: string;
            merged_ids: string[];
            relationships_transferred: number;
        }> = [];
        
        // 4. Processar cada grupo de duplicatas
        for (const group of duplicateGroups) {
            // Ordenar: mais antiga primeiro, mas preferir a que tem mais metadados
            const sorted = group.entities.sort((a, b) => {
                const aMetaCount = Object.keys(a.metadata).filter(k => !k.startsWith('_')).length;
                const bMetaCount = Object.keys(b.metadata).filter(k => !k.startsWith('_')).length;
                
                // Se um tem significativamente mais metadados, prefere ele
                if (Math.abs(aMetaCount - bMetaCount) > 2) {
                    return bMetaCount - aMetaCount;
                }
                
                // Senão, prefere o mais antigo
                return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            });
            
            const keepEntity = sorted[0];
            const mergeEntities = sorted.slice(1);
            
            if (!dry_run) {
                // 4a. Combinar metadados (não sobrescrever existentes)
                let combinedMetadata = { ...keepEntity.metadata };
                for (const ent of mergeEntities) {
                    for (const [key, value] of Object.entries(ent.metadata)) {
                        if (!combinedMetadata[key] && value) {
                            combinedMetadata[key] = value;
                        }
                    }
                }
                
                // Marcar como auto-merged
                combinedMetadata._auto_merged = true;
                combinedMetadata._merge_count = (combinedMetadata._merge_count || 0) + mergeEntities.length;
                combinedMetadata._merged_ids = [...(combinedMetadata._merged_ids || []), ...mergeEntities.map(e => e.id)];
                combinedMetadata._last_merge_at = new Date().toISOString();
                
                // 4b. Atualizar entidade mantida
                await supabase
                    .from('intelink_entities')
                    .update({ metadata: combinedMetadata })
                    .eq('id', keepEntity.id);
                
                // 4c. Transferir relacionamentos
                let relTransferred = 0;
                for (const ent of mergeEntities) {
                    // Update source_id
                    const { data: srcRels } = await supabase
                        .from('intelink_relationships')
                        .update({ source_id: keepEntity.id })
                        .eq('source_id', ent.id)
                        .select('id');
                    
                    // Update target_id
                    const { data: tgtRels } = await supabase
                        .from('intelink_relationships')
                        .update({ target_id: keepEntity.id })
                        .eq('target_id', ent.id)
                        .select('id');
                    
                    relTransferred += (srcRels?.length || 0) + (tgtRels?.length || 0);
                }
                
                // 4d. Soft-delete duplicatas
                const mergeIds = mergeEntities.map(e => e.id);
                await supabase
                    .from('intelink_entities')
                    .update({ 
                        deleted_at: new Date().toISOString(),
                        deleted_by: 'system:auto-merge',
                        delete_reason: `Merged into ${keepEntity.id}`
                    })
                    .in('id', mergeIds);
                
                mergeResults.push({
                    name: group.name,
                    type: group.type,
                    kept_id: keepEntity.id,
                    merged_ids: mergeIds,
                    relationships_transferred: relTransferred
                });
                
                mergesPerformed++;
            } else {
                // Dry run - apenas registrar
                mergeResults.push({
                    name: group.name,
                    type: group.type,
                    kept_id: keepEntity.id,
                    merged_ids: mergeEntities.map(e => e.id),
                    relationships_transferred: 0
                });
            }
        }
        
        return successResponse({
            success: true,
            dry_run,
            investigation_id: investigation_id || 'all',
            duplicates_found: duplicateGroups.length,
            total_entities_to_merge: duplicateGroups.reduce((sum, g) => sum + g.entities.length - 1, 0),
            merges_performed: dry_run ? 0 : mergesPerformed,
            results: mergeResults.slice(0, 50) // Limitar output
        });
        
    } catch (err: any) {
        console.error('[Merge Duplicates] Error:', err);
        return errorResponse(err.message || 'Erro interno', 500);
    }
}

export const POST = withSecurity(handlePost, { requiredRole: 'admin' });
