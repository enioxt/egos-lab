/**
 * Intelligence Module - Quantum Search
 * 
 * Exports for the Intelligence Lab feature.
 */

export { GraphAggregatorService, graphAggregator } from './graph-aggregator';
export type { 
    EntityData, 
    DossierResult, 
    SearchResult,
    RelationshipData,
    EvidenceData,
    TimelineEvent 
} from './graph-aggregator';

export { 
    NARRATIVE_DOSSIER_SYSTEM_PROMPT, 
    buildDossierContext, 
    generateFallbackNarrative 
} from './narrative-prompt';
