/**
 * LLM Verifier - AI-powered match verification
 * 
 * Uses LLM to verify uncertain matches (70-89% confidence)
 * Based on COMEM/BoostER research for optimal entity resolution
 * 
 * @version 1.0.0
 * @updated 2025-12-05
 */

import OpenAI from 'openai';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-001';

// Initialize OpenRouter client
function getClient(): OpenAI | null {
    if (!OPENROUTER_API_KEY) {
        console.warn('[LLM Verifier] OPENROUTER_API_KEY not configured');
        return null;
    }
    return new OpenAI({
        apiKey: OPENROUTER_API_KEY,
        baseURL: 'https://openrouter.ai/api/v1',
    });
}

// ========================================
// TYPES
// ========================================

export interface EntityForVerification {
    name: string;
    type: string;
    metadata?: Record<string, any>;
    investigationTitle?: string;
}

export interface MatchVerificationRequest {
    entity1: EntityForVerification;
    entity2: EntityForVerification;
    matchCriteria: Record<string, any>;
    currentConfidence: number;
}

export interface MatchVerificationResult {
    verified: boolean;
    confidence: number;  // AI-adjusted confidence (0-100)
    reasoning: string;
    suggestedAction: 'confirm' | 'reject' | 'review';
    processingTime: number;
    model: string;
}

// ========================================
// PROMPTS
// ========================================

const VERIFICATION_SYSTEM_PROMPT = `Você é um especialista em análise de inteligência policial.
Sua tarefa é verificar se duas entidades representam a mesma pessoa/objeto/local do mundo real.

REGRAS:
1. Analise TODOS os dados disponíveis de ambas entidades
2. Considere variações de escrita (apelidos, abreviações, erros de digitação)
3. CPF/RG/CNPJ idênticos = MESMA entidade (100% confiança)
4. Nome + Data Nascimento idênticos = PROVÁVEL mesma entidade (90%+)
5. Apenas nome similar = INCERTO (precisa mais dados)
6. Dados conflitantes (ex: mesmo nome, datas diferentes) = PROVAVELMENTE NÃO é a mesma

RESPONDA APENAS EM JSON com esta estrutura:
{
  "verified": boolean,          // true se você tem certeza que são a mesma entidade
  "confidence": number,         // 0-100, sua confiança na decisão
  "reasoning": string,          // Explicação curta (máx 200 chars)
  "suggestedAction": "confirm" | "reject" | "review"  // Ação sugerida
}`;

function buildVerificationPrompt(request: MatchVerificationRequest): string {
    const { entity1, entity2, matchCriteria, currentConfidence } = request;
    
    const formatMetadata = (meta: Record<string, any> | undefined) => {
        if (!meta) return 'Sem metadados';
        return Object.entries(meta)
            .filter(([_, v]) => v)
            .map(([k, v]) => `  - ${k}: ${v}`)
            .join('\n') || 'Sem dados adicionais';
    };
    
    return `## ENTIDADE 1 (Operação: ${entity1.investigationTitle || 'N/A'})
Tipo: ${entity1.type}
Nome: ${entity1.name}
Dados:
${formatMetadata(entity1.metadata)}

## ENTIDADE 2 (Operação: ${entity2.investigationTitle || 'N/A'})
Tipo: ${entity2.type}
Nome: ${entity2.name}
Dados:
${formatMetadata(entity2.metadata)}

## CRITÉRIOS DE MATCH DETECTADOS
${Object.entries(matchCriteria)
    .filter(([_, v]) => v)
    .map(([k, v]) => `- ${k}: ${typeof v === 'number' ? v + '%' : 'sim'}`)
    .join('\n')}

## CONFIANÇA ATUAL DO SISTEMA: ${currentConfidence}%

Analise e responda em JSON:`;
}

// ========================================
// MAIN FUNCTION
// ========================================

/**
 * Verify a match using LLM
 */
export async function verifyMatch(
    request: MatchVerificationRequest
): Promise<MatchVerificationResult> {
    const start = Date.now();
    
    // Skip if confidence is already very high or very low
    if (request.currentConfidence >= 95) {
        return {
            verified: true,
            confidence: request.currentConfidence,
            reasoning: 'Alta confiança do sistema - verificação LLM não necessária',
            suggestedAction: 'confirm',
            processingTime: Date.now() - start,
            model: 'system',
        };
    }
    
    if (request.currentConfidence < 50) {
        return {
            verified: false,
            confidence: request.currentConfidence,
            reasoning: 'Baixa confiança do sistema - requer mais dados',
            suggestedAction: 'review',
            processingTime: Date.now() - start,
            model: 'system',
        };
    }
    
    const client = getClient();
    if (!client) {
        return {
            verified: false,
            confidence: request.currentConfidence,
            reasoning: 'LLM não disponível - mantendo confiança original',
            suggestedAction: 'review',
            processingTime: Date.now() - start,
            model: 'none',
        };
    }
    
    try {
        const response = await client.chat.completions.create({
            model: MODEL,
            messages: [
                { role: 'system', content: VERIFICATION_SYSTEM_PROMPT },
                { role: 'user', content: buildVerificationPrompt(request) }
            ],
            temperature: 0.1, // Low temperature for consistent results
            max_tokens: 300,
        });
        
        const content = response.choices[0]?.message?.content || '';
        
        // Parse JSON response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('Invalid JSON response from LLM');
        }
        
        const result = JSON.parse(jsonMatch[0]);
        
        return {
            verified: result.verified === true,
            confidence: Math.min(100, Math.max(0, Number(result.confidence) || request.currentConfidence)),
            reasoning: String(result.reasoning || 'Sem explicação').substring(0, 300),
            suggestedAction: ['confirm', 'reject', 'review'].includes(result.suggestedAction) 
                ? result.suggestedAction 
                : 'review',
            processingTime: Date.now() - start,
            model: MODEL,
        };
        
    } catch (error) {
        console.error('[LLM Verifier] Error:', error);
        
        return {
            verified: false,
            confidence: request.currentConfidence,
            reasoning: `Erro na verificação LLM: ${error instanceof Error ? error.message : 'unknown'}`,
            suggestedAction: 'review',
            processingTime: Date.now() - start,
            model: MODEL,
        };
    }
}

/**
 * Batch verify multiple matches
 */
export async function verifyMatchesBatch(
    requests: MatchVerificationRequest[],
    options: { maxConcurrent?: number } = {}
): Promise<MatchVerificationResult[]> {
    const maxConcurrent = options.maxConcurrent || 3;
    const results: MatchVerificationResult[] = [];
    
    // Process in batches
    for (let i = 0; i < requests.length; i += maxConcurrent) {
        const batch = requests.slice(i, i + maxConcurrent);
        const batchResults = await Promise.all(batch.map(verifyMatch));
        results.push(...batchResults);
    }
    
    return results;
}

export default {
    verifyMatch,
    verifyMatchesBatch,
};
