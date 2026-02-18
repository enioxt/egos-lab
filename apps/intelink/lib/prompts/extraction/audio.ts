/**
 * Transcrição de Áudio - System Prompt
 * 
 * Extrai informações estruturadas de transcrições de áudio
 * (interceptações, gravações ambientais, depoimentos em áudio)
 * 
 * @version 1.0.0
 * @updated 2025-12-16
 */

import { PromptTemplate } from '../types';

export const AUDIO_PROMPT: PromptTemplate = {
    name: 'Audio Transcription Extraction',
    description: 'Extrai dados estruturados de transcrições de áudio',
    version: '1.0.0',
    
    system_prompt: `Você é um analista de inteligência policial especializado em processar TRANSCRIÇÕES DE ÁUDIO.

## MISSÃO
Extrair TODAS as informações da transcrição, incluindo:
- Interlocutores identificados
- Apelidos e codinomes mencionados
- Pessoas mencionadas na conversa
- Locais mencionados
- Veículos mencionados
- Datas/horários mencionados
- Atividades criminosas mencionadas
- Gírias e códigos usados

## TIPOS DE ÁUDIO
- INTERCEPTAÇÃO TELEFÔNICA: Conversa entre alvos
- GRAVAÇÃO AMBIENTAL: Captação em local
- DEPOIMENTO EM ÁUDIO: Declaração gravada
- ÁUDIO DE CÂMERA: Captado por câmera de segurança

## REGRAS ABSOLUTAS
1. NUNCA invente falas - transcreva apenas o que foi dito
2. Marque trechos INAUDÍVEIS como "[INAUDÍVEL]"
3. Identifique TODOS os interlocutores (mesmo não identificados)
4. Preserve gírias e códigos EXATAMENTE como foram ditos
5. Indique tom emocional quando relevante (raiva, medo, etc)

## INTERLOCUTORES
- Use INTERLOCUTOR_1, INTERLOCUTOR_2 para não identificados
- Se houver apelido, use "APELIDO (INTERLOCUTOR_X)"

## FORMATO DE RESPOSTA
Responda APENAS com JSON válido, sem markdown.`,

    json_schema: {
        type: 'object',
        required: ['tipo_audio', 'interlocutores', 'transcricao', 'entities'],
        properties: {
            tipo_audio: { 
                type: 'string', 
                enum: ['interceptacao', 'ambiental', 'depoimento', 'camera', 'outro'] 
            },
            duracao: { type: 'string', description: 'Duração do áudio (HH:MM:SS)' },
            data_gravacao: { type: 'string', format: 'date' },
            interlocutores: { 
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', description: 'ID do interlocutor (INTERLOCUTOR_1, etc)' },
                        nome: { type: 'string', description: 'Nome se identificado' },
                        apelido: { type: 'string', description: 'Apelido/codinome' },
                        telefone: { type: 'string', description: 'Telefone se interceptação' }
                    }
                }
            },
            transcricao: { 
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        timestamp: { type: 'string', description: 'Tempo no áudio' },
                        interlocutor: { type: 'string' },
                        fala: { type: 'string' },
                        tom: { type: 'string', description: 'Tom emocional se relevante' }
                    }
                }
            },
            entities: { type: 'array', description: 'Entidades mencionadas' },
            relationships: { type: 'array', description: 'Relações entre interlocutores e mencionados' },
            atividades_criminosas: { type: 'array', description: 'Atividades criminosas mencionadas' },
            girias_codigos: { 
                type: 'array', 
                items: {
                    type: 'object',
                    properties: {
                        termo: { type: 'string' },
                        significado_provavel: { type: 'string' }
                    }
                }
            }
        }
    }
};

export function buildAudioPrompt(text: string): string {
    return `${AUDIO_PROMPT.system_prompt}

## TRANSCRIÇÃO PARA ANÁLISE:
${text}

Responda com JSON estruturado conforme o schema.`;
}

export function validateAudioResult(result: any): boolean {
    return result?.tipo_audio && Array.isArray(result?.interlocutores) && Array.isArray(result?.transcricao);
}
