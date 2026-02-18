/**
 * INTELINK Urgency Service
 * 
 * Sistema de indicadores de urgência baseado em estudos científicos sobre
 * investigação de homicídios e outros crimes graves.
 * 
 * Fontes:
 * - FBI Clearance Rate Data (1962-2022)
 * - Police Executive Research Forum: "Best Practices for Homicide Investigations"
 * - DOJ/NIJ: "The First 48 Hours in Criminal Investigations"
 * - National Case Closed Project (2023)
 * 
 * @version 1.0.0
 * @updated 2025-12-10
 */

// ============================================================================
// TYPES
// ============================================================================

export type UrgencyLevel = 'critical' | 'high' | 'moderate' | 'low' | 'none';

export type CrimeType = 
    | 'homicide'      // Homicídio
    | 'kidnapping'    // Sequestro
    | 'robbery'       // Roubo
    | 'assault'       // Lesão corporal
    | 'trafficking'   // Tráfico
    | 'fraud'         // Fraude
    | 'theft'         // Furto
    | 'other';        // Outros

export interface UrgencyInfo {
    level: UrgencyLevel;
    hoursElapsed: number;
    daysElapsed: number;
    color: string;
    bgColor: string;
    borderColor: string;
    icon: string;
    title: string;
    message: string;
    suggestedActions: string[];
    isPulsing: boolean;
    source: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Perfis de urgência por tipo de crime
 * Homicídio tem a janela mais crítica (48h)
 * Outros crimes têm janelas maiores
 */
export const CRIME_URGENCY_PROFILES: Record<CrimeType, {
    criticalHours: number;
    highHours: number;
    moderateHours: number;
    displayName: string;
}> = {
    homicide: {
        criticalHours: 24,
        highHours: 48,
        moderateHours: 72,
        displayName: 'Homicídio'
    },
    kidnapping: {
        criticalHours: 6,
        highHours: 24,
        moderateHours: 48,
        displayName: 'Sequestro'
    },
    robbery: {
        criticalHours: 48,
        highHours: 72,
        moderateHours: 168, // 1 semana
        displayName: 'Roubo'
    },
    assault: {
        criticalHours: 72,
        highHours: 168,
        moderateHours: 336, // 2 semanas
        displayName: 'Lesão Corporal'
    },
    trafficking: {
        criticalHours: 48,
        highHours: 96,
        moderateHours: 168,
        displayName: 'Tráfico'
    },
    fraud: {
        criticalHours: 168, // 1 semana
        highHours: 336,     // 2 semanas
        moderateHours: 720, // 1 mês
        displayName: 'Fraude'
    },
    theft: {
        criticalHours: 72,
        highHours: 168,
        moderateHours: 336,
        displayName: 'Furto'
    },
    other: {
        criticalHours: 72,
        highHours: 168,
        moderateHours: 336,
        displayName: 'Outro'
    }
};

/**
 * Ações sugeridas por fase para HOMICÍDIOS
 * Baseado em melhores práticas do DOJ
 */
const HOMICIDE_ACTIONS: Record<UrgencyLevel, string[]> = {
    critical: [
        'Preservar e isolar a cena do crime',
        'Entrevistar testemunhas imediatamente (memória fresca)',
        'Solicitar imagens de câmeras de vigilância da região',
        'Acionar perícia técnica urgente',
        'Identificar e localizar possíveis suspeitos'
    ],
    high: [
        'Analisar vínculos entre vítima e suspeitos',
        'Confrontar alibis apresentados',
        'Solicitar perícias complementares (balística, DNA)',
        'Verificar antecedentes de envolvidos',
        'Mapear últimos contatos da vítima'
    ],
    moderate: [
        'Revisar timeline completa do caso',
        'Reouvir testemunhas com novas perguntas',
        'Analisar padrões de crimes similares',
        'Verificar câmeras em perímetro expandido',
        'Considerar análise de vínculos cruzados'
    ],
    low: [
        'Revisar todas as diligências realizadas',
        'Analisar casos similares (Modus Operandi)',
        'Considerar novas técnicas investigativas',
        'Verificar possibilidade de informantes',
        'Documentar para eventual cold case'
    ],
    none: []
};

// ============================================================================
// FUNCTIONS
// ============================================================================

/**
 * Calcula o nível de urgência baseado no tipo de crime e tempo decorrido
 */
export function calculateUrgencyLevel(
    crimeType: CrimeType,
    crimeDatetime: Date | string | null
): UrgencyLevel {
    if (!crimeDatetime) return 'none';
    
    const profile = CRIME_URGENCY_PROFILES[crimeType] || CRIME_URGENCY_PROFILES.other;
    const hoursElapsed = getHoursElapsed(crimeDatetime);
    
    if (hoursElapsed <= profile.criticalHours) return 'critical';
    if (hoursElapsed <= profile.highHours) return 'high';
    if (hoursElapsed <= profile.moderateHours) return 'moderate';
    return 'low';
}

/**
 * Calcula horas decorridas desde o crime
 */
export function getHoursElapsed(crimeDatetime: Date | string): number {
    const crimeDate = new Date(crimeDatetime);
    const now = new Date();
    const diffMs = now.getTime() - crimeDate.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60));
}

/**
 * Retorna informações completas de urgência
 */
export function getUrgencyInfo(
    crimeType: CrimeType,
    crimeDatetime: Date | string | null
): UrgencyInfo {
    const level = calculateUrgencyLevel(crimeType, crimeDatetime);
    const hoursElapsed = crimeDatetime ? getHoursElapsed(crimeDatetime) : 0;
    const daysElapsed = Math.floor(hoursElapsed / 24);
    const profile = CRIME_URGENCY_PROFILES[crimeType] || CRIME_URGENCY_PROFILES.other;
    
    const configs: Record<UrgencyLevel, Omit<UrgencyInfo, 'level' | 'hoursElapsed' | 'daysElapsed' | 'suggestedActions' | 'source'>> = {
        critical: {
            color: 'text-red-400',
            bgColor: 'bg-red-500/20',
            borderColor: 'border-red-500/50',
            icon: '🔴',
            title: 'JANELA DE OURO',
            message: `Estudos do DOJ indicam que a maioria dos ${profile.displayName.toLowerCase()}s resolvidos têm leads nas primeiras ${profile.criticalHours}h. Testemunhas ainda têm memória fresca. Priorize diligências urgentes.`,
            isPulsing: true
        },
        high: {
            color: 'text-orange-400',
            bgColor: 'bg-orange-500/20',
            borderColor: 'border-orange-500/50',
            icon: '🟠',
            title: 'TEMPO CRÍTICO',
            message: `Estatisticamente, casos de ${profile.displayName.toLowerCase()} sem leads em ${profile.highHours}h têm chances significativamente reduzidas de resolução. Foque em análise de vínculos.`,
            isPulsing: false
        },
        moderate: {
            color: 'text-yellow-400',
            bgColor: 'bg-yellow-500/20',
            borderColor: 'border-yellow-500/50',
            icon: '🟡',
            title: 'JANELA FECHANDO',
            message: `Cada hora adicional dificulta a investigação. Revise a timeline, testemunhas não ouvidas e considere análise de padrões.`,
            isPulsing: false
        },
        low: {
            color: 'text-slate-400',
            bgColor: 'bg-slate-500/20',
            borderColor: 'border-slate-500/50',
            icon: '📋',
            title: 'INVESTIGAÇÃO PROLONGADA',
            message: `Foco em diligências complementares e análise de vínculos cruzados. Considere técnicas de cold case se necessário.`,
            isPulsing: false
        },
        none: {
            color: 'text-slate-500',
            bgColor: 'bg-slate-700/20',
            borderColor: 'border-slate-700/50',
            icon: '⚪',
            title: '',
            message: '',
            isPulsing: false
        }
    };
    
    const config = configs[level];
    
    // Ações sugeridas baseadas no tipo de crime
    const actions = crimeType === 'homicide' 
        ? HOMICIDE_ACTIONS[level] 
        : getGenericActions(level);
    
    return {
        level,
        hoursElapsed,
        daysElapsed,
        suggestedActions: actions,
        source: 'DOJ/FBI Clearance Rate Studies, Police Executive Research Forum',
        ...config
    };
}

/**
 * Ações genéricas para outros crimes
 */
function getGenericActions(level: UrgencyLevel): string[] {
    const actions: Record<UrgencyLevel, string[]> = {
        critical: [
            'Preservar evidências',
            'Ouvir testemunhas imediatamente',
            'Coletar imagens de câmeras',
            'Identificar suspeitos'
        ],
        high: [
            'Analisar vínculos',
            'Verificar antecedentes',
            'Solicitar perícias'
        ],
        moderate: [
            'Revisar diligências',
            'Analisar padrões similares'
        ],
        low: [
            'Documentar caso',
            'Considerar arquivamento temporário'
        ],
        none: []
    };
    return actions[level] || [];
}

/**
 * Formata tempo decorrido para exibição
 */
export function formatTimeElapsed(hoursElapsed: number): string {
    if (hoursElapsed < 1) return 'menos de 1 hora';
    if (hoursElapsed < 24) return `${hoursElapsed}h`;
    const days = Math.floor(hoursElapsed / 24);
    const remainingHours = hoursElapsed % 24;
    if (days === 1) return remainingHours > 0 ? `1 dia e ${remainingHours}h` : '1 dia';
    return remainingHours > 0 ? `${days} dias e ${remainingHours}h` : `${days} dias`;
}

/**
 * Detecta tipo de crime baseado no título/descrição da investigação
 */
export function detectCrimeType(title: string, description?: string): CrimeType {
    const text = `${title} ${description || ''}`.toLowerCase();
    
    const patterns: [RegExp, CrimeType][] = [
        [/homic[íi]dio|assassinato|morte|matar|matou|latrocínio/i, 'homicide'],
        [/sequestro|cárcere|privação.*liberdade/i, 'kidnapping'],
        [/roubo|assalto|ameaça.*arma/i, 'robbery'],
        [/lesão|agressão|espancamento|violência/i, 'assault'],
        [/tráfico|drogas|entorpecente/i, 'trafficking'],
        [/fraude|estelionato|golpe/i, 'fraud'],
        [/furto|subtração/i, 'theft']
    ];
    
    for (const [pattern, crimeType] of patterns) {
        if (pattern.test(text)) return crimeType;
    }
    
    return 'other';
}
