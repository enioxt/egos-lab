/**
 * Cross-Reference Service
 * 
 * Detecta quando uma entidade cadastrada em uma operação
 * já existe em outra operação.
 * 
 * Níveis de Confiança:
 * - Nível 1: CPF/RG/CNPJ (100%) - Match exato
 * - Nível 2: Nome + Data Nascimento (95%)
 * - Nível 3: Nome + Filiação (90%)
 * - Nível 4: Telefone (85%)
 * - Nível 5: Endereço Fuzzy (80%)
 * - Nível 6: Nome Similar Jaro-Winkler > 0.9 (70%)
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface CrossReferenceMatch {
    // Entidade que FEZ MATCH (da outra operação)
    entityId: string;
    entityName: string;
    entityType: string;
    investigationId: string;
    investigationTitle: string;
    
    // Entidade LOCAL (da operação selecionada) - NOVO!
    sourceEntityId?: string;
    sourceEntityName?: string;
    sourceEntityType?: string;
    sourceInvestigationId?: string;
    
    matchConfidence: number;
    matchCriteria: {
        cpf?: boolean;
        rg?: boolean;
        cnpj?: boolean;
        nomeDataNascimento?: boolean;
        nomeFiliacao?: boolean;
        telefone?: boolean;
        endereco?: number; // fuzzy score
        nomeSimilar?: number; // jaro-winkler score
        placa?: boolean;
        chassi?: boolean;
        alcunha?: boolean;
        enderecoDetalhes?: string; // detalhes do match de endereço
        nomeDetalhes?: string; // detalhes do match de nome
    };
    
    // ALERTAS DE QUALIDADE DE DADOS (erros críticos)
    dataQualityAlert?: {
        type: 'cpf_name_mismatch' | 'filiation_cpf_mismatch' | 'rg_without_cpf';
        severity: 'critical' | 'high' | 'medium';
        message: string;
    };
}

/**
 * Jaro-Winkler similarity algorithm
 * Returns a score between 0 and 1
 */
function jaroWinkler(s1: string, s2: string): number {
    if (s1 === s2) return 1;

    const len1 = s1.length;
    const len2 = s2.length;

    if (len1 === 0 || len2 === 0) return 0;

    const matchDistance = Math.floor(Math.max(len1, len2) / 2) - 1;
    const s1Matches = new Array(len1).fill(false);
    const s2Matches = new Array(len2).fill(false);

    let matches = 0;
    let transpositions = 0;

    // Find matches
    for (let i = 0; i < len1; i++) {
        const start = Math.max(0, i - matchDistance);
        const end = Math.min(i + matchDistance + 1, len2);

        for (let j = start; j < end; j++) {
            if (s2Matches[j] || s1[i] !== s2[j]) continue;
            s1Matches[i] = true;
            s2Matches[j] = true;
            matches++;
            break;
        }
    }

    if (matches === 0) return 0;

    // Count transpositions
    let k = 0;
    for (let i = 0; i < len1; i++) {
        if (!s1Matches[i]) continue;
        while (!s2Matches[k]) k++;
        if (s1[i] !== s2[k]) transpositions++;
        k++;
    }

    const jaro = (matches / len1 + matches / len2 + (matches - transpositions / 2) / matches) / 3;

    // Winkler modification
    let prefix = 0;
    for (let i = 0; i < Math.min(4, Math.min(len1, len2)); i++) {
        if (s1[i] === s2[i]) prefix++;
        else break;
    }

    return jaro + prefix * 0.1 * (1 - jaro);
}

/**
 * Normalize string for comparison
 */
function normalize(str: string | null | undefined): string {
    if (!str) return '';
    return str
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^A-Z0-9]/g, ''); // Only alphanumeric
}

// Prefixos de logradouros que devem ser removidos para comparação
const STREET_PREFIXES = [
    'AVENIDA', 'AV', 'AV.',
    'RUA', 'R', 'R.',
    'TRAVESSA', 'TV', 'TV.',
    'ALAMEDA', 'AL', 'AL.',
    'PRACA', 'PC', 'PC.',
    'ESTRADA', 'EST', 'EST.',
    'RODOVIA', 'ROD', 'ROD.',
    'LARGO', 'LG', 'LG.',
    'BECO', 'BC', 'BC.',
    'VILA', 'VL', 'VL.',
];

/**
 * Parse address into components
 * Example: "Rua São Paulo, 281" -> { type: "RUA", streetName: "São Paulo", number: 281 }
 */
function parseAddress(address: string): { 
    type: string; 
    streetName: string; 
    fullStreet: string; 
    number: number | null 
} {
    if (!address) return { type: '', streetName: '', fullStreet: '', number: null };
    
    // Try to extract number at the end: "Rua São Paulo, 281" or "Rua São Paulo 281"
    const numMatch = address.match(/^(.+?)[,\s]+(\d+)\s*$/);
    const street = numMatch ? numMatch[1].trim() : address;
    const number = numMatch ? parseInt(numMatch[2], 10) : null;
    
    // Normalizar para comparar prefixos
    const streetUpper = street.toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    
    // Extrair tipo (Rua, Avenida, etc.) e nome da rua
    let type = '';
    let streetName = street;
    
    for (const prefix of STREET_PREFIXES) {
        if (streetUpper.startsWith(prefix + ' ') || streetUpper.startsWith(prefix + '.')) {
            type = prefix.replace('.', '');
            // Remover prefixo do nome
            streetName = street.substring(prefix.length).trim();
            if (streetName.startsWith('.') || streetName.startsWith(' ')) {
                streetName = streetName.substring(1).trim();
            }
            break;
        }
    }
    
    return { 
        type, 
        streetName, 
        fullStreet: street,
        number 
    };
}

/**
 * Compare two addresses intelligently
 * 
 * Requirements for match:
 * 1. Same city (if provided)
 * 2. Same street (normalized)
 * 3. Numbers within 50 of each other
 * 
 * Confidence levels:
 * - 85%: Same street, numbers within 10
 * - 80%: Same street, numbers within 25
 * - 75%: Same street, numbers within 50
 * - 70%: Same street, different numbers (> 50)
 */
function compareAddresses(
    addr1: string,
    addr2: string,
    city1?: string,
    city2?: string
): { isMatch: boolean; score: number; confidence: number; details: string } {
    const parsed1 = parseAddress(addr1);
    const parsed2 = parseAddress(addr2);
    
    // IMPORTANTE: Comparar apenas o NOME da rua, sem o prefixo (Rua, Avenida, etc.)
    // Isso evita que "Avenida Brasil" faça match com "Avenida Amazonas"
    const name1Norm = normalize(parsed1.streetName);
    const name2Norm = normalize(parsed2.streetName);
    
    // Se os nomes das ruas estão vazios, usar o endereço completo
    const street1Norm = name1Norm || normalize(parsed1.fullStreet);
    const street2Norm = name2Norm || normalize(parsed2.fullStreet);
    
    // Primeiro: verificar se os nomes das ruas são IGUAIS ou muito similares
    // Exigir score > 0.90 para evitar falsos positivos como "Brasil" vs "Amazonas"
    const streetScore = jaroWinkler(street1Norm, street2Norm);
    if (streetScore < 0.90) {
        return { 
            isMatch: false, 
            score: 0, 
            confidence: 0, 
            details: `Ruas diferentes: ${parsed1.streetName || parsed1.fullStreet} vs ${parsed2.streetName || parsed2.fullStreet}` 
        };
    }
    
    // Se os tipos de logradouro são diferentes (Rua vs Avenida), reduzir confiança
    const sameType = parsed1.type === parsed2.type || !parsed1.type || !parsed2.type;
    
    // Se as cidades são fornecidas, devem ser iguais
    if (city1 && city2) {
        const city1Norm = normalize(city1);
        const city2Norm = normalize(city2);
        if (city1Norm !== city2Norm) {
            return { isMatch: false, score: 0, confidence: 0, details: 'Cidades diferentes' };
        }
    }
    
    // Calcular diferença de números
    let confidence = sameType ? 70 : 65; // Base confidence
    let details = '';
    
    if (parsed1.number !== null && parsed2.number !== null) {
        const diff = Math.abs(parsed1.number - parsed2.number);
        
        if (diff === 0) {
            confidence = sameType ? 90 : 85; // Mesmo número exato
            details = `Mesmo endereço: ${parsed1.fullStreet}, ${parsed1.number}`;
        } else if (diff <= 10) {
            confidence = sameType ? 85 : 80;
            details = `Números próximos: ${parsed1.number} e ${parsed2.number} (diff: ${diff})`;
        } else if (diff <= 25) {
            confidence = sameType ? 80 : 75;
            details = `Mesma região: ${parsed1.number} e ${parsed2.number} (diff: ${diff})`;
        } else if (diff <= 50) {
            confidence = sameType ? 75 : 70;
            details = `Mesma rua: ${parsed1.number} e ${parsed2.number} (diff: ${diff})`;
        } else {
            // Números muito distantes - sem match
            return { 
                isMatch: false, 
                score: 0, 
                confidence: 0, 
                details: `Números muito distantes: ${parsed1.number} e ${parsed2.number} (diff: ${diff})` 
            };
        }
    } else {
        // Um ou ambos endereços sem número
        details = `Mesma rua: ${parsed1.streetName || parsed1.fullStreet}`;
    }
    
    // Adicionar informação da rua completa
    const streetInfo = `${parsed1.type ? parsed1.type + ' ' : ''}${parsed1.streetName || parsed1.fullStreet}`;
    
    return {
        isMatch: true,
        score: Math.round(streetScore * 100),
        confidence,
        details: city1 ? `${streetInfo} - ${city1}: ${details}` : `${streetInfo}: ${details}`
    };
}

// Lista de primeiros nomes muito comuns no Brasil
const NOMES_COMUNS = new Set([
    'JOSE', 'JOAO', 'MARIA', 'ANTONIO', 'FRANCISCO', 'CARLOS', 'PAULO', 
    'PEDRO', 'LUCAS', 'LUIZ', 'MARCOS', 'LUIS', 'GABRIEL', 'RAFAEL',
    'DANIEL', 'MARCELO', 'BRUNO', 'EDUARDO', 'FELIPE', 'RODRIGO',
    'ANA', 'SANDRA', 'ADRIANA', 'JULIANA', 'MARCIA', 'FERNANDA',
    'PATRICIA', 'ALINE', 'AMANDA', 'BRUNA', 'CAMILA', 'CARLA',
    'CLAUDIA', 'CRISTIANE', 'DANIELA', 'JESSICA', 'LARISSA',
    'LETICIA', 'LUCIANA', 'MICHELE', 'RENATA', 'TATIANA', 'VANESSA'
]);

/**
 * Compare two names intelligently
 * 
 * REGRAS:
 * 1. Primeiro nome comum (Marcos, José, Maria) sozinho = SEM MATCH
 * 2. Primeiro + segundo nome iguais = MATCH 75%
 * 3. Nome completo similar (Jaro-Winkler > 0.92) = MATCH 70%
 * 4. Nome + mesma cidade + mesma rua = MATCH 80%
 * 
 * @returns Match result with confidence and details
 */
function compareNames(
    name1: string,
    name2: string,
    meta1: Record<string, any>,
    meta2: Record<string, any>
): { isMatch: boolean; score: number; confidence: number; details: string } {
    if (!name1 || !name2) {
        return { isMatch: false, score: 0, confidence: 0, details: '' };
    }
    
    // Normalizar e dividir nomes
    const parts1 = name1.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().split(/\s+/);
    const parts2 = name2.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().split(/\s+/);
    
    const firstName1 = parts1[0] || '';
    const firstName2 = parts2[0] || '';
    const lastName1 = parts1[parts1.length - 1] || '';
    const lastName2 = parts2[parts2.length - 1] || '';
    const fullName1 = parts1.join('');
    const fullName2 = parts2.join('');

    // Evidências adicionais (ajudam a confirmar nome igual)
    const sameCPF = meta1.cpf && meta2.cpf && normalize(meta1.cpf) === normalize(meta2.cpf);
    const sameRG = meta1.rg && meta2.rg && normalize(meta1.rg) === normalize(meta2.rg);
    const sameBirth = (meta1.data_nascimento || meta1.birth_date) &&
        (meta2.data_nascimento || meta2.birth_date) &&
        normalize(meta1.data_nascimento || meta1.birth_date) === normalize(meta2.data_nascimento || meta2.birth_date);
    const sameMother = (meta1.mae || meta1.mother) && (meta2.mae || meta2.mother) &&
        normalize(meta1.mae || meta1.mother) === normalize(meta2.mae || meta2.mother);
    const sameFather = (meta1.pai || meta1.father) && (meta2.pai || meta2.father) &&
        normalize(meta1.pai || meta1.father) === normalize(meta2.pai || meta2.father);
    const samePhone = (meta1.telefone || meta1.phone) && (meta2.telefone || meta2.phone) &&
        normalize(meta1.telefone || meta1.phone) === normalize(meta2.telefone || meta2.phone);
    const sameProfession = (meta1.profissao || meta1.occupation) && (meta2.profissao || meta2.occupation) &&
        normalize(meta1.profissao || meta1.occupation) === normalize(meta2.profissao || meta2.occupation);

    // Endereço como evidência auxiliar (não decisivo sozinho)
    let addressSupport = false;
    if (meta1.endereco && meta2.endereco) {
        const addr = compareAddresses(
            meta1.endereco,
            meta2.endereco,
            meta1.cidade || meta1.city,
            meta2.cidade || meta2.city
        );
        addressSupport = addr.isMatch && addr.confidence >= 75;
    }

    const evidenceCount = [
        sameCPF,
        sameRG,
        sameBirth,
        sameMother,
        sameFather,
        samePhone,
        sameProfession,
        addressSupport
    ].filter(Boolean).length;

    // Se os primeiros nomes são diferentes, sem match
    if (firstName1 !== firstName2) {
        return { isMatch: false, score: 0, confidence: 0, details: 'Primeiros nomes diferentes' };
    }
    
    // Se apenas o primeiro nome é igual E é um nome comum, SEM MATCH
    // Ex: "Marcos Dias" vs "Marcos Silva" - NÃO é match
    if (NOMES_COMUNS.has(firstName1) && lastName1 !== lastName2) {
        // Verificar se há outros critérios que fortalecem o match
        const sameCidade = meta1.cidade && meta2.cidade && 
            normalize(meta1.cidade) === normalize(meta2.cidade);
        const sameRua = meta1.endereco && meta2.endereco &&
            jaroWinkler(normalize(meta1.endereco), normalize(meta2.endereco)) > 0.85;
        
        // Se mesma cidade E mesma rua, pode ser match fraco
        if (sameCidade && sameRua) {
            return {
                isMatch: true,
                score: 65,
                confidence: 65,
                details: `Nome parcial (${firstName1}) + mesma cidade/rua`
            };
        }
        
        // Nome comum + sobrenomes diferentes = SEM MATCH
        return { 
            isMatch: false, 
            score: 0, 
            confidence: 0, 
            details: `Primeiro nome comum (${firstName1}) com sobrenomes diferentes` 
        };
    }
    
    // Primeiro E último nome iguais: exigir pelo menos 1 evidência adicional
    if (firstName1 === firstName2 && lastName1 === lastName2 && parts1.length > 1 && parts2.length > 1) {
        if (evidenceCount === 0) {
            return {
                isMatch: false,
                score: 0,
                confidence: 0,
                details: 'Nome igual mas sem evidências (CPF/RG/mãe/pai/telefone/endereço/profissão)'
            };
        }
        return {
            isMatch: true,
            score: 85,
            confidence: 75,
            details: `Nome completo igual + ${evidenceCount} evidência(s)`
        };
    }
    
    // Nome completo muito similar (Jaro-Winkler alto)
    const fullScore = jaroWinkler(fullName1, fullName2);
    
    if (fullScore > 0.92) {
        if (evidenceCount === 0) {
            return { isMatch: false, score: 0, confidence: 0, details: 'Nome muito similar, mas sem evidências' };
        }
        return {
            isMatch: true,
            score: Math.round(fullScore * 100),
            confidence: evidenceCount >= 2 ? 75 : 70,
            details: `Nome muito similar (${Math.round(fullScore * 100)}%) + ${evidenceCount} evidência(s)`
        };
    }
    
    // Sem match suficiente
    return { isMatch: false, score: 0, confidence: 0, details: '' };
}

/**
 * Check if two entities match based on multiple criteria
 */
function checkMatch(
    newEntity: { type: string; name: string; metadata?: Record<string, any> },
    existingEntity: { id: string; type: string; name: string; metadata?: Record<string, any>; investigation_id: string; investigation?: { id: string; title: string } }
): CrossReferenceMatch | null {

    // Different types = no match
    if (newEntity.type !== existingEntity.type) return null;

    const newMeta = newEntity.metadata || {};
    const existMeta = existingEntity.metadata || {};

    const matchCriteria: CrossReferenceMatch['matchCriteria'] = {};
    let confidence = 0;
    
    // Normalizar nomes para comparações
    const nameNorm = normalize(newEntity.name);
    const existNameNorm = normalize(existingEntity.name);

    // Level 1: CPF/RG/CNPJ (100%)
    if (newMeta.cpf && existMeta.cpf && normalize(newMeta.cpf) === normalize(existMeta.cpf)) {
        matchCriteria.cpf = true;
        confidence = 100;
        
        // ⚠️ DATA QUALITY CHECK: CPF idêntico + nomes TOTALMENTE diferentes = ERRO CRÍTICO
        // Isso indica erro de digitação ou inserção incorreta
        const nameSimilarity = jaroWinkler(nameNorm, existNameNorm);
        if (nameSimilarity < 0.5) {
            // Nomes são MUITO diferentes (< 50% similares)
            return {
                entityId: existingEntity.id,
                entityName: existingEntity.name,
                entityType: existingEntity.type,
                investigationId: existingEntity.investigation_id,
                investigationTitle: existingEntity.investigation?.title || 'Operação',
                matchConfidence: 100,
                matchCriteria: { cpf: true },
                dataQualityAlert: {
                    type: 'cpf_name_mismatch',
                    severity: 'critical',
                    message: `ERRO CRÍTICO: CPF idêntico (${newMeta.cpf}) mas nomes totalmente diferentes: "${newEntity.name}" vs "${existingEntity.name}". Provavelmente erro de digitação ou cadastro duplicado incorreto.`
                }
            };
        }
    }
    if (newMeta.rg && existMeta.rg && normalize(newMeta.rg) === normalize(existMeta.rg)) {
        matchCriteria.rg = true;
        confidence = Math.max(confidence, 100);
    }
    if (newMeta.cnpj && existMeta.cnpj && normalize(newMeta.cnpj) === normalize(existMeta.cnpj)) {
        matchCriteria.cnpj = true;
        confidence = Math.max(confidence, 100);
    }

    // Level 2: Nome + Data Nascimento (95%)
    if (nameNorm === existNameNorm && newMeta.data_nascimento && existMeta.data_nascimento) {
        if (newMeta.data_nascimento === existMeta.data_nascimento) {
            matchCriteria.nomeDataNascimento = true;
            confidence = Math.max(confidence, 95);
        }
    }

    // Level 3: Nome + Filiação (90%)
    if (nameNorm === existNameNorm) {
        const maeMatch = newMeta.mae && existMeta.mae &&
            jaroWinkler(normalize(newMeta.mae), normalize(existMeta.mae)) > 0.85;
        const paiMatch = newMeta.pai && existMeta.pai &&
            jaroWinkler(normalize(newMeta.pai), normalize(existMeta.pai)) > 0.85;

        if (maeMatch || paiMatch) {
            matchCriteria.nomeFiliacao = true;
            confidence = Math.max(confidence, 90);
        }
    }

    // Level 4: Telefone (85%)
    if (newMeta.telefone && existMeta.telefone) {
        const phone1 = normalize(newMeta.telefone);
        const phone2 = normalize(existMeta.telefone);
        if (phone1 === phone2 && phone1.length >= 10) {
            matchCriteria.telefone = true;
            confidence = Math.max(confidence, 85);
        }
    }

    // Level 5: Endereço Inteligente (75%)
    // Requer: mesma cidade + mesma rua + números próximos (diferença máx 50)
    if (newMeta.endereco && existMeta.endereco) {
        const addressMatch = compareAddresses(
            newMeta.endereco, 
            existMeta.endereco,
            newMeta.cidade || newMeta.city,
            existMeta.cidade || existMeta.city
        );
        
        if (addressMatch.isMatch) {
            matchCriteria.endereco = addressMatch.score;
            matchCriteria.enderecoDetalhes = addressMatch.details;
            confidence = Math.max(confidence, addressMatch.confidence);
        }
    }

    // Level 6: Nome Similar INTELIGENTE
    // NÃO fazer match apenas por primeiro nome igual!
    // Requer: primeiro E segundo nome iguais/similares OU nome + outros critérios
    // 
    // ⚠️ HIERARQUIA DE DADOS CRÍTICA:
    // Se AMBAS as entidades TÊM CPF e os CPFs são DIFERENTES → NÃO são a mesma pessoa!
    // CPF é identificador único nacional. Nome igual + CPF diferente = HOMÔNIMOS, não duplicata.
    //
    if (confidence === 0 && newEntity.type === 'PERSON') {
        // VERIFICAÇÃO DE HOMÔNIMOS: Se ambos têm CPF e são diferentes, NÃO fazer match
        const newCpf = newMeta.cpf ? normalize(newMeta.cpf) : null;
        const existCpf = existMeta.cpf ? normalize(existMeta.cpf) : null;
        
        if (newCpf && existCpf && newCpf !== existCpf) {
            // Ambos têm CPF mas são DIFERENTES = Pessoas diferentes (homônimos)
            // NÃO fazer match por nome similar
            return null;
        }
        
        const nameMatch = compareNames(newEntity.name, existingEntity.name, newMeta, existMeta);
        if (nameMatch.isMatch) {
            matchCriteria.nomeSimilar = nameMatch.score;
            matchCriteria.nomeDetalhes = nameMatch.details;
            confidence = Math.max(confidence, nameMatch.confidence);
        }
    }

    // VEHICLE MATCHING LOGIC
    if (newEntity.type === 'VEHICLE' && existingEntity.type === 'VEHICLE') {
        // Plate (100%)
        if (newMeta.placa && existMeta.placa && normalize(newMeta.placa) === normalize(existMeta.placa)) {
            matchCriteria.placa = true;
            confidence = 100;
        }
        // Chassis (100%)
        if (newMeta.chassi && existMeta.chassi && normalize(newMeta.chassi) === normalize(existMeta.chassi)) {
            matchCriteria.chassi = true;
            confidence = 100;
        }
    }

    // Nickname Match (Weak Link but useful/60%)
    if (newMeta.alcunha && existMeta.alcunha && normalize(newMeta.alcunha) === normalize(existMeta.alcunha)) {
        matchCriteria.alcunha = true;
        confidence = Math.max(confidence, 60);
    }

    // Minimum threshold
    if (confidence < 70) return null;

    return {
        entityId: existingEntity.id,
        entityName: existingEntity.name,
        entityType: existingEntity.type,
        investigationId: existingEntity.investigation_id,
        investigationTitle: existingEntity.investigation?.title || 'Operação',
        matchConfidence: confidence,
        matchCriteria
    };
}

/**
 * Find cross-references for a new entity
 * @param newEntity - The entity to search matches for
 * @param excludeInvestigationId - Investigation to exclude from search
 * @param sourceEntityInfo - Optional: Info about the source entity for display purposes
 */
export async function findCrossReferences(
    newEntity: { type: string; name: string; metadata?: Record<string, any> },
    excludeInvestigationId?: string,
    sourceEntityInfo?: { id: string; name: string; type: string; investigationId: string }
): Promise<CrossReferenceMatch[]> {

    // Fetch all entities of the same type
    let query = supabase
        .from('intelink_entities')
        .select('id, type, name, metadata, investigation_id, investigation:intelink_investigations(id, title)')
        .eq('type', newEntity.type);

    if (excludeInvestigationId) {
        query = query.neq('investigation_id', excludeInvestigationId);
    }

    const { data: existingEntities, error } = await query.limit(500);

    if (error || !existingEntities) {
        console.error('Error fetching entities for cross-reference:', error);
        return [];
    }

    const matches: CrossReferenceMatch[] = [];

    for (const existing of existingEntities) {
        const match = checkMatch(newEntity, existing as any);
        if (match) {
            // Add source entity info if provided
            if (sourceEntityInfo) {
                match.sourceEntityId = sourceEntityInfo.id;
                match.sourceEntityName = sourceEntityInfo.name;
                match.sourceEntityType = sourceEntityInfo.type;
                match.sourceInvestigationId = sourceEntityInfo.investigationId;
            }
            matches.push(match);
        }
    }

    // Sort by confidence descending
    return matches.sort((a, b) => b.matchConfidence - a.matchConfidence);
}

/**
 * Check cross-references for all entities in an investigation
 * Returns matches with BOTH source (local) and target (other investigation) entity info
 */
export async function findAllCrossReferences(investigationId: string): Promise<CrossReferenceMatch[]> {
    // Get all entities from this investigation - NOW INCLUDING ID!
    const { data: entities, error } = await supabase
        .from('intelink_entities')
        .select('id, type, name, metadata')
        .eq('investigation_id', investigationId);

    if (error || !entities) return [];

    const allMatches: CrossReferenceMatch[] = [];

    for (const entity of entities) {
        // Pass source entity info so we know WHICH local entity made the match
        const sourceEntityInfo = {
            id: entity.id,
            name: entity.name,
            type: entity.type,
            investigationId: investigationId
        };
        
        const matches = await findCrossReferences(
            entity as any, 
            investigationId,
            sourceEntityInfo
        );
        allMatches.push(...matches);
    }

    // Remove duplicates (same entityId + sourceEntityId pair)
    const unique = allMatches.filter((match, index, self) =>
        index === self.findIndex(m => 
            m.entityId === match.entityId && 
            m.sourceEntityId === match.sourceEntityId
        )
    );

    return unique.sort((a, b) => b.matchConfidence - a.matchConfidence);
}

/**
 * Get confidence level description
 */
export function getConfidenceLevel(confidence: number): { level: string; color: string; description: string } {
    if (confidence >= 100) {
        return { level: 'MUITO ALTA', color: 'red', description: 'Match por documento único (CPF/RG/CNPJ)' };
    } else if (confidence >= 95) {
        return { level: 'ALTA', color: 'orange', description: 'Match por nome + data de nascimento' };
    } else if (confidence >= 90) {
        return { level: 'ALTA', color: 'orange', description: 'Match por nome + filiação' };
    } else if (confidence >= 85) {
        return { level: 'MÉDIA', color: 'yellow', description: 'Match por telefone' };
    } else if (confidence >= 80) {
        return { level: 'MÉDIA', color: 'yellow', description: 'Match por endereço similar' };
    } else {
        return { level: 'BAIXA', color: 'gray', description: 'Match por nome similar' };
    }
}
