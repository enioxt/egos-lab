'use client';

/**
 * Intelligence Lab - Quantum Search
 * 
 * Global search that builds narrative dossiers about entities.
 * Uses the GraphAggregator to traverse relationships across investigations.
 * 
 * @route /central/intelligence-lab
 */

import React, { useState, useCallback } from 'react';
import { 
    Search, 
    Loader2, 
    User, 
    Car, 
    MapPin, 
    Building2, 
    FileText,
    Sparkles,
    ChevronRight,
    AlertTriangle,
    Network,
    Clock,
    Link2,
    Shield,
    Scale,
    Brain
} from 'lucide-react';
import Link from 'next/link';
import JuristaTab from '@/components/intelligence/JuristaTab';
import EntityResolverTab from '@/components/intelligence/EntityResolverTab';
import NexusTab from '@/components/intelligence/NexusTab';
import CronosTab from '@/components/intelligence/CronosTab';
import { Merge } from 'lucide-react';

// Tab definitions
// NOTE: Busca Global removida (B5) - use Cmd+K no header para busca global
type TabId = 'jurista' | 'resolver' | 'nexus' | 'cronos';
const TABS: Array<{ id: TabId; label: string; icon: typeof Search; color: string; description: string }> = [
    { id: 'jurista', label: 'Jurista IA', icon: Scale, color: 'amber', description: 'Análise jurídica de textos' },
    { id: 'resolver', label: 'Entity Resolver', icon: Merge, color: 'purple', description: 'Detectar e fundir duplicatas' },
    { id: 'nexus', label: 'Nexus', icon: Network, color: 'emerald', description: 'Conexões cross-case' },
    { id: 'cronos', label: 'Cronos', icon: Clock, color: 'indigo', description: 'Extrair timeline de textos' },
];

// Types
interface EntityResult {
    id: string;
    type: string;
    name: string;
    metadata: Record<string, unknown>;
    investigation_id: string;
    investigation_title?: string;
}

interface DossierStats {
    total_investigations: number;
    total_relationships: number;
    total_evidences: number;
    cross_case_matches: number;
}

interface DossierResult {
    target: EntityResult;
    cross_case_matches: EntityResult[];
    appearances: Array<{
        investigation_id: string;
        investigation_title: string;
        entity_role?: string;
        status: string;
        date: string;
    }>;
    relationships: Array<{
        source_name: string;
        target_name: string;
        relationship_type: string;
        investigation_title: string;
    }>;
    evidences: Array<{
        type: string;
        description: string;
        investigation_title: string;
    }>;
    timeline: Array<{
        date: string;
        event: string;
        investigation_title: string;
    }>;
    stats: DossierStats;
}

// Icon mapping
const TYPE_ICONS: Record<string, typeof User> = {
    'PERSON': User,
    'VEHICLE': Car,
    'LOCATION': MapPin,
    'ORGANIZATION': Building2,
    'FIREARM': Shield,
    'default': FileText
};

const TYPE_COLORS: Record<string, string> = {
    'PERSON': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'VEHICLE': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    'LOCATION': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    'ORGANIZATION': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    'FIREARM': 'bg-red-500/20 text-red-400 border-red-500/30',
    'default': 'bg-slate-500/20 text-slate-400 border-slate-500/30'
};

export default function IntelligenceLabPage() {
    // Tab state
    const [activeTab, setActiveTab] = useState<TabId>('jurista');
    
    // Search state
    const [query, setQuery] = useState('');
    const [searchResults, setSearchResults] = useState<EntityResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    
    // Dossier state
    const [selectedEntity, setSelectedEntity] = useState<EntityResult | null>(null);
    const [dossier, setDossier] = useState<DossierResult | null>(null);
    const [narrative, setNarrative] = useState<string | null>(null);
    const [isLoadingDossier, setIsLoadingDossier] = useState(false);
    const [useAI, setUseAI] = useState(true);

    // Search handler
    const handleSearch = useCallback(async () => {
        if (query.trim().length < 2) return;
        
        setIsSearching(true);
        setSearchResults([]);
        setSelectedEntity(null);
        setDossier(null);
        setNarrative(null);

        try {
            const response = await fetch(`/api/intelligence/dossier?q=${encodeURIComponent(query)}&limit=15`);
            const data = await response.json();
            
            if (data.results) {
                setSearchResults(data.results);
            }
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setIsSearching(false);
        }
    }, [query]);

    // Build dossier handler
    const handleBuildDossier = useCallback(async (entity: EntityResult) => {
        setSelectedEntity(entity);
        setIsLoadingDossier(true);
        setDossier(null);
        setNarrative(null);

        try {
            const response = await fetch('/api/intelligence/dossier', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    entity_id: entity.id,
                    generate_narrative: true,
                    use_ai: useAI
                })
            });

            const data = await response.json();
            
            if (data.success) {
                setDossier(data.dossier);
                setNarrative(data.narrative);
            }
        } catch (error) {
            console.error('Dossier error:', error);
        } finally {
            setIsLoadingDossier(false);
        }
    }, [useAI]);

    // Keyboard handler
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            {/* Header */}
            <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/central" className="text-slate-400 hover:text-white transition-colors">
                                ← Central
                            </Link>
                            <div className="h-6 w-px bg-slate-700" />
                            <div className="flex items-center gap-2">
                                <Network className="w-6 h-6 text-cyan-400" />
                                <h1 className="text-xl font-bold">Intelligence Lab</h1>
                                <span className="px-2 py-0.5 text-xs bg-cyan-500/20 text-cyan-400 rounded-full">BETA</span>
                            </div>
                        </div>
                        
                        {/* Tip: Use Cmd+K for global search */}
                        <div className="text-xs text-slate-500">
                            Pressione <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700">⌘K</kbd> para busca global
                        </div>
                    </div>
                    
                    {/* Tab Navigation */}
                    <div className="flex gap-1 mt-4">
                        {TABS.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg transition-colors ${
                                        isActive 
                                            ? `bg-slate-950 text-${tab.color}-400 border-t border-l border-r border-${tab.color}-500/30`
                                            : 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-800'
                                    }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span className="font-medium">{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Tab Content */}
                
                {/* Jurista Tab */}
                {activeTab === 'jurista' && <JuristaTab />}
                
                {/* Entity Resolver Tab */}
                {activeTab === 'resolver' && <EntityResolverTab />}
                
                {/* Nexus Tab */}
                {activeTab === 'nexus' && <NexusTab />}
                
                {/* Cronos Tab */}
                {activeTab === 'cronos' && <CronosTab />}
            </div>
        </div>
    );
}
