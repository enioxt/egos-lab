'use client';

/**
 * UrgencyIndicator Component - v2.0 "Tactical Timeline Strip"
 * 
 * Redesigned for minimal visual footprint with maximum information density.
 * Features: Dynamic colors, SmartLinks to AI research tools, actionable chips.
 * 
 * @version 2.0.0
 * @updated 2025-12-10
 */

import React, { useState, useEffect } from 'react';
import { 
    Clock, AlertTriangle, X, Microscope, Search, UserCheck,
    ExternalLink, Sparkles, MessageSquare, BookOpen, ChevronDown, 
    ChevronUp, Info, Zap, ThermometerSnowflake
} from 'lucide-react';
import { 
    UrgencyInfo, 
    CrimeType, 
    getUrgencyInfo, 
    formatTimeElapsed,
    detectCrimeType 
} from '@/lib/analysis/urgency-service';

// SmartLink destinations with meta-prompts
const AI_RESEARCH_LINKS = {
    gemini: {
        name: 'Gemini',
        icon: '✨',
        baseUrl: 'https://gemini.google.com/app?text=',
    },
    chatgpt: {
        name: 'ChatGPT',
        icon: '🤖',
        baseUrl: 'https://chat.openai.com/?q=',
    },
    claude: {
        name: 'Claude',
        icon: '🧠',
        baseUrl: 'https://claude.ai/new?q=',
    },
    perplexity: {
        name: 'Perplexity',
        icon: '🔍',
        baseUrl: 'https://www.perplexity.ai/?q=',
    },
    grok: {
        name: 'Grok',
        icon: '⚡',
        baseUrl: 'https://grok.x.ai/?q=',
    }
};

// Research sources with real links
const RESEARCH_SOURCES = [
    {
        id: 'doj',
        name: 'DOJ Homicide Studies',
        shortName: 'DOJ',
        url: 'https://www.ojp.gov/ncjrs/virtual-library/abstracts/solving-homicides-study-identifies-factors-investigations',
        description: 'Fatores que afetam a resolução de homicídios'
    },
    {
        id: 'fbi',
        name: 'FBI UCR Data',
        shortName: 'FBI',
        url: 'https://ucr.fbi.gov/crime-in-the-u.s',
        description: 'Estatísticas de crimes e taxas de resolução'
    },
    {
        id: 'perf',
        name: 'Police Executive Research Forum',
        shortName: 'PERF',
        url: 'https://www.policeforum.org/assets/docs/Critical_Issues_Series/a%20gathering%20storm%20-%20violent%20crime%20in%20america%202006.pdf',
        description: 'Melhores práticas em investigação'
    }
];

// Generate meta-prompt for AI research
function generateMetaPrompt(topic: string, context: string): string {
    return encodeURIComponent(`Você é um especialista em investigação criminal e metodologia policial científica.

CONTEXTO: ${context}

MINHA NECESSIDADE: Quero aprender mais sobre "${topic}".

ANTES DE RESPONDER, faça-me 2-3 perguntas específicas para entender:
1. Meu nível de conhecimento atual sobre o tema
2. O contexto específico da minha investigação
3. Que tipo de informação seria mais útil (estatísticas, metodologia, casos de estudo)

Após minhas respostas, forneça:
- Resumo executivo (3 pontos-chave)
- Metodologia recomendada
- Fontes acadêmicas para aprofundamento
- Próximos passos práticos

Aguardo suas perguntas para personalizar a resposta.`);
}

interface UrgencyIndicatorProps {
    crimeType?: CrimeType;
    crimeDatetime?: Date | string | null;
    investigationTitle?: string;
    investigationDescription?: string;
    compact?: boolean;
    showActions?: boolean;
    dismissible?: boolean;
    onDismiss?: () => void;
}

export default function UrgencyIndicator({
    crimeType,
    crimeDatetime,
    investigationTitle,
    investigationDescription,
    compact = false,
    showActions = true,
    dismissible = true,
    onDismiss
}: UrgencyIndicatorProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);
    const [showAIMenu, setShowAIMenu] = useState(false);
    const [showDismissToast, setShowDismissToast] = useState(false);

    // Check localStorage for dismissed state on mount
    useEffect(() => {
        if (typeof window === 'undefined') return;
        // Per-investigation dismissal
        const storageKey = investigationTitle 
            ? `urgency_dismissed_${investigationTitle.replace(/\s+/g, '_').toLowerCase()}`
            : 'urgency_dismissed_global';
        const dismissed = localStorage.getItem(storageKey);
        if (dismissed === 'true') {
            setIsDismissed(true);
        }
    }, [investigationTitle]);

    // Detectar tipo de crime se não fornecido
    const detectedCrimeType = crimeType || 
        (investigationTitle ? detectCrimeType(investigationTitle, investigationDescription) : 'other');
    
    // Obter informações de urgência
    const urgencyInfo = getUrgencyInfo(detectedCrimeType, crimeDatetime || null);
    
    // Não mostrar se não há urgência
    if (urgencyInfo.level === 'none') {
        return null;
    }
    
    // Se foi dispensado, mostrar toast temporário ou nada
    if (isDismissed) {
        if (showDismissToast) {
            return (
                <div className="fixed bottom-4 right-4 z-50 bg-slate-800 border border-slate-600 rounded-lg p-4 shadow-xl animate-in slide-in-from-bottom-4 max-w-sm">
                    <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm text-white font-medium">Painel ocultado</p>
                            <p className="text-xs text-slate-400 mt-1">
                                Para reativar o indicador de tempo, acesse as{' '}
                                <button 
                                    onClick={() => {
                                        // TODO: Open investigation settings modal
                                        document.querySelector('[title="Mais opções"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                                    }}
                                    className="text-blue-400 hover:underline"
                                >
                                    Configurações da Operação
                                </button>
                            </p>
                        </div>
                        <button 
                            onClick={() => setShowDismissToast(false)}
                            className="text-slate-400 hover:text-white"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            );
        }
        return null;
    }

    // Não mostrar para crimes de baixa urgência em modo compacto
    if (compact && urgencyInfo.level === 'low') {
        return null;
    }

    const handleDismiss = () => {
        // Persist to localStorage
        if (typeof window !== 'undefined') {
            const storageKey = investigationTitle 
                ? `urgency_dismissed_${investigationTitle.replace(/\s+/g, '_').toLowerCase()}`
                : 'urgency_dismissed_global';
            localStorage.setItem(storageKey, 'true');
        }
        setIsDismissed(true);
        setShowDismissToast(true);
        setTimeout(() => setShowDismissToast(false), 5000);
        onDismiss?.();
    };

    // Dynamic colors based on time elapsed
    const getTimeBasedColor = () => {
        if (urgencyInfo.hoursElapsed < 48) return { border: 'border-emerald-500', text: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Hot Case' };
        if (urgencyInfo.hoursElapsed < 168) return { border: 'border-orange-500', text: 'text-orange-400', bg: 'bg-orange-500/10', label: 'Janela Crítica' };
        return { border: 'border-slate-500', text: 'text-slate-400', bg: 'bg-slate-500/10', label: 'Cold Case' };
    };

    const timeColor = getTimeBasedColor();

    // Generate AI research link
    const openAIResearch = (platform: keyof typeof AI_RESEARCH_LINKS) => {
        const topic = "Regra das 48 horas em investigações de homicídio e fatores de resolução";
        const context = `Investigação de ${detectedCrimeType} com ${formatTimeElapsed(urgencyInfo.hoursElapsed)} decorridas desde o fato.`;
        const prompt = generateMetaPrompt(topic, context);
        const url = AI_RESEARCH_LINKS[platform].baseUrl + prompt;
        window.open(url, '_blank');
        setShowAIMenu(false);
    };

    // Modo compacto (apenas badge)
    if (compact) {
        return (
            <div 
                className={`
                    inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium
                    ${timeColor.bg} ${timeColor.text} border ${timeColor.border}
                `}
                title={`${timeColor.label} - ${formatTimeElapsed(urgencyInfo.hoursElapsed)}`}
            >
                {urgencyInfo.hoursElapsed < 48 ? <Zap className="w-3 h-3" /> : 
                 urgencyInfo.hoursElapsed < 168 ? <AlertTriangle className="w-3 h-3" /> : 
                 <ThermometerSnowflake className="w-3 h-3" />}
                <span>{formatTimeElapsed(urgencyInfo.hoursElapsed)}</span>
            </div>
        );
    }

    // Modo expandido - TACTICAL TIMELINE STRIP
    return (
        <div className="mb-6">
            {/* Main Strip */}
            <div 
                className={`
                    w-full bg-slate-900/50 border-y border-slate-800 
                    border-l-4 ${timeColor.border}
                    flex items-center justify-between gap-4 px-6 py-3
                `}
            >
                {/* Left: Time Info */}
                <div className="flex items-center gap-4">
                    <div>
                        <p className="text-slate-500 text-xs uppercase tracking-wider">Tempo Decorrido</p>
                        <p className={`text-lg font-mono font-bold ${timeColor.text}`}>
                            {formatTimeElapsed(urgencyInfo.hoursElapsed)}
                        </p>
                    </div>
                    
                    {/* Status Badge */}
                    <div className={`px-2.5 py-1 rounded-full text-xs font-medium ${timeColor.bg} ${timeColor.text} border ${timeColor.border}`}>
                        {urgencyInfo.hoursElapsed < 48 ? '🔥 ' : urgencyInfo.hoursElapsed < 168 ? '⚠️ ' : '❄️ '}
                        {timeColor.label}
                    </div>
                </div>

                {/* Center: Action Chips - FUTURE: Implement these features
                {showActions && (
                    <div className="flex items-center gap-2 flex-wrap">
                        <button className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-full border border-slate-700 transition-colors inline-flex items-center gap-1.5">
                            <Microscope className="w-3.5 h-3.5" />
                            Solicitar Perícia
                        </button>
                        <button className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-full border border-slate-700 transition-colors inline-flex items-center gap-1.5">
                            <UserCheck className="w-3.5 h-3.5" />
                            Antecedentes
                        </button>
                        <button className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-full border border-slate-700 transition-colors inline-flex items-center gap-1.5">
                            <Search className="w-3.5 h-3.5" />
                            Vínculos
                        </button>
                    </div>
                )}
                */}

                {/* Right: Controls */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
                        title={isExpanded ? 'Recolher' : 'Ver detalhes'}
                    >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    {dismissible && (
                        <button
                            onClick={handleDismiss}
                            className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
                            title="Dispensar"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Expanded Details */}
            {isExpanded && (
                <div className="bg-slate-900/30 border-x border-b border-slate-800 px-6 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left: Research Sources */}
                        <div>
                            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                <BookOpen className="w-3.5 h-3.5" />
                                Fontes de Pesquisa
                            </h4>
                            <div className="space-y-2">
                                {RESEARCH_SOURCES.map((source) => (
                                    <a
                                        key={source.id}
                                        href={source.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 p-2 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 rounded-lg transition-colors group"
                                    >
                                        <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center text-xs font-bold text-blue-400">
                                            {source.shortName}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-white group-hover:text-blue-400 transition-colors truncate">
                                                {source.name}
                                            </p>
                                            <p className="text-xs text-slate-500 truncate">{source.description}</p>
                                        </div>
                                        <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors shrink-0" />
                                    </a>
                                ))}
                            </div>
                        </div>

                        {/* Right: AI Research */}
                        <div>
                            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5" />
                                Pesquisar com IA
                            </h4>
                            <p className="text-xs text-slate-500 mb-3">
                                Clique para iniciar pesquisa guiada com meta-prompt especializado:
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {Object.entries(AI_RESEARCH_LINKS).map(([key, platform]) => (
                                    <button
                                        key={key}
                                        onClick={() => openAIResearch(key as keyof typeof AI_RESEARCH_LINKS)}
                                        className="flex items-center gap-2 p-2 bg-slate-800/50 hover:bg-purple-500/20 border border-slate-700/50 hover:border-purple-500/50 rounded-lg transition-all group"
                                    >
                                        <span className="text-lg">{platform.icon}</span>
                                        <span className="text-xs text-slate-300 group-hover:text-purple-300">{platform.name}</span>
                                    </button>
                                ))}
                            </div>
                            
                            {/* Internal Chat Link */}
                            <div className="mt-4 p-3 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                                        <MessageSquare className="w-5 h-5 text-blue-400" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm text-white font-medium">Chat IA Intelink</p>
                                        <p className="text-xs text-slate-400">Pergunte ao nosso agente especializado</p>
                                    </div>
                                    <a 
                                        href="/chat"
                                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-lg transition-colors"
                                    >
                                        Abrir Chat
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/**
 * Versão mini do indicador para uso em listas
 */
export function UrgencyBadge({
    crimeType,
    crimeDatetime,
    investigationTitle
}: {
    crimeType?: CrimeType;
    crimeDatetime?: Date | string | null;
    investigationTitle?: string;
}) {
    const detectedCrimeType = crimeType || 
        (investigationTitle ? detectCrimeType(investigationTitle) : 'other');
    
    const urgencyInfo = getUrgencyInfo(detectedCrimeType, crimeDatetime || null);
    
    if (urgencyInfo.level === 'none' || urgencyInfo.level === 'low') {
        return null;
    }

    return (
        <span 
            className={`
                inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium
                ${urgencyInfo.bgColor} ${urgencyInfo.color}
                ${urgencyInfo.isPulsing ? 'animate-pulse' : ''}
            `}
            title={`${urgencyInfo.title} - ${formatTimeElapsed(urgencyInfo.hoursElapsed)}`}
        >
            {urgencyInfo.icon} {formatTimeElapsed(urgencyInfo.hoursElapsed)}
        </span>
    );
}
