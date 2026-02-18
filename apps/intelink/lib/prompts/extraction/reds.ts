/**
 * REDS/Boletim de Ocorrência - System Prompt
 * 
 * Extrai entidades, relacionamentos, timeline e análise de risco
 * de Registros de Eventos de Defesa Social (REDS)
 * 
 * @version 2.0.0
 * @updated 2025-12-04
 */

import { PromptTemplate, REDSExtractionResult } from '../types';

export const REDS_PROMPT: PromptTemplate = {
    name: 'REDS Extraction',
    description: 'Extrai dados estruturados de REDS/Boletim de Ocorrência',
    version: '2.0.0',
    
    system_prompt: `Você é um analista de inteligência policial especializado em processar REDS (Registro de Eventos de Defesa Social) e Boletins de Ocorrência.

## MISSÃO
Extrair TODAS as informações estruturadas do documento, incluindo:
- Entidades (pessoas, veículos, locais, armas, telefones)
- Relacionamentos entre entidades
- Timeline de eventos
- Materiais apreendidos
- Artigos criminais aplicáveis
- Análise de risco

## REGRAS ABSOLUTAS
1. NUNCA invente informações - extraia apenas o que está no documento
2. Use "DESCONHECIDO" para campos obrigatórios sem informação
3. Mantenha nomes e CPFs EXATAMENTE como aparecem
4. Identifique TODOS os envolvidos, mesmo citados brevemente
5. Preserve a narrativa original no campo "narrative"

## ARTIGOS CRIMINAIS COMUNS
- CP Art. 121 - Homicídio
- CP Art. 129 - Lesão Corporal
- CP Art. 147 - Ameaça
- CP Art. 155 - Furto
- CP Art. 157 - Roubo
- CP Art. 171 - Estelionato
- CP Art. 180 - Receptação
- Lei 11.343/06 - Tráfico de Drogas
- Lei 10.826/03 - Estatuto do Desarmamento
- Lei 11.340/06 - Maria da Penha
- Lei 12.850/13 - Organização Criminosa
- CTB Art. 303 - Lesão Corporal no Trânsito
- CTB Art. 306 - Embriaguez ao Volante

## FORMATO DE RESPOSTA
Responda APENAS com JSON válido, sem markdown, sem explicações.`,

    json_schema: {
        type: 'object',
        required: ['title', 'reds_number', 'entities', 'relationships', 'timeline', 'criminal_articles', 'ai_analysis'],
        properties: {
            title: { type: 'string', description: 'Título do caso (ex: HOMICÍDIO - ZONA NORTE - 2025-01-01)' },
            reds_number: { type: 'string', description: 'Número do REDS' },
            date: { type: 'string', format: 'date', description: 'Data do fato (YYYY-MM-DD)' },
            unit_responsible: { type: 'string', description: 'Delegacia responsável' },
            entities: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        type: { enum: ['person', 'vehicle', 'location', 'weapon', 'phone', 'organization'] },
                        name: { type: 'string' },
                        role: { type: 'string', description: 'autor, vitima, testemunha, etc' },
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
            timeline: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        datetime: { type: 'string' },
                        description: { type: 'string' },
                        location: { type: 'string' },
                        actors: { type: 'array', items: { type: 'string' } }
                    }
                }
            },
            materials: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        type: { type: 'string' },
                        description: { type: 'string' },
                        quantity: { type: 'number' },
                        location: { type: 'string' }
                    }
                }
            },
            criminal_articles: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        code: { type: 'string', description: 'Ex: CP Art. 121' },
                        article: { type: 'string', description: 'Nome do artigo' },
                        description: { type: 'string' }
                    }
                }
            },
            narrative: { type: 'string', description: 'Transcrição integral do histórico' },
            ai_analysis: {
                type: 'object',
                properties: {
                    risk_level: { enum: ['critical', 'high', 'medium', 'low'] },
                    flight_risk: { enum: ['high', 'medium', 'low'] },
                    flight_risk_factors: { type: 'array', items: { type: 'string' } },
                    recidivism_risk: { enum: ['high', 'medium', 'low'] },
                    recidivism_factors: { type: 'array', items: { type: 'string' } },
                    inconsistencies: { type: 'array', items: { type: 'string' } },
                    investigation_lines: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                title: { type: 'string' },
                                description: { type: 'string' },
                                priority: { enum: ['high', 'medium', 'low'] }
                            }
                        }
                    },
                    suggested_diligences: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                type: { type: 'string' },
                                description: { type: 'string' },
                                priority: { enum: ['urgent', 'high', 'medium', 'low'] }
                            }
                        }
                    }
                }
            }
        }
    },

    examples: [
        'REDS 2025-000001234-5 - Homicídio consumado na Rua das Flores, 123',
        'BO 123456/2025 - Roubo com emprego de arma de fogo'
    ]
};

/**
 * Constrói o prompt completo para enviar ao LLM
 */
export function buildREDSPrompt(documentText: string): string {
    return `${REDS_PROMPT.system_prompt}

## DOCUMENTO A ANALISAR
${documentText}

## SCHEMA JSON ESPERADO
Retorne um objeto JSON válido seguindo este schema:
${JSON.stringify(REDS_PROMPT.json_schema, null, 2)}

RESPONDA APENAS COM O JSON, SEM MARKDOWN, SEM EXPLICAÇÕES.`;
}

/**
 * Valida o resultado da extração
 */
export function validateREDSResult(result: any): result is REDSExtractionResult {
    if (!result || typeof result !== 'object') return false;
    
    const requiredFields = ['title', 'entities', 'relationships', 'ai_analysis'];
    for (const field of requiredFields) {
        if (!(field in result)) {
            console.warn(`Missing required field: ${field}`);
            return false;
        }
    }
    
    if (!Array.isArray(result.entities)) return false;
    if (!Array.isArray(result.relationships)) return false;
    
    return true;
}
