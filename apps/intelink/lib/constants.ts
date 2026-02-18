/**
 * Intelink Design System Constants
 * SSOT for colors, fonts, and common styles
 */

// Entity Type Colors (PHONE removed - phones are metadata, not entities)
export const ENTITY_TYPE_COLORS: Record<string, string> = {
    PERSON: '#3b82f6',      // blue-500
    VEHICLE: '#ec4899',     // pink-500
    LOCATION: '#10b981',    // emerald-500
    ORGANIZATION: '#f59e0b', // amber-500 (facções, quadrilhas)
    COMPANY: '#f59e0b',     // amber-500 (empresas com CNPJ)
    DOCUMENT: '#8b5cf6',    // violet-500
    WEAPON: '#ef4444',      // red-500
    FIREARM: '#ef4444',     // red-500 (alias)
    OTHER: '#94a3b8',       // slate-400
};

// Entity Type Labels (PT-BR) - PHONE removed: phones are metadata inside PERSON
export const ENTITY_TYPE_LABELS: Record<string, string> = {
    PERSON: 'Pessoa',
    VEHICLE: 'Veículo',
    LOCATION: 'Local',
    ORGANIZATION: 'Org. Criminosa',   // Facções, quadrilhas
    COMPANY: 'Empresa',            // PJ com CNPJ
    DOCUMENT: 'Documento',
    WEAPON: 'Arma',
    FIREARM: 'Arma de Fogo',
    OTHER: 'Outro',
};

// Document Type Labels (PT-BR)
export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
    'reds': 'REDS / Boletim de Ocorrência',
    'relatorio': 'Relatório',
    'cs': 'Comunicação de Serviço',
    'depoimento': 'Depoimento',
    'livre': 'Texto Livre',
    'audio': 'Transcrição de Áudio',
};

// Evidence Type Labels (PT-BR)
export const EVIDENCE_TYPE_LABELS: Record<string, string> = {
    DRUG: 'Droga',
    DEVICE: 'Dispositivo',
    MONEY: 'Dinheiro',
    DOCUMENT: 'Documento',
    AUDIO: 'Áudio',
    IMAGE: 'Imagem',
    VIDEO: 'Vídeo',
    OTHER: 'Outro',
    // Variações lowercase
    drug: 'Droga',
    device: 'Dispositivo',
    money: 'Dinheiro',
    document: 'Documento',
    audio: 'Áudio',
    image: 'Imagem',
    video: 'Vídeo',
    other: 'Outro'
};

// Organization Sub-Type Labels (for metadata.type field)
export const ORG_TYPE_LABELS: Record<string, string> = {
    company: 'Empresa',
    COMPANY: 'Empresa',
    gang: 'Facção',
    GANG: 'Facção',
    institution: 'Instituição',
    INSTITUTION: 'Instituição',
};

// Investigation Status Labels
export const STATUS_LABELS: Record<string, string> = {
    active: 'Ativo',
    archived: 'Arquivado',
    finished: 'Finalizado',
    pending: 'Pendente',
};

// Role Labels (PT-BR) - Ordem hierárquica
export const ROLE_LABELS: Record<string, string> = {
    delegado: 'Delegado(a)',
    escrivao: 'Escrivão(ã)',
    investigador: 'Investigador(a)',
    perito: 'Perito(a)',
    medico_legista: 'Médico(a) Legista',
    agente: 'Agente',
    estagiario: 'Estagiário(a)',
    admin: 'Administrador(a)',
};

// Role Order (for sorting)
export const ROLE_ORDER: string[] = [
    'delegado',
    'escrivao', 
    'investigador',
    'perito',
    'medico_legista',
    'estagiario',
    'agente',
    'admin',
];

// Role Colors
export const ROLE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    delegado: {
        bg: 'bg-amber-500/10',
        text: 'text-amber-400',
        border: 'border-amber-500/30',
    },
    escrivao: {
        bg: 'bg-purple-500/10',
        text: 'text-purple-400',
        border: 'border-purple-500/30',
    },
    investigador: {
        bg: 'bg-blue-500/10',
        text: 'text-blue-400',
        border: 'border-blue-500/30',
    },
    perito: {
        bg: 'bg-cyan-500/10',
        text: 'text-cyan-400',
        border: 'border-cyan-500/30',
    },
    medico_legista: {
        bg: 'bg-teal-500/10',
        text: 'text-teal-400',
        border: 'border-teal-500/30',
    },
    agente: {
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-400',
        border: 'border-emerald-500/30',
    },
    estagiario: {
        bg: 'bg-slate-500/10',
        text: 'text-slate-400',
        border: 'border-slate-500/30',
    },
    admin: {
        bg: 'bg-red-500/10',
        text: 'text-red-400',
        border: 'border-red-500/30',
    },
};

// Relationship Type Labels (PT-BR - Humanized for police officers)
export const RELATIONSHIP_LABELS: Record<string, string> = {
    // Core relationships
    KNOWN_ASSOCIATE: 'Conhecido',
    FAMILY: 'Família',
    BUSINESS: 'Negócios',
    OWNERSHIP: 'Proprietário',
    LOCATION: 'Localização',
    WITNESS: 'Testemunha',
    SUSPECT: 'Suspeito',
    VICTIM: 'Vítima',
    OTHER: 'Outro',
    // Graph edge types (from AI extraction)
    APPEARED_TOGETHER: 'Citados no mesmo documento',
    RELATED_TO: 'Relacionado a',
    OWNER: 'Proprietário de',
    MEMBER_OF: 'Membro de',
    WORKS_AT: 'Trabalha em',
    LIVES_AT: 'Reside em',
    KNOWS: 'Conhece',
    COMMUNICATED_WITH: 'Comunicou-se com',
    SUSPECT_IN: 'Suspeito em',
    VICTIM_IN: 'Vítima em',
    WITNESS_IN: 'Testemunha em',
    MENTIONED_WITH: 'Mencionado junto com',
    CONNECTED_TO: 'Conectado a',
    // Lowercase variants
    appeared_together: 'Citados no mesmo documento',
    related_to: 'Relacionado a',
    owner: 'Proprietário de',
    member_of: 'Membro de',
    works_at: 'Trabalha em',
    lives_at: 'Reside em',
    knows: 'Conhece',
    communicated_with: 'Comunicou-se com',
    suspect_in: 'Suspeito em',
    victim_in: 'Vítima em',
    witness_in: 'Testemunha em',
    mentioned_with: 'Mencionado junto com',
    connected_to: 'Conectado a',
};

// Helper function to get relationship label
export function getRelationshipLabel(type: string): string {
    return RELATIONSHIP_LABELS[type] || RELATIONSHIP_LABELS[type.toUpperCase()] || type.replace(/_/g, ' ').toLowerCase();
}

// Alert Severity Colors
export const ALERT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    HIGH: {
        bg: 'bg-red-500/10',
        text: 'text-red-400',
        border: 'border-red-500/30',
    },
    MEDIUM: {
        bg: 'bg-amber-500/10',
        text: 'text-amber-400',
        border: 'border-amber-500/30',
    },
    LOW: {
        bg: 'bg-blue-500/10',
        text: 'text-blue-400',
        border: 'border-blue-500/30',
    },
};

// Priority Colors (for jobs/tasks)
export const PRIORITY_COLORS: Record<string, string> = {
    high: 'bg-red-500/10 text-red-400 border-red-500/30',
    medium: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    low: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
};

// Common UI Colors
export const UI_COLORS = {
    background: {
        primary: 'bg-slate-950',
        secondary: 'bg-slate-900',
        tertiary: 'bg-slate-800',
    },
    text: {
        primary: 'text-white',
        secondary: 'text-slate-300',
        muted: 'text-slate-400',
        disabled: 'text-slate-500',
    },
    border: {
        default: 'border-slate-700',
        subtle: 'border-slate-800',
        accent: 'border-blue-500',
    },
};

// Chart Colors Palette
export const CHART_COLORS = [
    '#3b82f6', // blue
    '#10b981', // emerald
    '#f59e0b', // amber
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#ef4444', // red
    '#84cc16', // lime
];

// Breakpoints (matching Tailwind defaults)
export const BREAKPOINTS = {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
};

// Animation Durations
export const ANIMATIONS = {
    fast: 150,
    normal: 300,
    slow: 500,
};

// Helper function to get entity color
export function getEntityColor(type: string): string {
    return ENTITY_TYPE_COLORS[type] || ENTITY_TYPE_COLORS.OTHER;
}

// Helper function to get entity label
export function getEntityLabel(type: string): string {
    return ENTITY_TYPE_LABELS[type] || type;
}

// Helper function to get role color classes
export function getRoleColorClasses(role: string): string {
    const colors = ROLE_COLORS[role] || ROLE_COLORS.agente;
    return `${colors.bg} ${colors.text} ${colors.border}`;
}
