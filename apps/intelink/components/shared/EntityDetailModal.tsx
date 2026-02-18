'use client';

/**
 * EntityDetailModal - Componente PADRONIZADO para exibir detalhes de entidades
 * 
 * USAR EM TODO O SISTEMA para manter consistência visual.
 * Baseado no PersonModal.tsx mas genérico para qualquer tipo de entidade.
 * 
 * @see styles/DESIGN_SYSTEM.md para cores e padrões
 */

import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
    X, Users, Car, MapPin, FileText, Phone, IdCard,
    Calendar, Shield, AlertTriangle, ExternalLink,
    Fingerprint, Home, Briefcase, UserCircle,
    Building2, Target, Loader2, ArrowLeft, ChevronRight, Map
} from 'lucide-react';
import Link from 'next/link';
import EntityNarrativeSummary from './EntityNarrativeSummary';
import IndirectConnectionsModal from './IndirectConnectionsModal';
import { useJourneySafe } from '@/providers/JourneyContext';
import DeleteButton from '@/components/DeleteButton';
import PredictedLinksPanel from '@/components/graph/PredictedLinksPanel';

// =====================================================
// DESIGN SYSTEM - CORES PADRONIZADAS
// =====================================================
const ENTITY_COLORS: Record<string, { icon: string; bg: string; border: string }> = {
    PERSON: { icon: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/30' },
    LOCATION: { icon: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30' },
    VEHICLE: { icon: 'text-pink-400', bg: 'bg-pink-500/20', border: 'border-pink-500/30' },
    ORGANIZATION: { icon: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30' }, // Org. Criminosa
    COMPANY: { icon: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/30' }, // Empresa
    WEAPON: { icon: 'text-rose-400', bg: 'bg-rose-500/20', border: 'border-rose-500/30' },
    FIREARM: { icon: 'text-rose-400', bg: 'bg-rose-500/20', border: 'border-rose-500/30' },
};

// Labels em português
const TYPE_LABELS: Record<string, string> = {
    PERSON: 'Pessoa',
    LOCATION: 'Local',
    VEHICLE: 'Veículo',
    ORGANIZATION: 'Org. Criminosa',
    COMPANY: 'Empresa',
    WEAPON: 'Arma',
    FIREARM: 'Arma de Fogo',
};

const ENTITY_ICONS: Record<string, typeof UserCircle> = {
    PERSON: UserCircle,
    LOCATION: MapPin,
    VEHICLE: Car,
    ORGANIZATION: Building2,
    COMPANY: Building2,
    WEAPON: Target,
    FIREARM: Target,
};

const ROLE_COLORS: Record<string, { label: string; color: string }> = {
    suspeito: { label: 'Suspeito', color: 'red' },
    suspect: { label: 'Suspeito', color: 'red' },
    investigado: { label: 'Investigado', color: 'red' },
    vitima: { label: 'Vítima', color: 'amber' },
    victim: { label: 'Vítima', color: 'amber' },
    testemunha: { label: 'Testemunha', color: 'blue' },
    witness: { label: 'Testemunha', color: 'blue' },
    lider: { label: 'Líder', color: 'purple' },
    informante: { label: 'Informante', color: 'emerald' },
};

// =====================================================
// HELPERS - FORMATAÇÃO BRASILEIRA
// =====================================================

/** Formata data para DD/MM/AAAA */
function formatDateBR(date: string | undefined): string {
    if (!date) return '';
    // Se já estiver no formato DD/MM/AAAA, retornar
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(date)) return date;
    // Se estiver no formato ISO ou YYYY-MM-DD
    try {
        const d = new Date(date);
        if (isNaN(d.getTime())) return date;
        return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
        return date;
    }
}

/** Formata RG com UF se disponível */
function formatRG(rg: string | undefined, uf?: string): string {
    if (!rg) return '';
    return uf ? `${rg} (${uf.toUpperCase()})` : rg;
}

// =====================================================
// INTERFACES
// =====================================================
export interface EntityDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    entityId: string;
    // Opcionais - se já tiver dados básicos
    entityName?: string;
    entityType?: string;
    investigationId?: string;
    investigationTitle?: string;
    
    // Cross-case alert context (opcional)
    isFromAlert?: boolean;
    matchConfidence?: number;
    targetInvestigationId?: string;
    targetInvestigationTitle?: string;
    matchedEntityId?: string;
    matchedEntityName?: string;
}

interface EntityData {
    id: string;
    name: string;
    type: string;
    metadata?: Record<string, any>;
    created_at?: string;
    investigation?: { id: string; title: string };
    relationships?: Array<{
        id: string;
        type: string;
        relatedEntity: { id: string; name: string; type: string };
        direction: 'incoming' | 'outgoing';
    }>;
    otherInvestigations?: Array<{ id: string; title: string }>;
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================
export default function EntityDetailModal({
    isOpen,
    onClose,
    entityId,
    entityName,
    entityType,
    investigationId,
    investigationTitle,
    // Cross-case alert props
    isFromAlert,
    matchConfidence,
    targetInvestigationId,
    targetInvestigationTitle,
    matchedEntityId,
    matchedEntityName
}: EntityDetailModalProps) {
    const [loading, setLoading] = useState(true);
    const [entity, setEntity] = useState<EntityData | null>(null);
    const [currentEntityId, setCurrentEntityId] = useState(entityId);
    const [navigationHistory, setNavigationHistory] = useState<string[]>([]);
    const [showIndirectModal, setShowIndirectModal] = useState(false);
    
    // Journey tracking (Investigation Diary)
    const { addStep, isRecording } = useJourneySafe();
    
    // Ref to track current fetch and prevent race conditions
    const fetchIdRef = useRef<string | null>(null);
    
    // Telemetry tracking
    const trackClick = async (action: string, targetId: string, targetName: string, targetType: string) => {
        try {
            await fetch('/api/telemetry', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    event: 'entity_modal_click',
                    action,
                    source_entity_id: currentEntityId,
                    target_entity_id: targetId,
                    target_name: targetName,
                    target_type: targetType,
                    timestamp: new Date().toISOString(),
                }),
            });
        } catch (e) {
            console.error('Telemetry error:', e);
        }
    };
    
    // Handle navigation to another entity (cascade)
    const navigateToEntity = (newEntityId: string, name: string, type: string, relationshipType?: string) => {
        trackClick('navigate_to_entity', newEntityId, name, type);
        setNavigationHistory(prev => [...prev, currentEntityId]);
        
        // Add step to Investigation Journey
        if (isRecording && entity) {
            addStep({
                entityId: newEntityId,
                entityName: name,
                entityType: type,
                source: 'click_relationship',
                previousEntityId: currentEntityId,
                relationshipType: relationshipType,
                visibleConnectionsSnapshot: entity.relationships?.map(r => ({
                    id: r.relatedEntity.id,
                    name: r.relatedEntity.name,
                    type: r.relatedEntity.type,
                    relationship: r.type,
                })) || [],
            });
        }
        
        setCurrentEntityId(newEntityId);
    };
    
    // Go back in navigation history
    const navigateBack = () => {
        if (navigationHistory.length > 0) {
            const previousId = navigationHistory[navigationHistory.length - 1];
            setNavigationHistory(prev => prev.slice(0, -1));
            setCurrentEntityId(previousId);
        }
    };
    
    // Open location in Google Maps
    const openGoogleMaps = () => {
        const locationName = entity?.name || entityName || '';
        const query = encodeURIComponent(locationName);
        window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
    };
    
    // Reset when modal opens with new entityId
    useEffect(() => {
        if (isOpen && entityId) {
            setCurrentEntityId(entityId);
            setNavigationHistory([]);
            
            // Track initial entity view in Journey (if recording and we have basic info)
            if (isRecording && entityName && entityType) {
                addStep({
                    entityId,
                    entityName,
                    entityType,
                    source: 'search',
                    visibleConnectionsSnapshot: [],
                });
            }
        }
    }, [isOpen, entityId]);

    useEffect(() => {
        if (isOpen && currentEntityId) {
            loadEntityData();
        }
    }, [isOpen, currentEntityId]);

    // Fechar com ESC
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) onClose();
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    const loadEntityData = async () => {
        // Store the entity ID we're fetching to prevent race conditions
        const fetchingId = currentEntityId;
        fetchIdRef.current = fetchingId;
        
        setLoading(true);
        setEntity(null); // Clear previous entity immediately
        
        try {
            // Use API route instead of direct Supabase (bypasses RLS, more reliable)
            console.log('[EntityDetailModal] Loading data for entity:', fetchingId);
            const response = await fetch(`/api/entity/${fetchingId}/related`);
            
            // Check if this fetch is still relevant (user may have clicked another entity)
            if (fetchIdRef.current !== fetchingId) {
                console.log('[EntityDetailModal] Fetch cancelled - different entity requested');
                return;
            }
            
            if (!response.ok) {
                console.error('[EntityDetailModal] API error:', response.status);
                // Fallback: usar dados passados por props
                setEntity({
                    id: entityId,
                    name: entityName || 'Desconhecido',
                    type: entityType || 'PERSON',
                    investigation: investigationId ? { id: investigationId, title: investigationTitle || '' } : undefined
                });
                setLoading(false);
                return;
            }

            const apiData = await response.json();
            
            // Double-check race condition after async operation
            if (fetchIdRef.current !== fetchingId) {
                console.log('[EntityDetailModal] Fetch cancelled after response - different entity requested');
                return;
            }
            
            console.log('[EntityDetailModal] API response:', {
                entity: apiData.entity?.name,
                relatedPeople: apiData.relatedPeople?.length,
                relatedLocations: apiData.relatedLocations?.length,
                relatedVehicles: apiData.relatedVehicles?.length,
            });

            if (!apiData.entity) {
                // Fallback: usar dados passados por props
                setEntity({
                    id: entityId,
                    name: entityName || 'Desconhecido',
                    type: entityType || 'PERSON',
                    investigation: investigationId ? { id: investigationId, title: investigationTitle || '' } : undefined
                });
                setLoading(false);
                return;
            }

            // Combine all related entities into relationships array
            const allRelated = [
                ...(apiData.relatedPeople || []),
                ...(apiData.relatedLocations || []),
                ...(apiData.relatedVehicles || []),
                ...(apiData.relatedOrganizations || []),
                ...(apiData.relatedFirearms || []),
            ];

            const enrichedRelationships = allRelated.map((rel: any) => ({
                id: rel.relationship_id || rel.id,
                type: rel.relationship_type || 'ASSOCIATED',
                relatedEntity: { id: rel.id, name: rel.name, type: rel.type },
                direction: 'outgoing' as 'incoming' | 'outgoing'
            }));

            // Get investigation info from entity
            const investigation = apiData.entity.investigation_id ? {
                id: apiData.entity.investigation_id,
                title: '' // Will be fetched if needed
            } : undefined;

            // Other investigations from API (cross-case matches)
            const otherInvestigations: { id: string; title: string }[] = apiData.otherInvestigations || [];

            setEntity({
                id: apiData.entity.id,
                name: apiData.entity.name,
                type: apiData.entity.type,
                metadata: apiData.entity.metadata,
                created_at: apiData.entity.created_at,
                investigation,
                relationships: enrichedRelationships,
                otherInvestigations
            });

        } catch (e) {
            console.error('Error loading entity:', e);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const colors = ENTITY_COLORS[entity?.type || entityType || 'PERSON'] || ENTITY_COLORS.PERSON;
    const Icon = ENTITY_ICONS[entity?.type || entityType || 'PERSON'] || UserCircle;
    const rawMeta = entity?.metadata || {};
    
    // Normalize field names (support both Portuguese and English field names)
    const meta = {
        ...rawMeta,
        // Portuguese → English fallbacks
        cpf: rawMeta.cpf,
        rg: rawMeta.rg,
        rg_uf: rawMeta.rg_uf || rawMeta.uf_rg || rawMeta.orgao_expedidor || rawMeta.estado_rg,
        data_nascimento: rawMeta.data_nascimento || rawMeta.birth_date || rawMeta.nascimento || rawMeta.dn,
        mae: rawMeta.mae || rawMeta.mother_name || rawMeta.nome_mae || rawMeta.filiacao_mae,
        pai: rawMeta.pai || rawMeta.father_name || rawMeta.nome_pai || rawMeta.filiacao_pai,
        telefone: rawMeta.telefone || rawMeta.phone || rawMeta.celular,
        profissao: rawMeta.profissao || rawMeta.profession || rawMeta.ocupacao,
        endereco: rawMeta.endereco || rawMeta.address || rawMeta.logradouro,
        bairro: rawMeta.bairro || rawMeta.neighborhood,
        cidade: rawMeta.cidade || rawMeta.city || rawMeta.municipio,
        vulgo: rawMeta.vulgo || rawMeta.alias || rawMeta.apelido,
        role: rawMeta.role || rawMeta.papel,
    };
    const roleInfo = ROLE_COLORS[(meta.role || '').toLowerCase()] || { label: meta.role || 'Envolvido', color: 'slate' };

    // Agrupar relacionamentos por tipo de entidade
    const groupedRelationships = {
        PERSON: entity?.relationships?.filter(r => r.relatedEntity?.type === 'PERSON') || [],
        LOCATION: entity?.relationships?.filter(r => r.relatedEntity?.type === 'LOCATION') || [],
        VEHICLE: entity?.relationships?.filter(r => r.relatedEntity?.type === 'VEHICLE') || [],
        ORGANIZATION: entity?.relationships?.filter(r => ['ORGANIZATION', 'COMPANY'].includes(r.relatedEntity?.type)) || [],
        WEAPON: entity?.relationships?.filter(r => ['WEAPON', 'FIREARM'].includes(r.relatedEntity?.type)) || [],
    };

    const totalConnections = Object.values(groupedRelationships).flat().length;

    // Use Portal to render modal at document root (avoids z-index issues in nested containers)
    const modalContent = (
        <div 
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999] p-4"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="bg-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-slate-700 bg-slate-800">
                    {/* Navigation breadcrumb */}
                    {navigationHistory.length > 0 && (
                        <div className="flex items-center gap-2 mb-3">
                            <button
                                onClick={navigateBack}
                                className="flex items-center gap-1 px-2 py-1 text-xs text-blue-400 hover:bg-slate-700 rounded transition-colors"
                            >
                                <ArrowLeft className="w-3 h-3" />
                                Voltar
                            </button>
                            <span className="text-slate-600">•</span>
                            <span className="text-xs text-slate-500">
                                {navigationHistory.length + 1} níveis de navegação
                            </span>
                        </div>
                    )}
                    
                    <div className="flex justify-between items-start">
                        <div className="flex items-start gap-4">
                            <div className={`p-3 ${colors.bg} rounded-xl`}>
                                <Icon className={`w-8 h-8 ${colors.icon}`} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white uppercase tracking-wide">
                                    {entity?.name || entityName || 'Carregando...'}
                                </h2>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium bg-${roleInfo.color}-500/20 text-${roleInfo.color}-400 capitalize`}>
                                        {roleInfo.label}
                                    </span>
                                    {meta.vulgo && (
                                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-700 text-slate-300">
                                            Vulgo: {meta.vulgo}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Google Maps button for LOCATION entities */}
                            {(entity?.type === 'LOCATION' || entityType === 'LOCATION') && (
                                <button
                                    onClick={openGoogleMaps}
                                    className="flex items-center gap-2 px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg transition-colors"
                                    title="Abrir no Google Maps"
                                >
                                    <Map className="w-4 h-4" />
                                    <span className="text-sm font-medium hidden sm:inline">Ver no Mapa</span>
                                    <ExternalLink className="w-3 h-3" />
                                </button>
                            )}
                            {/* Delete button - Super admin can instant delete < 24h, others vote */}
                            {entity?.id && (
                                <DeleteButton
                                    itemType="entity"
                                    itemId={entity.id}
                                    itemName={entity.name}
                                    createdAt={entity.created_at}
                                    onDeleted={onClose}
                                    size="md"
                                />
                            )}
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                        </div>
                    ) : (
                        <>
                            {/* Cross-Case Alert Banner */}
                            {isFromAlert && matchConfidence && (
                                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                                    <div className="flex items-start gap-3">
                                        <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-amber-400">
                                                Match Cross-Case ({Math.round(matchConfidence)}% confiança)
                                            </p>
                                            {matchedEntityName && targetInvestigationTitle && (
                                                <p className="text-xs text-slate-400 mt-1">
                                                    Pode ser a mesma pessoa que <strong className="text-white">{matchedEntityName}</strong> em{' '}
                                                    <Link 
                                                        href={`/investigation/${targetInvestigationId}`}
                                                        className="text-amber-400 hover:underline"
                                                    >
                                                        {targetInvestigationTitle}
                                                    </Link>
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {/* Dados Pessoais (se PERSON) */}
                            {(entity?.type === 'PERSON' || entityType === 'PERSON') && (
                                <Section
                                    icon={<IdCard className="w-5 h-5 text-blue-400" />}
                                    title="Dados Pessoais"
                                    subtitle="Informações de identificação"
                                    colorKey="blue"
                                >
                                    {Object.keys(meta).filter(k => !['role', 'rg_uf'].includes(k) && meta[k as keyof typeof meta]).length > 0 ? (
                                        <div className="p-4 grid grid-cols-2 gap-4">
                                            {/* Dados principais em ordem: CPF, RG+UF, Nascimento, Filiação */}
                                            {meta.cpf && <InfoField icon={<Fingerprint className="w-4 h-4" />} label="CPF" value={meta.cpf} />}
                                            {meta.rg && <InfoField icon={<IdCard className="w-4 h-4" />} label="RG" value={formatRG(meta.rg, meta.rg_uf)} />}
                                            {meta.data_nascimento && <InfoField icon={<Calendar className="w-4 h-4" />} label="Nascimento" value={formatDateBR(meta.data_nascimento)} />}
                                            {meta.mae && <InfoField icon={<UserCircle className="w-4 h-4" />} label="Mãe" value={meta.mae} className="col-span-2" />}
                                            {meta.pai && <InfoField icon={<UserCircle className="w-4 h-4" />} label="Pai" value={meta.pai} className="col-span-2" />}
                                            {meta.telefone && <InfoField icon={<Phone className="w-4 h-4" />} label="Telefone" value={meta.telefone} />}
                                            {meta.profissao && <InfoField icon={<Briefcase className="w-4 h-4" />} label="Profissão" value={meta.profissao} />}
                                            {meta.bairro && <InfoField icon={<MapPin className="w-4 h-4" />} label="Bairro" value={meta.bairro} />}
                                            {meta.cidade && <InfoField icon={<MapPin className="w-4 h-4" />} label="Cidade" value={meta.cidade} />}
                                            {meta.endereco && <InfoField icon={<Home className="w-4 h-4" />} label="Endereço" value={meta.endereco} className="col-span-2" />}
                                        </div>
                                    ) : (
                                        <div className="p-6 text-center text-slate-500">
                                            <IdCard className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                            <p className="text-sm">Dados pessoais não cadastrados</p>
                                        </div>
                                    )}
                                </Section>
                            )}

                            {/* Síntese Narrativa - SEMPRE mostrar para entidades (com ou sem conexões) */}
                            {entity && (
                                <EntityNarrativeSummary
                                    entity={{
                                        id: entity.id,
                                        name: entity.name,
                                        type: entity.type,
                                        metadata: entity.metadata
                                    }}
                                    relationships={entity.relationships || []}
                                    otherInvestigations={entity.otherInvestigations}
                                    onEntityClick={navigateToEntity}
                                    onIndirectConnectionsClick={() => setShowIndirectModal(true)}
                                />
                            )}

                            {/* Pessoas Relacionadas */}
                            {groupedRelationships.PERSON.length > 0 && (
                                <Section
                                    icon={<Users className="w-5 h-5 text-purple-400" />}
                                    title="Pessoas Relacionadas"
                                    subtitle={`${groupedRelationships.PERSON.length} pessoa(s) • Clique para navegar`}
                                    colorKey="purple"
                                >
                                    {groupedRelationships.PERSON.map(r => (
                                        <RelatedItem 
                                            key={r.id} 
                                            item={r} 
                                            onClick={() => navigateToEntity(r.relatedEntity.id, r.relatedEntity.name, r.relatedEntity.type)}
                                        />
                                    ))}
                                </Section>
                            )}

                            {/* Locais */}
                            {groupedRelationships.LOCATION.length > 0 && (
                                <Section
                                    icon={<MapPin className="w-5 h-5 text-emerald-400" />}
                                    title="Locais"
                                    subtitle={`${groupedRelationships.LOCATION.length} local(is) • Clique para navegar`}
                                    colorKey="emerald"
                                >
                                    {groupedRelationships.LOCATION.map(r => (
                                        <RelatedItem 
                                            key={r.id} 
                                            item={r} 
                                            onClick={() => navigateToEntity(r.relatedEntity.id, r.relatedEntity.name, r.relatedEntity.type)}
                                        />
                                    ))}
                                </Section>
                            )}

                            {/* Veículos */}
                            {groupedRelationships.VEHICLE.length > 0 && (
                                <Section
                                    icon={<Car className="w-5 h-5 text-pink-400" />}
                                    title="Veículos"
                                    subtitle={`${groupedRelationships.VEHICLE.length} veículo(s) • Clique para navegar`}
                                    colorKey="pink"
                                >
                                    {groupedRelationships.VEHICLE.map(r => (
                                        <RelatedItem 
                                            key={r.id} 
                                            item={r} 
                                            onClick={() => navigateToEntity(r.relatedEntity.id, r.relatedEntity.name, r.relatedEntity.type)}
                                        />
                                    ))}
                                </Section>
                            )}

                            {/* Organizações */}
                            {groupedRelationships.ORGANIZATION.length > 0 && (
                                <Section
                                    icon={<Building2 className="w-5 h-5 text-amber-400" />}
                                    title="Empresas Vinculadas"
                                    subtitle={`${groupedRelationships.ORGANIZATION.length} empresa(s) • Clique para navegar`}
                                    colorKey="amber"
                                >
                                    {groupedRelationships.ORGANIZATION.map(r => (
                                        <RelatedItem 
                                            key={r.id} 
                                            item={r} 
                                            onClick={() => navigateToEntity(r.relatedEntity.id, r.relatedEntity.name, r.relatedEntity.type)}
                                        />
                                    ))}
                                </Section>
                            )}

                            {/* Armas */}
                            {groupedRelationships.WEAPON.length > 0 && (
                                <Section
                                    icon={<Target className="w-5 h-5 text-rose-400" />}
                                    title="Armas"
                                    subtitle={`${groupedRelationships.WEAPON.length} arma(s) • Clique para navegar`}
                                    colorKey="rose"
                                >
                                    {groupedRelationships.WEAPON.map(r => (
                                        <RelatedItem 
                                            key={r.id} 
                                            item={r} 
                                            onClick={() => navigateToEntity(r.relatedEntity.id, r.relatedEntity.name, r.relatedEntity.type)}
                                        />
                                    ))}
                                </Section>
                            )}

                            {/* Outras Operações */}
                            {entity?.otherInvestigations && entity.otherInvestigations.length > 0 && (
                                <Section
                                    icon={<AlertTriangle className="w-5 h-5 text-orange-400" />}
                                    title="Aparece em Outras Operações"
                                    subtitle={`${entity.otherInvestigations.length} operação(ões)`}
                                    colorKey="orange"
                                >
                                    {entity.otherInvestigations.map(inv => (
                                        <Link
                                            key={inv.id}
                                            href={`/intelink/investigation/${inv.id}`}
                                            className="block px-4 py-3 hover:bg-slate-700/20 transition-colors"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-white font-medium">{inv.title}</span>
                                                <ExternalLink className="w-4 h-4 text-slate-500" />
                                            </div>
                                        </Link>
                                    ))}
                                </Section>
                            )}

                            {/* Você Pode Conhecer - Conexões Sugeridas */}
                            {investigationId && entity?.id && (
                                <div className="mt-4">
                                    <PredictedLinksPanel
                                        investigationId={investigationId}
                                        selectedEntityId={entity.id}
                                        onViewEntity={(targetEntityId) => {
                                            navigateToEntity(targetEntityId, '', '');
                                        }}
                                        className="rounded-xl"
                                    />
                                </div>
                            )}

                            {/* Sem conexões */}
                            {totalConnections === 0 && !entity?.otherInvestigations?.length && (
                                <div className="text-center py-12">
                                    <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                                    <p className="text-slate-400">Nenhuma conexão encontrada</p>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-700 bg-slate-800/50">
                    <p className="text-slate-400 text-sm font-medium text-center">
                        {totalConnections} conexões • {entity?.otherInvestigations?.length || 0} outra(s) operação(ões)
                    </p>
                </div>
            </div>
        </div>
    );
    
    // Render modal using Portal to avoid z-index issues in nested containers
    const portalContent = typeof document !== 'undefined' 
        ? createPortal(modalContent, document.body)
        : modalContent;
    
    return (
        <>
            {portalContent}
            
            {/* Indirect Connections Modal (2nd degree - Mycelium) */}
            <IndirectConnectionsModal
                isOpen={showIndirectModal}
                onClose={() => setShowIndirectModal(false)}
                entityId={currentEntityId}
                entityName={entity?.name || entityName || 'Entidade'}
                onEntityClick={(id, name, type) => {
                    setShowIndirectModal(false);
                    navigateToEntity(id, name, type);
                }}
            />
        </>
    );
}

// =====================================================
// SUB-COMPONENTES
// =====================================================

function Section({ icon, title, subtitle, colorKey, children }: {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    colorKey: string;
    children: React.ReactNode;
}) {
    const colors: Record<string, string> = {
        blue: 'border-blue-500/30 bg-blue-500/5',
        purple: 'border-purple-500/30 bg-purple-500/5',
        emerald: 'border-emerald-500/30 bg-emerald-500/5',
        pink: 'border-pink-500/30 bg-pink-500/5',
        amber: 'border-amber-500/30 bg-amber-500/5',
        rose: 'border-rose-500/30 bg-rose-500/5',
        orange: 'border-orange-500/30 bg-orange-500/5',
    };

    return (
        <div className={`border rounded-xl overflow-hidden ${colors[colorKey] || colors.blue}`}>
            <div className="px-4 py-3 border-b border-slate-700/50 flex items-center gap-3">
                {icon}
                <div>
                    <h3 className="font-semibold text-white">{title}</h3>
                    <p className="text-slate-400 text-xs">{subtitle}</p>
                </div>
            </div>
            <div className="divide-y divide-slate-700/30">
                {children}
            </div>
        </div>
    );
}

function InfoField({ icon, label, value, className = '' }: { 
    icon: React.ReactNode; 
    label: string; 
    value?: string; 
    className?: string;
}) {
    return (
        <div className={`flex items-start gap-2 ${className}`}>
            <span className="text-slate-500 mt-0.5">{icon}</span>
            <div>
                <p className="text-xs text-slate-500">{label}</p>
                <p className="text-sm text-white">{value || <span className="text-slate-600 italic">Não informado</span>}</p>
            </div>
        </div>
    );
}

function RelatedItem({ item, onClick }: { item: any; onClick?: () => void }) {
    const Icon = ENTITY_ICONS[item.relatedEntity?.type] || UserCircle;
    const colors = ENTITY_COLORS[item.relatedEntity?.type] || ENTITY_COLORS.PERSON;
    
    // Humanize relationship type
    const humanizeType = (type: string) => {
        const translations: Record<string, string> = {
            'CASADO_COM': 'Casado com',
            'FILHO_DE': 'Filho de',
            'PAI_DE': 'Pai de',
            'MAE_DE': 'Mãe de',
            'SOCIO_DE': 'Sócio de',
            'DONO_DE': 'Dono de',
            'PROPRIETARIO': 'Proprietário',
            'RESIDE_EM': 'Reside em',
            'TRABALHA_EM': 'Trabalha em',
            'CONDUTOR_DE': 'Condutor de',
            'MEMBRO_DE': 'Membro de',
            'ASSOCIADO_A': 'Associado a',
            'CUMPLICE': 'Cúmplice',
            'COMPARSA': 'Comparsa',
        };
        return translations[type.toUpperCase()] || type.replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase());
    };

    return (
        <button
            onClick={onClick}
            className="w-full px-4 py-3 hover:bg-slate-700/30 transition-colors flex items-center justify-between cursor-pointer text-left"
        >
            <div className="flex items-center gap-3">
                <div className={`w-8 h-8 ${colors.bg} rounded-full flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${colors.icon}`} />
                </div>
                <div>
                    <p className="text-white font-medium">{item.relatedEntity?.name}</p>
                    <p className="text-slate-400 text-xs">{humanizeType(item.type)}</p>
                </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500" />
        </button>
    );
}
