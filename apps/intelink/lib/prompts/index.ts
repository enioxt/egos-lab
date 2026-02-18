/**
 * System Prompts - Central Index
 * 
 * Todos os prompts de extração e análise centralizados
 * para fácil manutenção e iteração
 * 
 * @version 1.0.0
 * @updated 2025-12-04
 */

// Types
export * from './types';

// Extraction Prompts
export { REDS_PROMPT, buildREDSPrompt, validateREDSResult } from './extraction/reds';
export { CS_PROMPT, buildCSPrompt, validateCSResult } from './extraction/comunicacao';
export { DEPOIMENTO_PROMPT, buildDepoimentoPrompt, validateDepoimentoResult } from './extraction/depoimento';
export { LAUDO_PERICIAL_PROMPT, buildLaudoPericialPrompt, validateLaudoPericialResult } from './extraction/laudo-pericial';
export { AUDIO_PROMPT, buildAudioPrompt, validateAudioResult } from './extraction/audio';

// Validation
export { 
    detectDocumentType, 
    generateMismatchWarning 
} from './validation/document-type-detector';

// Import for getPromptByType
import { buildREDSPrompt } from './extraction/reds';
import { buildCSPrompt } from './extraction/comunicacao';
import { buildDepoimentoPrompt } from './extraction/depoimento';
import { buildLaudoPericialPrompt } from './extraction/laudo-pericial';
import { buildAudioPrompt } from './extraction/audio';
import { DocumentType } from './types';

/**
 * Retorna o prompt builder apropriado para o tipo de documento
 */
export function getPromptBuilder(documentType: DocumentType): (text: string) => string {
    switch (documentType) {
        case 'reds':
            return buildREDSPrompt;
        case 'cs':
            return buildCSPrompt;
        case 'inquerito':
            return buildREDSPrompt; // IP uses similar structure to REDS
        case 'depoimento':
            return buildDepoimentoPrompt;
        case 'laudo_pericial':
            return buildLaudoPericialPrompt;
        case 'laudo_medico':
            return buildLaudoPericialPrompt; // Uses same pericial structure
        case 'audio':
            return buildAudioPrompt;
        case 'livre':
        default:
            return buildREDSPrompt;
    }
}

/**
 * Lista de todos os prompts disponíveis
 */
export const AVAILABLE_PROMPTS = [
    { type: 'reds', name: 'REDS/BO', status: 'ready' },
    { type: 'cs', name: 'Comunicação de Serviço', status: 'ready' },
    { type: 'inquerito', name: 'Inquérito Policial', status: 'ready' },
    { type: 'depoimento', name: 'Oitiva/Depoimento', status: 'ready' },
    { type: 'laudo_pericial', name: 'Laudo Pericial', status: 'ready' },
    { type: 'laudo_medico', name: 'Exame Médico/IML', status: 'ready' },
    { type: 'audio', name: 'Transcrição de Áudio', status: 'ready' },
] as const;
