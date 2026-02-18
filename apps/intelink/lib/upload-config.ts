/**
 * Upload Configuration - Limites e Configurações de Upload
 * 
 * Este arquivo centraliza todas as configurações de upload do sistema.
 * Atualizar aqui reflete automaticamente em todo o sistema.
 */

// ============= LIMITES DE ARQUIVO =============

/** Tamanho máximo por arquivo em bytes (10MB) */
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

/** Tamanho máximo por arquivo formatado para exibição */
export const MAX_FILE_SIZE_DISPLAY = '10MB';

/** Número máximo de arquivos por upload em lote */
export const MAX_FILES_PER_BATCH = 10;

/** Tipos de arquivo aceitos para documentos */
export const ACCEPTED_DOC_TYPES = {
    'application/pdf': ['.pdf'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/msword': ['.doc'],
    'text/plain': ['.txt'],
};

/** Extensões de arquivo aceitas (para exibição) */
export const ACCEPTED_EXTENSIONS = 'PDF, DOCX, DOC, TXT';

/** Extensões de arquivo para input HTML */
export const ACCEPTED_INPUT = '.pdf,.docx,.doc,.txt';

// ============= LIMITES DE PROCESSAMENTO IA =============

/** 
 * Tamanho máximo de texto para processamento por IA (chars)
 * Gemini 2.0 Flash: ~1M tokens ≈ 4M chars
 * Para segurança, limitamos a 500k chars por documento
 */
export const MAX_TEXT_LENGTH_PER_DOC = 500_000;

/**
 * Tamanho máximo de texto total em batch (chars)
 * 10 docs x 500k = 5M chars, mas limitamos a 2M para performance
 */
export const MAX_TOTAL_TEXT_LENGTH = 2_000_000;

/**
 * Timeout para processamento de um documento (ms)
 * 2 minutos por documento é razoável
 */
export const PROCESSING_TIMEOUT_MS = 120_000;

// ============= MENSAGENS DE ERRO =============

export const UPLOAD_ERRORS = {
    FILE_TOO_LARGE: `Arquivo muito grande. Máximo ${MAX_FILE_SIZE_DISPLAY} por arquivo.`,
    TOO_MANY_FILES: `Máximo ${MAX_FILES_PER_BATCH} arquivos por vez.`,
    INVALID_TYPE: 'Tipo de arquivo não suportado. Use ' + ACCEPTED_EXTENSIONS + '.',
    TEXT_TOO_SHORT: 'Texto muito curto para extração. Mínimo 50 caracteres.',
    TEXT_TOO_LONG: 'Texto muito longo para processamento em lote.',
} as const;

// ============= HELPERS =============

/**
 * Formata tamanho de arquivo para exibição
 */
export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/**
 * Valida se um arquivo está dentro dos limites
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
    if (file.size > MAX_FILE_SIZE_BYTES) {
        return { valid: false, error: UPLOAD_ERRORS.FILE_TOO_LARGE };
    }
    
    const validTypes = Object.keys(ACCEPTED_DOC_TYPES);
    if (!validTypes.includes(file.type) && !file.name.match(/\.(pdf|docx|doc|txt)$/i)) {
        return { valid: false, error: UPLOAD_ERRORS.INVALID_TYPE };
    }
    
    return { valid: true };
}

/**
 * Valida um lote de arquivos
 */
export function validateBatch(files: File[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (files.length > MAX_FILES_PER_BATCH) {
        errors.push(UPLOAD_ERRORS.TOO_MANY_FILES);
    }
    
    files.forEach((file, i) => {
        const result = validateFile(file);
        if (!result.valid && result.error) {
            errors.push(`Arquivo ${i + 1} (${file.name}): ${result.error}`);
        }
    });
    
    return { valid: errors.length === 0, errors };
}
