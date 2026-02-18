'use client';

/**
 * DocumentActionButtons - Botões de ação rápida para adicionar documentos
 * 
 * Exibir no header da operação para fácil acesso
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
    FileText, FileUp, Mic, PenLine, Plus,
    ChevronDown, File, FileSearch, ClipboardList,
    MessageSquare, Target, Stethoscope, Scale
} from 'lucide-react';

// Tipos de documentos suportados
export type DocumentType = 'reds' | 'cs' | 'inquerito' | 'depoimento' | 'laudo_pericial' | 'laudo_medico' | 'audio' | 'livre';

interface DocumentActionButtonsProps {
    investigationId: string;
    onUploadClick: (type: DocumentType) => void;
}

const DOCUMENT_TYPES = [
    { 
        id: 'reds', 
        label: 'REDS / BO', 
        icon: FileText, 
        color: 'blue',
        description: 'Boletim de Ocorrência - extrai entidades e fatos'
    },
    { 
        id: 'cs', 
        label: 'CS / Relatório', 
        icon: ClipboardList, 
        color: 'amber',
        description: 'Comunicação de Serviço - extrai análises e insights'
    },
    { 
        id: 'inquerito', 
        label: 'Inquérito Policial', 
        icon: Scale, 
        color: 'indigo',
        description: 'IP completo - oitivas, perícias, diligências'
    },
    { 
        id: 'depoimento', 
        label: 'Oitiva / Depoimento', 
        icon: MessageSquare, 
        color: 'purple',
        description: 'Testemunha, autor, vítima'
    },
    { 
        id: 'laudo_pericial', 
        label: 'Laudo Pericial', 
        icon: Target, 
        color: 'cyan',
        description: 'Conclusões periciais e metodologia'
    },
    { 
        id: 'laudo_medico', 
        label: 'Exame Médico / IML', 
        icon: Stethoscope, 
        color: 'red',
        description: 'Lesões, causa mortis, corpo de delito'
    },
    { 
        id: 'audio', 
        label: 'Áudio', 
        icon: Mic, 
        color: 'rose',
        description: 'Transcrição de gravações'
    },
    { 
        id: 'livre', 
        label: 'Texto Livre', 
        icon: PenLine, 
        color: 'slate',
        description: 'Colar ou digitar qualquer texto'
    },
] as const;

export default function DocumentActionButtons({ investigationId, onUploadClick }: DocumentActionButtonsProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // ESC key handler
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        };
        
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, [isOpen]);

    // Click outside handler
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Botão principal - Compacto em mobile */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1.5 md:gap-2 px-2.5 md:px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-lg font-medium transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 text-sm md:text-base"
            >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Adicionar</span>
                <span className="sm:hidden">Doc</span>
                <ChevronDown className={`w-3.5 h-3.5 md:w-4 md:h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown */}
            {isOpen && (
                <>
                    {/* Overlay invisível para fechar ao clicar fora */}
                    <div 
                        className="fixed inset-0 z-40 bg-transparent" 
                        onClick={() => setIsOpen(false)} 
                    />
                    
                    {/* Menu - Wider dropdown with full labels */}
                    <div className="absolute right-0 mt-2 w-[420px] bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                        <div className="p-3">
                            <p className="px-2 py-1.5 text-xs font-medium text-slate-400 uppercase tracking-wider">
                                Tipo de Documento
                            </p>
                            
                            {/* Grid 2 colunas - largura aumentada */}
                            <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto">
                                {DOCUMENT_TYPES.map((type) => {
                                    const Icon = type.icon;
                                    return (
                                        <button
                                            key={type.id}
                                            onClick={() => {
                                                onUploadClick(type.id as any);
                                                setIsOpen(false);
                                            }}
                                            className={`flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-${type.color}-500/10 transition-colors text-left group`}
                                        >
                                            <div className={`p-1.5 rounded-lg bg-${type.color}-500/20 shrink-0`}>
                                                <Icon className={`w-4 h-4 text-${type.color}-400`} />
                                            </div>
                                            <span className={`text-sm font-medium text-white group-hover:text-${type.color}-400 transition-colors whitespace-nowrap`}>
                                                {type.label}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        
                        <div className="border-t border-slate-700 p-2 bg-slate-900/50">
                            <p className="text-xs text-slate-500 text-center">
                                PDF, DOCX, TXT, MP3 • Máx 10MB
                            </p>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

// Versão compacta para mobile ou espaços menores
export function DocumentActionButtonsCompact({ investigationId, onUploadClick }: DocumentActionButtonsProps) {
    return (
        <div className="flex items-center gap-2">
            <button
                onClick={() => onUploadClick('reds')}
                className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors"
                title="REDS / BO"
            >
                <FileText className="w-4 h-4" />
            </button>
            <button
                onClick={() => onUploadClick('cs')}
                className="p-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg transition-colors"
                title="Comunicação de Serviço"
            >
                <FileSearch className="w-4 h-4" />
            </button>
            <button
                onClick={() => onUploadClick('livre')}
                className="p-2 bg-slate-500/20 hover:bg-slate-500/30 text-slate-400 rounded-lg transition-colors"
                title="Texto Livre"
            >
                <PenLine className="w-4 h-4" />
            </button>
            <button
                onClick={() => onUploadClick('audio')}
                className="p-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 rounded-lg transition-colors"
                title="Áudio"
            >
                <Mic className="w-4 h-4" />
            </button>
        </div>
    );
}
