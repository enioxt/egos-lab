'use client';

/**
 * UrgencyBadge - Compact urgency indicator for header
 * 
 * Shows elapsed time in a badge, clicking expands to modal/dropdown
 * 
 * @version 1.0.0
 * @updated 2025-12-17
 */

import React, { useState } from 'react';
import { Clock, Flame, AlertTriangle, Snowflake, X, BookOpen, ExternalLink, Sparkles } from 'lucide-react';
import { UrgencyInfo, CrimeType, getUrgencyInfo, formatTimeElapsed, detectCrimeType } from '@/lib/analysis/urgency-service';

// Research sources
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

// AI research links
const AI_LINKS = [
    { name: 'Gemini', icon: '✨', url: 'https://gemini.google.com/app' },
    { name: 'ChatGPT', icon: '🤖', url: 'https://chat.openai.com' },
    { name: 'Claude', icon: '🧠', url: 'https://claude.ai' },
    { name: 'Perplexity', icon: '🔍', url: 'https://www.perplexity.ai' },
];

interface UrgencyBadgeProps {
    investigationTitle: string;
    investigationDescription: string;
    crimeDatetime: string;
}

// Time color mapping
function getTimeColor(hours: number) {
    if (hours < 48) return { 
        bg: 'bg-red-500/20', 
        text: 'text-red-400', 
        border: 'border-red-500/50',
        label: 'Hot Case',
        icon: Flame
    };
    if (hours < 168) return { // 7 days
        bg: 'bg-amber-500/20', 
        text: 'text-amber-400', 
        border: 'border-amber-500/50',
        label: 'Atenção',
        icon: AlertTriangle
    };
    return { 
        bg: 'bg-slate-500/20', 
        text: 'text-slate-400', 
        border: 'border-slate-500/50',
        label: 'Cold Case',
        icon: Snowflake
    };
}

export default function UrgencyBadge({ 
    investigationTitle, 
    investigationDescription, 
    crimeDatetime 
}: UrgencyBadgeProps) {
    const [isOpen, setIsOpen] = useState(false);
    
    const crimeType = detectCrimeType(investigationTitle, investigationDescription);
    const urgencyInfo = getUrgencyInfo(crimeType, crimeDatetime);
    const timeColor = getTimeColor(urgencyInfo.hoursElapsed);
    const TimeIcon = timeColor.icon;
    
    return (
        <div className="relative">
            {/* Compact Badge - Clickable */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-lg
                    ${timeColor.bg} ${timeColor.text} border ${timeColor.border}
                    hover:bg-opacity-40 transition-all text-sm font-medium
                `}
                title="Ver detalhes do tempo de investigação"
            >
                <TimeIcon className="w-4 h-4" />
                <span className="font-mono">{formatTimeElapsed(urgencyInfo.hoursElapsed)}</span>
                {urgencyInfo.hoursElapsed < 48 && (
                    <span className="text-xs uppercase tracking-wide">Hot</span>
                )}
            </button>
            
            {/* Dropdown Panel */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setIsOpen(false)}
                    />
                    
                    {/* Panel */}
                    <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                        {/* Header */}
                        <div className={`px-4 py-3 border-b border-slate-800 ${timeColor.bg}`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <TimeIcon className={`w-5 h-5 ${timeColor.text}`} />
                                    <span className={`font-semibold ${timeColor.text}`}>
                                        {timeColor.label}
                                    </span>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-1 hover:bg-slate-700 rounded-lg transition-colors text-slate-400"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <p className={`text-2xl font-mono font-bold mt-2 ${timeColor.text}`}>
                                {formatTimeElapsed(urgencyInfo.hoursElapsed)}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                                desde o registro da ocorrência
                            </p>
                        </div>
                        
                        {/* Stats Grid */}
                        <div className="px-4 py-3 border-b border-slate-800 grid grid-cols-2 gap-3">
                            <div className="text-center">
                                <p className="text-xs text-slate-500 uppercase">Janela Crítica</p>
                                <p className="text-lg font-bold text-white">48h</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-slate-500 uppercase">Taxa Resolução</p>
                                <p className="text-lg font-bold text-white">
                                    {urgencyInfo.hoursElapsed < 48 ? '70%' : urgencyInfo.hoursElapsed < 168 ? '50%' : '30%'}
                                </p>
                            </div>
                        </div>
                        
                        {/* Research Links */}
                        <div className="px-4 py-3 border-b border-slate-800">
                            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <BookOpen className="w-3.5 h-3.5" />
                                Fontes de Pesquisa
                            </h4>
                            <div className="space-y-1">
                                {RESEARCH_SOURCES.map((source) => (
                                    <a
                                        key={source.id}
                                        href={source.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-800 rounded-lg transition-colors group text-sm"
                                    >
                                        <span className="text-blue-400">{source.shortName}</span>
                                        <span className="text-slate-300 flex-1 truncate">{source.name}</span>
                                        <ExternalLink className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100" />
                                    </a>
                                ))}
                            </div>
                        </div>
                        
                        {/* AI Links */}
                        <div className="px-4 py-3">
                            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5" />
                                Pesquisar com IA
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {AI_LINKS.map((ai) => (
                                    <a
                                        key={ai.name}
                                        href={ai.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-full text-xs text-slate-300 transition-colors"
                                    >
                                        <span>{ai.icon}</span>
                                        {ai.name}
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
