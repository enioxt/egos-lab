/**
 * INTELINK - Anchoring Score System
 * 
 * Implements quality metric for AI responses based on MACI framework.
 * 
 * Formula: S = ρd - dr - γ log(k)
 * - ρd = Relevance density (how relevant to the query)
 * - dr = Drift rate (how much it deviates from topic)
 * - γ log(k) = Complexity penalty (penalize over-complexity)
 * 
 * @version 1.0.0
 * @updated 2025-12-09
 */

// ============================================================================
// TYPES
// ============================================================================

export interface AnchoringInput {
    query: string;           // Original user query
    response: string;        // AI response to evaluate
    context?: string;        // Investigation context
    expected_length?: number; // Expected response length
}

export interface AnchoringScore {
    total: number;           // Final score (0-100)
    components: {
        relevance_density: number;   // ρd (0-1)
        drift_rate: number;          // dr (0-1)
        complexity_penalty: number;  // γ log(k)
    };
    quality_level: 'EXCELENTE' | 'BOM' | 'ADEQUADO' | 'FRACO' | 'RUIM';
    issues: string[];
    suggestions: string[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

const GAMMA = 0.15; // Complexity penalty coefficient

// Key terms that indicate high relevance in investigative context
const RELEVANT_TERMS = [
    'investigação', 'evidência', 'prova', 'testemunha', 'suspeito',
    'vítima', 'crime', 'artigo', 'lei', 'CPP', 'CP', 'diligência',
    'laudo', 'perícia', 'depoimento', 'indício', 'autoria', 'materialidade',
    'risco', 'fuga', 'reincidência', 'entidade', 'vínculo', 'relacionamento'
];

// Terms that indicate drift from topic
const DRIFT_TERMS = [
    'porém', 'entretanto', 'por outro lado', 'curiosamente',
    'aliás', 'a propósito', 'falando nisso', 'de forma geral',
    'em outro contexto', 'historicamente', 'filosoficamente'
];

// ============================================================================
// MAIN CALCULATION
// ============================================================================

export function calculateAnchoringScore(input: AnchoringInput): AnchoringScore {
    const { query, response, context, expected_length } = input;
    
    // 1. Calculate Relevance Density (ρd)
    const relevanceDensity = calculateRelevanceDensity(query, response, context);
    
    // 2. Calculate Drift Rate (dr)
    const driftRate = calculateDriftRate(response);
    
    // 3. Calculate Complexity Penalty (γ log k)
    const k = calculateComplexityFactor(response, expected_length);
    const complexityPenalty = GAMMA * Math.log(Math.max(1, k));
    
    // 4. Calculate final score: S = ρd - dr - γ log(k)
    // Normalize to 0-100 scale
    const rawScore = relevanceDensity - driftRate - complexityPenalty;
    const normalizedScore = Math.max(0, Math.min(100, rawScore * 100));
    
    // 5. Determine quality level
    const qualityLevel = getQualityLevel(normalizedScore);
    
    // 6. Identify issues and suggestions
    const { issues, suggestions } = analyzeResponse(
        normalizedScore,
        relevanceDensity,
        driftRate,
        complexityPenalty
    );
    
    return {
        total: Math.round(normalizedScore),
        components: {
            relevance_density: Math.round(relevanceDensity * 100) / 100,
            drift_rate: Math.round(driftRate * 100) / 100,
            complexity_penalty: Math.round(complexityPenalty * 100) / 100
        },
        quality_level: qualityLevel,
        issues,
        suggestions
    };
}

// ============================================================================
// COMPONENT CALCULATIONS
// ============================================================================

function calculateRelevanceDensity(query: string, response: string, context?: string): number {
    const queryTerms = extractKeyTerms(query);
    const responseTerms = extractKeyTerms(response);
    const contextTerms = context ? extractKeyTerms(context) : [];
    
    // Calculate overlap
    const relevantTermsInResponse = responseTerms.filter(term => 
        queryTerms.includes(term) || 
        contextTerms.includes(term) ||
        RELEVANT_TERMS.some(rt => term.includes(rt))
    );
    
    // Base relevance from term overlap
    const termRelevance = relevantTermsInResponse.length / Math.max(1, responseTerms.length);
    
    // Bonus for directly addressing query
    const addressesQuery = response.toLowerCase().includes(query.toLowerCase().slice(0, 20)) ? 0.1 : 0;
    
    // Bonus for investigative terms
    const investigativeBonus = RELEVANT_TERMS.filter(t => 
        response.toLowerCase().includes(t)
    ).length * 0.02;
    
    return Math.min(1, termRelevance + addressesQuery + investigativeBonus);
}

function calculateDriftRate(response: string): number {
    const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    if (sentences.length <= 1) return 0;
    
    let driftCount = 0;
    
    for (const sentence of sentences) {
        // Check for drift indicators
        for (const term of DRIFT_TERMS) {
            if (sentence.toLowerCase().includes(term)) {
                driftCount++;
                break;
            }
        }
    }
    
    // Check for topic changes (multiple different subjects)
    const topics = detectTopicChanges(sentences);
    const topicDrift = topics > 3 ? (topics - 3) * 0.05 : 0;
    
    return Math.min(1, (driftCount / sentences.length) + topicDrift);
}

function calculateComplexityFactor(response: string, expectedLength?: number): number {
    const words = response.split(/\s+/).length;
    const sentences = response.split(/[.!?]+/).filter(s => s.trim()).length;
    
    // Calculate average sentence length
    const avgSentenceLength = words / Math.max(1, sentences);
    
    // Calculate based on expected length if provided
    if (expectedLength) {
        const lengthRatio = words / expectedLength;
        if (lengthRatio > 2) return lengthRatio; // Too verbose
        if (lengthRatio < 0.5) return 1 / lengthRatio; // Too brief
    }
    
    // Penalize very long sentences
    if (avgSentenceLength > 40) {
        return avgSentenceLength / 20;
    }
    
    return 1; // Neutral complexity
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function extractKeyTerms(text: string): string[] {
    // Remove common stop words and extract key terms
    const stopWords = ['de', 'da', 'do', 'em', 'um', 'uma', 'o', 'a', 'os', 'as', 
        'para', 'por', 'com', 'que', 'se', 'não', 'é', 'foi', 'são', 'está'];
    
    return text.toLowerCase()
        .split(/\s+/)
        .map(w => w.replace(/[^a-záàâãéêíóôõúç]/gi, ''))
        .filter(w => w.length > 3 && !stopWords.includes(w));
}

function detectTopicChanges(sentences: string[]): number {
    const topics = new Set<string>();
    
    const topicIndicators = [
        { pattern: /investiga/i, topic: 'investigacao' },
        { pattern: /vítima|vitima/i, topic: 'vitima' },
        { pattern: /suspeito|autor/i, topic: 'suspeito' },
        { pattern: /evidência|prova/i, topic: 'evidencia' },
        { pattern: /crime|delito/i, topic: 'crime' },
        { pattern: /recomend|suger/i, topic: 'recomendacao' },
        { pattern: /risco|perigo/i, topic: 'risco' },
        { pattern: /lei|artigo|código/i, topic: 'legal' }
    ];
    
    for (const sentence of sentences) {
        for (const { pattern, topic } of topicIndicators) {
            if (pattern.test(sentence)) {
                topics.add(topic);
            }
        }
    }
    
    return topics.size;
}

function getQualityLevel(score: number): 'EXCELENTE' | 'BOM' | 'ADEQUADO' | 'FRACO' | 'RUIM' {
    if (score >= 85) return 'EXCELENTE';
    if (score >= 70) return 'BOM';
    if (score >= 50) return 'ADEQUADO';
    if (score >= 30) return 'FRACO';
    return 'RUIM';
}

function analyzeResponse(
    score: number,
    relevance: number,
    drift: number,
    complexity: number
): { issues: string[]; suggestions: string[] } {
    const issues: string[] = [];
    const suggestions: string[] = [];
    
    if (relevance < 0.5) {
        issues.push('Baixa relevância em relação à pergunta');
        suggestions.push('Foque mais diretamente no que foi perguntado');
    }
    
    if (drift > 0.3) {
        issues.push('Desvio do tópico principal');
        suggestions.push('Evite tangentes e mantenha o foco');
    }
    
    if (complexity > 0.5) {
        issues.push('Resposta excessivamente complexa ou longa');
        suggestions.push('Simplifique a linguagem e seja mais conciso');
    }
    
    if (score >= 70 && issues.length === 0) {
        suggestions.push('Resposta bem estruturada. Manter padrão.');
    }
    
    return { issues, suggestions };
}

// ============================================================================
// FORMAT FOR DISPLAY
// ============================================================================

export function formatAnchoringScore(score: AnchoringScore): string {
    let output = 'ANCHORING SCORE (MACI)\n';
    output += '═'.repeat(50) + '\n\n';
    
    const qualityIcons: Record<string, string> = {
        'EXCELENTE': '🏆',
        'BOM': '✅',
        'ADEQUADO': '📊',
        'FRACO': '⚠️',
        'RUIM': '❌'
    };
    
    output += `Score: ${score.total}/100 ${qualityIcons[score.quality_level]} ${score.quality_level}\n\n`;
    
    output += 'COMPONENTES\n';
    output += '─'.repeat(40) + '\n';
    output += `• Densidade de Relevância (ρd): ${score.components.relevance_density}\n`;
    output += `• Taxa de Desvio (dr): ${score.components.drift_rate}\n`;
    output += `• Penalidade de Complexidade: ${score.components.complexity_penalty}\n\n`;
    
    if (score.issues.length > 0) {
        output += 'PROBLEMAS\n';
        output += '─'.repeat(40) + '\n';
        for (const issue of score.issues) {
            output += `• ${issue}\n`;
        }
        output += '\n';
    }
    
    output += 'SUGESTÕES\n';
    output += '─'.repeat(40) + '\n';
    for (const suggestion of score.suggestions) {
        output += `• ${suggestion}\n`;
    }
    
    return output;
}

export default {
    calculateAnchoringScore,
    formatAnchoringScore
};
