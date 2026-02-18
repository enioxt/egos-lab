/**
 * RAG Context Retriever
 * 
 * Retrieves relevant context from investigations to augment LLM responses.
 * Uses semantic similarity (when embeddings available) or keyword matching.
 * 
 * @version 1.0.0
 */

import { createClient } from '@supabase/supabase-js';

// Types
export interface RetrievedContext {
    type: 'entity' | 'relationship' | 'evidence' | 'note';
    content: string;
    source: {
        investigationId: string;
        investigationTitle?: string;
        entityId?: string;
        entityName?: string;
    };
    relevanceScore: number;
}

export interface RAGContext {
    contexts: RetrievedContext[];
    totalFound: number;
    searchTerms: string[];
    investigationSummary?: string;
}

// Supabase client
function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

/**
 * Extract keywords from user query
 */
export function extractKeywords(query: string): string[] {
    // Remove common Portuguese stop words
    const stopWords = new Set([
        'o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas',
        'de', 'da', 'do', 'das', 'dos', 'em', 'na', 'no', 'nas', 'nos',
        'por', 'para', 'com', 'sem', 'sob', 'sobre',
        'e', 'ou', 'mas', 'se', 'que', 'qual', 'quais',
        'é', 'são', 'foi', 'foram', 'ser', 'estar',
        'tem', 'têm', 'tinha', 'ter', 'tendo',
        'isso', 'isto', 'esse', 'esta', 'este', 'essa',
        'me', 'te', 'se', 'nos', 'vos', 'lhe', 'lhes',
        'meu', 'minha', 'seu', 'sua', 'nosso', 'nossa',
        'como', 'quando', 'onde', 'porque', 'porquê',
        'já', 'ainda', 'também', 'muito', 'mais', 'menos',
        'aqui', 'ali', 'lá', 'aí', 'então', 'assim',
    ]);

    const normalized = query
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 2 && !stopWords.has(word));

    return [...new Set(normalized)];
}

/**
 * Retrieve context from a specific investigation
 */
export async function retrieveInvestigationContext(
    investigationId: string,
    query: string,
    limit: number = 10
): Promise<RAGContext> {
    const supabase = getSupabase();
    const keywords = extractKeywords(query);
    const contexts: RetrievedContext[] = [];

    // Get investigation info
    const { data: investigation } = await supabase
        .from('intelink_investigations')
        .select('id, title, description')
        .eq('id', investigationId)
        .single();

    // Search entities
    const { data: entities } = await supabase
        .from('intelink_entities')
        .select('id, name, type, metadata')
        .eq('investigation_id', investigationId)
        .limit(50);

    if (entities) {
        for (const entity of entities) {
            const nameMatch = keywords.some(kw => 
                entity.name?.toLowerCase().includes(kw)
            );
            const metadataStr = JSON.stringify(entity.metadata || {}).toLowerCase();
            const metaMatch = keywords.some(kw => metadataStr.includes(kw));

            if (nameMatch || metaMatch) {
                const score = (nameMatch ? 0.8 : 0) + (metaMatch ? 0.2 : 0);
                contexts.push({
                    type: 'entity',
                    content: formatEntityContext(entity),
                    source: {
                        investigationId,
                        investigationTitle: investigation?.title,
                        entityId: entity.id,
                        entityName: entity.name,
                    },
                    relevanceScore: score,
                });
            }
        }
    }

    // Search relationships
    const { data: relationships } = await supabase
        .from('intelink_relationships')
        .select(`
            id, type, description,
            source:source_entity_id(id, name, type),
            target:target_entity_id(id, name, type)
        `)
        .eq('investigation_id', investigationId)
        .limit(50);

    if (relationships) {
        for (const rel of relationships) {
            const descMatch = keywords.some(kw => 
                rel.description?.toLowerCase().includes(kw)
            );
            const sourceMatch = keywords.some(kw => 
                (rel.source as any)?.name?.toLowerCase().includes(kw)
            );
            const targetMatch = keywords.some(kw => 
                (rel.target as any)?.name?.toLowerCase().includes(kw)
            );

            if (descMatch || sourceMatch || targetMatch) {
                contexts.push({
                    type: 'relationship',
                    content: formatRelationshipContext(rel),
                    source: {
                        investigationId,
                        investigationTitle: investigation?.title,
                    },
                    relevanceScore: descMatch ? 0.7 : 0.5,
                });
            }
        }
    }

    // Search evidence
    const { data: evidence } = await supabase
        .from('intelink_evidence')
        .select('id, type, content_text, metadata')
        .eq('investigation_id', investigationId)
        .not('content_text', 'is', null)
        .limit(20);

    if (evidence) {
        for (const ev of evidence) {
            const textMatch = keywords.some(kw => 
                ev.content_text?.toLowerCase().includes(kw)
            );

            if (textMatch) {
                contexts.push({
                    type: 'evidence',
                    content: formatEvidenceContext(ev),
                    source: {
                        investigationId,
                        investigationTitle: investigation?.title,
                    },
                    relevanceScore: 0.6,
                });
            }
        }
    }

    // Sort by relevance and limit
    contexts.sort((a, b) => b.relevanceScore - a.relevanceScore);
    const limited = contexts.slice(0, limit);

    return {
        contexts: limited,
        totalFound: contexts.length,
        searchTerms: keywords,
        investigationSummary: investigation 
            ? `Operação: ${investigation.title}. ${investigation.description || ''}`
            : undefined,
    };
}

/**
 * Retrieve context from all investigations (Central mode)
 * @param query - Search query
 * @param limit - Max results
 * @param unitId - Optional: Filter by unit for tenant isolation
 */
export async function retrieveCentralContext(
    query: string,
    limit: number = 15,
    unitId?: string
): Promise<RAGContext> {
    const supabase = getSupabase();
    const keywords = extractKeywords(query);
    const contexts: RetrievedContext[] = [];

    // Build query with optional tenant isolation
    let entityQuery = supabase
        .from('intelink_entities')
        .select(`
            id, name, type, metadata, investigation_id,
            intelink_investigations!inner(id, title, unit_id)
        `)
        .limit(100);
    
    // TENANT ISOLATION: Filter by unit if provided
    if (unitId) {
        entityQuery = entityQuery.eq('intelink_investigations.unit_id', unitId);
    }
    
    const { data: entities } = await entityQuery;

    if (entities) {
        for (const entity of entities) {
            const nameMatch = keywords.some(kw => 
                entity.name?.toLowerCase().includes(kw)
            );

            if (nameMatch) {
                contexts.push({
                    type: 'entity',
                    content: formatEntityContext(entity),
                    source: {
                        investigationId: entity.investigation_id,
                        investigationTitle: (entity as any).intelink_investigations?.title,
                        entityId: entity.id,
                        entityName: entity.name,
                    },
                    relevanceScore: 0.8,
                });
            }
        }
    }

    // Sort and limit
    contexts.sort((a, b) => b.relevanceScore - a.relevanceScore);
    const limited = contexts.slice(0, limit);

    return {
        contexts: limited,
        totalFound: contexts.length,
        searchTerms: keywords,
    };
}

/**
 * Format entity into context string
 */
function formatEntityContext(entity: any): string {
    const meta = entity.metadata || {};
    let context = `${entity.type}: ${entity.name}`;

    if (meta.cpf) context += ` (CPF: ${meta.cpf})`;
    if (meta.placa) context += ` (Placa: ${meta.placa})`;
    if (meta.telefone) context += ` (Tel: ${meta.telefone})`;
    if (meta.endereco) context += ` - ${meta.endereco}`;
    if (meta.alcunha) context += ` - vulgo "${meta.alcunha}"`;

    return context;
}

/**
 * Format relationship into context string
 */
function formatRelationshipContext(rel: any): string {
    const source = rel.source?.name || 'Desconhecido';
    const target = rel.target?.name || 'Desconhecido';
    const type = rel.type || 'relacionado';
    const desc = rel.description ? ` - ${rel.description}` : '';

    return `${source} [${type}] ${target}${desc}`;
}

/**
 * Format evidence into context string
 */
function formatEvidenceContext(ev: any): string {
    const preview = ev.content_text?.slice(0, 300) || '';
    return `[${ev.type}] ${preview}...`;
}

/**
 * Build system prompt with RAG context
 */
export function buildRAGSystemPrompt(ragContext: RAGContext): string {
    if (ragContext.contexts.length === 0) {
        return '';
    }

    let prompt = '\n\n---\nCONTEXTO RELEVANTE DA INVESTIGAÇÃO:\n\n';

    if (ragContext.investigationSummary) {
        prompt += `${ragContext.investigationSummary}\n\n`;
    }

    // Group by type
    const entities = ragContext.contexts.filter(c => c.type === 'entity');
    const relationships = ragContext.contexts.filter(c => c.type === 'relationship');
    const evidence = ragContext.contexts.filter(c => c.type === 'evidence');

    if (entities.length > 0) {
        prompt += 'ENTIDADES:\n';
        entities.forEach(e => {
            prompt += `- ${e.content}\n`;
        });
        prompt += '\n';
    }

    if (relationships.length > 0) {
        prompt += 'RELACIONAMENTOS:\n';
        relationships.forEach(r => {
            prompt += `- ${r.content}\n`;
        });
        prompt += '\n';
    }

    if (evidence.length > 0) {
        prompt += 'EVIDÊNCIAS:\n';
        evidence.forEach(ev => {
            prompt += `- ${ev.content}\n`;
        });
        prompt += '\n';
    }

    prompt += '---\n\nUse o contexto acima para responder a pergunta do usuário de forma precisa e relevante.';

    return prompt;
}
