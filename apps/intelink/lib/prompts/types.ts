/**
 * Types for System Prompts
 * 
 * Centraliza todos os tipos usados pelos prompts de extração e análise
 */

// Tipos de documento suportados
export type DocumentType = 
    | 'reds'           // REDS/Boletim de Ocorrência
    | 'cs'             // Comunicação de Serviço
    | 'inquerito'      // Inquérito Policial Completo
    | 'depoimento'     // Oitiva/Depoimento
    | 'laudo_pericial' // Laudo Pericial
    | 'laudo_medico'   // Exame Médico/IML
    | 'audio'          // Transcrição de áudio
    | 'livre';         // Texto livre

// Resultado da detecção de tipo
export interface DocumentTypeDetection {
    detected_type: DocumentType;
    confidence: 'high' | 'medium' | 'low';
    indicators: string[];
    suggested_type?: DocumentType;
    user_selected_type: DocumentType;
    mismatch: boolean;
}

// Entidade extraída
export interface ExtractedEntity {
    type: 'person' | 'vehicle' | 'location' | 'organization' | 'phone' | 'weapon' | 'document';
    name: string;
    role?: string;
    metadata?: Record<string, any>;
    confidence: 'high' | 'medium' | 'low';
}

// Relacionamento extraído
export interface ExtractedRelationship {
    source: string;
    target: string;
    type: string;
    description?: string;
    confidence: 'high' | 'medium' | 'low';
}

// Evento da timeline
export interface TimelineEvent {
    datetime: string;
    description: string;
    location?: string;
    actors?: string[];
}

// Material apreendido
export interface SeizedMaterial {
    type: string;
    description: string;
    quantity?: number;
    location?: string;
}

// Resultado base de extração
export interface BaseExtractionResult {
    title: string;
    document_number?: string;
    date?: string;
    entities: ExtractedEntity[];
    relationships: ExtractedRelationship[];
    timeline: TimelineEvent[];
    materials?: SeizedMaterial[];
    narrative?: string;
}

// Análise de IA (extensão do resultado base)
export interface AIAnalysis {
    risk_level: 'critical' | 'high' | 'medium' | 'low';
    flight_risk: 'high' | 'medium' | 'low';
    flight_risk_factors: string[];
    recidivism_risk: 'high' | 'medium' | 'low';
    recidivism_factors: string[];
    inconsistencies: string[];
    investigation_lines: Array<{
        title: string;
        description: string;
        priority: 'high' | 'medium' | 'low';
    }>;
    suggested_diligences: Array<{
        type: string;
        description: string;
        priority: 'urgent' | 'high' | 'medium' | 'low';
    }>;
}

// Resultado completo de extração de REDS
export interface REDSExtractionResult extends BaseExtractionResult {
    reds_number: string;
    unit_responsible?: string;
    criminal_articles: Array<{
        code: string;
        article: string;
        description: string;
    }>;
    ai_analysis: AIAnalysis;
}

// Resultado de extração de Comunicação de Serviço
export interface CSExtractionResult extends BaseExtractionResult {
    cs_number?: string;
    hypotheses: string[];
    insights: string[];
    recommendations: string[];
}

// Resultado de extração de Depoimento
export interface DepoimentoExtractionResult extends BaseExtractionResult {
    deponent_name: string;
    deponent_role: 'vitima' | 'autor' | 'testemunha' | 'outro';
    declarations: string[];
    contradictions?: string[];
    key_quotes: string[];
}

// Prompt Template
export interface PromptTemplate {
    name: string;
    description: string;
    version: string;
    system_prompt: string;
    json_schema: Record<string, any>;
    examples?: string[];
}
