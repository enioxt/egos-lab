/**
 * Prompt Classifier - Auto-classify chat prompts by intent
 * 
 * Categories:
 * - QUERY: Questions, lookups, searches
 * - COMMAND: Actions, create, delete, update
 * - ANALYSIS: Summarize, compare, analyze patterns
 * - REPORT: Generate reports, exports
 * - NAVIGATION: Go to, open, show
 * 
 * @version 1.0.0
 */

export type PromptCategory = 
    | 'QUERY' 
    | 'COMMAND' 
    | 'ANALYSIS' 
    | 'REPORT' 
    | 'NAVIGATION'
    | 'UNKNOWN';

export interface ClassificationResult {
    category: PromptCategory;
    confidence: number;
    subcategory?: string;
    keywords: string[];
}

// Keyword patterns for each category
const PATTERNS: Record<PromptCategory, RegExp[]> = {
    QUERY: [
        /^(quem|qual|quais|onde|quando|como|por\s*que|quantos?)/i,
        /\?$/,
        /(buscar?|procurar?|encontrar?|localizar?)/i,
        /(existe|há|tem|possui)/i,
        /(listar?|mostrar?|exibir?)/i,
    ],
    COMMAND: [
        /^(criar?|adicionar?|inserir?|cadastrar?)/i,
        /^(deletar?|remover?|excluir?|apagar?)/i,
        /^(atualizar?|editar?|modificar?|alterar?)/i,
        /^(vincular?|conectar?|associar?|relacionar?)/i,
        /(salvar?|gravar?)/i,
    ],
    ANALYSIS: [
        /(analisar?|análise)/i,
        /(resumir?|resumo|sumarizar?)/i,
        /(comparar?|comparação)/i,
        /(padrão|padrões|tendência|tendências)/i,
        /(identificar?|detectar?)/i,
        /(conexões?|vínculos?|relacionamentos?)/i,
        /(quais?\s+(são\s+)?(os|as)\s+(principais?|envolvidos?))/i,
    ],
    REPORT: [
        /(relatório|report)/i,
        /(exportar?|gerar?\s+pdf|gerar?\s+documento)/i,
        /(consolidar?|consolidado)/i,
        /(estatísticas?|métricas?)/i,
    ],
    NAVIGATION: [
        /^(ir\s+para|abrir?|mostrar?|ver|visualizar?)/i,
        /(página|tela|seção)/i,
        /^(voltar?|retornar?)/i,
    ],
    UNKNOWN: [],
};

// Entity keywords for subcategory detection
const ENTITY_KEYWORDS = {
    PERSON: ['pessoa', 'indivíduo', 'suspeito', 'autor', 'vítima', 'testemunha', 'envolvido'],
    VEHICLE: ['veículo', 'carro', 'moto', 'placa', 'automóvel'],
    LOCATION: ['local', 'endereço', 'lugar', 'localização', 'bairro', 'rua'],
    PHONE: ['telefone', 'celular', 'número', 'ligação', 'chamada'],
    ORGANIZATION: ['facção', 'organização', 'grupo', 'quadrilha', 'pcc', 'cv'],
    INVESTIGATION: ['operação', 'caso', 'operação', 'inquérito'],
};

/**
 * Classify a prompt by its intent
 */
export function classifyPrompt(prompt: string): ClassificationResult {
    const normalizedPrompt = prompt.toLowerCase().trim();
    const scores: Record<PromptCategory, number> = {
        QUERY: 0,
        COMMAND: 0,
        ANALYSIS: 0,
        REPORT: 0,
        NAVIGATION: 0,
        UNKNOWN: 0,
    };
    
    const matchedKeywords: string[] = [];
    
    // Score each category
    for (const [category, patterns] of Object.entries(PATTERNS) as [PromptCategory, RegExp[]][]) {
        for (const pattern of patterns) {
            const match = normalizedPrompt.match(pattern);
            if (match) {
                scores[category] += 1;
                matchedKeywords.push(match[0]);
            }
        }
    }
    
    // Find highest scoring category
    let maxScore = 0;
    let bestCategory: PromptCategory = 'UNKNOWN';
    
    for (const [category, score] of Object.entries(scores) as [PromptCategory, number][]) {
        if (score > maxScore && category !== 'UNKNOWN') {
            maxScore = score;
            bestCategory = category;
        }
    }
    
    // Calculate confidence (0-1)
    const totalMatches = Object.values(scores).reduce((a, b) => a + b, 0);
    const confidence = totalMatches > 0 ? maxScore / Math.max(totalMatches, 3) : 0;
    
    // Detect subcategory (entity type)
    let subcategory: string | undefined;
    for (const [entity, keywords] of Object.entries(ENTITY_KEYWORDS)) {
        if (keywords.some(kw => normalizedPrompt.includes(kw))) {
            subcategory = entity;
            break;
        }
    }
    
    return {
        category: bestCategory,
        confidence: Math.min(confidence, 1),
        subcategory,
        keywords: [...new Set(matchedKeywords)],
    };
}

/**
 * Get human-readable label for category
 */
export function getCategoryLabel(category: PromptCategory): string {
    const labels: Record<PromptCategory, string> = {
        QUERY: '🔍 Consulta',
        COMMAND: '⚡ Comando',
        ANALYSIS: '📊 Análise',
        REPORT: '📄 Relatório',
        NAVIGATION: '🧭 Navegação',
        UNKNOWN: '❓ Indefinido',
    };
    return labels[category];
}

/**
 * Classify and return telemetry-ready metadata
 */
export function classifyForTelemetry(prompt: string): Record<string, any> {
    const result = classifyPrompt(prompt);
    return {
        prompt_category: result.category,
        prompt_confidence: result.confidence,
        prompt_subcategory: result.subcategory,
        prompt_keywords: result.keywords,
        prompt_length: prompt.length,
        prompt_word_count: prompt.split(/\s+/).length,
    };
}
