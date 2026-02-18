/**
 * Guardian AI Prompt
 * 
 * Quick analysis before saving documents.
 * Identifies missed entities, corrections, and alerts.
 * 
 * @id documents.guardian
 * @version 1.0.0
 * @model google/gemini-2.0-flash-001
 * @updated 2025-12-14
 */

// ============================================
// PROMPT CONFIG
// ============================================

export const promptConfig = {
    id: 'documents.guardian',
    name: 'Guardian AI',
    version: '1.0.0',
    model: 'google/gemini-2.0-flash-001',
    temperature: 0,
    maxTokens: 1000,
};

// ============================================
// SYSTEM PROMPT
// ============================================

export const GUARDIAN_PROMPT = `Você é um assistente de análise policial. Analise o texto e as entidades extraídas.

TEXTO ORIGINAL:
{text}

ENTIDADES EXTRAÍDAS:
{entities}

Sua tarefa é identificar:

1. ENTIDADES PERDIDAS
   - Pessoas, veículos, telefones ou locais mencionados no texto mas NÃO listados nas entidades
   - CPFs, RGs, placas que aparecem no texto mas não foram extraídos
   
2. CORREÇÕES
   - Nomes mal formatados ou com possíveis erros de digitação
   - Placas com formatação incorreta
   - Telefones com DDD faltando
   
3. ALERTAS
   - Dados críticos que parecem estar faltando
   - Inconsistências entre o texto e as entidades extraídas
   - Informações que precisam de verificação

Responda APENAS em JSON válido:
{
  "missed_entities": [
    {"type": "PERSON|VEHICLE|PHONE|LOCATION|DOCUMENT", "value": "...", "context": "trecho do texto onde aparece"}
  ],
  "corrections": [
    {"original": "nome errado", "suggested": "nome correto", "reason": "..."}
  ],
  "alerts": [
    {"severity": "high|medium|low", "message": "..."}
  ],
  "confidence": 0.0-1.0
}

Se não houver problemas, retorne arrays vazios. 
Seja rigoroso - apenas aponte problemas REAIS.
NÃO invente entidades que não estão claramente no texto.`;

// ============================================
// TYPES
// ============================================

export interface GuardianMissedEntity {
    type: 'PERSON' | 'VEHICLE' | 'PHONE' | 'LOCATION' | 'DOCUMENT';
    value: string;
    context: string;
}

export interface GuardianCorrection {
    original: string;
    suggested: string;
    reason: string;
}

export interface GuardianAlert {
    severity: 'high' | 'medium' | 'low';
    message: string;
}

export interface GuardianResult {
    missed_entities: GuardianMissedEntity[];
    corrections: GuardianCorrection[];
    alerts: GuardianAlert[];
    confidence: number;
}

// ============================================
// BUILDER FUNCTION
// ============================================

/**
 * Build the guardian prompt with text and entities
 */
export function buildGuardianPrompt(text: string, entities: Array<{ type: string; name: string }>): string {
    const entitiesText = entities?.length > 0 
        ? entities.map(e => `- ${e.type}: ${e.name}`).join('\n')
        : '(nenhuma entidade extraída)';
    
    return GUARDIAN_PROMPT
        .replace('{text}', text.substring(0, 3000))
        .replace('{entities}', entitiesText);
}

/**
 * Parse the guardian result from LLM response
 */
export function parseGuardianResult(responseText: string): GuardianResult | null {
    try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]) as GuardianResult;
        }
        return null;
    } catch {
        return null;
    }
}

export default {
    config: promptConfig,
    prompt: GUARDIAN_PROMPT,
    build: buildGuardianPrompt,
    parse: parseGuardianResult,
};
