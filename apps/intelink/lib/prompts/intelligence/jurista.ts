/**
 * Jurista IA Prompt
 * 
 * Análise jurídica de textos policiais.
 * Identifica crimes, tipificação penal, flagrantes e artigos.
 * 
 * @id intelligence.jurista
 * @version 1.0.0
 * @model google/gemini-2.0-flash-001
 * @updated 2025-12-15
 */

// ============================================
// PROMPT CONFIG
// ============================================

export const promptConfig = {
    id: 'intelligence.jurista',
    name: 'Jurista IA',
    version: '1.0.0',
    model: 'google/gemini-2.0-flash-001',
    temperature: 0,
    maxTokens: 2000,
};

// ============================================
// SYSTEM PROMPT
// ============================================

export const JURISTA_PROMPT = `Você é um especialista jurídico brasileiro com profundo conhecimento do Código Penal, CPP, e leis especiais (Lei Maria da Penha, Estatuto do Desarmamento, Lei de Drogas, etc).

TEXTO PARA ANÁLISE:
{text}

Analise o texto e forneça uma análise jurídica completa:

## INSTRUÇÕES:

1. **CRIMES IDENTIFICADOS**
   - Liste TODOS os crimes que podem ser tipificados com base nos fatos narrados
   - Para cada crime, cite o artigo específico e a lei
   - Indique se há qualificadoras ou agravantes

2. **SITUAÇÃO DE FLAGRANTE**
   - Avalie se há situação de flagrante delito (art. 302 CPP)
   - Identifique qual tipo: próprio, impróprio, presumido, ou não há flagrante
   - Justifique

3. **CRIMES CONEXOS**
   - Identifique se há conexão entre os crimes (art. 76 CPP)
   - Indique se deve haver unificação de processos

4. **RECOMENDAÇÕES PROCEDIMENTAIS**
   - Indique as providências legais cabíveis
   - Sugira diligências investigativas

5. **ALERTAS IMPORTANTES**
   - Destaque pontos que merecem atenção especial
   - Indique possíveis nulidades ou vícios

Responda APENAS em JSON válido:
{
  "crimes": [
    {
      "crime": "Nome do crime",
      "tipificacao": "Art. X do Código Penal / Lei Y",
      "qualificadoras": ["lista de qualificadoras se houver"],
      "pena_base": "X a Y anos",
      "evidencias_no_texto": "Trecho que fundamenta"
    }
  ],
  "flagrante": {
    "existe": true/false,
    "tipo": "proprio|improprio|presumido|nenhum",
    "fundamento": "Art. 302, inciso X, CPP",
    "justificativa": "..."
  },
  "conexao": {
    "existe": true/false,
    "tipo": "intersubjetiva|objetiva|instrumental|probatoria",
    "crimes_conexos": ["lista de crimes que devem ser julgados juntos"]
  },
  "providencias": [
    {"acao": "...", "fundamento": "...", "prioridade": "alta|media|baixa"}
  ],
  "alertas": [
    {"tipo": "nulidade|atencao|oportunidade", "mensagem": "..."}
  ],
  "resumo_executivo": "Parágrafo resumindo a situação jurídica",
  "confianca": 0.0-1.0
}`;

// ============================================
// TYPES
// ============================================

export interface JuristaCrime {
    crime: string;
    tipificacao: string;
    qualificadoras: string[];
    pena_base: string;
    evidencias_no_texto: string;
}

export interface JuristaFlagrante {
    existe: boolean;
    tipo: 'proprio' | 'improprio' | 'presumido' | 'nenhum';
    fundamento: string;
    justificativa: string;
}

export interface JuristaConexao {
    existe: boolean;
    tipo: 'intersubjetiva' | 'objetiva' | 'instrumental' | 'probatoria';
    crimes_conexos: string[];
}

export interface JuristaProvidencia {
    acao: string;
    fundamento: string;
    prioridade: 'alta' | 'media' | 'baixa';
}

export interface JuristaAlerta {
    tipo: 'nulidade' | 'atencao' | 'oportunidade';
    mensagem: string;
}

export interface JuristaResult {
    crimes: JuristaCrime[];
    flagrante: JuristaFlagrante;
    conexao: JuristaConexao;
    providencias: JuristaProvidencia[];
    alertas: JuristaAlerta[];
    resumo_executivo: string;
    confianca: number;
}

// ============================================
// BUILDER FUNCTION
// ============================================

export function buildJuristaPrompt(text: string): string {
    return JURISTA_PROMPT.replace('{text}', text);
}

// ============================================
// PARSER FUNCTION
// ============================================

export function parseJuristaResult(content: string): JuristaResult {
    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = content;
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        jsonStr = jsonMatch[1] || jsonMatch[0];
    }
    
    return JSON.parse(jsonStr);
}
