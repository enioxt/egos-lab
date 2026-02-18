'use client';

/**
 * NarrativeSummary - AI-Generated Investigation Synopsis
 * 
 * Transforms raw data into a compelling narrative that answers:
 * "Who did what, where, when, and with whom?"
 * 
 * @version 1.0.0
 * @updated 2025-12-09
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
    Brain, ChevronRight, AlertTriangle, Users, MapPin, 
    Car, Target, Link2, Sparkles, RefreshCw, ExternalLink, MessageSquare
} from 'lucide-react';

// ============================================================================
// DEBATE BUTTON COMPONENT (Tsun-Cha Protocol)
// ============================================================================

function DebateButton({ investigationId, synopsis }: { investigationId: string; synopsis: string }) {
    const router = useRouter();
    
    const handleDebate = () => {
        // Navigate to chat with context pre-loaded
        const context = encodeURIComponent(synopsis.substring(0, 500));
        router.push(`/chat?debate=true&investigation=${investigationId}&context=${context}`);
    };
    
    return (
        <button
            onClick={handleDebate}
            className="text-xs text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1.5"
            title="Questionar e debater a análise da IA"
        >
            <MessageSquare className="w-3 h-3" />
            Debater
        </button>
    );
}

// ============================================================================
// TYPES
// ============================================================================

interface Entity {
    id: string;
    name: string;
    type: string;
    metadata?: Record<string, any>;
}

interface Relationship {
    id: string;
    source_id: string;
    target_id: string;
    type: string;
}

interface Evidence {
    id: string;
    description?: string;
    type: string;
    metadata?: Record<string, any>;
    created_at: string;
}

interface NarrativeSummaryProps {
    investigation: {
        id: string;
        title: string;
        status: string;
        created_at: string;
        metadata?: Record<string, any>;
    };
    entities: Entity[];
    relationships: Relationship[];
    evidence: Evidence[];
    crossCaseMatches?: number;
    onEntityClick?: (entity: Entity) => void;
    onExpandNarrative?: () => void;
    className?: string;
    /** Hide internal header (use when inside CollapsibleWidget) */
    hideHeader?: boolean;
}

interface RecentDocument {
    title: string;
    type: string;
    addedAt: string;
    entitiesExtracted: number;
}

interface NarrativeData {
    synopsis: string;
    keyFindings: string[];
    centralFigure: { name: string; connections: number; entity: Entity | null } | null;
    crimeLocations: Entity[];
    weapons: Entity[];
    vehicles: Entity[];
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    recentDocuments: RecentDocument[];
    documentImpact: string | null;
}

// ============================================================================
// HELPERS
// ============================================================================

const ROLE_LABELS: Record<string, string> = {
    'suspect': 'suspeito',
    'SUSPECT': 'suspeito',
    'victim': 'vítima',
    'VICTIM': 'vítima',
    'witness': 'testemunha',
    'WITNESS': 'testemunha',
    'informant': 'informante',
    'INFORMANT': 'informante',
};

const RELATIONSHIP_LABELS: Record<string, string> = {
    'FAMILY': 'familiar',
    'WORKS_WITH': 'trabalha com',
    'LIVES_AT': 'mora em',
    'OWNS': 'proprietário de',
    'ASSOCIATED': 'associado a',
    'MEMBER_OF': 'membro de',
    'SEEN_AT': 'visto em',
    'CONNECTED_TO': 'conectado a',
};

function getRoleLabel(role?: string): string {
    if (!role) return '';
    return ROLE_LABELS[role] || role.toLowerCase();
}

function getRelLabel(type: string): string {
    return RELATIONSHIP_LABELS[type] || type.toLowerCase().replace(/_/g, ' ');
}

// ============================================================================
// NARRATIVE GENERATOR
// ============================================================================

function generateNarrative(
    entities: Entity[],
    relationships: Relationship[],
    evidence: Evidence[],
    investigation: NarrativeSummaryProps['investigation']
): NarrativeData {
    // Categorize entities
    const persons = entities.filter(e => e.type === 'PERSON');
    const locations = entities.filter(e => e.type === 'LOCATION');
    const vehicles = entities.filter(e => e.type === 'VEHICLE');
    const weapons = entities.filter(e => e.type === 'WEAPON' || e.type === 'FIREARM');
    const organizations = entities.filter(e => e.type === 'ORGANIZATION');

    // Find crime scene locations
    const crimeLocations = locations.filter(l => 
        l.metadata?.locationType === 'crime_scene' || 
        l.metadata?.type === 'crime_scene' ||
        l.name.toLowerCase().includes('crime') ||
        l.name.toLowerCase().includes('local do')
    );

    // Calculate connections per entity
    const connectionCount: Record<string, number> = {};
    relationships.forEach(r => {
        connectionCount[r.source_id] = (connectionCount[r.source_id] || 0) + 1;
        connectionCount[r.target_id] = (connectionCount[r.target_id] || 0) + 1;
    });

    // Find most connected (central figure)
    let centralFigure: NarrativeData['centralFigure'] = null;
    let maxConnections = 0;
    persons.forEach(p => {
        const count = connectionCount[p.id] || 0;
        if (count > maxConnections) {
            maxConnections = count;
            centralFigure = { name: p.name, connections: count, entity: p };
        }
    });

    // Identify suspects
    const suspects = persons.filter(p => 
        p.metadata?.role === 'suspect' || 
        p.metadata?.role === 'SUSPECT' ||
        p.metadata?.papel === 'suspeito'
    );

    // Identify victims
    const victims = persons.filter(p => 
        p.metadata?.role === 'victim' || 
        p.metadata?.role === 'VICTIM' ||
        p.metadata?.papel === 'vítima'
    );

    // Generate key findings (LINGUAGEM POLICIAL - sem "informatiquês")
    const keyFindings: string[] = [];
    
    if (suspects.length > 0) {
        const suspectNames = suspects.slice(0, 3).map(s => s.name).join(', ');
        const more = suspects.length > 3 ? ` e mais ${suspects.length - 3}` : '';
        keyFindings.push(`🎯 ${suspects.length === 1 ? 'Suspeito identificado' : 'Suspeitos identificados'}: ${suspectNames}${more}`);
    }
    
    if (victims.length > 0) {
        const victimNames = victims.slice(0, 2).map(v => v.name).join(', ');
        keyFindings.push(`⚠️ ${victims.length === 1 ? 'Vítima' : 'Vítimas'}: ${victimNames}`);
    }
    
    if (crimeLocations.length > 0) {
        keyFindings.push(`📍 ${crimeLocations.length === 1 ? 'Cena de crime identificada' : `${crimeLocations.length} cenas de crime`}`);
    }
    
    if (weapons.length > 0) {
        const weaponTypes = weapons.map(w => w.name || w.metadata?.tipo || 'arma').slice(0, 2).join(', ');
        keyFindings.push(`🔫 ${weapons.length === 1 ? 'Arma vinculada' : 'Armas vinculadas'}: ${weaponTypes}`);
    }
    
    if (vehicles.length > 0) {
        const plates = vehicles.filter(v => v.metadata?.placa).map(v => v.metadata?.placa).slice(0, 2);
        keyFindings.push(`🚗 ${vehicles.length === 1 ? 'Veículo' : 'Veículos'} envolvidos${plates.length > 0 ? ': ' + plates.join(', ') : ''}`);
    }

    if (organizations.length > 0) {
        keyFindings.push(`🏴 ${organizations.length === 1 ? 'Organização criminosa' : 'Organizações criminosas'} relacionadas`);
    }

    // Calculate risk level
    let riskLevel: NarrativeData['riskLevel'] = 'low';
    if (weapons.length > 0 || organizations.length > 0) riskLevel = 'high';
    if (weapons.length > 1 || (organizations.length > 0 && suspects.length > 2)) riskLevel = 'critical';
    if (suspects.length === 0 && weapons.length === 0) riskLevel = 'low';
    if (suspects.length > 0 && weapons.length === 0) riskLevel = 'medium';

    // Generate synopsis (LINGUAGEM POLICIAL - como um investigador sênior)
    let synopsis = '';
    
    if (persons.length === 0) {
        synopsis = `A **${investigation.title}** ainda não possui envolvidos cadastrados. Adicione documentos para que a IA identifique automaticamente pessoas, locais e vínculos.`;
    } else {
        // Construir narrativa policial
        const personCount = persons.length === 1 ? '1 pessoa' : `${persons.length} pessoas`;
        const suspectCount = suspects.length;
        const victimCount = victims.length;
        
        // Início contextual
        if (suspectCount > 0 && victimCount > 0) {
            synopsis = `A **${investigation.title}** apura fatos envolvendo **${suspectCount} suspeito${suspectCount > 1 ? 's' : ''}** e **${victimCount} vítima${victimCount > 1 ? 's' : ''}**.`;
        } else if (suspectCount > 0) {
            synopsis = `A **${investigation.title}** investiga **${suspectCount} suspeito${suspectCount > 1 ? 's' : ''}** com [**${relationships.length} vínculos**](/central/vinculos?inv=${investigation.id}) identificados.`;
        } else {
            synopsis = `A **${investigation.title}** envolve **${personCount}** interligadas por [**${relationships.length} vínculos**](/central/vinculos?inv=${investigation.id}) diretos. [Ver grafo →](/graph/${investigation.id})`;
        }
        
        // Figura central (linguagem policial)
        if (centralFigure && (centralFigure as any).connections >= 2) {
            const cf = centralFigure as { name: string; connections: number; entity: Entity | null };
            const role = cf.entity?.metadata?.role;
            
            if (role === 'suspect' || role === 'SUSPECT') {
                synopsis += ` **${cf.name}** é a figura central, conectando ${cf.connections} elementos do caso.`;
            } else if (role === 'victim' || role === 'VICTIM') {
                synopsis += ` **${cf.name}** (vítima) é o elo principal, com ${cf.connections} conexões a outros envolvidos.`;
            } else {
                synopsis += ` **${cf.name}** concentra ${cf.connections} conexões, indicando papel relevante na estrutura.`;
            }
        }
        
        // Materialidade (armas)
        if (weapons.length > 0) {
            const weaponDesc = weapons.length === 1 
                ? `A apreensão de **1 arma** reforça a materialidade do delito.`
                : `A apreensão de **${weapons.length} armas** reforça a materialidade.`;
            synopsis += ` ${weaponDesc}`;
        }
        
        // Locais de crime
        if (crimeLocations.length > 0) {
            synopsis += ` ${crimeLocations.length === 1 ? 'Foi identificada **1 cena de crime**.' : `Foram identificadas **${crimeLocations.length} cenas de crime**.`}`;
        }
        
        // Veículo relevante
        if (vehicles.length > 0 && vehicles.some(v => connectionCount[v.id] > 1)) {
            const mainVehicle = vehicles.find(v => connectionCount[v.id] > 1);
            if (mainVehicle) {
                const plate = mainVehicle.metadata?.placa ? ` (${mainVehicle.metadata.placa})` : '';
                synopsis += ` O veículo **${mainVehicle.name}**${plate} conecta múltiplos envolvidos.`;
            }
        }
        
        // Organizações criminosas (se houver)
        if (organizations.length > 0) {
            const orgNames = organizations.slice(0, 2).map(o => o.name).join(', ');
            synopsis += ` ${organizations.length === 1 ? 'Há vínculo com a organização' : 'Há vínculos com as organizações'} **${orgNames}**${organizations.length > 2 ? ` e mais ${organizations.length - 2}` : ''}.`;
        }
        
        // Telefones/aparelhos (comunicação)
        const phones = entities.filter(e => e.type === 'PHONE');
        if (phones.length > 0) {
            synopsis += ` **${phones.length} linha${phones.length > 1 ? 's' : ''} telefônica${phones.length > 1 ? 's' : ''}** identificada${phones.length > 1 ? 's' : ''} para análise de tráfego.`;
        }
        
        // Locais geográficos (bairros/cidades únicos)
        const uniqueBairros = new Set<string>();
        crimeLocations.forEach(loc => {
            if (loc.metadata?.bairro) uniqueBairros.add(loc.metadata.bairro);
        });
        if (uniqueBairros.size > 1) {
            synopsis += ` Os fatos se espalham por **${uniqueBairros.size} bairros** distintos.`;
        }
    }

    // Analyze recent documents/evidence
    const recentDocuments: RecentDocument[] = [];
    let documentImpact: string | null = null;
    
    // Sort evidence by date and get recent ones (last 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const recentEvidence = evidence
        .filter(e => new Date(e.created_at) > oneWeekAgo)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 3);
    
    if (recentEvidence.length > 0) {
        // Map evidence to document format
        recentEvidence.forEach(ev => {
            const docType = ev.type || ev.metadata?.type || 'DOCUMENTO';
            const title = ev.description || ev.metadata?.title || ev.metadata?.filename || 'Documento sem título';
            
            // Count entities that reference this evidence
            const relatedEntities = entities.filter(e => 
                e.metadata?.source_document_id === ev.id ||
                e.metadata?.evidence_id === ev.id
            ).length;
            
            recentDocuments.push({
                title: title.length > 40 ? title.slice(0, 40) + '...' : title,
                type: docType,
                addedAt: new Date(ev.created_at).toLocaleDateString('pt-BR'),
                entitiesExtracted: relatedEntities
            });
        });
        
        // Generate document impact summary
        const totalExtracted = recentDocuments.reduce((sum, d) => sum + d.entitiesExtracted, 0);
        const docTypes = [...new Set(recentDocuments.map(d => d.type))];
        
        if (totalExtracted > 0) {
            const typeLabel = docTypes.length === 1 
                ? getDocTypeLabel(docTypes[0])
                : `${recentDocuments.length} documentos`;
            documentImpact = `📄 **${typeLabel}** adicionado${recentDocuments.length > 1 ? 's' : ''} recentemente: **${totalExtracted} entidade${totalExtracted > 1 ? 's' : ''}** extraída${totalExtracted > 1 ? 's' : ''} para análise.`;
        } else if (recentDocuments.length > 0) {
            documentImpact = `📄 **${recentDocuments.length} documento${recentDocuments.length > 1 ? 's' : ''}** adicionado${recentDocuments.length > 1 ? 's' : ''} recentemente. Processando extração de entidades.`;
        }
        
        // Add document impact to findings
        if (documentImpact) {
            keyFindings.unshift(documentImpact.replace(/\*\*/g, ''));
        }
    }

    return {
        synopsis,
        keyFindings,
        centralFigure,
        crimeLocations,
        weapons,
        vehicles,
        riskLevel,
        recentDocuments,
        documentImpact
    };
}

// Helper to get document type label in PT-BR
function getDocTypeLabel(type: string): string {
    const labels: Record<string, string> = {
        'REDS': 'REDS/B.O.',
        'PDF': 'PDF',
        'DOCX': 'Documento Word',
        'IMAGE': 'Imagem',
        'AUDIO': 'Áudio',
        'INQUERITO': 'Inquérito',
        'RELATORIO': 'Relatório',
        'AUTO': 'Auto de Apreensão',
        'TERMO': 'Termo',
        'DOCUMENTO': 'Documento'
    };
    return labels[type.toUpperCase()] || type;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function NarrativeSummary({
    investigation,
    entities,
    relationships,
    evidence,
    crossCaseMatches = 0,
    onEntityClick,
    onExpandNarrative,
    className = '',
    hideHeader = false
}: NarrativeSummaryProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    const narrative = useMemo(() => 
        generateNarrative(entities, relationships, evidence, investigation),
        [entities, relationships, evidence, investigation]
    );

    const riskColors = {
        low: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
        medium: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
        high: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
        critical: 'bg-red-500/10 border-red-500/30 text-red-400 animate-pulse'
    };

    const riskLabels = {
        low: 'Baixo',
        medium: 'Médio',
        high: 'Alto',
        critical: 'Crítico'
    };

    // Parse synopsis to make entity names and links clickable
    const renderSynopsis = (text: string) => {
        // First, handle markdown links [text](url)
        const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
        const textWithLinksProcessed = text.replace(linkRegex, '{{LINK:$2:$1}}');
        
        // Then split by bold markers
        const parts = textWithLinksProcessed.split(/(\*\*[^*]+\*\*|{{LINK:[^}]+}})/g);
        
        return parts.map((part, i) => {
            // Handle links
            if (part.startsWith('{{LINK:')) {
                const match = part.match(/{{LINK:([^:]+):([^}]+)}}/);
                if (match) {
                    const [, url, linkText] = match;
                    return (
                        <a
                            key={i}
                            href={url}
                            className="text-cyan-400 hover:text-cyan-300 hover:underline"
                        >
                            {linkText}
                        </a>
                    );
                }
            }
            
            // Handle bold text
            if (part.startsWith('**') && part.endsWith('**')) {
                const content = part.slice(2, -2);
                // Check if this is an entity name
                const entity = entities.find(e => e.name === content);
                if (entity && onEntityClick) {
                    return (
                        <button
                            key={i}
                            onClick={() => onEntityClick(entity)}
                            className="font-bold text-cyan-400 hover:text-cyan-300 hover:underline cursor-pointer"
                        >
                            {content}
                        </button>
                    );
                }
                return <span key={i} className="font-bold text-white">{content}</span>;
            }
            return <span key={i}>{part}</span>;
        });
    };

    return (
        <div className={`${hideHeader ? '' : 'bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-cyan-500/5 border border-blue-500/20 rounded-2xl'} overflow-hidden flex flex-col h-full ${className}`}>
            {/* Header - Fixed (hidden when inside CollapsibleWidget) */}
            {!hideHeader && (
            <div className="px-6 py-4 border-b border-slate-700/50 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-xl">
                        <Brain className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-white flex items-center gap-2">
                            Síntese da Investigação
                            <span className="text-xs font-normal px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded">
                                Auto-gerada
                            </span>
                        </h3>
                        <p className="text-xs text-slate-400">Narrativa baseada em {entities.length} entidades</p>
                    </div>
                </div>
                
                {/* Risk Badge - Temporarily hidden per user request */}
                {/* 
                <div className={`px-3 py-1.5 rounded-lg border text-xs font-medium ${riskColors[narrative.riskLevel]}`}>
                    <AlertTriangle className="w-3 h-3 inline mr-1" />
                    Risco {riskLabels[narrative.riskLevel]}
                </div>
                */}
            </div>
            )}

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto min-h-0">
                {/* Synopsis */}
                <div className="px-6 py-4">
                    <p className="text-slate-300 text-sm leading-relaxed">
                        {renderSynopsis(narrative.synopsis)}
                    </p>

                    {/* Document Impact Alert */}
                    {narrative.documentImpact && (
                        <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                            <p className="text-sm text-slate-300">
                                {renderSynopsis(narrative.documentImpact)}
                            </p>
                            {narrative.recentDocuments.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {narrative.recentDocuments.map((doc, i) => (
                                        <span 
                                            key={i}
                                            className="inline-flex items-center gap-1 px-2 py-1 bg-slate-700/50 rounded text-xs text-slate-400"
                                        >
                                            📄 {doc.title}
                                            {doc.entitiesExtracted > 0 && (
                                                <span className="text-emerald-400">
                                                    (+{doc.entitiesExtracted})
                                                </span>
                                            )}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Cross-Case Alert */}
                    {crossCaseMatches > 0 && (
                        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3">
                            <div className="p-1.5 bg-red-500/20 rounded">
                                <Link2 className="w-4 h-4 text-red-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-red-400">
                                    {crossCaseMatches === 1 ? '1 cross-case detectado' : `${crossCaseMatches} cross-cases detectados`}
                                </p>
                                <p className="text-xs text-slate-400">
                                    Entidades desta investigação aparecem em outras. <a href="/central/vinculos" className="text-red-400 hover:underline">Ver alertas →</a>
                                </p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-red-400 ml-auto" />
                        </div>
                    )}
                </div>

                {/* FUTURE: Key Findings and Entity Chips - Temporarily hidden per user request
                   These features exist but are too verbose for current UX needs.
                   Re-enable when user requests more detailed synthesis view.
                */}
                {/* Key Findings (Expandable) - HIDDEN 
                {narrative.keyFindings.length > 0 && (
                    <div className="px-6 pb-4">
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="w-full flex items-center justify-between text-sm text-slate-400 hover:text-white transition-colors"
                        >
                            <span className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-amber-400" />
                                {narrative.keyFindings.length === 1 ? '1 Pista Chave' : `${narrative.keyFindings.length} Pistas Chave`}
                            </span>
                            <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                        </button>

                        {isExpanded && (
                            <div className="mt-3 space-y-2">
                                {narrative.keyFindings.map((finding, i) => (
                                    <div 
                                        key={i}
                                        className="flex items-start gap-2 text-sm text-slate-300 pl-6"
                                    >
                                        <span className="text-cyan-400 mt-1">•</span>
                                        <span>{finding}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
                */}

                {/* Quick Entity Chips - HIDDEN
                {(narrative.centralFigure || narrative.crimeLocations.length > 0 || narrative.weapons.length > 0) && (
                    <div className="px-6 pb-4 flex flex-wrap gap-2">
                    {narrative.centralFigure?.entity && (
                        <button
                            onClick={() => onEntityClick?.(narrative.centralFigure!.entity!)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-full text-xs text-blue-400 hover:bg-blue-500/20 transition-colors"
                        >
                            <Users className="w-3 h-3" />
                            {narrative.centralFigure.name}
                            <ExternalLink className="w-3 h-3 opacity-50" />
                        </button>
                    )}
                    {narrative.crimeLocations.slice(0, 2).map(loc => (
                        <button
                            key={loc.id}
                            onClick={() => onEntityClick?.(loc)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-xs text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                        >
                            <MapPin className="w-3 h-3" />
                            {loc.name.length > 20 ? loc.name.slice(0, 20) + '...' : loc.name}
                            <ExternalLink className="w-3 h-3 opacity-50" />
                        </button>
                    ))}
                    {narrative.weapons.slice(0, 2).map(w => (
                        <button
                            key={w.id}
                            onClick={() => onEntityClick?.(w)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-full text-xs text-red-400 hover:bg-red-500/20 transition-colors"
                        >
                            <Target className="w-3 h-3" />
                            {w.name}
                            <ExternalLink className="w-3 h-3 opacity-50" />
                        </button>
                    ))}
                    </div>
                )}
                */}
            </div>

            {/* Footer Actions - Fixed at bottom */}
            <div className="px-6 py-3 bg-slate-900/50 border-t border-slate-700/50 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            setIsGenerating(true);
                            setTimeout(() => setIsGenerating(false), 1500);
                        }}
                        className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1.5"
                        disabled={isGenerating}
                    >
                        <RefreshCw className={`w-3 h-3 ${isGenerating ? 'animate-spin' : ''}`} />
                        {isGenerating ? 'Atualizando...' : 'Atualizar'}
                    </button>
                    
                    {/* Debate Button - Tsun-Cha Protocol */}
                    <DebateButton 
                        investigationId={investigation.id}
                        synopsis={narrative.synopsis}
                    />
                </div>
                
                {onExpandNarrative && (
                    <button
                        onClick={onExpandNarrative}
                        className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1.5"
                    >
                        Ver completo
                        <ChevronRight className="w-3 h-3" />
                    </button>
                )}
            </div>
        </div>
    );
}
