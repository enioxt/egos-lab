import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = 'force-dynamic';

/**
 * Remove acentos de uma string para busca mais flexível
 * Ex: "José" -> "jose", "João" -> "joao"
 */
function removeAccents(str: string): string {
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
}

/**
 * Remove caracteres não numéricos (para CPF, telefone, placa)
 */
function onlyNumbers(str: string): string {
    return str.replace(/\D/g, '');
}

interface SearchResult {
    id: string;
    type: 'operation' | 'person' | 'vehicle' | 'location' | 'organization';
    title: string;
    subtitle?: string;
    href: string;
    // Quantum Search additions
    connections?: number; // Number of direct connections
    crossCase?: boolean; // Appears in other investigations
    relatedEntities?: {
        id: string;
        name: string;
        type: string;
        relationship: string;
    }[];
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const rawQuery = searchParams.get('q')?.trim() || '';
        
        if (rawQuery.length < 2) {
            return NextResponse.json({ results: [] });
        }

        // Normalizar query removendo acentos
        const query = removeAccents(rawQuery);
        const numbersOnly = onlyNumbers(rawQuery);
        
        const results: SearchResult[] = [];

        // 1. Search Operations (investigations) - busca por título (com e sem acento)
        const { data: operations } = await supabase
            .from('intelink_investigations')
            .select('id, title, status')
            .or(`title.ilike.%${query}%,title.ilike.%${rawQuery}%`)
            .is('deleted_at', null)
            .limit(5);

        if (operations) {
            operations.forEach(op => {
                results.push({
                    id: op.id,
                    type: 'operation',
                    title: op.title,
                    subtitle: op.status === 'active' ? 'Ativa' : 'Arquivada',
                    href: `/investigation/${op.id}`
                });
            });
        }

        // 2. Search Entities - busca por nome (com e sem acento) + CPF + Placa
        // Construir query OR com múltiplos padrões
        let entityQuery = `name.ilike.%${query}%,name.ilike.%${rawQuery}%`;
        
        // Se parece um CPF (11+ dígitos), buscar também por CPF
        if (numbersOnly.length >= 6) {
            entityQuery += `,metadata->>cpf.ilike.%${numbersOnly}%`;
            entityQuery += `,metadata->>placa.ilike.%${rawQuery.toUpperCase()}%`;
            entityQuery += `,metadata->>telefone.ilike.%${numbersOnly}%`;
        }
        
        const { data: entities } = await supabase
            .from('intelink_entities')
            .select('id, name, type, investigation_id, metadata')
            .or(entityQuery)
            .limit(10);

        if (entities) {
            // ═══════════════════════════════════════════════════════
            // QUANTUM SEARCH: Get relationships for found entities
            // ═══════════════════════════════════════════════════════
            const entityIds = entities.map(e => e.id);
            
            // Get relationships where entities are source OR target
            const { data: relationships } = await supabase
                .from('intelink_relationships')
                .select('id, source_id, target_id, type')
                .or(`source_id.in.(${entityIds.join(',')}),target_id.in.(${entityIds.join(',')})`)
                .limit(100);
            
            // Build connection count map
            const connectionCount: Record<string, number> = {};
            const relatedEntityIds = new Set<string>();
            
            relationships?.forEach(rel => {
                connectionCount[rel.source_id] = (connectionCount[rel.source_id] || 0) + 1;
                connectionCount[rel.target_id] = (connectionCount[rel.target_id] || 0) + 1;
                
                // Collect related entity IDs for cross-reference
                if (entityIds.includes(rel.source_id)) {
                    relatedEntityIds.add(rel.target_id);
                } else {
                    relatedEntityIds.add(rel.source_id);
                }
            });
            
            // Get related entity details
            const relatedIdsArray = Array.from(relatedEntityIds).filter(id => !entityIds.includes(id));
            let relatedEntitiesMap: Record<string, any> = {};
            
            if (relatedIdsArray.length > 0) {
                const { data: relatedEntities } = await supabase
                    .from('intelink_entities')
                    .select('id, name, type, investigation_id')
                    .in('id', relatedIdsArray.slice(0, 50)); // Limit to 50
                
                relatedEntities?.forEach(e => {
                    relatedEntitiesMap[e.id] = e;
                });
            }
            
            // Check for cross-case entities (same CPF/name in other investigations)
            const crossCaseIds = new Set<string>();
            const personEntities = entities.filter(e => e.type === 'PERSON' && e.metadata?.cpf);
            
            if (personEntities.length > 0) {
                const cpfs = personEntities.map(e => e.metadata.cpf).filter(Boolean);
                if (cpfs.length > 0) {
                    const { data: crossCaseEntities } = await supabase
                        .from('intelink_entities')
                        .select('id, investigation_id, metadata')
                        .in('metadata->>cpf', cpfs);
                    
                    crossCaseEntities?.forEach(e => {
                        const original = personEntities.find(p => p.metadata?.cpf === e.metadata?.cpf);
                        if (original && e.investigation_id !== original.investigation_id) {
                            crossCaseIds.add(original.id);
                        }
                    });
                }
            }
            // ═══════════════════════════════════════════════════════
            
            const typeMap: Record<string, SearchResult['type']> = {
                'PERSON': 'person',
                'VEHICLE': 'vehicle',
                'LOCATION': 'location',
                'ORGANIZATION': 'organization'
            };
            
            const typeLabels: Record<string, string> = {
                'PERSON': 'Pessoa',
                'VEHICLE': 'Veículo',
                'LOCATION': 'Local',
                'ORGANIZATION': 'Organização'
            };
            
            entities.forEach(entity => {
                // ═══════════════════════════════════════════════════════
                // HIERARCHICAL IDENTIFICATION DATA (for disambiguation)
                // Priority: CPF > RG+UF > Nome da Mãe > Data Nascimento
                // ═══════════════════════════════════════════════════════
                const meta = entity.metadata || {};
                const identifiers: string[] = [];
                
                // 1. CPF (highest certainty)
                if (meta.cpf) {
                    identifiers.push(`CPF: ${meta.cpf}`);
                }
                
                // 2. RG + UF
                if (meta.rg) {
                    const rgDisplay = meta.uf ? `RG: ${meta.rg}/${meta.uf}` : `RG: ${meta.rg}`;
                    identifiers.push(rgDisplay);
                }
                
                // 3. Nome da Mãe (filiation)
                if (meta.nome_mae || meta.mae || meta.filiacao_mae) {
                    const mae = meta.nome_mae || meta.mae || meta.filiacao_mae;
                    identifiers.push(`Mãe: ${mae}`);
                }
                
                // 4. Data de Nascimento
                if (meta.data_nascimento || meta.nascimento || meta.dn) {
                    const dn = meta.data_nascimento || meta.nascimento || meta.dn;
                    identifiers.push(`DN: ${dn}`);
                }
                
                // 5. Placa (for vehicles)
                if (meta.placa) {
                    identifiers.push(`Placa: ${meta.placa}`);
                }
                
                // 6. Telefone
                if (meta.telefone) {
                    identifiers.push(`Tel: ${meta.telefone}`);
                }
                
                // Build subtitle: Type label + identifiers (max 2 for space)
                let subtitle = typeLabels[entity.type] || entity.type;
                if (identifiers.length > 0) {
                    subtitle = identifiers.slice(0, 2).join(' • ');
                }
                
                // Add connection info to subtitle
                const conns = connectionCount[entity.id] || 0;
                if (conns > 0) {
                    subtitle += ` • ${conns} vínculos`;
                }
                
                // Get related entities for this entity
                const entityRelated: SearchResult['relatedEntities'] = [];
                relationships?.forEach(rel => {
                    let relatedId: string | null = null;
                    if (rel.source_id === entity.id) relatedId = rel.target_id;
                    if (rel.target_id === entity.id) relatedId = rel.source_id;
                    
                    if (relatedId && relatedEntitiesMap[relatedId]) {
                        const related = relatedEntitiesMap[relatedId];
                        entityRelated.push({
                            id: related.id,
                            name: related.name,
                            type: related.type,
                            relationship: rel.type
                        });
                    }
                });

                results.push({
                    id: entity.id,
                    type: typeMap[entity.type] || 'person',
                    title: entity.name,
                    subtitle,
                    href: `/investigation/${entity.investigation_id}?entity=${entity.id}`,
                    // Quantum Search fields
                    connections: conns,
                    crossCase: crossCaseIds.has(entity.id),
                    relatedEntities: entityRelated.slice(0, 5) // Max 5 related
                });
            });
        }

        // 3. Search Members
        const { data: members } = await supabase
            .from('intelink_members')
            .select('id, name, role')
            .or(`name.ilike.%${query}%`)
            .limit(5);

        if (members) {
            members.forEach(member => {
                results.push({
                    id: member.id,
                    type: 'person',
                    title: member.name,
                    subtitle: `Membro: ${member.role || 'Agente'}`,
                    href: `/central/membros?id=${member.id}`
                });
            });
        }

        // ═══════════════════════════════════════════════════════
        // QUANTUM SEARCH: Dedupe entities by name (keep highest connections)
        // This prevents showing 10 "JOAO MATHEUS CORREA" entries
        // ═══════════════════════════════════════════════════════
        const seenEntityNames = new Map<string, { index: number; connections: number }>();
        const deduplicatedResults = results.filter((r, idx) => {
            // Operations and members are not deduplicated
            if (r.type === 'operation' || r.href.includes('/membros')) return true;
            
            const key = r.title.toLowerCase().trim();
            const existing = seenEntityNames.get(key);
            const conns = r.connections || 0;
            
            if (!existing) {
                seenEntityNames.set(key, { index: idx, connections: conns });
                return true;
            }
            
            // Keep this one if it has more connections
            if (conns > existing.connections) {
                // Remove the previous one (mark it)
                results[existing.index] = { ...results[existing.index], _remove: true } as any;
                seenEntityNames.set(key, { index: idx, connections: conns });
                return true;
            }
            
            return false;
        }).filter(r => !(r as any)._remove);
        
        // ═══════════════════════════════════════════════════════
        // QUANTUM SEARCH: Sort results by relevance
        // Priority: cross-case > connections > type (operations first)
        // ═══════════════════════════════════════════════════════
        const sortedResults = deduplicatedResults.sort((a, b) => {
            // Cross-case results first (highest priority)
            if (a.crossCase && !b.crossCase) return -1;
            if (!a.crossCase && b.crossCase) return 1;
            
            // Then by connection count
            const aConns = a.connections || 0;
            const bConns = b.connections || 0;
            if (aConns !== bConns) return bConns - aConns;
            
            // Then operations before entities
            if (a.type === 'operation' && b.type !== 'operation') return -1;
            if (a.type !== 'operation' && b.type === 'operation') return 1;
            
            // Then people before vehicles/locations
            if (a.type === 'person' && b.type !== 'person') return -1;
            if (a.type !== 'person' && b.type === 'person') return 1;
            
            return 0;
        });
        
        return NextResponse.json({ 
            results: sortedResults.slice(0, 15), // Max 15 results
            query,
            quantumEnabled: true // Flag to indicate enhanced search
        });

    } catch (error) {
        console.error('Search error:', error);
        return NextResponse.json({ error: 'Search failed' }, { status: 500 });
    }
}
