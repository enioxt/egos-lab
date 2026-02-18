/**
 * Depoimento/Oitiva - System Prompt
 * 
 * Extrai informações estruturadas de depoimentos e oitivas
 * 
 * @version 1.0.0
 * @updated 2025-12-16
 */

import { PromptTemplate } from '../types';

export const DEPOIMENTO_PROMPT: PromptTemplate = {
    name: 'Depoimento Extraction',
    description: 'Extrai dados estruturados de depoimentos e oitivas',
    version: '1.0.0',
    
    system_prompt: `Você é um analista de inteligência policial especializado em processar DEPOIMENTOS e OITIVAS.

## MISSÃO
Extrair TODAS as informações do depoimento, incluindo:
- Qualificação do depoente (nome, CPF, endereço, profissão)
- Tipo de participação (vítima, testemunha, suspeito, informante)
- Pessoas mencionadas no relato
- Locais mencionados
- Veículos mencionados
- Armas mencionadas
- Timeline de eventos relatados
- Contradições ou inconsistências

## REGRAS ABSOLUTAS
1. NUNCA invente informações - extraia apenas o que está no documento
2. Use "DESCONHECIDO" para campos sem informação
3. Mantenha nomes EXATAMENTE como aparecem
4. Identifique o NÍVEL DE CONFIABILIDADE do depoente
5. Preserve citações importantes entre aspas

## AVALIAÇÃO DE CONFIABILIDADE
- A: Completamente confiável (histórico conhecido)
- B: Normalmente confiável
- C: Geralmente confiável
- D: Normalmente não confiável
- E: Não confiável
- F: Confiabilidade não pode ser avaliada

## FORMATO DE RESPOSTA
Responda APENAS com JSON válido, sem markdown.`,

    json_schema: {
        type: 'object',
        required: ['deponent', 'entities', 'relationships', 'timeline'],
        properties: {
            deponent: {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    cpf: { type: 'string' },
                    role: { type: 'string', enum: ['victim', 'witness', 'suspect', 'informant'] },
                    reliability: { type: 'string', enum: ['A', 'B', 'C', 'D', 'E', 'F'] }
                }
            },
            entities: { type: 'array' },
            relationships: { type: 'array' },
            timeline: { type: 'array' },
            key_statements: { type: 'array', description: 'Declarações importantes do depoimento' },
            contradictions: { type: 'array', description: 'Contradições identificadas' },
            narrative: { type: 'string', description: 'Transcrição integral do depoimento' }
        }
    }
};

export function buildDepoimentoPrompt(text: string): string {
    return `${DEPOIMENTO_PROMPT.system_prompt}

## DOCUMENTO PARA ANÁLISE:
${text}

Responda com JSON estruturado conforme o schema.`;
}

export function validateDepoimentoResult(result: any): boolean {
    return result?.deponent?.name && Array.isArray(result?.entities);
}
