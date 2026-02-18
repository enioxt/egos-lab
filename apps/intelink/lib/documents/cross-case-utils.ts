/**
 * Cross-Case Alert Utilities
 * Extracted from api/documents/save/route.ts
 */

import { SupabaseClient } from '@supabase/supabase-js';

// ============================================
// CROSS-CASE ALERT
// ============================================

export type MatchType = 'cpf' | 'placa' | 'nome' | 'telefone' | 'rg';

export async function createCrossCaseAlert(
    supabase: SupabaseClient,
    newEntityId: string,
    existingEntityId: string,
    matchType: MatchType,
    matchReason: string,
    newInvestigationId: string,
    existingInvestigationId: string
): Promise<void> {
    try {
        // Insert alert (UNIQUE constraint prevents duplicates)
        const { error } = await supabase
            .from('intelink_cross_case_alerts')
            .insert({
                entity_a_id: newEntityId,
                entity_b_id: existingEntityId,
                investigation_a_id: newInvestigationId,
                investigation_b_id: existingInvestigationId,
                match_type: matchType,
                match_reason: matchReason,
                similarity_score: 0.95,
                status: 'pending'
            });
        
        if (error && !error.message?.includes('duplicate')) {
            console.error('[Cross-Case] Error creating alert:', error);
        }
    } catch (e) {
        // Ignore duplicate error (UNIQUE constraint)
        console.warn('[Cross-Case] Alert may already exist:', e);
    }
}

// ============================================
// FINDING CLASSIFICATION
// ============================================

const FINDING_TYPE_MAP: Record<string, string> = {
    'INDICAÇÃO': 'connection_hypothesis',
    'POSSÍVEL': 'connection_hypothesis',
    'SUGERE': 'connection_hypothesis',
    'ANÁLISE': 'technical_analysis',
    'ERB': 'technical_analysis',
    'EXTRAÇÃO': 'technical_analysis',
    'TESTEMUNHO': 'interview_impression',
    'DECLAROU': 'interview_impression',
    'DEPOIMENTO': 'interview_impression',
    'VIGILÂNCIA': 'surveillance_obs',
    'OBSERVADO': 'surveillance_obs',
    'MODUS': 'modus_operandi',
    'PADRÃO': 'modus_operandi',
    'FONTE': 'source_intel',
    'INFORMANTE': 'source_intel',
};

export function classifyFinding(text: string): string {
    const upperText = text.toUpperCase();
    for (const [keyword, findingType] of Object.entries(FINDING_TYPE_MAP)) {
        if (upperText.includes(keyword)) {
            return findingType;
        }
    }
    return 'connection_hypothesis'; // Default
}

// ============================================
// INTERFACES
// ============================================

export interface SaveDocumentRequest {
    investigation_id: string;
    document_type: string;
    extraction: DocumentExtraction;
    file_info?: FileInfo;
    stats?: ProcessingStats;
}

export interface DocumentExtraction {
    summary?: string;
    historico_completo?: string;
    analise_completa?: string; // For CS
    numero_ocorrencia?: string;
    natureza?: string;
    data_fato?: string;
    entities?: EntityExtraction[];
    relationships?: RelationshipExtraction[];
    evidences?: EvidenceExtraction[];
    hipoteses?: HypothesisExtraction[];
    analises_tecnicas?: TechnicalAnalysis[];
    warnings?: string[];
    insights?: string[];
}

export interface EntityExtraction {
    type: string;
    name: string;
    role?: string;
    confidence?: number;
    metadata?: Record<string, unknown>;
}

export interface RelationshipExtraction {
    source: string;
    target: string;
    type: string;
    description?: string;
    confidence?: number;
    status?: string;
}

export interface EvidenceExtraction {
    type: string;
    description: string;
    quantity?: string;
    details?: Record<string, unknown>;
}

export interface HypothesisExtraction {
    descricao: string;
    base?: string;
    confidence?: number;
}

export interface TechnicalAnalysis {
    tipo: string;
    descricao: string;
    resultados?: string;
}

export interface FileInfo {
    name: string;
    size: number;
    type: string;
    hash?: string;
}

export interface ProcessingStats {
    processing_time_ms: number;
    cost_usd: number;
    tokens_input: number;
    tokens_output: number;
}

// ============================================
// DUPLICATE CHECK RESULT
// ============================================

export interface DuplicateResult {
    found: boolean;
    sameInvestigation: boolean;
    existingEntity?: {
        id: string;
        name: string;
        investigation_id: string;
        investigation_title?: string;
    };
    matchType?: MatchType | 'nome';
    matchReason?: string;
}
