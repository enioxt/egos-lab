/**
 * Laudo Pericial - System Prompt
 * 
 * Extrai informações estruturadas de laudos periciais
 * (local de crime, balística, papiloscopia, veicular, etc)
 * 
 * @version 1.0.0
 * @updated 2025-12-16
 */

import { PromptTemplate } from '../types';

export const LAUDO_PERICIAL_PROMPT: PromptTemplate = {
    name: 'Laudo Pericial Extraction',
    description: 'Extrai dados estruturados de laudos periciais',
    version: '1.0.0',
    
    system_prompt: `Você é um analista de inteligência policial especializado em processar LAUDOS PERICIAIS.

## MISSÃO
Extrair TODAS as informações técnicas do laudo, incluindo:
- Tipo de perícia (local, balística, papiloscopia, veicular, digital)
- Perito responsável
- Vestígios e evidências coletadas
- Resultados técnicos
- Conclusões periciais
- Conexões com pessoas/veículos/armas

## TIPOS DE LAUDO
- LOCAL DE CRIME: Croqui, vestígios, manchas, projéteis
- BALÍSTICA: Armas, projéteis, cápsulas, confronto balístico
- PAPILOSCOPIA: Impressões digitais, identificação
- VEICULAR: Acidentes, adulteração, identificação veicular
- DIGITAL: Celulares, computadores, extrações

## REGRAS ABSOLUTAS
1. NUNCA invente informações técnicas
2. Preserve números de laudos e protocolos EXATAMENTE
3. Identifique TODAS as evidências coletadas
4. Relacione evidências com entidades (pessoas, armas, veículos)
5. Extraia conclusões periciais com citação exata

## FORMATO DE RESPOSTA
Responda APENAS com JSON válido, sem markdown.`,

    json_schema: {
        type: 'object',
        required: ['laudo_number', 'tipo_pericia', 'evidencias', 'conclusoes'],
        properties: {
            laudo_number: { type: 'string', description: 'Número do laudo pericial' },
            tipo_pericia: { 
                type: 'string', 
                enum: ['local_crime', 'balistica', 'papiloscopia', 'veicular', 'digital', 'outro'] 
            },
            perito: {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    matricula: { type: 'string' }
                }
            },
            data_pericia: { type: 'string', format: 'date' },
            evidencias: { 
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        tipo: { type: 'string' },
                        descricao: { type: 'string' },
                        localizacao: { type: 'string' },
                        relacionado_a: { type: 'string', description: 'Entidade relacionada' }
                    }
                }
            },
            resultados_tecnicos: { type: 'array', description: 'Resultados das análises' },
            conclusoes: { type: 'array', description: 'Conclusões do perito' },
            entities: { type: 'array', description: 'Entidades identificadas (pessoas, armas, veículos)' },
            relationships: { type: 'array', description: 'Relações entre entidades e evidências' }
        }
    }
};

export function buildLaudoPericialPrompt(text: string): string {
    return `${LAUDO_PERICIAL_PROMPT.system_prompt}

## DOCUMENTO PARA ANÁLISE:
${text}

Responda com JSON estruturado conforme o schema.`;
}

export function validateLaudoPericialResult(result: any): boolean {
    return result?.laudo_number && result?.tipo_pericia && Array.isArray(result?.evidencias);
}
