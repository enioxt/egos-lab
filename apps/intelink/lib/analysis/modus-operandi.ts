/**
 * INTELINK - Modus Operandi Comparison System
 * 
 * Detects patterns between cases to identify:
 * - Serial offenders
 * - Related cases
 * - Criminal networks
 * 
 * @version 1.0.0
 * @updated 2025-12-09
 */

// ============================================================================
// TYPES
// ============================================================================

export interface CrimeSignature {
    id: string;
    investigation_id: string;
    crime_type: string;
    location_type?: string;  // residência, comércio, via_publica
    time_of_day?: string;    // madrugada, manhã, tarde, noite
    day_of_week?: string;    // segunda, terça, etc.
    weapon_type?: string;    // arma_fogo, arma_branca, sem_arma
    victim_profile?: string; // idoso, mulher, comerciante
    entry_method?: string;   // arrombamento, chave_falsa, janela
    escape_method?: string;  // veiculo, pe, moto
    value_range?: string;    // baixo, medio, alto
    violence_level?: string; // sem_violencia, moderada, alta
    accomplices?: number;    // número de comparsas
    region?: string;         // bairro ou região
    metadata?: Record<string, any>;
}

export interface MOMatch {
    investigation_id: string;
    title: string;
    similarity_score: number; // 0-100
    matching_factors: string[];
    differing_factors: string[];
}

export interface MOAnalysis {
    source_investigation: string;
    source_signature: CrimeSignature;
    matches: MOMatch[];
    patterns_detected: string[];
    serial_indicator: boolean;
    recommendation: string;
}

// ============================================================================
// WEIGHTS FOR COMPARISON
// ============================================================================

const MO_WEIGHTS: Record<string, number> = {
    crime_type: 25,
    location_type: 10,
    time_of_day: 8,
    day_of_week: 5,
    weapon_type: 15,
    victim_profile: 12,
    entry_method: 10,
    escape_method: 8,
    value_range: 5,
    violence_level: 10,
    region: 12
};

// ============================================================================
// SIGNATURE EXTRACTION
// ============================================================================

export function extractSignature(
    investigationId: string,
    crimeType: string,
    metadata: Record<string, any>
): CrimeSignature {
    return {
        id: `sig_${investigationId}`,
        investigation_id: investigationId,
        crime_type: normalizeType(crimeType),
        location_type: metadata.location_type || metadata.tipo_local,
        time_of_day: extractTimeOfDay(metadata.time || metadata.hora),
        day_of_week: extractDayOfWeek(metadata.date || metadata.data),
        weapon_type: normalizeWeapon(metadata.weapon || metadata.arma),
        victim_profile: metadata.victim_profile || metadata.perfil_vitima,
        entry_method: metadata.entry_method || metadata.modo_entrada,
        escape_method: metadata.escape_method || metadata.modo_fuga,
        value_range: categorizeValue(metadata.value || metadata.valor),
        violence_level: metadata.violence_level || metadata.nivel_violencia,
        accomplices: metadata.accomplices || metadata.comparsas || 0,
        region: metadata.region || metadata.bairro,
        metadata
    };
}

function normalizeType(type: string): string {
    const normalized = type.toUpperCase().trim();
    const mapping: Record<string, string> = {
        'ROUBO': 'ROUBO',
        'ROUBO A MAO ARMADA': 'ROUBO',
        'LATROCINIO': 'LATROCINIO',
        'FURTO': 'FURTO',
        'FURTO QUALIFICADO': 'FURTO',
        'HOMICIDIO': 'HOMICIDIO',
        'HOMICIDIO DOLOSO': 'HOMICIDIO',
        'HOMICIDIO CULPOSO': 'HOMICIDIO_CULPOSO',
        'TRAFICO': 'TRAFICO',
        'ESTELIONATO': 'ESTELIONATO',
        'VIOLENCIA DOMESTICA': 'VIOLENCIA_DOMESTICA'
    };
    return mapping[normalized] || normalized;
}

function extractTimeOfDay(time?: string): string | undefined {
    if (!time) return undefined;
    
    const hour = parseInt(time.split(':')[0]);
    if (isNaN(hour)) return undefined;
    
    if (hour >= 0 && hour < 6) return 'madrugada';
    if (hour >= 6 && hour < 12) return 'manha';
    if (hour >= 12 && hour < 18) return 'tarde';
    return 'noite';
}

function extractDayOfWeek(date?: string): string | undefined {
    if (!date) return undefined;
    
    try {
        const d = new Date(date);
        const days = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
        return days[d.getDay()];
    } catch {
        return undefined;
    }
}

function normalizeWeapon(weapon?: string): string | undefined {
    if (!weapon) return undefined;
    
    const w = weapon.toUpperCase();
    if (w.includes('FOGO') || w.includes('REVOLVER') || w.includes('PISTOLA')) return 'arma_fogo';
    if (w.includes('FACA') || w.includes('BRANCA') || w.includes('CANIVETE')) return 'arma_branca';
    return 'sem_arma';
}

function categorizeValue(value?: number | string): string | undefined {
    if (!value) return undefined;
    
    const v = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(v)) return undefined;
    
    if (v < 1000) return 'baixo';
    if (v < 10000) return 'medio';
    return 'alto';
}

// ============================================================================
// COMPARISON FUNCTIONS
// ============================================================================

export function compareSignatures(
    source: CrimeSignature,
    target: CrimeSignature
): { score: number; matching: string[]; differing: string[] } {
    let score = 0;
    const matching: string[] = [];
    const differing: string[] = [];
    
    for (const [factor, weight] of Object.entries(MO_WEIGHTS)) {
        const sourceValue = (source as any)[factor];
        const targetValue = (target as any)[factor];
        
        if (!sourceValue || !targetValue) continue;
        
        if (sourceValue === targetValue) {
            score += weight;
            matching.push(factor);
        } else {
            differing.push(factor);
        }
    }
    
    return { score, matching, differing };
}

export function findSimilarCases(
    source: CrimeSignature,
    candidates: CrimeSignature[],
    minScore: number = 50
): MOMatch[] {
    const matches: MOMatch[] = [];
    
    for (const candidate of candidates) {
        // Skip same investigation
        if (candidate.investigation_id === source.investigation_id) continue;
        
        const { score, matching, differing } = compareSignatures(source, candidate);
        
        if (score >= minScore) {
            matches.push({
                investigation_id: candidate.investigation_id,
                title: `Caso ${candidate.investigation_id}`,
                similarity_score: score,
                matching_factors: matching,
                differing_factors: differing
            });
        }
    }
    
    // Sort by similarity
    return matches.sort((a, b) => b.similarity_score - a.similarity_score);
}

// ============================================================================
// PATTERN DETECTION
// ============================================================================

export function detectPatterns(matches: MOMatch[]): string[] {
    const patterns: string[] = [];
    
    if (matches.length === 0) {
        return ['Nenhum padrão similar identificado'];
    }
    
    // Check for serial indicator
    if (matches.length >= 3) {
        const avgScore = matches.reduce((sum, m) => sum + m.similarity_score, 0) / matches.length;
        if (avgScore > 70) {
            patterns.push(`ALERTA SERIAL: ${matches.length} casos com alta similaridade (média ${avgScore.toFixed(0)}%)`);
        }
    }
    
    // Check for common factors
    const factorCounts: Record<string, number> = {};
    for (const match of matches) {
        for (const factor of match.matching_factors) {
            factorCounts[factor] = (factorCounts[factor] || 0) + 1;
        }
    }
    
    for (const [factor, count] of Object.entries(factorCounts)) {
        if (count >= matches.length * 0.8) {
            const factorNames: Record<string, string> = {
                crime_type: 'tipo de crime',
                location_type: 'tipo de local',
                time_of_day: 'horário',
                weapon_type: 'tipo de arma',
                region: 'região'
            };
            patterns.push(`Padrão recorrente: ${factorNames[factor] || factor}`);
        }
    }
    
    return patterns;
}

// ============================================================================
// MAIN ANALYSIS FUNCTION
// ============================================================================

export function analyzeMO(
    sourceId: string,
    sourceSignature: CrimeSignature,
    allSignatures: CrimeSignature[]
): MOAnalysis {
    const matches = findSimilarCases(sourceSignature, allSignatures);
    const patterns = detectPatterns(matches);
    const serialIndicator = matches.length >= 3 && 
        matches.some(m => m.similarity_score >= 80);
    
    let recommendation = '';
    
    if (serialIndicator) {
        recommendation = 'RECOMENDAÇÃO URGENTE: Possível atuação serial detectada. ' +
            'Consolidar investigações e verificar autoria comum.';
    } else if (matches.length > 0) {
        recommendation = `Verificar possível conexão com ${matches.length} caso(s) similar(es). ` +
            'Considerar cruzamento de dados e testemunhas.';
    } else {
        recommendation = 'Caso aparentemente isolado. Continuar investigação padrão.';
    }
    
    return {
        source_investigation: sourceId,
        source_signature: sourceSignature,
        matches,
        patterns_detected: patterns,
        serial_indicator: serialIndicator,
        recommendation
    };
}

// ============================================================================
// FORMAT FOR DISPLAY
// ============================================================================

export function formatMOAnalysis(analysis: MOAnalysis): string {
    let output = 'ANÁLISE DE MODUS OPERANDI\n';
    output += '═'.repeat(50) + '\n\n';
    
    output += `Investigação: ${analysis.source_investigation}\n`;
    output += `Tipo: ${analysis.source_signature.crime_type}\n\n`;
    
    if (analysis.serial_indicator) {
        output += '⚠️  ALERTA: POSSÍVEL ATUAÇÃO SERIAL DETECTADA ⚠️\n\n';
    }
    
    output += 'CASOS SIMILARES\n';
    output += '─'.repeat(40) + '\n';
    
    if (analysis.matches.length === 0) {
        output += 'Nenhum caso similar encontrado.\n\n';
    } else {
        for (const match of analysis.matches.slice(0, 5)) {
            output += `\n• ${match.title}\n`;
            output += `  Similaridade: ${match.similarity_score}%\n`;
            output += `  Fatores: ${match.matching_factors.join(', ')}\n`;
        }
        output += '\n';
    }
    
    output += 'PADRÕES DETECTADOS\n';
    output += '─'.repeat(40) + '\n';
    for (const pattern of analysis.patterns_detected) {
        output += `• ${pattern}\n`;
    }
    output += '\n';
    
    output += 'RECOMENDAÇÃO\n';
    output += '─'.repeat(40) + '\n';
    output += analysis.recommendation + '\n';
    
    return output;
}

export default {
    extractSignature,
    compareSignatures,
    findSimilarCases,
    detectPatterns,
    analyzeMO,
    formatMOAnalysis
};
