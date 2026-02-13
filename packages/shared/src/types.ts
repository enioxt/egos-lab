/**
 * Shared Types — Used across all egos-lab apps
 */

// ═══════════════════════════════════════════════════════════
// Gazette Types (Querido Diário API)
// ═══════════════════════════════════════════════════════════

export interface GazetteItem {
    territory_id: string;
    date: string;
    url: string;
    territory_name: string;
    state_code: string;
    excerpts: string[];
    highlight_texts: string[];
    txt_url: string;
    is_extra_edition: boolean;
    edition_number?: string;
}

export interface GazetteSearchResponse {
    total_gazettes: number;
    gazettes: GazetteItem[];
}

export interface CityInfo {
    territory_id: string;
    territory_name: string;
    state_code: string;
    publication_urls: string[];
    level: string;
}

// ═══════════════════════════════════════════════════════════
// Opportunity Pattern Types
// ═══════════════════════════════════════════════════════════

export type PatternTier = 1 | 2 | 3;
export type DetectionStrategy = 'keyword' | 'theme' | 'ai_semantic';

export interface OpportunityPattern {
    id: string;
    name: string;
    name_pt: string;
    tier: PatternTier;
    strategy: DetectionStrategy;
    keywords: string[];
    urgency_indicators: string[];
    ai_context: string;
    source_file: string;
    confidence_boost: number; // 0-20 extra points for tier relevance
}

export interface OpportunityMatch {
    pattern_id: string;
    pattern_name: string;
    confidence: number; // 0-100
    urgency: 'critical' | 'high' | 'medium' | 'low';
    matched_keywords: string[];
    ai_reasoning: string;
    effective_date?: string;
    action_deadline?: string;
}

export interface AnalysisResult {
    gazette: GazetteItem;
    matches: OpportunityMatch[];
    raw_text_length: number;
    analysis_model: string;
    analysis_cost_usd: number;
    timestamp: string;
}

// ═══════════════════════════════════════════════════════════
// AI Client Types
// ═══════════════════════════════════════════════════════════

export interface AIAnalysisResult {
    content: string;
    model: string;
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
    cost_usd: number;
}
