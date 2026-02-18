/**
 * POST /api/entities/cleanup-duplicates
 * 
 * Encontra e faz merge de entidades duplicadas DENTRO da mesma investigação.
 * 
 * Hierarquia de identificadores mestres:
 * - PERSON: CPF > RG > Nome + Mãe
 * - VEHICLE: Chassi > Placa > Renavam
 * - COMPANY: CNPJ > Nome
 * - PHONE: Número
 * 
 * A entidade com mais dados completos se torna a "mestre".
 * Relacionamentos são migrados para a entidade mestre.
 * 
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, successResponse, errorResponse } from '@/lib/api-utils';
import { withSecurity, AuthContext } from '@/lib/api-security';
import { calculateNameSimilarity, mergeMetadata, DEFAULT_AUTO_MERGE_CONFIG } from '@/lib/entity-resolution/auto-merge';

interface DuplicateGroup {
    masterId: string;
    masterName: string;
    duplicateIds: string[];
    mergeReason: string;
    totalConnections: number;
}

/**
 * Normalize name for comparison
 */
function normalizeNameForMatch(name: string): string {
    return name
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Calculate entity completeness score (more data = higher score)
 */
function calculateCompletenessScore(entity: any): number {
    let score = 0;
    const meta = entity.metadata || {};
    
    // Identificadores mestres (alto valor)
    if (meta.cpf && meta.cpf.length >= 11) score += 100;
    if (meta.cnpj && meta.cnpj.length >= 14) score += 100;
    if (meta.chassi) score += 100;
    if (meta.placa) score += 50;
    if (meta.rg) score += 50;
    if (meta.telefone) score += 30;
    
    // Dados complementares
    if (meta.mae || meta.nome_mae) score += 20;
    if (meta.pai || meta.nome_pai) score += 20;
    if (meta.endereco) score += 15;
    if (meta.data_nascimento) score += 15;
    if (meta.profissao || meta.ocupacao) score += 10;
    if (meta.vulgo) score += 5;
    if (meta.role) score += 5;
    
    // Penalizar dados inválidos
    if (meta.cpf === 'XXXX' || meta.cpf === '00000000000') score -= 100;
    if (meta.telefone === 'XXXX') score -= 30;
    
    return score;
}

async function handlePost(req: NextRequest, auth: AuthContext): Promise<NextResponse> {
    const supabase = getSupabaseAdmin();
    
    try {
        const body = await req.json();
        const { investigation_id, dry_run = true } = body;
        
        if (!investigation_id) {
            return errorResponse('investigation_id é obrigatório', 400);
        }
        
        console.log(`[Cleanup Duplicates] Starting for investigation ${investigation_id}, dry_run: ${dry_run}`);
        
        // 1. Buscar todas as entidades da investigação
        const { data: entities, error } = await supabase
            .from('intelink_entities')
            .select('id, name, type, metadata, created_at')
            .eq('investigation_id', investigation_id)
            .order('created_at', { ascending: true });
        
        if (error) {
            console.error('[Cleanup Duplicates] Query error:', error);
            return errorResponse('Erro ao buscar entidades', 500);
        }
        
        if (!entities || entities.length === 0) {
            return successResponse({ message: 'Nenhuma entidade encontrada', duplicateGroups: [], stats: {} });
        }
        
        // 2. Buscar contagem de relacionamentos para cada entidade
        const entityIds = entities.map(e => e.id);
        const { data: relationships } = await supabase
            .from('intelink_relationships')
            .select('id, source_id, target_id')
            .or(`source_id.in.(${entityIds.join(',')}),target_id.in.(${entityIds.join(',')})`);
        
        const connectionCount: Record<string, number> = {};
        relationships?.forEach(r => {
            connectionCount[r.source_id] = (connectionCount[r.source_id] || 0) + 1;
            connectionCount[r.target_id] = (connectionCount[r.target_id] || 0) + 1;
        });
        
        // 3. Agrupar entidades por nome normalizado + tipo
        const groups: Record<string, any[]> = {};
        
        entities.forEach(entity => {
            const normalizedName = normalizeNameForMatch(entity.name);
            const key = `${entity.type}:${normalizedName}`;
            
            if (!groups[key]) groups[key] = [];
            groups[key].push({
                ...entity,
                normalizedName,
                completenessScore: calculateCompletenessScore(entity),
                connections: connectionCount[entity.id] || 0
            });
        });
        
        // 4. Identificar grupos com duplicatas
        const duplicateGroups: DuplicateGroup[] = [];
        
        Object.entries(groups).forEach(([key, group]) => {
            if (group.length <= 1) return; // Sem duplicatas
            
            // Verificar se realmente são duplicatas (CPFs diferentes = pessoas diferentes)
            const cpfs = new Set<string>();
            group.forEach(e => {
                const cpf = e.metadata?.cpf?.replace(/\D/g, '');
                if (cpf && cpf.length >= 11 && !['00000000000', 'XXXX'].includes(cpf)) {
                    cpfs.add(cpf);
                }
            });
            
            // Se há múltiplos CPFs válidos diferentes, não são duplicatas
            if (cpfs.size > 1) {
                console.log(`[Cleanup] Skipping ${key}: ${cpfs.size} different CPFs found`);
                return;
            }
            
            // Ordenar: mais completo + mais conexões primeiro
            group.sort((a, b) => {
                // Primeiro por completeness
                if (b.completenessScore !== a.completenessScore) {
                    return b.completenessScore - a.completenessScore;
                }
                // Depois por conexões
                if (b.connections !== a.connections) {
                    return b.connections - a.connections;
                }
                // Depois por data (mais antigo primeiro = original)
                return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            });
            
            const master = group[0];
            const duplicates = group.slice(1);
            
            duplicateGroups.push({
                masterId: master.id,
                masterName: master.name,
                duplicateIds: duplicates.map(d => d.id),
                mergeReason: cpfs.size === 1 ? `CPF: ${[...cpfs][0]}` : `Nome: ${master.normalizedName}`,
                totalConnections: group.reduce((sum, e) => sum + e.connections, 0)
            });
        });
        
        console.log(`[Cleanup Duplicates] Found ${duplicateGroups.length} duplicate groups`);
        
        // 5. Se não for dry_run, fazer o merge
        let mergedCount = 0;
        let relationshipsRedirected = 0;
        
        if (!dry_run && duplicateGroups.length > 0) {
            for (const group of duplicateGroups) {
                // 5.1 Merge metadados de todas as duplicatas para o master
                const { data: masterEntity } = await supabase
                    .from('intelink_entities')
                    .select('metadata')
                    .eq('id', group.masterId)
                    .single();
                
                let mergedMeta = masterEntity?.metadata || {};
                
                for (const duplicateId of group.duplicateIds) {
                    const { data: dupEntity } = await supabase
                        .from('intelink_entities')
                        .select('metadata')
                        .eq('id', duplicateId)
                        .single();
                    
                    if (dupEntity?.metadata) {
                        const result = mergeMetadata(mergedMeta, dupEntity.metadata, DEFAULT_AUTO_MERGE_CONFIG);
                        mergedMeta = result.merged;
                    }
                }
                
                // Adicionar tracking
                mergedMeta._merged_from = group.duplicateIds;
                mergedMeta._merge_date = new Date().toISOString();
                mergedMeta._merge_reason = group.mergeReason;
                
                // 5.2 Atualizar master com metadados mesclados
                await supabase
                    .from('intelink_entities')
                    .update({ metadata: mergedMeta })
                    .eq('id', group.masterId);
                
                // 5.3 Redirecionar relacionamentos das duplicatas para o master
                for (const duplicateId of group.duplicateIds) {
                    // Redirecionar source_id
                    const { data: sourceRels } = await supabase
                        .from('intelink_relationships')
                        .update({ source_id: group.masterId })
                        .eq('source_id', duplicateId)
                        .select('id');
                    
                    // Redirecionar target_id
                    const { data: targetRels } = await supabase
                        .from('intelink_relationships')
                        .update({ target_id: group.masterId })
                        .eq('target_id', duplicateId)
                        .select('id');
                    
                    relationshipsRedirected += (sourceRels?.length || 0) + (targetRels?.length || 0);
                }
                
                // 5.4 Deletar entidades duplicadas
                await supabase
                    .from('intelink_entities')
                    .delete()
                    .in('id', group.duplicateIds);
                
                mergedCount += group.duplicateIds.length;
            }
            
            // 5.5 Remover relacionamentos duplicados (mesmo source+target)
            await supabase.rpc('cleanup_duplicate_relationships', { inv_id: investigation_id });
        }
        
        const stats = {
            totalEntities: entities.length,
            duplicateGroups: duplicateGroups.length,
            entitiesMerged: mergedCount,
            relationshipsRedirected,
            entitiesAfter: entities.length - mergedCount
        };
        
        console.log(`[Cleanup Duplicates] Complete:`, stats);
        
        return successResponse({
            message: dry_run 
                ? `Encontradas ${duplicateGroups.length} grupos de duplicatas. Execute com dry_run: false para aplicar.`
                : `Merge concluído: ${mergedCount} entidades mescladas, ${relationshipsRedirected} relacionamentos redirecionados.`,
            duplicateGroups,
            stats,
            dry_run
        });
        
    } catch (e) {
        console.error('[Cleanup Duplicates] Error:', e);
        return errorResponse('Erro ao processar duplicatas', 500);
    }
}

export const POST = withSecurity(handlePost);
