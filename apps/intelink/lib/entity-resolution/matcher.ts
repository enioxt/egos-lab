/**
 * Entity Resolution - Match Detection
 * 
 * Finds similar/duplicate entities across investigations using:
 * - Exact matching (CPF, plates, phones)
 * - Fuzzy matching (names with Levenshtein)
 * - Phonetic matching (Soundex/Metaphone for names)
 * 
 * Based on academic research:
 * - BoostER: Optimal question selection
 * - COMEM: Match/Compare/Select strategies
 * 
 * @version 1.0.0
 */

export interface Entity {
    id: string;
    name: string;
    type: 'PERSON' | 'VEHICLE' | 'LOCATION' | 'PHONE' | 'COMPANY' | 'ORGANIZATION' | 'FIREARM';
    investigation_id: string;
    investigation_title?: string;
    metadata?: Record<string, any>;
}

export interface MatchCandidate {
    entity1: Entity;
    entity2: Entity;
    score: number;
    matchType: 'exact' | 'fuzzy' | 'phonetic' | 'partial';
    matchedFields: string[];
    confidence: 'high' | 'medium' | 'low';
}

export interface MatchResult {
    candidates: MatchCandidate[];
    stats: {
        totalEntities: number;
        totalMatches: number;
        highConfidence: number;
        mediumConfidence: number;
        lowConfidence: number;
    };
}

// ============================================================================
// STRING SIMILARITY
// ============================================================================

/**
 * Levenshtein distance between two strings
 */
function levenshteinDistance(a: string, b: string): number {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }

    return matrix[b.length][a.length];
}

/**
 * Calculate similarity ratio (0-1) using Levenshtein
 */
export function stringSimilarity(a: string, b: string): number {
    if (!a || !b) return 0;
    const normalizedA = normalizeString(a);
    const normalizedB = normalizeString(b);
    
    if (normalizedA === normalizedB) return 1;
    
    const maxLen = Math.max(normalizedA.length, normalizedB.length);
    if (maxLen === 0) return 1;
    
    const distance = levenshteinDistance(normalizedA, normalizedB);
    return 1 - distance / maxLen;
}

/**
 * Normalize string for comparison
 */
function normalizeString(str: string): string {
    return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^a-z0-9\s]/g, '') // Remove special chars
        .replace(/\s+/g, ' ')
        .trim();
}

// ============================================================================
// PHONETIC MATCHING (Simplified Soundex)
// ============================================================================

/**
 * Simple Soundex implementation for Portuguese names
 */
function soundex(str: string): string {
    const normalized = normalizeString(str);
    if (!normalized) return '';
    
    const codes: Record<string, string> = {
        'b': '1', 'f': '1', 'p': '1', 'v': '1',
        'c': '2', 'g': '2', 'j': '2', 'k': '2', 'q': '2', 's': '2', 'x': '2', 'z': '2',
        'd': '3', 't': '3',
        'l': '4',
        'm': '5', 'n': '5',
        'r': '6',
    };
    
    const firstLetter = normalized[0].toUpperCase();
    let result = firstLetter;
    let prevCode = codes[normalized[0]] || '';
    
    for (let i = 1; i < normalized.length && result.length < 4; i++) {
        const char = normalized[i];
        const code = codes[char];
        
        if (code && code !== prevCode) {
            result += code;
            prevCode = code;
        } else if (!code) {
            prevCode = '';
        }
    }
    
    return result.padEnd(4, '0');
}

/**
 * Check if two names are phonetically similar
 */
export function phoneticMatch(name1: string, name2: string): boolean {
    const soundex1 = soundex(name1);
    const soundex2 = soundex(name2);
    return soundex1 === soundex2 && soundex1 !== '';
}

// ============================================================================
// FIELD EXTRACTORS
// ============================================================================

/**
 * Invalid CPF patterns - placeholders that should be ignored
 */
const INVALID_CPF_PATTERNS = [
    /^X+$/i,                    // XXXX, xxxx
    /^0+$/,                     // 0000, 00000000000
    /^1+$/,                     // 1111, 11111111111
    /^9+$/,                     // 9999, 99999999999
    /^000\.?000\.?000-?00$/,    // 000.000.000-00
    /^111\.?111\.?111-?11$/,    // 111.111.111-11
    /^999\.?999\.?999-?99$/,    // 999.999.999-99
    /^123\.?456\.?789-?0\d$/,   // 123.456.789-0X
];

/**
 * Check if CPF is a placeholder/invalid
 */
function isInvalidCPF(cpf: string): boolean {
    if (!cpf) return true;
    
    // Remove formatting
    const cleaned = cpf.replace(/\D/g, '');
    
    // Too short or too long
    if (cleaned.length < 4 || cleaned.length > 14) return true;
    
    // Check against known invalid patterns
    for (const pattern of INVALID_CPF_PATTERNS) {
        if (pattern.test(cpf) || pattern.test(cleaned)) {
            return true;
        }
    }
    
    // All same digits
    if (/^(\d)\1+$/.test(cleaned)) {
        return true;
    }
    
    return false;
}

/**
 * Extract CPF from entity metadata (validates against placeholders)
 */
function extractCPF(entity: Entity): string | null {
    const meta = entity.metadata || {};
    const cpf = meta.cpf || meta.CPF || meta.documento || null;
    
    // Return null for invalid/placeholder CPFs
    if (!cpf || isInvalidCPF(cpf)) {
        return null;
    }
    
    return cpf.replace(/\D/g, ''); // Return normalized (digits only)
}

/**
 * Extract plate from entity metadata
 */
function extractPlate(entity: Entity): string | null {
    const meta = entity.metadata || {};
    const plate = meta.placa || meta.plate || meta.PLACA || null;
    return plate ? plate.replace(/[^A-Z0-9]/gi, '').toUpperCase() : null;
}

/**
 * Extract phone from entity metadata
 */
function extractPhone(entity: Entity): string | null {
    const meta = entity.metadata || {};
    const phone = meta.telefone || meta.phone || meta.celular || entity.name;
    if (entity.type === 'PHONE' || phone) {
        return phone?.replace(/\D/g, '') || null;
    }
    return null;
}

// ============================================================================
// MATCH DETECTION
// ============================================================================

/**
 * Check if two entities match based on exact identifiers
 */
function checkExactMatch(e1: Entity, e2: Entity): { match: boolean; fields: string[] } {
    const fields: string[] = [];
    
    // CPF match (PERSON only)
    if (e1.type === 'PERSON' && e2.type === 'PERSON') {
        const cpf1 = extractCPF(e1);
        const cpf2 = extractCPF(e2);
        if (cpf1 && cpf2 && cpf1 === cpf2) {
            fields.push('cpf');
        }
    }
    
    // Plate match (VEHICLE only)
    if (e1.type === 'VEHICLE' && e2.type === 'VEHICLE') {
        const plate1 = extractPlate(e1);
        const plate2 = extractPlate(e2);
        if (plate1 && plate2 && plate1 === plate2) {
            fields.push('placa');
        }
    }
    
    // Phone match
    if (e1.type === 'PHONE' && e2.type === 'PHONE') {
        const phone1 = extractPhone(e1);
        const phone2 = extractPhone(e2);
        if (phone1 && phone2 && phone1 === phone2) {
            fields.push('telefone');
        }
    }
    
    // Exact name match
    if (normalizeString(e1.name) === normalizeString(e2.name)) {
        fields.push('nome');
    }
    
    return { match: fields.length > 0, fields };
}

/**
 * Check fuzzy name match
 */
function checkFuzzyMatch(e1: Entity, e2: Entity, threshold: number = 0.85): { match: boolean; score: number } {
    const similarity = stringSimilarity(e1.name, e2.name);
    return { match: similarity >= threshold, score: similarity };
}

/**
 * Find all matches between two sets of entities
 */
export function findMatches(
    entities: Entity[],
    options: {
        sameInvestigation?: boolean;
        minScore?: number;
        types?: Entity['type'][];
    } = {}
): MatchResult {
    const { sameInvestigation = false, minScore = 0.7, types } = options;
    const candidates: MatchCandidate[] = [];
    
    // Filter by type if specified
    const filtered = types ? entities.filter(e => types.includes(e.type)) : entities;
    
    // Compare each pair
    for (let i = 0; i < filtered.length; i++) {
        for (let j = i + 1; j < filtered.length; j++) {
            const e1 = filtered[i];
            const e2 = filtered[j];
            
            // Skip same investigation unless explicitly allowed
            if (!sameInvestigation && e1.investigation_id === e2.investigation_id) {
                continue;
            }
            
            // Skip different types
            if (e1.type !== e2.type) {
                continue;
            }
            
            // Check exact match
            const exactResult = checkExactMatch(e1, e2);
            if (exactResult.match) {
                candidates.push({
                    entity1: e1,
                    entity2: e2,
                    score: 1.0,
                    matchType: 'exact',
                    matchedFields: exactResult.fields,
                    confidence: 'high',
                });
                continue;
            }
            
            // Check fuzzy match
            const fuzzyResult = checkFuzzyMatch(e1, e2, minScore);
            if (fuzzyResult.match) {
                const isPhonetic = phoneticMatch(e1.name, e2.name);
                candidates.push({
                    entity1: e1,
                    entity2: e2,
                    score: fuzzyResult.score,
                    matchType: isPhonetic ? 'phonetic' : 'fuzzy',
                    matchedFields: ['nome'],
                    confidence: fuzzyResult.score >= 0.95 ? 'high' : fuzzyResult.score >= 0.85 ? 'medium' : 'low',
                });
            }
        }
    }
    
    // Sort by score descending
    candidates.sort((a, b) => b.score - a.score);
    
    // Calculate stats
    const stats = {
        totalEntities: filtered.length,
        totalMatches: candidates.length,
        highConfidence: candidates.filter(c => c.confidence === 'high').length,
        mediumConfidence: candidates.filter(c => c.confidence === 'medium').length,
        lowConfidence: candidates.filter(c => c.confidence === 'low').length,
    };
    
    return { candidates, stats };
}

/**
 * Find matches for a single entity against a list
 */
export function findMatchesForEntity(
    entity: Entity,
    candidates: Entity[],
    options: { minScore?: number } = {}
): MatchCandidate[] {
    const { minScore = 0.7 } = options;
    const matches: MatchCandidate[] = [];
    
    for (const candidate of candidates) {
        if (candidate.id === entity.id) continue;
        if (candidate.type !== entity.type) continue;
        
        // Check exact match
        const exactResult = checkExactMatch(entity, candidate);
        if (exactResult.match) {
            matches.push({
                entity1: entity,
                entity2: candidate,
                score: 1.0,
                matchType: 'exact',
                matchedFields: exactResult.fields,
                confidence: 'high',
            });
            continue;
        }
        
        // Check fuzzy match
        const fuzzyResult = checkFuzzyMatch(entity, candidate, minScore);
        if (fuzzyResult.match) {
            matches.push({
                entity1: entity,
                entity2: candidate,
                score: fuzzyResult.score,
                matchType: phoneticMatch(entity.name, candidate.name) ? 'phonetic' : 'fuzzy',
                matchedFields: ['nome'],
                confidence: fuzzyResult.score >= 0.95 ? 'high' : fuzzyResult.score >= 0.85 ? 'medium' : 'low',
            });
        }
    }
    
    return matches.sort((a, b) => b.score - a.score);
}

// ============================================================================
// BOOSTER: OPTIMAL QUESTION SELECTION
// ============================================================================

export interface BoosterQuestion {
    field: string;
    label: string;
    priority: number;
    expectedGain: number;
}

/**
 * Generate optimal questions to distinguish between candidates
 * Based on BoostER paper: asks questions that maximize information gain
 */
export function generateOptimalQuestions(
    candidate: MatchCandidate
): BoosterQuestion[] {
    const questions: BoosterQuestion[] = [];
    const e1 = candidate.entity1;
    const e2 = candidate.entity2;
    
    // Questions based on entity type
    if (e1.type === 'PERSON') {
        // CPF is the most discriminative
        if (!extractCPF(e1) || !extractCPF(e2)) {
            questions.push({
                field: 'cpf',
                label: 'Qual o CPF desta pessoa?',
                priority: 1,
                expectedGain: 0.95,
            });
        }
        
        // Birth date is highly discriminative
        questions.push({
            field: 'data_nascimento',
            label: 'Qual a data de nascimento?',
            priority: 2,
            expectedGain: 0.85,
        });
        
        // Mother's name is traditional identifier
        questions.push({
            field: 'nome_mae',
            label: 'Qual o nome da mãe?',
            priority: 3,
            expectedGain: 0.80,
        });
    }
    
    if (e1.type === 'VEHICLE') {
        // Chassis is unique
        questions.push({
            field: 'chassi',
            label: 'Qual o número do chassi?',
            priority: 1,
            expectedGain: 0.99,
        });
        
        // RENAVAM is unique
        questions.push({
            field: 'renavam',
            label: 'Qual o RENAVAM?',
            priority: 2,
            expectedGain: 0.98,
        });
    }
    
    if (e1.type === 'PHONE') {
        // Owner name
        questions.push({
            field: 'proprietario',
            label: 'Quem é o proprietário da linha?',
            priority: 1,
            expectedGain: 0.70,
        });
    }
    
    return questions.sort((a, b) => a.priority - b.priority);
}
