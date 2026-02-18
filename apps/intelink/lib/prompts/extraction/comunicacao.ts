/**
 * Comunicação de Serviço - System Prompt
 * 
 * Extrai análises, hipóteses e insights investigativos
 * de Comunicações de Serviço policiais
 * 
 * @version 2.0.0
 * @updated 2025-12-04
 */

import { PromptTemplate, CSExtractionResult } from '../types';

export const CS_PROMPT: PromptTemplate = {
    name: 'Comunicação de Serviço Extraction',
    description: 'Extrai análises e hipóteses de Comunicações de Serviço',
    version: '2.0.0',
    
    system_prompt: `Você é um analista de inteligência policial especializado em processar Comunicações de Serviço (CS).

## MISSÃO
Extrair informações analíticas e hipóteses investigativas, incluindo:
- Entidades citadas (pessoas, veículos, locais)
- Hipóteses levantadas pelo investigador
- Insights e observações
- Recomendações de diligências
- Conexões com outros casos

## DIFERENÇA CS vs REDS
- REDS: Fatos objetivos, narrativa do que aconteceu
- CS: Análise subjetiva, hipóteses, inteligência investigativa

## REGRAS
1. Identifique HIPÓTESES claramente (o que o investigador ACHA, não o que é FATO)
2. Destaque INSIGHTS que podem conectar casos
3. Preserve recomendações do investigador
4. Marque confiança de cada informação

## FORMATO DE RESPOSTA
Responda APENAS com JSON válido, sem markdown, sem explicações.`,

    json_schema: {
        type: 'object',
        required: ['title', 'entities', 'hypotheses', 'insights'],
        properties: {
            title: { type: 'string', description: 'Título da CS' },
            cs_number: { type: 'string', description: 'Número da CS' },
            date: { type: 'string', format: 'date' },
            entities: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        type: { enum: ['person', 'vehicle', 'location', 'phone', 'organization'] },
                        name: { type: 'string' },
                        role: { type: 'string' },
                        metadata: { type: 'object' },
                        confidence: { enum: ['high', 'medium', 'low'] }
                    }
                }
            },
            relationships: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        source: { type: 'string' },
                        target: { type: 'string' },
                        type: { type: 'string' },
                        description: { type: 'string' },
                        confidence: { enum: ['high', 'medium', 'low'] }
                    }
                }
            },
            hypotheses: {
                type: 'array',
                items: { type: 'string' },
                description: 'Hipóteses levantadas pelo investigador'
            },
            insights: {
                type: 'array',
                items: { type: 'string' },
                description: 'Insights e observações analíticas'
            },
            recommendations: {
                type: 'array',
                items: { type: 'string' },
                description: 'Diligências recomendadas'
            },
            timeline: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        datetime: { type: 'string' },
                        description: { type: 'string' }
                    }
                }
            },
            narrative: { type: 'string' }
        }
    },

    examples: []
};

/**
 * Constrói o prompt completo para Comunicação de Serviço
 */
export function buildCSPrompt(documentText: string): string {
    return `${CS_PROMPT.system_prompt}

## DOCUMENTO A ANALISAR
${documentText}

## SCHEMA JSON ESPERADO
${JSON.stringify(CS_PROMPT.json_schema, null, 2)}

RESPONDA APENAS COM O JSON, SEM MARKDOWN, SEM EXPLICAÇÕES.`;
}

/**
 * Valida o resultado da extração de CS
 */
export function validateCSResult(result: any): result is CSExtractionResult {
    if (!result || typeof result !== 'object') return false;
    
    const requiredFields = ['title', 'entities', 'hypotheses', 'insights'];
    for (const field of requiredFields) {
        if (!(field in result)) {
            console.warn(`Missing required field: ${field}`);
            return false;
        }
    }
    
    return true;
}
