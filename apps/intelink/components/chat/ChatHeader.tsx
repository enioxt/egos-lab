'use client';

/**
 * ChatHeader - Header minimalista
 * Apenas: Seletor de Operações (sem botão voltar - já está no sidebar)
 */

import { ChevronDown, Building2, FolderOpen, Search } from 'lucide-react';
import { useChat } from '@/providers/ChatContext';
import { useState, useRef, useEffect, useMemo } from 'react';
import { matchesSearch } from '@/lib/utils/search';

export function ChatHeader() {
    const {
        isCentralMode,
        selectedInv,
        handleSelectInvestigation,
        investigations,
        loadingInvestigations,
    } = useChat();
    
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    
    // Fecha dropdown ao clicar fora
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    // Deduplicate and filter investigations (accent-insensitive)
    const filteredInvestigations = useMemo(() => {
        // 1. Deduplicate by title (keep first occurrence)
        const seen = new Map<string, typeof investigations[0]>();
        investigations.forEach(inv => {
            const key = inv.title?.toLowerCase().trim();
            if (!seen.has(key)) {
                seen.set(key, inv);
            }
        });
        
        // 2. Filter by search term (accent-insensitive)
        const unique = Array.from(seen.values());
        if (!searchTerm.trim()) return unique;
        
        return unique.filter(inv => matchesSearch(inv.title, searchTerm));
    }, [investigations, searchTerm]);
    
    // Nome selecionado
    const getSelectedName = () => {
        if (!selectedInv) return 'Selecione uma operação...';
        if (selectedInv === 'ALL') return 'Central de Inteligência';
        const inv = investigations.find(i => i.id === selectedInv);
        return inv?.title || 'Operação';
    };
    
    return (
        <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
            <div className="px-4 py-4">
                <div className="flex items-center gap-4">
                    {/* Seletor de Operação - Custom Dropdown */}
                    <div className="relative flex-1 max-w-md" ref={dropdownRef}>
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            disabled={loadingInvestigations}
                            className={`w-full flex items-center justify-between gap-2 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-left transition-colors hover:bg-slate-750 hover:border-slate-600 disabled:opacity-50 ${
                                isOpen ? 'border-slate-500' : ''
                            }`}
                        >
                            <div className="flex items-center gap-2 min-w-0">
                                {selectedInv === 'ALL' ? (
                                    <Building2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                ) : selectedInv ? (
                                    <FolderOpen className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                ) : null}
                                <span className={`truncate ${selectedInv ? 'text-white' : 'text-slate-400'}`}>
                                    {loadingInvestigations ? 'Carregando...' : getSelectedName()}
                                </span>
                            </div>
                            <ChevronDown className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        </button>
                        
                        {/* Dropdown Menu */}
                        {isOpen && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 max-h-80 overflow-hidden">
                                {/* Search */}
                                <div className="p-2 border-b border-slate-700">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                        <input
                                            type="text"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            placeholder="Buscar operação..."
                                            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded text-sm text-white placeholder-slate-500 focus:outline-none focus:border-slate-500"
                                            autoFocus
                                        />
                                    </div>
                                </div>
                                
                                {/* Options */}
                                <div className="overflow-y-auto max-h-60">
                                    {/* Central Option */}
                                    <button
                                        onClick={() => { handleSelectInvestigation('ALL'); setIsOpen(false); setSearchTerm(''); }}
                                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                                            selectedInv === 'ALL' 
                                                ? 'bg-slate-700 text-white' 
                                                : 'text-slate-300 hover:bg-slate-700/50'
                                        }`}
                                    >
                                        <Building2 className="w-4 h-4 text-slate-400" />
                                        <div>
                                            <p className="font-medium">Central de Inteligência</p>
                                            <p className="text-xs text-slate-500">Todas as operações</p>
                                        </div>
                                    </button>
                                    
                                    {/* Divider */}
                                    <div className="border-t border-slate-700 my-1" />
                                    <p className="px-4 py-2 text-xs text-slate-500 uppercase tracking-wide">
                                        Operações ({filteredInvestigations.length})
                                    </p>
                                    
                                    {/* Investigation List */}
                                    {filteredInvestigations.length === 0 ? (
                                        <p className="px-4 py-3 text-sm text-slate-500">
                                            {searchTerm ? 'Nenhuma operação encontrada' : 'Nenhuma operação'}
                                        </p>
                                    ) : (
                                        filteredInvestigations.map(inv => (
                                            <button
                                                key={inv.id}
                                                onClick={() => { handleSelectInvestigation(inv.id); setIsOpen(false); setSearchTerm(''); }}
                                                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                                                    selectedInv === inv.id 
                                                        ? 'bg-slate-700 text-white' 
                                                        : 'text-slate-300 hover:bg-slate-700/50'
                                                }`}
                                            >
                                                <FolderOpen className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                                <span className="truncate">{inv.title}</span>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {/* Indicator de modo */}
                    {selectedInv && (
                        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-full text-xs text-slate-400">
                            {isCentralMode ? (
                                <>
                                    <Building2 className="w-3 h-3" />
                                    <span>Modo Central • {investigations.length} operações</span>
                                </>
                            ) : (
                                <>
                                    <FolderOpen className="w-3 h-3" />
                                    <span>Operação Individual</span>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
