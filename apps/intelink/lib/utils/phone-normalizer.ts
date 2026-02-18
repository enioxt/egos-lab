/**
 * Phone Normalizer Utility
 * 
 * Normaliza números de telefone brasileiros de qualquer formato para um formato padrão.
 * Reconhece e normaliza todos os formatos comuns:
 * 
 * - +55 24 99227-0880
 * - 55 24 99227-0880
 * - 24 99227-0880
 * - (24) 99227-0880
 * - 24992270880
 * - 24.9.9227.0880
 * - 024 99227-0880
 * - etc.
 */

export interface PhoneInfo {
    /** Número completo sem formatação (apenas dígitos) */
    raw: string;
    /** Número formatado para display: (24) 99227-0880 */
    formatted: string;
    /** Número para WhatsApp: 5524992270880 */
    whatsapp: string;
    /** DDD extraído */
    ddd: string;
    /** Número sem DDD */
    number: string;
    /** Se é celular (9 dígitos, começa com 9) */
    isMobile: boolean;
    /** Se parece válido */
    isValid: boolean;
    /** Código do país (55 para Brasil) */
    countryCode: string;
}

/**
 * Remove todos os caracteres não-numéricos de uma string
 */
export function stripNonDigits(phone: string): string {
    return phone.replace(/\D/g, '');
}

/**
 * Normaliza um número de telefone brasileiro para formato padrão
 * 
 * @param phone - Número em qualquer formato
 * @returns PhoneInfo com todas as variações do número
 * 
 * @example
 * normalizePhone('+55 24 99227-0880')
 * // { raw: '5524992270880', formatted: '(24) 99227-0880', whatsapp: '5524992270880', ... }
 * 
 * normalizePhone('24992270880')
 * // { raw: '24992270880', formatted: '(24) 99227-0880', whatsapp: '5524992270880', ... }
 */
export function normalizePhone(phone: string | null | undefined): PhoneInfo {
    if (!phone) {
        return {
            raw: '',
            formatted: '',
            whatsapp: '',
            ddd: '',
            number: '',
            isMobile: false,
            isValid: false,
            countryCode: '55'
        };
    }

    // Remove tudo que não é dígito
    let digits = stripNonDigits(phone);
    
    // Remove zeros à esquerda (comum em alguns formatos)
    digits = digits.replace(/^0+/, '');
    
    // Determina se tem código do país
    let countryCode = '55';
    let ddd = '';
    let number = '';
    
    if (digits.length >= 12 && digits.startsWith('55')) {
        // Formato com código do país: 5524992270880
        countryCode = '55';
        digits = digits.substring(2); // Remove o 55
    }
    
    if (digits.length === 11) {
        // Celular com DDD: 24992270880
        ddd = digits.substring(0, 2);
        number = digits.substring(2);
    } else if (digits.length === 10) {
        // Could be: old mobile format (34 9652-2114) or landline (24 3322-1234)
        ddd = digits.substring(0, 2);
        const firstDigitAfterDDD = digits.charAt(2);
        
        // If starts with 6, 7, 8 or 9 → it's an old mobile format, add the 9
        // Old format: 34 9652-2114 → New format: 34 9 9652-2114
        if (['6', '7', '8', '9'].includes(firstDigitAfterDDD)) {
            number = '9' + digits.substring(2); // Add the 9 prefix
            digits = ddd + number; // Update digits to 11-digit format
        } else {
            // Landline: 24 3322-1234
            number = digits.substring(2);
        }
    } else if (digits.length === 9) {
        // Celular sem DDD: 992270880 - assumir DDD padrão
        ddd = ''; // Sem DDD
        number = digits;
    } else if (digits.length === 8) {
        // Fixo sem DDD: 33221234
        ddd = '';
        number = digits;
    } else {
        // Formato não reconhecido, retorna o que tem
        return {
            raw: digits,
            formatted: digits,
            whatsapp: `55${digits}`,
            ddd: '',
            number: digits,
            isMobile: false,
            isValid: false,
            countryCode: '55'
        };
    }
    
    const isMobile = number.length === 9 && number.startsWith('9');
    const isValid = (number.length === 8 || number.length === 9) && (ddd.length === 0 || ddd.length === 2);
    
    // Formata para display
    let formatted = '';
    if (ddd) {
        if (number.length === 9) {
            // Celular: (24) 99227-0880
            formatted = `(${ddd}) ${number.substring(0, 5)}-${number.substring(5)}`;
        } else {
            // Fixo: (24) 3322-1234
            formatted = `(${ddd}) ${number.substring(0, 4)}-${number.substring(4)}`;
        }
    } else {
        if (number.length === 9) {
            formatted = `${number.substring(0, 5)}-${number.substring(5)}`;
        } else {
            formatted = `${number.substring(0, 4)}-${number.substring(4)}`;
        }
    }
    
    // WhatsApp sempre precisa do código do país + DDD
    const whatsapp = ddd ? `${countryCode}${ddd}${number}` : `${countryCode}${number}`;
    
    return {
        raw: ddd ? `${ddd}${number}` : number,
        formatted,
        whatsapp,
        ddd,
        number,
        isMobile,
        isValid,
        countryCode
    };
}

/**
 * Compara dois números de telefone ignorando formatação
 * 
 * @example
 * phonesMatch('+55 24 99227-0880', '24992270880') // true
 * phonesMatch('(24) 99227-0880', '24.99227.0880') // true
 */
export function phonesMatch(phone1: string | null | undefined, phone2: string | null | undefined): boolean {
    if (!phone1 || !phone2) return false;
    
    const p1 = normalizePhone(phone1);
    const p2 = normalizePhone(phone2);
    
    // Compara os números sem DDD se um deles não tiver
    if (!p1.ddd || !p2.ddd) {
        return p1.number === p2.number;
    }
    
    // Compara com DDD
    return p1.raw === p2.raw || p1.whatsapp === p2.whatsapp;
}

/**
 * Formata um telefone para display amigável
 * 
 * @example
 * formatPhoneDisplay('24992270880') // '(24) 99227-0880'
 * formatPhoneDisplay('+5524992270880') // '(24) 99227-0880'
 */
export function formatPhoneDisplay(phone: string | null | undefined): string {
    return normalizePhone(phone).formatted;
}

/**
 * Formata um telefone para WhatsApp (link clicável)
 * 
 * @example
 * formatPhoneWhatsApp('24992270880') // '5524992270880'
 * getWhatsAppLink('24992270880') // 'https://wa.me/5524992270880'
 */
export function formatPhoneWhatsApp(phone: string | null | undefined): string {
    return normalizePhone(phone).whatsapp;
}

export function getWhatsAppLink(phone: string | null | undefined, message?: string): string {
    const wa = formatPhoneWhatsApp(phone);
    if (!wa) return '';
    const base = `https://wa.me/${wa}`;
    return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/**
 * Extrai todos os telefones de um texto (útil para parsing de documentos)
 * 
 * @example
 * extractPhonesFromText('Ligue para (24) 99227-0880 ou 24 3322-1234')
 * // ['(24) 99227-0880', '24 3322-1234']
 */
export function extractPhonesFromText(text: string): PhoneInfo[] {
    if (!text) return [];
    
    // Regex para capturar vários formatos de telefone brasileiro
    const phoneRegex = /(?:\+?55\s?)?(?:\(?\d{2}\)?[\s.-]?)?\d{4,5}[\s.-]?\d{4}/g;
    
    const matches = text.match(phoneRegex) || [];
    
    return matches
        .map(match => normalizePhone(match))
        .filter(info => info.isValid);
}

/**
 * Valida se um telefone parece ser válido
 */
export function isValidPhone(phone: string | null | undefined): boolean {
    return normalizePhone(phone).isValid;
}

/**
 * Limpa um telefone para armazenamento no banco de dados
 * Retorna apenas dígitos, sem código do país
 * 
 * @example
 * cleanPhoneForStorage('+55 24 99227-0880') // '24992270880'
 */
export function cleanPhoneForStorage(phone: string | null | undefined): string {
    const info = normalizePhone(phone);
    return info.raw;
}
