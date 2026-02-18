/**
 * Vision Analysis Prompt
 * 
 * Prompt para análise de imagens em contexto de investigação policial.
 * Utilizado pelo endpoint /api/chat/vision
 * 
 * @id chat.vision
 * @version 1.0.0
 * @model google/gemini-2.0-flash-001
 * @updated 2025-12-14
 */

// ============================================
// PROMPT CONFIG
// ============================================

export const promptConfig = {
    id: 'chat.vision',
    name: 'Vision Analysis',
    version: '1.0.0',
    model: 'google/gemini-2.0-flash-001',
    temperature: 0.3,
    maxTokens: 2000,
};

// ============================================
// SYSTEM PROMPT
// ============================================

export const VISION_SYSTEM_PROMPT = `Você é um assistente especializado em análise de imagens para investigações policiais.
Analise a imagem fornecida e extraia informações relevantes como:

PESSOAS VISÍVEIS:
- Descrição física (altura estimada, biotipo, cor de pele)
- Roupas e acessórios
- Posição na imagem
- Expressões ou comportamentos notáveis

VEÍCULOS:
- Marca e modelo (se identificável)
- Cor
- Placa (se visível, mesmo parcialmente)
- Ano aproximado
- Danos ou características distintivas

LOCAIS:
- Tipo de ambiente (residencial, comercial, rural, urbano)
- Características identificáveis (nomes de ruas, placas, estabelecimentos)
- Horário aproximado (se inferível pela luz/sombras)

OBJETOS RELEVANTES:
- Armas (tipo, modelo se identificável)
- Documentos (tipo, informações visíveis)
- Drogas ou materiais suspeitos
- Equipamentos eletrônicos

TEXTO VISÍVEL:
- Placas de identificação
- Documentos
- Tatuagens com texto
- Grafites ou pichações

REGRAS:
- Seja OBJETIVO e PRECISO
- NÃO invente informações que não estão claramente visíveis
- Indique o nível de confiança quando apropriado (ex: "possivelmente", "aparenta ser")
- Use linguagem técnica policial
- Para ênfase, use MAIÚSCULAS (não asteriscos)
- Se não conseguir identificar algo, diga "Não foi possível identificar"`;

// ============================================
// DEFAULT USER PROMPT
// ============================================

export const VISION_DEFAULT_USER_PROMPT = 'Descreva esta imagem em detalhes, identificando pessoas, veículos, locais e objetos relevantes para uma investigação policial.';

// ============================================
// BUILDER FUNCTION
// ============================================

export interface VisionPromptParams {
    customPrompt?: string;
    focusArea?: 'people' | 'vehicles' | 'locations' | 'objects' | 'all';
    confidenceLevel?: 'high' | 'medium' | 'low';
}

/**
 * Build a customized vision prompt
 */
export function buildVisionPrompt(params: VisionPromptParams = {}): {
    systemPrompt: string;
    userPrompt: string;
} {
    let systemPrompt = VISION_SYSTEM_PROMPT;
    let userPrompt = params.customPrompt || VISION_DEFAULT_USER_PROMPT;
    
    // Add focus area instruction if specified
    if (params.focusArea && params.focusArea !== 'all') {
        const focusMap = {
            people: 'Foque principalmente na identificação de PESSOAS na imagem.',
            vehicles: 'Foque principalmente na identificação de VEÍCULOS na imagem.',
            locations: 'Foque principalmente na identificação do LOCAL e ambiente.',
            objects: 'Foque principalmente na identificação de OBJETOS relevantes.',
        };
        userPrompt = `${focusMap[params.focusArea]} ${userPrompt}`;
    }
    
    return { systemPrompt, userPrompt };
}

export default {
    config: promptConfig,
    systemPrompt: VISION_SYSTEM_PROMPT,
    defaultUserPrompt: VISION_DEFAULT_USER_PROMPT,
    build: buildVisionPrompt,
};
