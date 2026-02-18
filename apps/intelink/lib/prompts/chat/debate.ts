/**
 * Debate Prompt - Tsun-cha Protocol
 * 
 * Challenges AI assertions and demands logical justification.
 * "The Defender must prove its premises."
 * 
 * @id chat.debate
 * @version 1.0.0
 * @model google/gemini-2.0-flash-001
 * @updated 2025-12-14
 * @see .guarani/philosophy/TSUN_CHA_PROTOCOL.md
 */

// ============================================
// PROMPT CONFIG
// ============================================

export const promptConfig = {
    id: 'chat.debate',
    name: 'Tsun-cha Debate',
    version: '1.0.0',
    model: 'google/gemini-2.0-flash-001',
    temperature: 0.3,
    maxTokens: 500,
};

// ============================================
// SYSTEM PROMPT
// ============================================

export const DEBATE_SYSTEM_PROMPT = `Você é um VERIFICADOR LÓGICO (Tsun-cha Protocol).
Sua função é analisar uma AFIRMAÇÃO e determinar se ela é logicamente sustentável.

## REGRAS

1. NÃO ACEITE GENERALIZAÇÃO SEM EVIDÊNCIA
   - "Sempre", "nunca", "todos" → QUESTIONE
   
2. VERIFIQUE A BASE LÓGICA
   - A afirmação deriva de fatos ou de suposições?
   
3. BUSQUE CONTRA-EXEMPLOS
   - Existe alguma situação que contradiz a afirmação?

4. IDENTIFIQUE FALÁCIAS COMUNS
   - Ad hominem, apelo à autoridade, falso dilema, etc.

5. AVALIE A FONTE
   - A informação tem procedência verificável?

## OUTPUT (JSON)

Responda APENAS com JSON válido:
{
  "valid": true/false,
  "reasoning": "Explicação curta do porquê",
  "evidence": ["evidência 1", "evidência 2"],
  "confidence": 0.0-1.0,
  "logical_flaws": ["falácia identificada, se houver"],
  "recommendations": ["sugestão de melhoria, se houver"]
}

IMPORTANTE: Não use asteriscos (*) para ênfase. Use MAIÚSCULAS.`;

// ============================================
// TYPES
// ============================================

export interface DebateContext {
    entityId?: string;
    investigationId?: string;
    source?: string;
}

export interface DebateResult {
    valid: boolean;
    reasoning: string;
    evidence: string[];
    confidence: number;
    logical_flaws: string[];
    recommendations?: string[];
}

// ============================================
// BUILDER FUNCTION
// ============================================

/**
 * Build the user message for debate analysis
 */
export function buildDebateUserPrompt(
    assertion: string, 
    context?: DebateContext
): string {
    let contextInfo = '';
    if (context?.entityId) {
        contextInfo += `Entidade ID: ${context.entityId}\n`;
    }
    if (context?.investigationId) {
        contextInfo += `Investigação ID: ${context.investigationId}\n`;
    }
    if (context?.source) {
        contextInfo += `Fonte: ${context.source}\n`;
    }

    return `## AFIRMAÇÃO A DEBATER

"${assertion}"

${contextInfo ? `## CONTEXTO\n${contextInfo}` : ''}

## INSTRUÇÃO

Analise esta afirmação usando o protocolo Tsun-cha.
Determine se ela é logicamente válida ou se contém falácias/generalizações.
Responda APENAS com JSON válido.`;
}

/**
 * Parse the debate result from LLM response
 */
export function parseDebateResult(responseText: string): DebateResult | null {
    try {
        // Try to extract JSON from response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]) as DebateResult;
        }
        return null;
    } catch {
        return null;
    }
}

export default {
    config: promptConfig,
    systemPrompt: DEBATE_SYSTEM_PROMPT,
    buildUserPrompt: buildDebateUserPrompt,
    parseResult: parseDebateResult,
};
