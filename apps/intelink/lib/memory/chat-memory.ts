/**
 * INTELINK Chat Memory System
 * 
 * Persists important facts from conversations for context across sessions.
 * 
 * @version 1.0.0
 * @updated 2025-12-09
 */

import { getSupabaseAdmin } from '@/lib/api-utils';

const supabase = getSupabaseAdmin();

// ============================================================================
// TYPES
// ============================================================================

export type FactType = 'entity_mention' | 'hypothesis' | 'conclusion' | 'question' | 'preference' | 'context';

export interface MemoryFact {
    id?: string;
    investigation_id: string;
    session_id?: string;
    fact_type: FactType;
    content: string;
    relevance_score?: number;
    source_message_id?: string;
    metadata?: Record<string, any>;
    expires_at?: string;
}

export interface MemoryContext {
    facts: MemoryFact[];
    summary: string;
}

// ============================================================================
// MEMORY RETRIEVAL
// ============================================================================

/**
 * Retrieve relevant memory facts for an investigation
 */
export async function getMemoryContext(
    investigationId: string,
    limit: number = 10
): Promise<MemoryContext> {
    try {
        const { data: facts, error } = await supabase
            .from('intelink_chat_memory')
            .select('*')
            .eq('investigation_id', investigationId)
            .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
            .order('relevance_score', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;

        if (!facts || facts.length === 0) {
            return {
                facts: [],
                summary: ''
            };
        }

        // Build summary
        const summary = buildMemorySummary(facts);

        return {
            facts: facts as MemoryFact[],
            summary
        };
    } catch (error) {
        console.error('[ChatMemory] Error retrieving memory:', error);
        return { facts: [], summary: '' };
    }
}

/**
 * Build a summary string from memory facts
 */
function buildMemorySummary(facts: MemoryFact[]): string {
    if (facts.length === 0) return '';

    const grouped: Record<FactType, string[]> = {
        'entity_mention': [],
        'hypothesis': [],
        'conclusion': [],
        'question': [],
        'preference': [],
        'context': []
    };

    for (const fact of facts) {
        grouped[fact.fact_type].push(fact.content);
    }

    const sections: string[] = [];

    if (grouped.conclusion.length > 0) {
        sections.push(`CONCLUSÕES ANTERIORES:\n- ${grouped.conclusion.join('\n- ')}`);
    }
    if (grouped.hypothesis.length > 0) {
        sections.push(`HIPÓTESES EM ANÁLISE:\n- ${grouped.hypothesis.join('\n- ')}`);
    }
    if (grouped.entity_mention.length > 0) {
        sections.push(`ENTIDADES DISCUTIDAS:\n- ${grouped.entity_mention.join('\n- ')}`);
    }
    if (grouped.question.length > 0) {
        sections.push(`QUESTÕES PENDENTES:\n- ${grouped.question.join('\n- ')}`);
    }
    if (grouped.context.length > 0) {
        sections.push(`CONTEXTO:\n- ${grouped.context.join('\n- ')}`);
    }

    return sections.length > 0 
        ? `\nMEMÓRIA DE CONVERSAS ANTERIORES:\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n${sections.join('\n\n')}\n`
        : '';
}

// ============================================================================
// MEMORY STORAGE
// ============================================================================

/**
 * Save a memory fact
 */
export async function saveMemoryFact(fact: MemoryFact): Promise<string | null> {
    try {
        const { data, error } = await supabase
            .from('intelink_chat_memory')
            .insert({
                ...fact,
                relevance_score: fact.relevance_score || 0.5,
                metadata: fact.metadata || {}
            })
            .select('id')
            .single();

        if (error) throw error;
        return data?.id || null;
    } catch (error) {
        console.error('[ChatMemory] Error saving fact:', error);
        return null;
    }
}

/**
 * Extract and save facts from a conversation exchange
 */
export async function extractAndSaveFacts(
    investigationId: string,
    sessionId: string,
    userMessage: string,
    assistantResponse: string
): Promise<number> {
    const facts: MemoryFact[] = [];

    // Extract entity mentions (names in caps)
    const entityRegex = /\b[A-ZÁÉÍÓÚÀÈÌÒÙÂÊÎÔÛÃÕ][A-ZÁÉÍÓÚÀÈÌÒÙÂÊÎÔÛÃÕ\s]{3,30}\b/g;
    const entities = assistantResponse.match(entityRegex) || [];
    const uniqueEntities = [...new Set(entities)].slice(0, 5);
    
    for (const entity of uniqueEntities) {
        facts.push({
            investigation_id: investigationId,
            session_id: sessionId,
            fact_type: 'entity_mention',
            content: entity.trim(),
            relevance_score: 0.6
        });
    }

    // Extract conclusions (phrases with "portanto", "conclui", etc)
    const conclusionPatterns = [
        /(?:portanto|conclui-se|em resumo|conclusão)[:\s]+([^.]+\.)/gi,
        /(?:evidência sugere|dados indicam)[:\s]+([^.]+\.)/gi
    ];
    
    for (const pattern of conclusionPatterns) {
        const matches = assistantResponse.matchAll(pattern);
        for (const match of matches) {
            if (match[1] && match[1].length > 20) {
                facts.push({
                    investigation_id: investigationId,
                    session_id: sessionId,
                    fact_type: 'conclusion',
                    content: match[1].trim(),
                    relevance_score: 0.8
                });
            }
        }
    }

    // Extract hypotheses (phrases with "hipótese", "possível", etc)
    const hypothesisPatterns = [
        /(?:hipótese|possível|possivelmente|suspeita-se)[:\s]+([^.]+\.)/gi
    ];
    
    for (const pattern of hypothesisPatterns) {
        const matches = assistantResponse.matchAll(pattern);
        for (const match of matches) {
            if (match[1] && match[1].length > 20) {
                facts.push({
                    investigation_id: investigationId,
                    session_id: sessionId,
                    fact_type: 'hypothesis',
                    content: match[1].trim(),
                    relevance_score: 0.7
                });
            }
        }
    }

    // Extract questions from user message
    if (userMessage.includes('?')) {
        const questions = userMessage.split('?').filter(q => q.trim().length > 10);
        for (const q of questions.slice(0, 2)) {
            facts.push({
                investigation_id: investigationId,
                session_id: sessionId,
                fact_type: 'question',
                content: q.trim() + '?',
                relevance_score: 0.5,
                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
            });
        }
    }

    // Save all facts
    let saved = 0;
    for (const fact of facts.slice(0, 10)) { // Max 10 facts per exchange
        const id = await saveMemoryFact(fact);
        if (id) saved++;
    }

    console.log(`[ChatMemory] Extracted and saved ${saved} facts`);
    return saved;
}

// ============================================================================
// MEMORY MANAGEMENT
// ============================================================================

/**
 * Update relevance score of a fact
 */
export async function updateRelevance(factId: string, delta: number): Promise<void> {
    try {
        const { data: current } = await supabase
            .from('intelink_chat_memory')
            .select('relevance_score')
            .eq('id', factId)
            .single();

        if (current) {
            const newScore = Math.max(0, Math.min(1, (current.relevance_score || 0.5) + delta));
            await supabase
                .from('intelink_chat_memory')
                .update({ relevance_score: newScore, updated_at: new Date().toISOString() })
                .eq('id', factId);
        }
    } catch (error) {
        console.error('[ChatMemory] Error updating relevance:', error);
    }
}

/**
 * Clean up expired and low-relevance facts
 */
export async function cleanupMemory(investigationId: string): Promise<number> {
    try {
        // Delete expired facts
        const { data: deleted } = await supabase
            .from('intelink_chat_memory')
            .delete()
            .eq('investigation_id', investigationId)
            .or(`expires_at.lt.${new Date().toISOString()},relevance_score.lt.0.2`)
            .select('id');

        return deleted?.length || 0;
    } catch (error) {
        console.error('[ChatMemory] Error cleaning up:', error);
        return 0;
    }
}

export default {
    getMemoryContext,
    saveMemoryFact,
    extractAndSaveFacts,
    updateRelevance,
    cleanupMemory
};
