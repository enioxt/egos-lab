/**
 * POST /api/entities/generate-relationships
 * 
 * Gera relacionamentos APPEARED_TOGETHER retroativamente
 * para entidades que vieram do mesmo documento.
 * 
 * Body:
 * - investigation_id: string (obrigatório)
 * - dry_run?: boolean (default: false) - se true, apenas conta quantos seriam criados
 * 
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, successResponse, errorResponse } from '@/lib/api-utils';
import { withSecurity, AuthContext } from '@/lib/api-security';

async function handlePost(req: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        const supabase = getSupabaseAdmin();
        const body = await req.json();
        
        const { investigation_id, dry_run = false } = body;
        
        if (!investigation_id) {
            return errorResponse('investigation_id é obrigatório', 400);
        }
        
        // 1. Buscar todos os documentos da investigação com suas entidades
        const { data: documents, error: docError } = await supabase
            .from('intelink_documents')
            .select('id, title')
            .eq('investigation_id', investigation_id)
            .is('deleted_at', null);
        
        if (docError || !documents) {
            return errorResponse('Erro ao buscar documentos', 500);
        }
        
        let totalCreated = 0;
        let totalSkipped = 0;
        const relationshipsCreated: Array<{ doc: string; source: string; target: string }> = [];
        
        // 2. Para cada documento, buscar entidades e criar relacionamentos
        for (const doc of documents) {
            // Buscar entidades deste documento
            const { data: entities } = await supabase
                .from('intelink_entities')
                .select('id, name, type')
                .eq('source_document_id', doc.id);
            
            if (!entities || entities.length < 2) continue;
            
            // Criar relacionamentos entre pares de entidades
            for (let i = 0; i < entities.length; i++) {
                for (let j = i + 1; j < entities.length; j++) {
                    const sourceId = entities[i].id;
                    const targetId = entities[j].id;
                    
                    // Verificar se já existe
                    const { data: existing } = await supabase
                        .from('intelink_relationships')
                        .select('id')
                        .eq('investigation_id', investigation_id)
                        .or(`and(source_id.eq.${sourceId},target_id.eq.${targetId}),and(source_id.eq.${targetId},target_id.eq.${sourceId})`)
                        .limit(1);
                    
                    if (existing && existing.length > 0) {
                        totalSkipped++;
                        continue;
                    }
                    
                    if (!dry_run) {
                        // Criar relacionamento (schema: id, investigation_id, source_id, target_id, type, description)
                        const { error: relError } = await supabase
                            .from('intelink_relationships')
                            .insert({
                                investigation_id,
                                source_id: sourceId,
                                target_id: targetId,
                                type: 'APPEARED_TOGETHER',
                                description: `Mencionados no mesmo documento: ${doc.title}`
                            });
                        
                        if (!relError) {
                            totalCreated++;
                            relationshipsCreated.push({
                                doc: doc.title,
                                source: entities[i].name,
                                target: entities[j].name
                            });
                        }
                    } else {
                        totalCreated++;
                        relationshipsCreated.push({
                            doc: doc.title,
                            source: entities[i].name,
                            target: entities[j].name
                        });
                    }
                }
            }
        }
        
        return successResponse({
            success: true,
            dry_run,
            investigation_id,
            documents_processed: documents.length,
            relationships_created: totalCreated,
            relationships_skipped: totalSkipped,
            sample: relationshipsCreated.slice(0, 20) // Mostrar até 20 exemplos
        });
        
    } catch (err: any) {
        console.error('[Generate Relationships] Error:', err);
        return errorResponse(err.message || 'Erro interno', 500);
    }
}

export const POST = withSecurity(handlePost, { requiredRole: 'admin' });
