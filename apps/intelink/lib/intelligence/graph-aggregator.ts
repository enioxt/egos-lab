/**
 * GraphAggregatorService - Intelligence Lab
 * 
 * Recursively traverses the entity graph to build a complete "dossier"
 * of everything known about a target entity across all investigations.
 * 
 * @module intelligence/graph-aggregator
 * @version 1.0.0
 */

import { createClient } from '@supabase/supabase-js';

// ============================================
// TYPES
// ============================================

export interface EntityData {
    id: string;
    type: string;
    name: string;
    metadata: Record<string, unknown>;
    investigation_id: string;
    investigation_title?: string;
    created_at: string;
}

export interface InvestigationAppearance {
    investigation_id: string;
    investigation_title: string;
    entity_role?: string;
    status: string;
    date: string;
}

export interface RelationshipData {
    id: string;
    source_entity_id: string;
    source_name: string;
    source_type: string;
    target_entity_id: string;
    target_name: string;
    target_type: string;
    relationship_type: string;
    description?: string;
    investigation_id: string;
    investigation_title: string;
}

export interface EvidenceData {
    id: string;
    type: string;
    description: string;
    investigation_id: string;
    investigation_title: string;
    created_at: string;
}

export interface TimelineEvent {
    date: string;
    event: string;
    investigation_id: string;
    investigation_title: string;
}

export interface DossierResult {
    target: EntityData;
    cross_case_matches: EntityData[];
    appearances: InvestigationAppearance[];
    relationships: RelationshipData[];
    evidences: EvidenceData[];
    timeline: TimelineEvent[];
    stats: {
        total_investigations: number;
        total_relationships: number;
        total_evidences: number;
        cross_case_matches: number;
    };
}

export interface SearchResult {
    entities: EntityData[];
    total: number;
}

// ============================================
// SERVICE
// ============================================

export class GraphAggregatorService {
    private supabase;

    constructor() {
        this.supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
    }

    /**
     * Search for entities by name, CPF, phone, or plate
     */
    async searchEntities(query: string, limit: number = 10): Promise<SearchResult> {
        const normalizedQuery = this.normalizeQuery(query);
        const numbersOnly = query.replace(/\D/g, '');

        // Build search conditions
        let searchConditions = `name.ilike.%${normalizedQuery}%`;
        
        // If query has numbers, also search in metadata
        if (numbersOnly.length >= 6) {
            searchConditions += `,metadata->>cpf.ilike.%${numbersOnly}%`;
            searchConditions += `,metadata->>telefone.ilike.%${numbersOnly}%`;
            searchConditions += `,metadata->>phone.ilike.%${numbersOnly}%`;
        }
        
        // Search for plate format
        if (query.length >= 3) {
            searchConditions += `,metadata->>placa.ilike.%${query.toUpperCase()}%`;
            searchConditions += `,metadata->>plate.ilike.%${query.toUpperCase()}%`;
        }

        const { data: entities, error } = await this.supabase
            .from('intelink_entities')
            .select(`
                id, type, name, metadata, investigation_id, created_at,
                intelink_investigations!inner(title)
            `)
            .or(searchConditions)
            .is('deleted_at', null)
            .limit(limit);

        if (error) {
            console.error('Search error:', error);
            return { entities: [], total: 0 };
        }

        const mappedEntities: EntityData[] = (entities || []).map((e: any) => ({
            id: e.id,
            type: e.type,
            name: e.name,
            metadata: e.metadata || {},
            investigation_id: e.investigation_id,
            investigation_title: e.intelink_investigations?.title,
            created_at: e.created_at
        }));

        return { entities: mappedEntities, total: mappedEntities.length };
    }

    /**
     * Build complete dossier for an entity
     */
    async buildDossier(entityId: string): Promise<DossierResult | null> {
        // 1. Get the target entity
        const { data: entity, error: entityError } = await this.supabase
            .from('intelink_entities')
            .select(`
                id, type, name, metadata, investigation_id, created_at,
                intelink_investigations(title, status)
            `)
            .eq('id', entityId)
            .single();

        if (entityError || !entity) {
            console.error('Entity not found:', entityError);
            return null;
        }

        // Handle Supabase join result - can be object or array depending on relation type
        const investigations = entity.intelink_investigations as any;
        const investigationTitle = Array.isArray(investigations) 
            ? investigations[0]?.title 
            : investigations?.title;

        const target: EntityData = {
            id: entity.id,
            type: entity.type,
            name: entity.name,
            metadata: entity.metadata || {},
            investigation_id: entity.investigation_id,
            investigation_title: investigationTitle,
            created_at: entity.created_at
        };

        // 2. Find cross-case matches (same CPF/phone in other investigations)
        const crossCaseMatches = await this.findCrossCaseMatches(entity);

        // 3. Build appearances list (all investigations this entity appears in)
        const allEntityIds = [entityId, ...crossCaseMatches.map(e => e.id)];
        const appearances = await this.getAppearances(allEntityIds);

        // 4. Get all relationships (where entity is source OR target)
        const relationships = await this.getRelationships(allEntityIds);

        // 5. Get related evidences
        const evidences = await this.getRelatedEvidences(allEntityIds);

        // 6. Build timeline
        const timeline = await this.buildTimeline(allEntityIds);

        return {
            target,
            cross_case_matches: crossCaseMatches,
            appearances,
            relationships,
            evidences,
            timeline,
            stats: {
                total_investigations: appearances.length,
                total_relationships: relationships.length,
                total_evidences: evidences.length,
                cross_case_matches: crossCaseMatches.length
            }
        };
    }

    /**
     * Find same entity in other investigations (by CPF, phone, or exact name match)
     */
    private async findCrossCaseMatches(entity: any): Promise<EntityData[]> {
        const matches: EntityData[] = [];
        const metadata = entity.metadata || {};

        // Search by CPF
        if (metadata.cpf) {
            const { data: cpfMatches } = await this.supabase
                .from('intelink_entities')
                .select(`
                    id, type, name, metadata, investigation_id, created_at,
                    intelink_investigations(title)
                `)
                .neq('id', entity.id)
                .neq('investigation_id', entity.investigation_id)
                .contains('metadata', { cpf: metadata.cpf })
                .is('deleted_at', null)
                .limit(10);

            if (cpfMatches) {
                matches.push(...cpfMatches.map((e: any) => ({
                    id: e.id,
                    type: e.type,
                    name: e.name,
                    metadata: e.metadata || {},
                    investigation_id: e.investigation_id,
                    investigation_title: e.intelink_investigations?.title,
                    created_at: e.created_at
                })));
            }
        }

        // Search by phone
        const phone = metadata.telefone || metadata.phone;
        if (phone) {
            const phoneNumbers = phone.replace(/\D/g, '');
            if (phoneNumbers.length >= 8) {
                const { data: phoneMatches } = await this.supabase
                    .from('intelink_entities')
                    .select(`
                        id, type, name, metadata, investigation_id, created_at,
                        intelink_investigations(title)
                    `)
                    .neq('id', entity.id)
                    .neq('investigation_id', entity.investigation_id)
                    .or(`metadata->>telefone.ilike.%${phoneNumbers}%,metadata->>phone.ilike.%${phoneNumbers}%`)
                    .is('deleted_at', null)
                    .limit(10);

                if (phoneMatches) {
                    const existingIds = new Set([entity.id, ...matches.map(m => m.id)]);
                    const newMatches = phoneMatches.filter((e: any) => !existingIds.has(e.id));
                    matches.push(...newMatches.map((e: any) => ({
                        id: e.id,
                        type: e.type,
                        name: e.name,
                        metadata: e.metadata || {},
                        investigation_id: e.investigation_id,
                        investigation_title: e.intelink_investigations?.title,
                        created_at: e.created_at
                    })));
                }
            }
        }

        return matches;
    }

    /**
     * Get all investigation appearances for a set of entity IDs
     */
    private async getAppearances(entityIds: string[]): Promise<InvestigationAppearance[]> {
        const { data: entities } = await this.supabase
            .from('intelink_entities')
            .select(`
                investigation_id, metadata,
                intelink_investigations(id, title, status, created_at)
            `)
            .in('id', entityIds)
            .is('deleted_at', null);

        if (!entities) return [];

        // Deduplicate by investigation_id
        const seen = new Set<string>();
        return entities
            .filter((e: any) => {
                if (seen.has(e.investigation_id)) return false;
                seen.add(e.investigation_id);
                return true;
            })
            .map((e: any) => ({
                investigation_id: e.investigation_id,
                investigation_title: e.intelink_investigations?.title || 'Sem título',
                entity_role: e.metadata?.role,
                status: e.intelink_investigations?.status || 'unknown',
                date: e.intelink_investigations?.created_at
            }));
    }

    /**
     * Get all relationships involving the entities
     */
    private async getRelationships(entityIds: string[]): Promise<RelationshipData[]> {
        const { data: relationships } = await this.supabase
            .from('intelink_relationships')
            .select(`
                id, type, description, investigation_id, created_at,
                source:source_entity_id(id, name, type),
                target:target_entity_id(id, name, type),
                intelink_investigations(title)
            `)
            .or(`source_entity_id.in.(${entityIds.join(',')}),target_entity_id.in.(${entityIds.join(',')})`)
            .limit(50);

        if (!relationships) return [];

        return relationships.map((r: any) => ({
            id: r.id,
            source_entity_id: r.source?.id,
            source_name: r.source?.name || 'Desconhecido',
            source_type: r.source?.type || 'UNKNOWN',
            target_entity_id: r.target?.id,
            target_name: r.target?.name || 'Desconhecido',
            target_type: r.target?.type || 'UNKNOWN',
            relationship_type: r.type,
            description: r.description,
            investigation_id: r.investigation_id,
            investigation_title: r.intelink_investigations?.title || 'Sem título'
        }));
    }

    /**
     * Get evidences related to the entities (via mentions or tags)
     */
    private async getRelatedEvidences(entityIds: string[]): Promise<EvidenceData[]> {
        // Get investigation IDs first
        const { data: entities } = await this.supabase
            .from('intelink_entities')
            .select('investigation_id')
            .in('id', entityIds);

        if (!entities) return [];

        const investigationIds = [...new Set(entities.map((e: any) => e.investigation_id))];

        const { data: evidences } = await this.supabase
            .from('intelink_evidences')
            .select(`
                id, type, description, investigation_id, created_at,
                intelink_investigations(title)
            `)
            .in('investigation_id', investigationIds)
            .is('deleted_at', null)
            .limit(30);

        if (!evidences) return [];

        return evidences.map((e: any) => ({
            id: e.id,
            type: e.type,
            description: e.description,
            investigation_id: e.investigation_id,
            investigation_title: e.intelink_investigations?.title || 'Sem título',
            created_at: e.created_at
        }));
    }

    /**
     * Build unified timeline from all investigations
     */
    private async buildTimeline(entityIds: string[]): Promise<TimelineEvent[]> {
        // Get investigation IDs
        const { data: entities } = await this.supabase
            .from('intelink_entities')
            .select('investigation_id')
            .in('id', entityIds);

        if (!entities) return [];

        const investigationIds = [...new Set(entities.map((e: any) => e.investigation_id))];

        const { data: events } = await this.supabase
            .from('intelink_timeline_events')
            .select(`
                id, date, description, investigation_id,
                intelink_investigations(title)
            `)
            .in('investigation_id', investigationIds)
            .order('date', { ascending: true })
            .limit(50);

        if (!events) return [];

        return events.map((e: any) => ({
            date: e.date,
            event: e.description,
            investigation_id: e.investigation_id,
            investigation_title: e.intelink_investigations?.title || 'Sem título'
        }));
    }

    /**
     * Normalize query for fuzzy matching
     */
    private normalizeQuery(query: string): string {
        return query
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim();
    }
}

// Singleton export
export const graphAggregator = new GraphAggregatorService();
