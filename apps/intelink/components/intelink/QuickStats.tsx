'use client';

import React from 'react';
import { Users, Car, MapPin, Building2, Link2, Target, TrendingUp, FileText } from 'lucide-react';

interface QuickStatsProps {
    entities: any[];
    relationships: any[];
    evidence?: any[];
    onEntityClick?: (entity: any) => void;
}

interface StatCardProps {
    icon: React.ReactNode;
    label: string;
    value: number;
    bgColor: string;
    textColor: string;
    borderColor: string;
    onClick?: () => void;
}

function StatCard({ icon, label, value, bgColor, textColor, borderColor, onClick, subtitle, cta }: StatCardProps & { subtitle?: string; cta?: string }) {
    return (
        <button 
            onClick={onClick}
            className={`${bgColor} ${borderColor} border rounded-xl p-4 flex items-center gap-3 w-full text-left transition-all hover:scale-[1.02] hover:brightness-110 cursor-pointer group`}
        >
            <div className={`p-2 rounded-lg ${textColor} bg-white/10`}>
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <p className={`text-2xl font-bold ${textColor}`}>{value}</p>
                <p className="text-xs text-slate-300">{label}</p>
                {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
            </div>
            {cta && (
                <span className="text-xs text-slate-500 group-hover:text-white transition-colors whitespace-nowrap">
                    {cta} →
                </span>
            )}
        </button>
    );
}

export default function QuickStats({ entities, relationships, evidence = [], onEntityClick }: QuickStatsProps) {
    // Count by type - separando COMPANY de ORGANIZATION
    // COMPANY = tem CNPJ (empresa comercial)
    // ORGANIZATION = facção criminosa (não tem CNPJ)
    const counts = {
        persons: entities.filter(e => e.type === 'PERSON').length,
        vehicles: entities.filter(e => e.type === 'VEHICLE').length,
        locations: entities.filter(e => e.type === 'LOCATION').length,
        // Empresas: tipo COMPANY ou ORGANIZATION com CNPJ
        companies: entities.filter(e => 
            e.type === 'COMPANY' || 
            (e.type === 'ORGANIZATION' && e.metadata?.cnpj)
        ).length,
        // Organizações criminosas: tipo ORGANIZATION sem CNPJ
        organizations: entities.filter(e => 
            e.type === 'ORGANIZATION' && !e.metadata?.cnpj
        ).length,
        weapons: entities.filter(e => e.type === 'WEAPON' || e.type === 'FIREARM').length,
    };

    // Find most connected entity
    const connectionCounts = new Map<string, number>();
    relationships.forEach(r => {
        connectionCounts.set(r.source_id, (connectionCounts.get(r.source_id) || 0) + 1);
        connectionCounts.set(r.target_id, (connectionCounts.get(r.target_id) || 0) + 1);
    });

    let mostConnected = { id: '', count: 0, name: '', entity: null as any };
    connectionCounts.forEach((count, id) => {
        if (count > mostConnected.count) {
            const entity = entities.find(e => e.id === id);
            if (entity) {
                mostConnected = { id, count, name: entity.name, entity };
            }
        }
    });

    // Calculate network density
    const maxPossibleConnections = entities.length * (entities.length - 1) / 2;
    const density = maxPossibleConnections > 0 
        ? Math.round((relationships.length / maxPossibleConnections) * 100) 
        : 0;

    // Scroll to entities section filtered by type
    const scrollToEntities = (type?: string) => {
        const section = document.getElementById('entities-section');
        if (section) {
            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    // Count suspects and witnesses for context
    const suspects = entities.filter(e => 
        e.type === 'PERSON' && 
        (e.metadata?.role === 'suspect' || e.metadata?.role === 'SUSPECT' || e.metadata?.papel === 'suspeito')
    ).length;
    const witnesses = entities.filter(e => 
        e.type === 'PERSON' && 
        (e.metadata?.role === 'witness' || e.metadata?.role === 'WITNESS' || e.metadata?.papel === 'testemunha')
    ).length;
    const crimeScenes = entities.filter(e => 
        e.type === 'LOCATION' && 
        (e.metadata?.locationType === 'crime_scene' || e.metadata?.type === 'crime_scene')
    ).length;

    return (
        <div className="space-y-4">
            {/* Main Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard
                    icon={<Users className="w-5 h-5" />}
                    label="Pessoas"
                    value={counts.persons}
                    bgColor="bg-blue-500/20"
                    textColor="text-blue-400"
                    borderColor="border-blue-500/30"
                    onClick={() => scrollToEntities('PERSON')}
                    subtitle={suspects > 0 ? `${suspects} suspeito(s)` : witnesses > 0 ? `${witnesses} testemunha(s)` : undefined}
                    cta="Ver perfis"
                />
                <StatCard
                    icon={<Car className="w-5 h-5" />}
                    label="Veículos"
                    value={counts.vehicles}
                    bgColor="bg-violet-500/20"
                    textColor="text-violet-400"
                    borderColor="border-violet-500/30"
                    onClick={() => scrollToEntities('VEHICLE')}
                    cta="Ver placas"
                />
                <StatCard
                    icon={<MapPin className="w-5 h-5" />}
                    label="Locais"
                    value={counts.locations}
                    bgColor="bg-emerald-500/20"
                    textColor="text-emerald-400"
                    borderColor="border-emerald-500/30"
                    onClick={() => scrollToEntities('LOCATION')}
                    subtitle={crimeScenes > 0 ? `${crimeScenes} cena(s) de crime` : undefined}
                    cta="Ver mapa"
                />
                <StatCard
                    icon={<Link2 className="w-5 h-5" />}
                    label="Conexões"
                    value={relationships.length}
                    bgColor="bg-purple-500/20"
                    textColor="text-purple-400"
                    borderColor="border-purple-500/30"
                    onClick={() => scrollToEntities()}
                    subtitle={density < 20 ? 'Rede esparsa' : density < 50 ? 'Rede moderada' : 'Rede densa'}
                    cta="Ver grafo"
                />
            </div>

            {/* Secondary Stats - Empresas, Organizações Criminosas, Armas, Evidências */}
            {(counts.companies > 0 || counts.organizations > 0 || counts.weapons > 0 || evidence.length > 0) && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {counts.companies > 0 && (
                        <StatCard
                            icon={<Building2 className="w-5 h-5" />}
                            label="Empresas"
                            value={counts.companies}
                            bgColor="bg-amber-500/20"
                            textColor="text-amber-400"
                            borderColor="border-amber-500/30"
                            onClick={() => scrollToEntities('COMPANY')}
                        />
                    )}
                    {counts.organizations > 0 && (
                        <StatCard
                            icon={<Target className="w-5 h-5" />}
                            label="Facções"
                            value={counts.organizations}
                            bgColor="bg-red-500/20"
                            textColor="text-red-400"
                            borderColor="border-red-500/30"
                            onClick={() => scrollToEntities('ORGANIZATION')}
                        />
                    )}
                    {counts.weapons > 0 && (
                        <StatCard
                            icon={<Target className="w-5 h-5" />}
                            label="Armas"
                            value={counts.weapons}
                            bgColor="bg-rose-500/20"
                            textColor="text-rose-400"
                            borderColor="border-rose-500/30"
                            onClick={() => scrollToEntities('FIREARM')}
                        />
                    )}
                    {evidence.length > 0 && (
                        <StatCard
                            icon={<FileText className="w-5 h-5" />}
                            label="Evidências"
                            value={evidence.length}
                            bgColor="bg-cyan-500/20"
                            textColor="text-cyan-400"
                            borderColor="border-cyan-500/30"
                            onClick={() => {
                                const section = document.getElementById('evidence-section');
                                if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }}
                        />
                    )}
                </div>
            )}

            {/* Network Insights - Narrative Style */}
            {mostConnected.count > 0 && (
                <div className="bg-gradient-to-r from-cyan-500/5 to-blue-500/5 rounded-xl p-4 border border-cyan-500/20">
                    <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-cyan-400" />
                        O que a rede revela
                    </h4>
                    
                    {/* Narrative Text */}
                    <p className="text-sm text-slate-300 leading-relaxed mb-3">
                        <button 
                            onClick={() => onEntityClick && mostConnected.entity && onEntityClick(mostConnected.entity)}
                            className="font-bold text-cyan-400 hover:text-cyan-300 hover:underline cursor-pointer"
                        >
                            {mostConnected.name}
                        </button>
                        {' '}é o <span className="text-white font-medium">nó central</span> desta rede, 
                        conectado a <span className="text-cyan-400 font-medium">{mostConnected.count} entidades</span>.
                        {density < 20 && ' A estrutura é esparsa, indicando conexões fracas ou investigação inicial.'}
                        {density >= 20 && density < 50 && ' A rede apresenta coesão moderada entre os envolvidos.'}
                        {density >= 50 && ' Alta densidade indica grupo coeso ou organização estruturada.'}
                    </p>
                    
                    {/* Quick Stats Row */}
                    <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
                            <span className="text-slate-400">Densidade:</span>
                            <span className="text-white font-medium">{density}%</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                            <span className="text-slate-400">Vínculos:</span>
                            <span className="text-white font-medium">{relationships.length}</span>
                        </div>
                        <button 
                            onClick={() => onEntityClick && mostConnected.entity && onEntityClick(mostConnected.entity)}
                            className="ml-auto text-cyan-400 hover:text-cyan-300 transition-colors"
                        >
                            Ver {mostConnected.name} →
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
