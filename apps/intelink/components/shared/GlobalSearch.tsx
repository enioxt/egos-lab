'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Briefcase, User, Car, MapPin, Building2, Command, Link2, AlertCircle, ChevronRight, Clock, Phone, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAudit } from '@/hooks/useAudit';
import { useJourneySafe } from '@/providers/JourneyContext';
import EntityDetailModal from '@/components/shared/EntityDetailModal';
import {
    HistoryItem,
    SearchResult,
    TYPE_CONFIG,
    TYPE_LABELS,
    getSearchHistory,
    addToHistory,
    formatRelType
} from '@/components/search';

interface GlobalSearchProps {
    variant?: 'inline' | 'modal'; // inline = always visible input, modal = button opens modal
    compact?: boolean; // For mobile/small spaces
}

export default function GlobalSearch({ variant = 'inline', compact = false }: GlobalSearchProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [isMac, setIsMac] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [expandedResult, setExpandedResult] = useState<string | null>(null);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const { logSearch } = useAudit();
    const { addStep, isRecording } = useJourneySafe();
    
    // Detect mobile device
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Load history on mount
    useEffect(() => {
        setHistory(getSearchHistory());
    }, [isOpen]);

    // Show dropdown when focused (show history) or has results
    const showDropdown = (isFocused || isOpen) && (query.length >= 2 || results.length > 0 || history.length > 0);

    // Detect OS for keyboard shortcut display
    useEffect(() => {
        setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0);
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsFocused(false);
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Listen for global search open event (from GlobalSearchProvider)
    useEffect(() => {
        const handleGlobalSearchOpen = () => {
            setIsOpen(true);
            if (isMobile) setIsFullScreen(true);
            setTimeout(() => inputRef.current?.focus(), 100);
        };
        window.addEventListener('global-search-open', handleGlobalSearchOpen);
        return () => window.removeEventListener('global-search-open', handleGlobalSearchOpen);
    }, [isMobile]);

    // CMD+K handler (local - also handled by GlobalSearchProvider for consistency)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(true);
                setTimeout(() => inputRef.current?.focus(), 100);
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Focus input when modal opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Search debounce
    useEffect(() => {
        if (query.length < 2) {
            setResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
                if (res.ok) {
                    const data = await res.json();
                    setResults(data.results || []);
                    setSelectedIndex(0);
                    
                    // Audit: Log search term
                    logSearch(query, { results_count: data.results?.length || 0 });
                }
            } catch (error) {
                console.error('Search error:', error);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    // Keyboard navigation
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter' && results[selectedIndex]) {
            e.preventDefault();
            const item = results[selectedIndex];
            navigateTo(item.href, { id: item.id, type: item.type, title: item.title });
        }
    }, [results, selectedIndex]);

    const navigateTo = (href: string, item?: { id: string; type: string; title: string }) => {
        // Save to history if we have item info
        if (item) {
            addToHistory({
                id: item.id,
                type: item.type as HistoryItem['type'],
                title: item.title,
                href,
            });
        }
        
        // For entities (person, vehicle, etc), open modal instead of navigating
        if (item && item.type !== 'operation') {
            // Track in Journey when recording
            if (isRecording) {
                addStep({
                    entityId: item.id,
                    entityName: item.title,
                    entityType: item.type.toUpperCase(),
                    source: 'search',
                    visibleConnectionsSnapshot: [],
                });
            }
            
            setSelectedEntityId(item.id);
            setIsOpen(false);
            setQuery('');
            setResults([]);
            return;
        }
        
        // For operations, navigate normally
        setIsOpen(false);
        setQuery('');
        setResults([]);
        router.push(href);
    };

    // Group results by type
    const groupedResults = results.reduce((acc, result) => {
        if (!acc[result.type]) acc[result.type] = [];
        acc[result.type].push(result);
        return acc;
    }, {} as Record<string, SearchResult[]>);

    // Close fullscreen mode
    const closeFullScreen = () => {
        setIsFullScreen(false);
        setIsOpen(false);
        setIsFocused(false);
        setQuery('');
        setResults([]);
    };

    if (variant === 'inline') {
        // MOBILE FULLSCREEN MODE
        if (isFullScreen && isMobile) {
            return (
                <div className="fixed inset-0 z-[60] bg-slate-950 flex flex-col">
                    {/* Header with input */}
                    <div className="flex items-center gap-2 p-4 border-b border-slate-800">
                        <button 
                            onClick={closeFullScreen}
                            className="p-2 hover:bg-slate-800 rounded-lg"
                        >
                            <X className="w-5 h-5 text-slate-400" />
                        </button>
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Buscar pessoas, CPFs, placas..."
                                className="w-full pl-10 pr-4 h-12 bg-slate-800 border border-slate-700 focus:border-blue-500 rounded-xl text-white placeholder-slate-400 outline-none text-base"
                                autoFocus
                            />
                            {loading && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            )}
                        </div>
                    </div>
                    
                    {/* Results - scrollable */}
                    <div className="flex-1 overflow-y-auto">
                        {query.length < 2 && history.length > 0 ? (
                            <div className="py-2">
                                <div className="px-4 py-2 text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                    <Clock className="w-3 h-3" />
                                    <span>Últimos Acessos</span>
                                </div>
                                {history.map((item) => {
                                    const config = TYPE_CONFIG[item.type as keyof typeof TYPE_CONFIG];
                                    const Icon = config?.icon || User;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => { 
                                                navigateTo(item.href, { id: item.id, type: item.type, title: item.title }); 
                                                closeFullScreen(); 
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-800 text-slate-300"
                                        >
                                            <div className={`p-2 rounded-lg ${config?.bg || 'bg-slate-700'}`}>
                                                <Icon className={`w-5 h-5 ${config?.color || 'text-slate-400'}`} />
                                            </div>
                                            <span className="font-medium truncate flex-1">{item.title}</span>
                                            <ChevronRight className="w-5 h-5 text-slate-600" />
                                        </button>
                                    );
                                })}
                            </div>
                        ) : query.length < 2 ? (
                            <div className="p-8 text-center text-slate-500">
                                <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                <p>Digite para buscar</p>
                            </div>
                        ) : results.length === 0 && !loading ? (
                            <div className="p-8 text-center text-slate-500">
                                <p>Nenhum resultado para "{query}"</p>
                            </div>
                        ) : (
                            <div className="py-2">
                                {Object.entries(groupedResults).map(([type, items]) => {
                                    const config = TYPE_CONFIG[type as keyof typeof TYPE_CONFIG];
                                    const Icon = config?.icon || User;
                                    return (
                                        <div key={type}>
                                            <div className="px-4 py-2 text-xs font-medium text-slate-500 uppercase tracking-wider">
                                                {TYPE_LABELS[type as keyof typeof TYPE_LABELS] || type} ({items.length})
                                            </div>
                                            {items.map((result) => (
                                                <button
                                                    key={result.id}
                                                    onClick={() => { 
                                                        navigateTo(result.href, { id: result.id, type: result.type, title: result.title }); 
                                                        closeFullScreen(); 
                                                    }}
                                                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-800 text-slate-300"
                                                >
                                                    <div className={`p-2 rounded-lg ${config?.bg || 'bg-slate-700'}`}>
                                                        <Icon className={`w-5 h-5 ${config?.color || 'text-slate-400'}`} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-medium truncate">{result.title}</p>
                                                            {result.crossCase && (
                                                                <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded text-[10px] font-bold">
                                                                    CROSS
                                                                </span>
                                                            )}
                                                        </div>
                                                        {result.subtitle && (
                                                            <p className="text-xs text-slate-500 truncate">{result.subtitle}</p>
                                                        )}
                                                    </div>
                                                    <ChevronRight className="w-5 h-5 text-slate-600" />
                                                </button>
                                            ))}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            );
        }
        
        // DESKTOP INLINE MODE
        return (
            <div ref={containerRef} className="relative w-full">
                {/* Visible Search Input - Infoseg Style */}
                <div className={`relative flex items-center ${compact ? 'h-10' : 'h-12'}`}>
                    <div className="absolute left-4 flex items-center pointer-events-none">
                        <Search className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} text-blue-400`} />
                    </div>
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => {
                            setIsFocused(true);
                            if (isMobile) setIsFullScreen(true);
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder={compact ? "Buscar..." : "Buscar pessoas, CPFs, placas, telefones..."}
                        className={`w-full ${compact ? 'pl-10 pr-10 text-sm' : 'pl-12 pr-16'} bg-slate-800/90 hover:bg-slate-700/90 border border-slate-600 hover:border-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl text-white placeholder-slate-400 outline-none transition-all ${compact ? 'h-10' : 'h-12'}`}
                    />
                    {/* Ctrl+K badge - only show when no query on desktop */}
                    {!compact && !query && !isMobile && (
                        <kbd className="absolute right-3 pointer-events-none flex items-center gap-1 px-2 py-1 bg-slate-900/50 border border-slate-600/50 rounded-lg text-[10px] font-bold text-slate-500">
                            {isMac ? <><Command className="w-3 h-3" />K</> : 'Ctrl+K'}
                        </kbd>
                    )}
                    {/* X button - only show when query exists */}
                    {query && (
                        <button
                            onClick={() => { setQuery(''); setResults([]); }}
                            className="absolute right-3 p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                    {loading && (
                        <div className="absolute right-20 w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    )}
                </div>

                {/* Dropdown Results - Desktop only */}
                {showDropdown && !isMobile && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden max-h-[70vh] overflow-y-auto">
                        {/* Show History when no query */}
                        {query.length < 2 && history.length > 0 ? (
                            <div className="py-2">
                                <div className="px-4 py-1.5 text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                    <Clock className="w-3 h-3" />
                                    <span>Últimos Acessos</span>
                                </div>
                                {history.map((item) => {
                                    const config = TYPE_CONFIG[item.type as keyof typeof TYPE_CONFIG];
                                    const Icon = config?.icon || User;
                                    
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => navigateTo(item.href, { id: item.id, type: item.type, title: item.title })}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-800 text-slate-300 transition-colors"
                                        >
                                            <div className={`p-1.5 rounded flex-shrink-0 ${config?.bg || 'bg-slate-700'}`}>
                                                <Icon className={`w-4 h-4 ${config?.color || 'text-slate-400'}`} />
                                            </div>
                                            <span className="font-medium truncate">{item.title}</span>
                                            <ChevronRight className="w-4 h-4 text-slate-600 flex-shrink-0 ml-auto" />
                                        </button>
                                    );
                                })}
                                <div className="px-4 py-2 text-xs text-slate-600 text-center">
                                    Digite para buscar operações, pessoas, veículos...
                                </div>
                            </div>
                        ) : query.length < 2 ? (
                            <div className="p-4 text-center text-slate-500 text-sm">
                                <p>Digite pelo menos 2 caracteres</p>
                            </div>
                        ) : results.length === 0 && !loading ? (
                            <div className="p-4 text-center text-slate-500">
                                <p>Nenhum resultado para "{query}"</p>
                            </div>
                        ) : (
                            <div className="py-2">
                                {Object.entries(groupedResults).map(([type, items]) => {
                                    const config = TYPE_CONFIG[type as keyof typeof TYPE_CONFIG];
                                    const Icon = config?.icon || User;
                                    
                                    return (
                                        <div key={type}>
                                            <div className="px-4 py-1.5 text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center justify-between">
                                                <span>{TYPE_LABELS[type as keyof typeof TYPE_LABELS] || type}</span>
                                                <span className="text-slate-600">{items.length}</span>
                                            </div>
                                            {items.map((result) => {
                                                const globalIndex = results.indexOf(result);
                                                const isSelected = globalIndex === selectedIndex;
                                                const isExpanded = expandedResult === result.id;
                                                const hasConnections = result.connections && result.connections > 0;
                                                
                                                return (
                                                    <div key={result.id}>
                                                        <button
                                                            onClick={() => navigateTo(result.href, { id: result.id, type: result.type, title: result.title })}
                                                            onMouseEnter={() => hasConnections && setExpandedResult(result.id)}
                                                            onMouseLeave={() => setExpandedResult(null)}
                                                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                                                                isSelected 
                                                                    ? 'bg-blue-600/20 text-white' 
                                                                    : 'hover:bg-slate-800 text-slate-300'
                                                            }`}
                                                        >
                                                            <div className={`p-1.5 rounded flex-shrink-0 ${config?.bg || 'bg-slate-700'}`}>
                                                                <Icon className={`w-4 h-4 ${config?.color || 'text-slate-400'}`} />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2">
                                                                    <p className="font-medium truncate">{result.title}</p>
                                                                    {/* Quantum Search Badges */}
                                                                    {result.crossCase && (
                                                                        <span className="flex items-center gap-1 px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded text-[10px] font-bold flex-shrink-0">
                                                                            <AlertCircle className="w-3 h-3" />
                                                                            CROSS-CASE
                                                                        </span>
                                                                    )}
                                                                    {hasConnections && (
                                                                        <span className="flex items-center gap-1 px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded text-[10px] flex-shrink-0">
                                                                            <Link2 className="w-3 h-3" />
                                                                            {result.connections}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {result.subtitle && (
                                                                    <p className="text-xs text-slate-500 truncate">{result.subtitle}</p>
                                                                )}
                                                            </div>
                                                            <ChevronRight className="w-4 h-4 text-slate-600 flex-shrink-0" />
                                                        </button>
                                                        
                                                        {/* Expanded Connections - Rich Connection Chips */}
                                                        {isExpanded && result.relatedEntities && result.relatedEntities.length > 0 && (
                                                            <div className="px-4 py-3 bg-slate-950/70 border-l-2 border-purple-500 ml-4 mr-2 rounded-r">
                                                                <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">Conexões Diretas:</p>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {result.relatedEntities.slice(0, 5).map((rel, idx) => {
                                                                        const relInfo = formatRelType(rel.relationship);
                                                                        return (
                                                                            <div 
                                                                                key={idx} 
                                                                                className={`flex items-center gap-2 px-2.5 py-1.5 bg-slate-900/80 border rounded-md ${
                                                                                    relInfo.critical 
                                                                                        ? 'border-red-900/50' 
                                                                                        : 'border-slate-700/50'
                                                                                }`}
                                                                            >
                                                                                <span className="text-sm">{relInfo.emoji}</span>
                                                                                <span className={`text-xs font-medium ${
                                                                                    relInfo.critical 
                                                                                        ? 'text-red-400' 
                                                                                        : 'text-blue-400'
                                                                                }`}>
                                                                                    {relInfo.label}
                                                                                </span>
                                                                                <ArrowRight className="w-3 h-3 text-slate-600" />
                                                                                <span className="text-sm text-slate-200 font-medium">{rel.name}</span>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        
                        {/* Footer - hide keyboard hints on mobile */}
                        <div className="px-4 py-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
                            <span className="flex items-center gap-2">
                                <Search className="w-3 h-3 text-blue-400" />
                                <span>Busca Avançada</span>
                            </span>
                            <span className="hidden sm:block">
                                <kbd className="px-1 py-0.5 bg-slate-800 rounded">↑↓</kbd> navegar
                                <kbd className="px-1 py-0.5 bg-slate-800 rounded ml-1">Enter</kbd> selecionar
                            </span>
                        </div>
                    </div>
                )}
                
                {/* Entity Detail Modal - MUST be outside dropdown for inline variant */}
                <EntityDetailModal
                    isOpen={!!selectedEntityId}
                    entityId={selectedEntityId || ''}
                    onClose={() => setSelectedEntityId(null)}
                />
            </div>
        );
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="group flex items-center gap-3 w-full h-12 px-5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-600 hover:border-slate-500 rounded-xl text-slate-300 text-sm transition-all duration-200 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none shadow-lg hover:shadow-blue-500/10"
            >
                <Search className="w-5 h-5 flex-shrink-0 text-blue-400 group-hover:text-blue-300" />
                <span className="hidden sm:inline text-left flex-1 truncate text-slate-400 group-hover:text-slate-300 font-medium">
                    Buscar pessoas, CPFs, placas, telefones...
                </span>
                <span className="sm:hidden text-slate-400">Buscar...</span>
                <kbd className="pointer-events-none hidden sm:flex items-center gap-1 px-2.5 py-1 bg-slate-900/50 border border-slate-600/50 rounded-lg text-[11px] font-bold text-slate-500 group-hover:text-slate-400 transition-colors">
                    {isMac ? <><Command className="w-3 h-3" />K</> : 'Ctrl K'}
                </kbd>
            </button>
        );
    }

    return (
        <>
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                onClick={() => setIsOpen(false)}
            />

            {/* Modal - closer to top on mobile */}
            <div className="fixed top-4 sm:top-[15%] left-1/2 -translate-x-1/2 w-full max-w-2xl z-50 px-4">
                <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
                    {/* Input */}
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800">
                        <Search className="w-5 h-5 text-slate-400" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Buscar operações, pessoas, veículos..."
                            className="flex-1 bg-transparent text-white placeholder-slate-500 outline-none text-lg"
                        />
                        {loading && (
                            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        )}
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1 text-slate-400 hover:text-white rounded"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Results */}
                    <div className="max-h-[60vh] overflow-y-auto">
                        {query.length < 2 ? (
                            <div className="p-6 text-center text-slate-500">
                                <p>Digite pelo menos 2 caracteres para buscar</p>
                                <p className="text-xs mt-2">
                                    Use <kbd className="px-1 py-0.5 bg-slate-800 rounded text-slate-400">↑↓</kbd> para navegar, 
                                    <kbd className="px-1 py-0.5 bg-slate-800 rounded text-slate-400 ml-1">Enter</kbd> para selecionar
                                </p>
                            </div>
                        ) : results.length === 0 && !loading ? (
                            <div className="p-6 text-center text-slate-500">
                                <p>Nenhum resultado para "{query}"</p>
                            </div>
                        ) : (
                            <div className="py-2">
                                {Object.entries(groupedResults).map(([type, items]) => {
                                    const config = TYPE_CONFIG[type as keyof typeof TYPE_CONFIG];
                                    const Icon = config?.icon || User;
                                    
                                    return (
                                        <div key={type}>
                                            <div className="px-4 py-2 text-xs font-medium text-slate-500 uppercase tracking-wider">
                                                {TYPE_LABELS[type as keyof typeof TYPE_LABELS] || type}
                                            </div>
                                            {items.map((result) => {
                                                const globalIndex = results.indexOf(result);
                                                const isSelected = globalIndex === selectedIndex;
                                                const hasConnections = result.connections && result.connections > 0;
                                                
                                                return (
                                                    <div key={result.id}>
                                                        <button
                                                            onClick={() => navigateTo(result.href, { id: result.id, type: result.type, title: result.title })}
                                                            onMouseEnter={() => hasConnections && setExpandedResult(result.id)}
                                                            onMouseLeave={() => setExpandedResult(null)}
                                                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                                                                isSelected 
                                                                    ? 'bg-blue-600/20 text-white border-l-4 border-blue-500 pl-3' 
                                                                    : 'hover:bg-slate-800 text-slate-300 border-l-4 border-transparent pl-3'
                                                            }`}
                                                        >
                                                            <div className={`p-1.5 rounded flex-shrink-0 ${config?.bg || 'bg-slate-700'}`}>
                                                                <Icon className={`w-4 h-4 ${config?.color || 'text-slate-400'}`} />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2">
                                                                    <p className="font-medium truncate">{result.title}</p>
                                                                    {result.crossCase && (
                                                                        <span className="flex items-center gap-1 px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded text-[10px] font-bold flex-shrink-0">
                                                                            <AlertCircle className="w-3 h-3" />
                                                                            CROSS
                                                                        </span>
                                                                    )}
                                                                    {hasConnections && (
                                                                        <span className="flex items-center gap-1 px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded text-[10px] flex-shrink-0">
                                                                            <Link2 className="w-3 h-3" />
                                                                            {result.connections}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {result.subtitle && (
                                                                    <p className="text-xs text-slate-500 truncate">{result.subtitle}</p>
                                                                )}
                                                            </div>
                                                            {isSelected && (
                                                                <kbd className="hidden md:inline-block px-1.5 py-0.5 bg-slate-700 rounded text-xs text-slate-400">
                                                                    Enter
                                                                </kbd>
                                                            )}
                                                        </button>
                                                        
                                                        {/* Expanded Connections - Rich Connection Chips (Desktop) */}
                                                        {hasConnections && expandedResult === result.id && result.relatedEntities && result.relatedEntities.length > 0 && (
                                                            <div className="px-4 py-3 bg-slate-950/70 border-l-2 border-purple-500 ml-4 mr-2 rounded-r animate-in fade-in slide-in-from-top-1 duration-200">
                                                                <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">Conexões Diretas:</p>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {result.relatedEntities.slice(0, 5).map((rel, idx) => {
                                                                        const relInfo = formatRelType(rel.relationship);
                                                                        return (
                                                                            <div 
                                                                                key={idx} 
                                                                                className={`flex items-center gap-2 px-2.5 py-1.5 bg-slate-900/80 border rounded-md shadow-sm ${
                                                                                    relInfo.critical 
                                                                                        ? 'border-red-900/50' 
                                                                                        : 'border-slate-700/50'
                                                                                }`}
                                                                            >
                                                                                <span className="text-sm">{relInfo.emoji}</span>
                                                                                <span className={`text-xs font-medium ${
                                                                                    relInfo.critical ? 'text-red-400' : 'text-blue-400'
                                                                                }`}>
                                                                                    {relInfo.label}
                                                                                </span>
                                                                                <ArrowRight className="w-3 h-3 text-slate-600" />
                                                                                <span className="text-xs text-slate-200">{rel.name}</span>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                    {result.relatedEntities.length > 5 && (
                                                                        <span className="text-xs text-slate-500 self-center">
                                                                            +{result.relatedEntities.length - 5}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
                        <span>Busca Global Intelink</span>
                        <span>
                            <kbd className="px-1 py-0.5 bg-slate-800 rounded">ESC</kbd> para fechar
                        </span>
                    </div>
                </div>
            </div>
            
            {/* Entity Detail Modal */}
            <EntityDetailModal
                isOpen={!!selectedEntityId}
                entityId={selectedEntityId || ''}
                onClose={() => setSelectedEntityId(null)}
            />
        </>
    );
}
