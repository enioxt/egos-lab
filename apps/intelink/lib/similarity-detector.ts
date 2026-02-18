/**
 * INTELINK Similarity Detector
 * Detecta possíveis vínculos entre entidades baseado em:
 * - Endereços próximos (mesmo número ou vizinhos)
 * - Telefones em formatos diferentes
 * - Nomes similares com mesma filiação
 * - Sobrenomes em comum
 */

export interface SimilarityMatch {
    entity1_id: string;
    entity1_name: string;
    entity2_id: string;
    entity2_name: string;
    match_type: 'ADDRESS' | 'PHONE' | 'NAME' | 'MOTHER' | 'SURNAME';
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    description: string;
    needs_validation: boolean;
}

interface Entity {
    id: string;
    name: string;
    metadata?: {
        phone?: string;
        address?: string;
        mother?: string;
        cpf?: string;
        [key: string]: unknown;
    };
}

/**
 * Normaliza número de telefone removendo formatação
 * Ex: (34) 9-9999-9999 → 34999999999
 */
export function normalizePhone(phone: string | undefined): string {
    if (!phone) return '';
    return phone.replace(/[\s\-\.\(\)]/g, '');
}

/**
 * Extrai número e rua de um endereço
 */
export function parseAddress(address: string | undefined): { street: string; number: string } | null {
    if (!address) return null;
    
    // Padrões comuns de endereço
    // Rua ABC, 123 | Rua ABC 123 | Rua ABC n. 123 | Rua ABC nº 123
    const patterns = [
        /^(.+?)[,\s]+(?:n[º°.]?\s*)?(\d+)/i,
        /^(.+?)\s+(\d+)$/i,
    ];
    
    for (const pattern of patterns) {
        const match = address.match(pattern);
        if (match) {
            return {
                street: match[1].trim().toLowerCase(),
                number: match[2]
            };
        }
    }
    
    return null;
}

/**
 * Normaliza nome removendo acentos, preposições e espaços extras
 */
export function normalizeName(name: string | undefined): string {
    if (!name) return '';
    
    return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/\b(de|da|do|dos|das|e)\b/gi, '') // Remove preposições
        .replace(/\s+/g, ' ') // Normaliza espaços
        .trim();
}

/**
 * Extrai sobrenomes de um nome completo
 */
export function extractSurnames(name: string): string[] {
    const normalized = normalizeName(name);
    const parts = normalized.split(' ');
    
    // Remove primeiro nome, retorna sobrenomes
    if (parts.length > 1) {
        return parts.slice(1);
    }
    return [];
}

/**
 * Calcula similaridade entre dois nomes (0-1)
 * Usa distância de Levenshtein normalizada
 */
export function nameSimilarity(name1: string, name2: string): number {
    const n1 = normalizeName(name1);
    const n2 = normalizeName(name2);
    
    if (n1 === n2) return 1;
    
    const len1 = n1.length;
    const len2 = n2.length;
    
    if (len1 === 0 || len2 === 0) return 0;
    
    // Distância de Levenshtein
    const matrix: number[][] = [];
    
    for (let i = 0; i <= len1; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
        matrix[0][j] = j;
    }
    
    for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
            const cost = n1[i - 1] === n2[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + cost
            );
        }
    }
    
    const distance = matrix[len1][len2];
    const maxLen = Math.max(len1, len2);
    
    return 1 - (distance / maxLen);
}

/**
 * Verifica se dois endereços são vizinhos (números próximos na mesma rua)
 */
export function areNeighbors(addr1: string | undefined, addr2: string | undefined): { isNeighbor: boolean; distance: number } {
    const parsed1 = parseAddress(addr1);
    const parsed2 = parseAddress(addr2);
    
    if (!parsed1 || !parsed2) return { isNeighbor: false, distance: -1 };
    
    // Verificar se é a mesma rua (similaridade > 0.8)
    const streetSimilarity = nameSimilarity(parsed1.street, parsed2.street);
    
    if (streetSimilarity < 0.8) return { isNeighbor: false, distance: -1 };
    
    const num1 = parseInt(parsed1.number);
    const num2 = parseInt(parsed2.number);
    
    const distance = Math.abs(num1 - num2);
    
    // Considera vizinho se diferença <= 10 números
    return {
        isNeighbor: distance <= 10 && distance > 0,
        distance
    };
}

/**
 * Detecta todas as similaridades em uma lista de entidades
 */
export function detectSimilarities(entities: Entity[]): SimilarityMatch[] {
    const matches: SimilarityMatch[] = [];
    
    for (let i = 0; i < entities.length; i++) {
        for (let j = i + 1; j < entities.length; j++) {
            const e1 = entities[i];
            const e2 = entities[j];
            
            // 1. Verificar telefones
            const phone1 = normalizePhone(e1.metadata?.phone as string);
            const phone2 = normalizePhone(e2.metadata?.phone as string);
            
            if (phone1 && phone2 && phone1 === phone2) {
                matches.push({
                    entity1_id: e1.id,
                    entity1_name: e1.name,
                    entity2_id: e2.id,
                    entity2_name: e2.name,
                    match_type: 'PHONE',
                    confidence: 'HIGH',
                    description: `Mesmo telefone: ${phone1}`,
                    needs_validation: true
                });
            }
            
            // 2. Verificar endereços vizinhos
            const addr1 = e1.metadata?.address as string;
            const addr2 = e2.metadata?.address as string;
            const { isNeighbor, distance } = areNeighbors(addr1, addr2);
            
            if (isNeighbor) {
                matches.push({
                    entity1_id: e1.id,
                    entity1_name: e1.name,
                    entity2_id: e2.id,
                    entity2_name: e2.name,
                    match_type: 'ADDRESS',
                    confidence: distance <= 2 ? 'HIGH' : distance <= 5 ? 'MEDIUM' : 'LOW',
                    description: `Vizinhos (${distance} números de diferença): ${addr1} ↔ ${addr2}`,
                    needs_validation: true
                });
            }
            
            // 3. Verificar mesma mãe com nomes diferentes
            const mother1 = e1.metadata?.mother as string;
            const mother2 = e2.metadata?.mother as string;
            
            if (mother1 && mother2) {
                const motherSim = nameSimilarity(mother1, mother2);
                const nameSim = nameSimilarity(e1.name, e2.name);
                
                // Mesma mãe mas nomes diferentes (podem ser irmãos ou mesma pessoa com nome errado)
                if (motherSim > 0.9 && nameSim < 0.9 && nameSim > 0.5) {
                    matches.push({
                        entity1_id: e1.id,
                        entity1_name: e1.name,
                        entity2_id: e2.id,
                        entity2_name: e2.name,
                        match_type: 'MOTHER',
                        confidence: motherSim > 0.95 ? 'HIGH' : 'MEDIUM',
                        description: `Mesma mãe (${mother1}) - Possível mesma pessoa ou parentes`,
                        needs_validation: true
                    });
                }
            }
            
            // 4. Verificar nomes muito similares (possível erro de digitação)
            const nameSimScore = nameSimilarity(e1.name, e2.name);
            
            if (nameSimScore > 0.85 && nameSimScore < 1) {
                matches.push({
                    entity1_id: e1.id,
                    entity1_name: e1.name,
                    entity2_id: e2.id,
                    entity2_name: e2.name,
                    match_type: 'NAME',
                    confidence: nameSimScore > 0.95 ? 'HIGH' : 'MEDIUM',
                    description: `Nomes similares (${Math.round(nameSimScore * 100)}% similar) - Possível mesma pessoa`,
                    needs_validation: true
                });
            }
            
            // 5. Verificar sobrenomes em comum (sem já ter match de nome)
            if (nameSimScore < 0.85) {
                const surnames1 = extractSurnames(e1.name);
                const surnames2 = extractSurnames(e2.name);
                
                const commonSurnames = surnames1.filter(s1 => 
                    surnames2.some(s2 => nameSimilarity(s1, s2) > 0.9)
                );
                
                if (commonSurnames.length >= 2) {
                    matches.push({
                        entity1_id: e1.id,
                        entity1_name: e1.name,
                        entity2_id: e2.id,
                        entity2_name: e2.name,
                        match_type: 'SURNAME',
                        confidence: 'MEDIUM',
                        description: `Sobrenomes em comum: ${commonSurnames.join(', ')}`,
                        needs_validation: true
                    });
                }
            }
        }
    }
    
    return matches;
}

/**
 * Agrupa entidades similares por possível identidade
 */
export function groupPossibleDuplicates(entities: Entity[]): Map<string, Entity[]> {
    const matches = detectSimilarities(entities);
    const groups = new Map<string, Entity[]>();
    const assigned = new Set<string>();
    
    // Criar grupos baseados em matches de alta confiança
    for (const match of matches) {
        if (match.confidence === 'HIGH' && (match.match_type === 'NAME' || match.match_type === 'PHONE')) {
            const groupId = match.entity1_id;
            
            if (!groups.has(groupId)) {
                const e1 = entities.find(e => e.id === match.entity1_id);
                if (e1) groups.set(groupId, [e1]);
            }
            
            if (!assigned.has(match.entity2_id)) {
                const e2 = entities.find(e => e.id === match.entity2_id);
                if (e2) {
                    groups.get(groupId)?.push(e2);
                    assigned.add(match.entity2_id);
                }
            }
        }
    }
    
    return groups;
}

/**
 * Formata matches para exibição no Telegram ou UI
 */
export function formatMatchesForDisplay(matches: SimilarityMatch[]): string {
    if (matches.length === 0) {
        return '✅ Nenhuma similaridade suspeita encontrada.';
    }
    
    const byType = new Map<string, SimilarityMatch[]>();
    
    for (const match of matches) {
        const key = match.match_type;
        if (!byType.has(key)) byType.set(key, []);
        byType.get(key)?.push(match);
    }
    
    let result = `⚠️ **${matches.length} SIMILARIDADES DETECTADAS**\n\n`;
    
    const typeLabels: Record<string, string> = {
        'PHONE': '📞 MESMO TELEFONE',
        'ADDRESS': '🏠 VIZINHOS',
        'NAME': '👤 NOMES SIMILARES',
        'MOTHER': '👩 MESMA MÃE',
        'SURNAME': '👨‍👩‍👧 SOBRENOMES EM COMUM'
    };
    
    for (const [type, typeMatches] of byType) {
        result += `\n**${typeLabels[type] || type}**\n`;
        
        for (const match of typeMatches) {
            const conf = match.confidence === 'HIGH' ? '🔴' : match.confidence === 'MEDIUM' ? '🟡' : '🟢';
            result += `${conf} ${match.entity1_name} ↔ ${match.entity2_name}\n`;
            result += `   └ ${match.description}\n`;
        }
    }
    
    result += `\n⚡ Use /validar [id1] [id2] para confirmar ou descartar vínculos.`;
    
    return result;
}
