/**
 * Investigation Journey Types
 * 
 * Based on:
 * - i2 Analyst's Notebook (Provenance Information)
 * - Palantir Gotham (Investigation Workflows)
 */

// Provenance rating (i2 6x6 system)
export type ReliabilityRating = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
export type SourceType = 'database' | 'document' | 'witness' | 'osint' | 'manual';

// How the user arrived at this entity
export type JourneySource = 'search' | 'click_relationship' | 'graph_nav' | 'document' | 'direct_link';

/**
 * Provenance information for a journey step
 * Tracks the source and reliability of information
 */
export interface JourneyProvenance {
    sourceType: SourceType;
    reliability: ReliabilityRating;
    documentRef?: string; // Reference to source document
    notes?: string;
}

/**
 * A snapshot of visible connections at the time of the step
 * Used by AI to identify "missed" connections
 */
export interface ConnectionSnapshot {
    id: string;
    name: string;
    type: string;
    relationship: string;
}

/**
 * A single step in the investigation journey
 */
export interface JourneyStep {
    // Identification
    stepNumber: number;
    timestamp: number;
    
    // Entity info
    entityId: string;
    entityName: string;
    entityType: string;
    
    // Navigation context
    source: JourneySource;
    previousEntityId?: string;
    relationshipType?: string;
    
    // Provenance (i2 style)
    provenance?: JourneyProvenance;
    
    // Snapshot for AI analysis
    visibleConnectionsSnapshot: ConnectionSnapshot[];
}

/**
 * Complete investigation journey
 */
export interface InvestigationJourney {
    id: string;
    userId: string;
    investigationId?: string;
    
    // Content
    title?: string;
    context?: string; // User's investigation description
    steps: JourneyStep[];
    stepCount: number;
    
    // AI Analysis
    aiAnalysis?: string;
    aiModel?: string;
    aiAnalyzedAt?: Date;
    
    // Status
    status: 'active' | 'completed' | 'archived';
    
    // Timestamps
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Request to analyze a journey with AI
 */
export interface JourneyAnalysisRequest {
    journeyId: string;
    context: string; // Investigation description
    includeSecondDegree: boolean;
}

/**
 * Response from AI analysis
 */
export interface JourneyAnalysisResponse {
    analysis: string; // Markdown formatted
    missedConnections: {
        entityId: string;
        entityName: string;
        entityType: string;
        relevance: 'high' | 'medium' | 'low';
        reason: string;
        connectedVia: string; // Which visited entity connects to this
    }[];
    suggestedNextSteps: string[];
}

// Default provenance for database entities
export const DEFAULT_PROVENANCE: JourneyProvenance = {
    sourceType: 'database',
    reliability: 'B', // Reliable but not verified independently
};

// Reliability descriptions (i2 standard)
export const RELIABILITY_LABELS: Record<ReliabilityRating, string> = {
    'A': 'Completamente confiável',
    'B': 'Normalmente confiável',
    'C': 'Razoavelmente confiável',
    'D': 'Normalmente não confiável',
    'E': 'Não confiável',
    'F': 'Confiabilidade desconhecida',
};

export const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
    'database': 'Banco de dados',
    'document': 'Documento',
    'witness': 'Testemunha',
    'osint': 'OSINT',
    'manual': 'Entrada manual',
};
