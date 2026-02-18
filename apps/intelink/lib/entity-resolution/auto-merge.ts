/**
 * Auto-Merge Logic for Entity Resolution
 * 
 * Handles intelligent merging of entities based on:
 * - CPF match (exact)
 * - Name similarity (>85% Levenshtein)
 * - Combined metadata
 * 
 * @module entity-resolution/auto-merge
 */

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
    const m = str1.length;
    const n = str2.length;
    
    // Create matrix
    const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
    
    // Initialize first row and column
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    
    // Fill matrix
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (str1[i - 1] === str2[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1];
            } else {
                dp[i][j] = 1 + Math.min(
                    dp[i - 1][j],     // deletion
                    dp[i][j - 1],     // insertion
                    dp[i - 1][j - 1]  // substitution
                );
            }
        }
    }
    
    return dp[m][n];
}

/**
 * Calculate similarity score between two names (0-1)
 * Handles common variations: accents, case, extra spaces
 */
export function calculateNameSimilarity(name1: string, name2: string): number {
    // Normalize names
    const normalize = (name: string): string => {
        return name
            .toUpperCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remove accents
            .replace(/\s+/g, ' ')
            .trim();
    };
    
    const n1 = normalize(name1);
    const n2 = normalize(name2);
    
    // Exact match
    if (n1 === n2) return 1.0;
    
    // Calculate Levenshtein similarity
    const maxLen = Math.max(n1.length, n2.length);
    if (maxLen === 0) return 1.0;
    
    const distance = levenshteinDistance(n1, n2);
    const similarity = 1 - (distance / maxLen);
    
    return Math.round(similarity * 100) / 100;
}

/**
 * Check if a CPF is valid for matching purposes
 */
export function isValidCpf(cpf: string | null | undefined): boolean {
    if (!cpf) return false;
    
    const digits = String(cpf).replace(/\D/g, '');
    
    // Must have 11 digits
    if (digits.length !== 11) return false;
    
    // Reject known invalid patterns
    const INVALID_PATTERNS = [
        '00000000000', '11111111111', '22222222222', '33333333333',
        '44444444444', '55555555555', '66666666666', '77777777777',
        '88888888888', '99999999999'
    ];
    
    if (INVALID_PATTERNS.includes(digits)) return false;
    
    // Reject masked/placeholder CPFs
    if (digits.includes('XXXX') || cpf.includes('X')) return false;
    
    return true;
}

/**
 * Configuration for auto-merge behavior
 */
export interface AutoMergeConfig {
    minNameSimilarity: number;  // Default: 0.85
    preferNewerName: boolean;   // Default: true
    mutableFields: string[];    // Fields where newer always wins
    immutableFields: string[];  // Fields that never change once set
}

export const DEFAULT_AUTO_MERGE_CONFIG: AutoMergeConfig = {
    minNameSimilarity: 0.85,
    preferNewerName: true,
    mutableFields: ['endereco', 'telefone', 'ocupacao', 'idade', 'vulgo'],
    immutableFields: ['data_nascimento', 'filiacao', 'naturalidade'],
};

/**
 * Result of an auto-merge operation
 */
export interface AutoMergeResult {
    merged: boolean;
    reason?: string;
    mergedEntityId?: string;
    nameSimilarity?: number;
    cpfMatch?: boolean;
    fieldsUpdated?: string[];
    metadata?: Record<string, unknown>;
}

/**
 * Merge two entities' metadata intelligently
 * 
 * Rules:
 * 1. Newer data fills empty/invalid fields
 * 2. Mutable fields: newer always wins (address, phone)
 * 3. Immutable fields: older value is preserved
 * 4. CPF: prefer longer/more complete
 */
export function mergeMetadata(
    existing: Record<string, unknown>,
    incoming: Record<string, unknown>,
    config: AutoMergeConfig = DEFAULT_AUTO_MERGE_CONFIG
): { merged: Record<string, unknown>; fieldsUpdated: string[] } {
    const merged = { ...existing };
    const fieldsUpdated: string[] = [];
    
    const isInvalid = (v: unknown): boolean => 
        v === null || v === undefined || v === '' || 
        v === 'XXXX' || v === 'XXX' || v === 'X' ||
        v === '0000' || v === '00000000000';
    
    for (const [key, newValue] of Object.entries(incoming)) {
        // Skip internal tracking fields
        if (key.startsWith('_')) continue;
        
        const existingValue = existing[key];
        
        // Skip if new value is invalid
        if (isInvalid(newValue)) continue;
        
        // If existing is empty/invalid, use new
        if (isInvalid(existingValue)) {
            merged[key] = newValue;
            fieldsUpdated.push(key);
            continue;
        }
        
        // Immutable fields: never change
        if (config.immutableFields.includes(key)) continue;
        
        // Mutable fields: newer always wins
        if (config.mutableFields.includes(key)) {
            if (existingValue !== newValue) {
                merged[key] = newValue;
                fieldsUpdated.push(key);
            }
            continue;
        }
        
        // CPF: prefer longer/more complete
        if (key === 'cpf') {
            const oldLen = String(existingValue).replace(/\D/g, '').length;
            const newLen = String(newValue).replace(/\D/g, '').length;
            if (newLen > oldLen) {
                merged[key] = newValue;
                fieldsUpdated.push(key);
            }
            continue;
        }
        
        // Default: keep existing if both are valid
    }
    
    // Add auto-merge tracking
    merged._auto_merged = true;
    merged._merged_at = new Date().toISOString();
    merged._merge_count = ((existing._merge_count as number) || 0) + 1;
    
    return { merged, fieldsUpdated };
}

/**
 * Determine if two entities should be auto-merged
 */
export function shouldAutoMerge(
    entity1: { name: string; type: string; metadata?: Record<string, unknown> },
    entity2: { name: string; type: string; metadata?: Record<string, unknown> },
    config: AutoMergeConfig = DEFAULT_AUTO_MERGE_CONFIG
): { shouldMerge: boolean; reason: string; similarity: number; cpfMatch: boolean } {
    // Must be same type
    if (entity1.type !== entity2.type) {
        return { shouldMerge: false, reason: 'Different entity types', similarity: 0, cpfMatch: false };
    }
    
    const cpf1 = entity1.metadata?.cpf ? String(entity1.metadata.cpf) : null;
    const cpf2 = entity2.metadata?.cpf ? String(entity2.metadata.cpf) : null;
    
    const cpf1Valid = isValidCpf(cpf1);
    const cpf2Valid = isValidCpf(cpf2);
    
    // If both have valid CPFs, they must match
    if (cpf1Valid && cpf2Valid) {
        const cpf1Digits = cpf1!.replace(/\D/g, '');
        const cpf2Digits = cpf2!.replace(/\D/g, '');
        
        if (cpf1Digits !== cpf2Digits) {
            return { 
                shouldMerge: false, 
                reason: 'Different valid CPFs', 
                similarity: 0, 
                cpfMatch: false 
            };
        }
        
        // CPFs match - check name similarity for confirmation
        const similarity = calculateNameSimilarity(entity1.name, entity2.name);
        
        if (similarity >= config.minNameSimilarity) {
            return {
                shouldMerge: true,
                reason: `CPF idêntico + nome ${Math.round(similarity * 100)}% similar`,
                similarity,
                cpfMatch: true
            };
        } else {
            // Same CPF but very different names - might be data error
            // Still merge but flag for review
            return {
                shouldMerge: true,
                reason: `CPF idêntico (nomes ${Math.round(similarity * 100)}% similares - revisar)`,
                similarity,
                cpfMatch: true
            };
        }
    }
    
    // If neither has valid CPF, check name similarity only
    if (!cpf1Valid && !cpf2Valid) {
        const similarity = calculateNameSimilarity(entity1.name, entity2.name);
        
        if (similarity >= config.minNameSimilarity) {
            return {
                shouldMerge: true,
                reason: `Nome ${Math.round(similarity * 100)}% similar (sem CPF válido)`,
                similarity,
                cpfMatch: false
            };
        }
    }
    
    return { shouldMerge: false, reason: 'No matching criteria', similarity: 0, cpfMatch: false };
}

/**
 * Create a merge notification record
 */
export interface MergeNotification {
    type: 'auto_merge';
    entityId: string;
    mergedFromId: string;
    reason: string;
    similarity: number;
    cpfMatch: boolean;
    fieldsUpdated: string[];
    timestamp: string;
}

export function createMergeNotification(
    targetEntityId: string,
    sourceEntityId: string,
    mergeResult: AutoMergeResult
): MergeNotification {
    return {
        type: 'auto_merge',
        entityId: targetEntityId,
        mergedFromId: sourceEntityId,
        reason: mergeResult.reason || 'Auto-merge',
        similarity: mergeResult.nameSimilarity || 0,
        cpfMatch: mergeResult.cpfMatch || false,
        fieldsUpdated: mergeResult.fieldsUpdated || [],
        timestamp: new Date().toISOString(),
    };
}
