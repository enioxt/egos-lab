/**
 * Global Search Constants
 * Extracted from components/shared/GlobalSearch.tsx
 */

import { Briefcase, User, Car, MapPin, Building2 } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

export interface HistoryItem {
    id: string;
    type: 'operation' | 'person' | 'vehicle' | 'location' | 'organization' | 'phone';
    title: string;
    href: string;
    timestamp: number;
}

export interface SearchResult {
    id: string;
    type: 'operation' | 'person' | 'vehicle' | 'location' | 'organization';
    title: string;
    subtitle?: string;
    href: string;
    connections?: number;
    crossCase?: boolean;
    relatedEntities?: Array<{
        id: string;
        name: string;
        type: string;
        relationship: string;
    }>;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const HISTORY_KEY = 'intelink_search_history';
export const MAX_HISTORY = 5;

export const TYPE_CONFIG = {
    operation: { icon: Briefcase, color: 'text-blue-400', bg: 'bg-blue-500/20' },
    person: { icon: User, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
    vehicle: { icon: Car, color: 'text-purple-400', bg: 'bg-purple-500/20' },
    location: { icon: MapPin, color: 'text-orange-400', bg: 'bg-orange-500/20' },
    organization: { icon: Building2, color: 'text-cyan-400', bg: 'bg-cyan-500/20' },
};

export const TYPE_LABELS = {
    operation: 'Operações',
    person: 'Pessoas',
    vehicle: 'Veículos',
    location: 'Locais',
    organization: 'Organizações',
};

// ============================================================================
// RELATIONSHIP HUMANIZATION (Dicionário de Tradução)
// ============================================================================

export const RELATIONSHIP_TRANSLATIONS: Record<string, { label: string; emoji: string; critical?: boolean }> = {
    // Família
    'CASADO_COM': { label: 'Casado com', emoji: '💍' },
    'FILHO_DE': { label: 'Filho de', emoji: '👨‍👧' },
    'PAI_DE': { label: 'Pai de', emoji: '👨‍👧' },
    'MAE_DE': { label: 'Mãe de', emoji: '👩‍👧' },
    'IRMAO_DE': { label: 'Irmão de', emoji: '👥' },
    'PARENTE_DE': { label: 'Parente de', emoji: '👪' },
    
    // Negócios
    'SOCIO_DE': { label: 'Sócio de', emoji: '🤝' },
    'DONO_DE': { label: 'Dono de', emoji: '🏢' },
    'PROPRIETARIO': { label: 'Proprietário', emoji: '🏠' },
    'TRABALHA_EM': { label: 'Trabalha em', emoji: '💼' },
    'FUNCIONARIO_DE': { label: 'Funcionário de', emoji: '👔' },
    
    // Vínculos Criminais (CRÍTICOS - vermelho)
    'CUMPLICE': { label: 'Cúmplice', emoji: '⚠️', critical: true },
    'MEMBRO_DE': { label: 'Membro de', emoji: '⚠️', critical: true },
    'MEMBRO_DE_FACCAO': { label: 'Membro de facção', emoji: '🚨', critical: true },
    'ASSOCIADO_A': { label: 'Associado a', emoji: '🔗', critical: true },
    'LIDER_DE': { label: 'Líder de', emoji: '👑', critical: true },
    'COMPARSA': { label: 'Comparsa', emoji: '⚠️', critical: true },
    
    // Veículos
    'CONDUTOR_DE': { label: 'Condutor de', emoji: '🚗' },
    'POSSUI_VEICULO': { label: 'Possui veículo', emoji: '🚙' },
    'VISTO_EM': { label: 'Visto em', emoji: '👁️' },
    
    // Localização
    'RESIDE_EM': { label: 'Reside em', emoji: '🏠' },
    'FREQUENTA': { label: 'Frequenta', emoji: '📍' },
    'LOCALIZADO_EM': { label: 'Localizado em', emoji: '📍' },
    
    // Comunicação
    'CONTATO_DE': { label: 'Contato de', emoji: '📞' },
    'TELEFONE_DE': { label: 'Telefone de', emoji: '📱' },
    
    // Genéricos
    'CONHECE': { label: 'Conhece', emoji: '🤝' },
    'RELACIONADO_A': { label: 'Relacionado a', emoji: '🔗' },
    'VINCULADO_A': { label: 'Vinculado a', emoji: '🔗' },
};

// ============================================================================
// HELPERS
// ============================================================================

export function formatRelType(type: string): { label: string; emoji: string; critical: boolean } {
    const translation = RELATIONSHIP_TRANSLATIONS[type.toUpperCase()];
    if (translation) {
        return { ...translation, critical: translation.critical || false };
    }
    
    // Fallback: humanize the string
    const humanized = type
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/^./, c => c.toUpperCase());
    
    return { label: humanized, emoji: '🔗', critical: false };
}

export function getSearchHistory(): HistoryItem[] {
    if (typeof window === 'undefined') return [];
    try {
        const data = localStorage.getItem(HISTORY_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

export function addToHistory(item: Omit<HistoryItem, 'timestamp'>) {
    const history = getSearchHistory().filter(h => h.id !== item.id);
    history.unshift({ ...item, timestamp: Date.now() });
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));
}
