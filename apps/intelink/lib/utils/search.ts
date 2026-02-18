/**
 * Search Utilities
 * 
 * Funções para busca inteligente sem considerar acentos,
 * case insensitive, e com normalização de texto.
 * 
 * @version 1.0.0
 * @date 2025-12-08
 */

/**
 * Remove acentos de uma string
 * "Operação" -> "Operacao"
 * "VÊNUS" -> "VENUS"
 */
export function removeAccents(str: string): string {
    if (!str) return '';
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Normaliza string para busca (lowercase + sem acentos)
 * "Operação VÊNUS" -> "operacao venus"
 */
export function normalizeForSearch(str: string): string {
    return removeAccents(str).toLowerCase().trim();
}

/**
 * Verifica se searchTerm está contido em text (ignorando acentos e case)
 * 
 * @example
 * matchesSearch("Operação Vênus", "venus") // true
 * matchesSearch("Operação Vênus", "operacao") // true
 * matchesSearch("João Silva", "joao") // true
 */
export function matchesSearch(text: string | null | undefined, searchTerm: string): boolean {
    if (!text || !searchTerm) return !searchTerm; // Se não tem termo, retorna true
    
    const normalizedText = normalizeForSearch(text);
    const normalizedSearch = normalizeForSearch(searchTerm);
    
    return normalizedText.includes(normalizedSearch);
}

/**
 * Filtra array de objetos por múltiplos campos (ignorando acentos)
 * 
 * @example
 * filterBySearch(investigations, 'venus', ['title', 'description'])
 */
export function filterBySearch<T>(
    items: T[],
    searchTerm: string,
    fields: (keyof T)[]
): T[] {
    if (!searchTerm.trim()) return items;
    
    const normalizedSearch = normalizeForSearch(searchTerm);
    
    return items.filter(item => {
        return fields.some(field => {
            const value = item[field];
            if (typeof value === 'string') {
                return normalizeForSearch(value).includes(normalizedSearch);
            }
            if (typeof value === 'object' && value !== null) {
                // Search in nested object values
                return Object.values(value).some(v => 
                    typeof v === 'string' && normalizeForSearch(v).includes(normalizedSearch)
                );
            }
            return false;
        });
    });
}

/**
 * Highlight do termo de busca em um texto (preservando acentos originais)
 * Retorna React elements com <mark> tags
 * 
 * @example
 * highlightMatch("Operação Vênus", "venus")
 * // Returns: ["Operação ", <mark>Vênus</mark>]
 */
export function getHighlightParts(text: string, searchTerm: string): { 
    text: string; 
    isMatch: boolean 
}[] {
    if (!searchTerm.trim() || !text) {
        return [{ text, isMatch: false }];
    }
    
    const normalizedText = normalizeForSearch(text);
    const normalizedSearch = normalizeForSearch(searchTerm);
    
    const matchIndex = normalizedText.indexOf(normalizedSearch);
    
    if (matchIndex === -1) {
        return [{ text, isMatch: false }];
    }
    
    const parts: { text: string; isMatch: boolean }[] = [];
    
    if (matchIndex > 0) {
        parts.push({ text: text.slice(0, matchIndex), isMatch: false });
    }
    
    parts.push({ 
        text: text.slice(matchIndex, matchIndex + searchTerm.length), 
        isMatch: true 
    });
    
    if (matchIndex + searchTerm.length < text.length) {
        parts.push({ 
            text: text.slice(matchIndex + searchTerm.length), 
            isMatch: false 
        });
    }
    
    return parts;
}
