/**
 * 🔍 Entity Matcher Service
 * 
 * Identifica entidades em texto livre e busca correspondências no banco de dados.
 * Usado para sugerir vínculos antes de salvar novas informações.
 * 
 * Arquitetura de Cache:
 * 1. L1 Cache (In-Memory) - Verificação instantânea
 * 2. L3 Database - Query ao Postgres se não encontrar no cache
 */

import { getSupabaseAdmin } from '../api-utils';
import { getEntityCache, normalizeForCache } from '../cache/entity-cache';

// Tipos de Entidades (Simplificado para matching)
type EntityType = 'PERSON' | 'VEHICLE' | 'LOCATION' | 'PHONE' | 'COMPANY';

interface EntityCandidate {
    originalText: string;
    type: EntityType;
    normalizedValue: string; // CPF sem pontuação, Placa sem traço
    confidence: number; // 0-100
}

interface EntityMatch {
    candidate: EntityCandidate;
    dbEntity?: {
        id: string;
        name: string;
        type: string;
        confidence: number;
        matchReason: string;
        // Extra info for name-based matches
        investigationTitle?: string;
        cpfPartial?: string | null;
        metadata?: any;
    };
}

/**
 * Extrai candidatos de entidades usando RegEx (Rápido e Determinístico)
 */
export function extractCandidatesRegex(text: string): EntityCandidate[] {
    const candidates: EntityCandidate[] = [];
    
    // 1. CPF (Pessoas)
    const cpfRegex = /(?:\D|^)(\d{3}\.?\d{3}\.?\d{3}-?\d{2})(?:\D|$)/g;
    let match;
    while ((match = cpfRegex.exec(text)) !== null) {
        const cpf = match[1].replace(/\D/g, '');
        if (isValidCPF(cpf)) {
            candidates.push({
                originalText: match[1],
                type: 'PERSON',
                normalizedValue: cpf,
                confidence: 100 // CPF é identificador forte
            });
        }
    }

    // 2. Placas (Veículos) - Mercosul e Antiga
    const plateRegex = /(?:\D|^)([A-Z]{3}[0-9][0-9A-Z][0-9]{2})(?:\D|$)/gi;
    while ((match = plateRegex.exec(text)) !== null) {
        candidates.push({
            originalText: match[1].toUpperCase(),
            type: 'VEHICLE',
            normalizedValue: match[1].toUpperCase(),
            confidence: 95
        });
    }

    // 3. CNPJ (Empresas)
    const cnpjRegex = /(?:\D|^)(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2})(?:\D|$)/g;
    while ((match = cnpjRegex.exec(text)) !== null) {
        const cnpj = match[1].replace(/\D/g, '');
        if (isValidCNPJ(cnpj)) {
            candidates.push({
                originalText: match[1],
                type: 'COMPANY',
                normalizedValue: cnpj,
                confidence: 100
            });
        }
    }

    // 4. Telefones
    const phoneRegex = /(?:\D|^)((?:\(?\d{2}\)?\s?)?(?:9\d{4}|\d{4})[ -]?\d{4})(?:\D|$)/g;
    while ((match = phoneRegex.exec(text)) !== null) {
        const phone = match[1].replace(/\D/g, '');
        if (phone.length >= 10) { // Mínimo DDD + 8 dígitos
            candidates.push({
                originalText: match[1],
                type: 'PHONE',
                normalizedValue: phone,
                confidence: 90
            });
        }
    }

    // 5. Nomes Próprios (2+ palavras capitalizadas consecutivas)
    // Ex: "Enio Rocha", "Maria da Silva", "João Pedro Santos"
    const nameRegex = /\b([A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ][a-záàâãéèêíïóôõöúçñ]+(?:\s+(?:da|de|do|dos|das|e|y)?\s*[A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ][a-záàâãéèêíïóôõöúçñ]+)+)\b/g;
    const seenNames = new Set<string>();
    while ((match = nameRegex.exec(text)) !== null) {
        const name = match[1].trim();
        const normalizedName = name.toUpperCase();
        
        // Evitar duplicatas e nomes muito curtos
        if (name.length >= 5 && !seenNames.has(normalizedName)) {
            seenNames.add(normalizedName);
            candidates.push({
                originalText: name,
                type: 'PERSON',
                normalizedValue: normalizedName,
                confidence: 60 // Menor confiança que CPF (pode ser homônimo)
            });
        }
    }

    return candidates;
}

/**
 * Busca correspondências usando Cache L1 primeiro, depois banco de dados
 * @param candidates - Lista de candidatos a entidades
 * @param unitId - Optional: Filter by unit for tenant isolation
 */
export async function findMatchesInDB(
    candidates: EntityCandidate[],
    unitId?: string
): Promise<EntityMatch[]> {
    const cache = getEntityCache();
    const supabase = getSupabaseAdmin();
    const matches: EntityMatch[] = [];

    for (const candidate of candidates) {
        let matchFound = false;

        // 1. CACHE L1: Verificação instantânea (< 1ms)
        // NOTE: Cache is global - for full tenant isolation, skip cache when unitId is set
        // This is a tradeoff: performance vs security
        const useCache = !unitId; // Only use cache for super admins
        
        if (useCache && candidate.type === 'PERSON' && candidate.confidence === 100) {
            const cached = cache.findByCPF(candidate.normalizedValue);
            if (cached) {
                matches.push({
                    candidate,
                    dbEntity: {
                        id: cached.id,
                        name: cached.name,
                        type: cached.type,
                        confidence: 100,
                        matchReason: 'CPF Exato (Cache L1)'
                    }
                });
                matchFound = true;
            }
        } else if (useCache && candidate.type === 'VEHICLE') {
            const cached = cache.findByPlaca(candidate.normalizedValue);
            if (cached) {
                matches.push({
                    candidate,
                    dbEntity: {
                        id: cached.id,
                        name: cached.name,
                        type: cached.type,
                        confidence: 100,
                        matchReason: 'Placa Exata (Cache L1)'
                    }
                });
                matchFound = true;
            }
        } else if (useCache && candidate.type === 'COMPANY' && candidate.confidence === 100) {
            const cached = cache.findByCNPJ(candidate.normalizedValue);
            if (cached) {
                matches.push({
                    candidate,
                    dbEntity: {
                        id: cached.id,
                        name: cached.name,
                        type: cached.type,
                        confidence: 100,
                        matchReason: 'CNPJ Exato (Cache L1)'
                    }
                });
                matchFound = true;
            }
        } else if (useCache && candidate.type === 'PHONE') {
            const cached = cache.findByPhone(candidate.normalizedValue);
            if (cached) {
                matches.push({
                    candidate,
                    dbEntity: {
                        id: cached.id,
                        name: cached.name,
                        type: cached.type,
                        confidence: 90,
                        matchReason: 'Telefone (Cache L1)'
                    }
                });
                matchFound = true;
            }
        }

        // 2. DATABASE L3: Query ao Postgres se não encontrou no cache
        if (!matchFound) {
            // TENANT ISOLATION: Join with investigations to filter by unit
            let baseQuery = unitId
                ? supabase.from('intelink_entities')
                    .select('id, name, type, metadata, investigation_id, intelink_investigations!inner(unit_id)')
                    .eq('intelink_investigations.unit_id', unitId)
                : supabase.from('intelink_entities')
                    .select('id, name, type, metadata, investigation_id');
            
            if (candidate.type === 'PERSON' && candidate.confidence === 100) {
                const { data } = await baseQuery.eq('type', 'PERSON').contains('metadata', { cpf: candidate.normalizedValue }).maybeSingle();
                
                if (data) {
                    // Add to cache for future lookups
                    cache.set(normalizeForCache(data));
                    
                    matches.push({
                        candidate,
                        dbEntity: {
                            id: data.id,
                            name: data.name,
                            type: data.type,
                            confidence: 100,
                            matchReason: 'CPF Exato (DB)'
                        }
                    });
                    matchFound = true;
                }
            } else if (candidate.type === 'VEHICLE') {
                const { data } = await baseQuery.eq('type', 'VEHICLE').contains('metadata', { placa: candidate.normalizedValue }).maybeSingle();
                if (data) {
                    cache.set(normalizeForCache(data));
                    matches.push({
                        candidate,
                        dbEntity: {
                            id: data.id,
                            name: data.name,
                            type: data.type,
                            confidence: 100,
                            matchReason: 'Placa Exata (DB)'
                        }
                    });
                    matchFound = true;
                }
            } else if (candidate.type === 'COMPANY' && candidate.confidence === 100) {
                const { data } = await baseQuery.eq('type', 'COMPANY').contains('metadata', { cnpj: candidate.normalizedValue }).maybeSingle();
                if (data) {
                    cache.set(normalizeForCache(data));
                    matches.push({
                        candidate,
                        dbEntity: {
                            id: data.id,
                            name: data.name,
                            type: data.type,
                            confidence: 100,
                            matchReason: 'CNPJ Exato (DB)'
                        }
                    });
                    matchFound = true;
                }
            } else if (candidate.type === 'PERSON' && candidate.confidence < 100) {
                // Busca por nome (pode ter múltiplos resultados - homônimos)
                const searchQuery = unitId
                    ? supabase.from('intelink_entities')
                        .select(`
                            id, name, type, metadata, investigation_id,
                            intelink_investigations!inner(title, unit_id)
                        `)
                        .eq('intelink_investigations.unit_id', unitId)
                    : supabase.from('intelink_entities')
                        .select(`
                            id, name, type, metadata, investigation_id,
                            intelink_investigations(title)
                        `);
                
                const { data: nameMatches } = await searchQuery
                    .eq('type', 'PERSON')
                    .ilike('name', `%${candidate.normalizedValue}%`)
                    .limit(5);
                
                if (nameMatches && nameMatches.length > 0) {
                    // Retorna todos os matches (usuário escolhe)
                    for (const entity of nameMatches) {
                        const inv = entity.intelink_investigations as any;
                        const cpfPartial = (entity.metadata as any)?.cpf 
                            ? `***.***.${(entity.metadata as any).cpf.slice(-5)}`
                            : null;
                        
                        matches.push({
                            candidate,
                            dbEntity: {
                                id: entity.id,
                                name: entity.name,
                                type: entity.type,
                                confidence: 70,
                                matchReason: 'Nome Similar',
                                // Extra info for UI
                                investigationTitle: inv?.title || 'Operação',
                                cpfPartial,
                                metadata: entity.metadata
                            }
                        });
                    }
                    matchFound = true;
                }
            }
        }

        // Se não achou match, adiciona como "Novo" (sem dbEntity)
        if (!matchFound) {
            matches.push({ candidate });
        }
    }

    return matches;
}

/**
 * Warm cache with recent entities from database
 */
export async function warmCache(limit: number = 500): Promise<number> {
    const cache = getEntityCache();
    const supabase = getSupabaseAdmin();
    
    const { data } = await supabase
        .from('intelink_entities')
        .select('id, name, type, metadata, investigation_id')
        .order('updated_at', { ascending: false })
        .limit(limit);
    
    if (!data) return 0;
    
    const entitiesToCache = data.map(normalizeForCache);
    return cache.bulkLoad(entitiesToCache);
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
    return getEntityCache().stats();
}

// --- Validators ---

function isValidCPF(cpf: string): boolean {
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
    // Validação simplificada para performance (pode melhorar depois)
    return true;
}

function isValidCNPJ(cnpj: string): boolean {
    if (cnpj.length !== 14) return false;
    return true;
}
