'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
    Users, Search, Filter, Download,
    User, Car, MapPin, Phone, Building2, Crosshair,
    X, Eye, Loader2
} from 'lucide-react';

interface Entity {
    id: string;
    type: string;
    name: string;
    metadata?: Record<string, any>;
    created_at: string;
    investigation_id: string;
    investigation?: { title: string };
}

const ENTITY_TYPE_LABELS: Record<string, string> = {
    'PERSON': 'Pessoa',
    'VEHICLE': 'Veículo',
    'LOCATION': 'Local',
    'PHONE': 'Telefone',
    'ORGANIZATION': 'Organização',
    'COMPANY': 'Empresa',
    'FIREARM': 'Arma'
};

const ENTITY_ICONS: Record<string, any> = {
    'PERSON': User,
    'VEHICLE': Car,
    'LOCATION': MapPin,
    'PHONE': Phone,
    'ORGANIZATION': Building2,
    'COMPANY': Building2,
    'FIREARM': Crosshair,
    'default': Users
};

function CentralEntidadesContent() {
    const searchParams = useSearchParams();
    const investigationFilter = searchParams.get('inv');
    
    const [entities, setEntities] = useState<Entity[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [investigationTitle, setInvestigationTitle] = useState<string>('');

    useEffect(() => {
        loadEntities();
    }, [investigationFilter, filterType]);

    const loadEntities = async () => {
        setLoading(true);
        try {
            // Build API URL with filters
            const params = new URLSearchParams();
            if (investigationFilter) {
                params.set('investigation_id', investigationFilter);
            }
            if (filterType !== 'all') {
                params.set('type', filterType);
            }
            
            const response = await fetch(`/api/entities?${params.toString()}`);
            if (!response.ok) throw new Error('Erro ao carregar entidades');
            
            const data = await response.json();
            
            if (data.entities) {
                setEntities(data.entities);
                
                // If filtering by investigation, get title from first entity
                if (investigationFilter && data.entities.length > 0) {
                    setInvestigationTitle(data.entities[0].investigation?.title || '');
                }
            }
        } catch (error) {
            console.error('Error loading entities:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredEntities = entities.filter(ent => {
        const matchesSearch = (ent.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (ent.metadata?.cpf || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (ent.metadata?.placa || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || ent.type === filterType;
        return matchesSearch && matchesType;
    });

    // Count by type
    const typeCounts = entities.reduce((acc, ent) => {
        acc[ent.type] = (acc[ent.type] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            {/* Investigation Filter Banner */}
            {investigationFilter && (
                <div className="mb-6 flex items-center justify-between p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-xl">
                    <div className="flex items-center gap-3">
                        <Users className="w-5 h-5 text-cyan-400" />
                        <div>
                            <p className="text-sm text-cyan-300">Filtrando por operação</p>
                            <p className="text-white font-medium">{investigationTitle || 'Carregando...'}</p>
                        </div>
                    </div>
                    <Link
                        href="/central/entidades"
                        className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-300 transition-colors"
                    >
                        <X className="w-4 h-4" />
                        Limpar filtro
                    </Link>
                </div>
            )}
            
            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Users className="w-8 h-8 text-cyan-400" />
                        {investigationFilter ? 'Entidades da Operação' : 'Central de Entidades'}
                    </h1>
                    <p className="text-slate-400 mt-1">
                        {filteredEntities.length} entidades encontradas
                    </p>
                </div>
                
                <div className="flex items-center gap-3">
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 text-sm"
                    >
                        <option value="all">Todos os tipos ({entities.length})</option>
                        {Object.entries(ENTITY_TYPE_LABELS).map(([key, label]) => (
                            <option key={key} value={key}>{label} ({typeCounts[key] || 0})</option>
                        ))}
                    </select>
                    <Link
                        href="/central/intelligence-lab"
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-colors"
                    >
                        Resolver Duplicatas
                    </Link>
                </div>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nome, CPF, placa..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                    />
                </div>
            </div>

            {/* Results */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                </div>
            ) : filteredEntities.length === 0 ? (
                <div className="text-center py-20 bg-slate-900/50 rounded-xl border border-slate-800">
                    <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400">Nenhuma entidade encontrada</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredEntities.map((ent) => {
                        const Icon = ENTITY_ICONS[ent.type] || ENTITY_ICONS.default;
                        
                        return (
                            <div 
                                key={ent.id}
                                className="group bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-all hover:bg-slate-800/30"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400">
                                        <Icon className="w-5 h-5" />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-white truncate">
                                            {ent.name}
                                        </h3>
                                        
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs px-2 py-0.5 bg-slate-800 rounded text-slate-400">
                                                {ENTITY_TYPE_LABELS[ent.type] || ent.type}
                                            </span>
                                        </div>

                                        {/* Metadata preview */}
                                        <div className="mt-2 text-xs text-slate-500 space-y-0.5">
                                            {ent.metadata?.cpf && (
                                                <p>CPF: {ent.metadata.cpf}</p>
                                            )}
                                            {ent.metadata?.placa && (
                                                <p>Placa: {ent.metadata.placa}</p>
                                            )}
                                            {ent.metadata?.role && (
                                                <p>Função: {ent.metadata.role}</p>
                                            )}
                                            {ent.investigation && (
                                                <p className="text-slate-600 truncate">
                                                    Op. {ent.investigation.title}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white" title="Ver detalhes">
                                            <Eye className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default function CentralEntidadesPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>}>
            <CentralEntidadesContent />
        </Suspense>
    );
}
