'use client';

/**
 * EntityNarrativeSummary - Síntese Narrativa de Entidade
 * 
 * Transforma dados de uma entidade em narrativa policial:
 * "Quem é essa pessoa, com quem se relaciona, onde está envolvida?"
 * 
 * @version 1.0.0
 * @updated 2025-12-13
 */

import React from 'react';
import { 
    Brain, Users, MapPin, Car, Building2, Target, 
    Link2, ChevronRight, Network, Map, ExternalLink
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface RelatedEntity {
    id: string;
    name: string;
    type: string;
    relationship_type?: string;
}

interface EntityNarrativeSummaryProps {
    entity: {
        id: string;
        name: string;
        type: string;
        metadata?: Record<string, any>;
    };
    relationships: Array<{
        id: string;
        type: string;
        relatedEntity: { id: string; name: string; type: string };
        direction: 'incoming' | 'outgoing';
    }>;
    otherInvestigations?: Array<{ id: string; title: string }>;
    onEntityClick: (entityId: string, name: string, type: string) => void;
    onIndirectConnectionsClick?: () => void;
}

// ============================================================================
// HELPERS
// ============================================================================

const RELATIONSHIP_LABELS: Record<string, string> = {
    // Família
    MARRIED_TO: 'casado(a) com',
    SPOUSE: 'cônjuge de',
    CASADO_COM: 'casado(a) com',
    CHILD_OF: 'filho(a) de',
    FILHO_DE: 'filho(a) de',
    PARENT_OF: 'pai/mãe de',
    PAI_DE: 'pai de',
    MAE_DE: 'mãe de',
    SIBLING: 'irmão(ã) de',
    IRMAO_DE: 'irmão(ã) de',
    RELATIVE: 'parente de',
    // Profissional
    PARTNER: 'sócio(a) de',
    SOCIO_DE: 'sócio(a) de',
    EMPLOYEE: 'funcionário(a) de',
    EMPLOYER: 'empregador(a) de',
    OWNS: 'proprietário(a) de',
    PROPRIETARIO: 'proprietário(a) de',
    OWNED_BY: 'pertence a',
    WORKS_AT: 'trabalha em',
    BUSINESS: 'negócio com',
    // Localização
    RESIDES_AT: 'reside em',
    RESIDE_EM: 'reside em',
    // Outros
    ASSOCIATED: 'vinculado(a) a',
    KNOWS: 'conhecido(a) de',
    CONHECIDO_DE: 'conhecido(a) de',
    CONNECTED: 'conectado(a) a',
    FRIEND: 'amigo(a) de',
};

function getRelationshipLabel(type: string): string {
    return RELATIONSHIP_LABELS[type?.toUpperCase()] || RELATIONSHIP_LABELS[type] || type?.toLowerCase() || 'vinculado a';
}

function groupByType(relationships: EntityNarrativeSummaryProps['relationships']) {
    return {
        // NOTA: Filiação (FILHO_DE, CHILD_OF) vai para dados básicos, NÃO para síntese
        // Síntese só mostra: cônjuge, irmãos, parentes (não pais)
        spouse: relationships.filter(r => 
            ['MARRIED_TO', 'SPOUSE', 'CASADO_COM'].includes(r.type?.toUpperCase())
        ),
        family: relationships.filter(r => 
            ['SIBLING', 'RELATIVE', 'IRMAO_DE'].includes(r.type?.toUpperCase())
        ),
        business: relationships.filter(r => 
            ['PARTNER', 'SOCIO_DE', 'EMPLOYEE', 'EMPLOYER', 'OWNS', 'OWNED_BY', 'WORKS_AT', 'BUSINESS'].includes(r.type?.toUpperCase())
        ),
        locations: relationships.filter(r => 
            r.relatedEntity.type === 'LOCATION' || ['RESIDES_AT', 'RESIDE_EM'].includes(r.type?.toUpperCase())
        ),
        vehicles: relationships.filter(r => 
            r.relatedEntity.type === 'VEHICLE'
        ),
        organizations: relationships.filter(r => 
            ['ORGANIZATION', 'COMPANY'].includes(r.relatedEntity.type)
        ),
        weapons: relationships.filter(r => 
            ['WEAPON', 'FIREARM'].includes(r.relatedEntity.type)
        ),
        other: relationships.filter(r => 
            // Excluir todos os tipos já categorizados
            !['MARRIED_TO', 'SPOUSE', 'CASADO_COM', 'CHILD_OF', 'PARENT_OF', 'FILHO_DE', 'PAI_DE', 'MAE_DE',
              'SIBLING', 'RELATIVE', 'IRMAO_DE', 'SOCIO_DE',
              'PARTNER', 'EMPLOYEE', 'EMPLOYER', 'OWNS', 'OWNED_BY', 'WORKS_AT', 'BUSINESS',
              'RESIDES_AT', 'RESIDE_EM', 'PROPRIETARIO'].includes(r.type?.toUpperCase()) &&
            !['LOCATION', 'VEHICLE', 'ORGANIZATION', 'COMPANY', 'WEAPON', 'FIREARM'].includes(r.relatedEntity.type)
        ),
    };
}

// ============================================================================
// CLICKABLE ENTITY COMPONENT
// ============================================================================

function ClickableEntity({ 
    name, 
    entityId,
    type,
    onClick 
}: { 
    name: string; 
    entityId: string;
    type: string;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className="font-semibold text-blue-400 hover:text-blue-300 hover:underline transition-colors cursor-pointer"
            title={`Ver detalhes de ${name}`}
        >
            {name}
        </button>
    );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function EntityNarrativeSummary({
    entity,
    relationships,
    otherInvestigations = [],
    onEntityClick,
    onIndirectConnectionsClick
}: EntityNarrativeSummaryProps) {
    
    if (!entity) {
        return null;
    }

    const grouped = groupByType(relationships);
    const meta = entity.metadata || {};
    const role = meta.role?.toLowerCase();
    
    // Build basic description from metadata even without relationships
    const basicDescriptionParts: string[] = [];
    if (meta.filho_de || meta.mae || meta.pai) {
        const parents = [meta.filho_de, meta.mae, meta.pai].filter(Boolean).join(', ');
        basicDescriptionParts.push(`filho de ${parents}`);
    }
    if (meta.envolvimento) basicDescriptionParts.push(meta.envolvimento);
    if (meta.profissao) basicDescriptionParts.push(meta.profissao);
    
    // Location info
    const locationParts: string[] = [];
    if (meta.endereco) locationParts.push(meta.endereco);
    else if (meta.rua || meta.numero) {
        locationParts.push([meta.rua, meta.numero].filter(Boolean).join(', '));
    }
    if (meta.bairro) locationParts.push(meta.bairro);
    if (meta.cidade || meta.municipio) locationParts.push(meta.cidade || meta.municipio);
    if (locationParts.length > 0) {
        basicDescriptionParts.push(`Reside/frequenta: ${locationParts.join(', ')}`);
    }
    
    const basicDescription = basicDescriptionParts.join('. ');

    // Build narrative parts
    const narrativeParts: React.ReactNode[] = [];

    // Spouse (cônjuge) - most important personal relationship
    if (grouped.spouse.length > 0) {
        const spouse = grouped.spouse[0]; // Usually only one
        narrativeParts.push(
            <span key="spouse" className="text-slate-300">
                Casado(a) com{' '}
                <ClickableEntity 
                    name={spouse.relatedEntity.name}
                    entityId={spouse.relatedEntity.id}
                    type={spouse.relatedEntity.type}
                    onClick={() => onEntityClick(spouse.relatedEntity.id, spouse.relatedEntity.name, spouse.relatedEntity.type)}
                />
                .
            </span>
        );
    }

    // Siblings/Other family (não filiação - isso vai nos dados básicos)
    if (grouped.family.length > 0) {
        const familyParts: React.ReactNode[] = [];
        
        grouped.family.forEach((rel, idx) => {
            const label = getRelationshipLabel(rel.type);
            familyParts.push(
                <span key={rel.id}>
                    {idx > 0 && (idx === grouped.family.length - 1 ? ' e ' : ', ')}
                    {label}{' '}
                    <ClickableEntity 
                        name={rel.relatedEntity.name}
                        entityId={rel.relatedEntity.id}
                        type={rel.relatedEntity.type}
                        onClick={() => onEntityClick(rel.relatedEntity.id, rel.relatedEntity.name, rel.relatedEntity.type)}
                    />
                </span>
            );
        });

        narrativeParts.push(
            <span key="family" className="text-slate-300">
                {' '}É {familyParts}.
            </span>
        );
    }

    // Business/Work relationships
    if (grouped.business.length > 0 || grouped.organizations.length > 0) {
        const businessParts: React.ReactNode[] = [];
        const allBusiness = [...grouped.business, ...grouped.organizations];
        
        allBusiness.forEach((rel, idx) => {
            const label = getRelationshipLabel(rel.type);
            businessParts.push(
                <span key={`business-${idx}-${rel.id}`}>
                    {idx > 0 && (idx === allBusiness.length - 1 ? ' e ' : ', ')}
                    {label}{' '}
                    <ClickableEntity 
                        name={rel.relatedEntity.name}
                        entityId={rel.relatedEntity.id}
                        type={rel.relatedEntity.type}
                        onClick={() => onEntityClick(rel.relatedEntity.id, rel.relatedEntity.name, rel.relatedEntity.type)}
                    />
                </span>
            );
        });

        narrativeParts.push(
            <span key="business" className="text-slate-300">
                {' '}Profissionalmente, {businessParts}.
            </span>
        );
    }

    // Location relationships
    if (grouped.locations.length > 0) {
        const locationParts: React.ReactNode[] = [];
        
        grouped.locations.forEach((rel, idx) => {
            locationParts.push(
                <span key={rel.id}>
                    {idx > 0 && (idx === grouped.locations.length - 1 ? ' e ' : ', ')}
                    <ClickableEntity 
                        name={rel.relatedEntity.name}
                        entityId={rel.relatedEntity.id}
                        type={rel.relatedEntity.type}
                        onClick={() => onEntityClick(rel.relatedEntity.id, rel.relatedEntity.name, rel.relatedEntity.type)}
                    />
                </span>
            );
        });

        narrativeParts.push(
            <span key="locations" className="text-slate-300">
                {' '}Reside/frequenta: {locationParts}.
            </span>
        );
    }

    // Vehicle relationships
    if (grouped.vehicles.length > 0) {
        const vehicleParts: React.ReactNode[] = [];
        
        grouped.vehicles.forEach((rel, idx) => {
            vehicleParts.push(
                <span key={rel.id}>
                    {idx > 0 && (idx === grouped.vehicles.length - 1 ? ' e ' : ', ')}
                    <ClickableEntity 
                        name={rel.relatedEntity.name}
                        entityId={rel.relatedEntity.id}
                        type={rel.relatedEntity.type}
                        onClick={() => onEntityClick(rel.relatedEntity.id, rel.relatedEntity.name, rel.relatedEntity.type)}
                    />
                </span>
            );
        });

        narrativeParts.push(
            <span key="vehicles" className="text-slate-300">
                {' '}Veículo(s) vinculado(s): {vehicleParts}.
            </span>
        );
    }

    // Weapon relationships
    if (grouped.weapons.length > 0) {
        const weaponParts: React.ReactNode[] = [];
        
        grouped.weapons.forEach((rel, idx) => {
            weaponParts.push(
                <span key={rel.id}>
                    {idx > 0 && (idx === grouped.weapons.length - 1 ? ' e ' : ', ')}
                    <ClickableEntity 
                        name={rel.relatedEntity.name}
                        entityId={rel.relatedEntity.id}
                        type={rel.relatedEntity.type}
                        onClick={() => onEntityClick(rel.relatedEntity.id, rel.relatedEntity.name, rel.relatedEntity.type)}
                    />
                </span>
            );
        });

        narrativeParts.push(
            <span key="weapons" className="text-slate-300">
                {' '}⚠️ Arma(s) vinculada(s): {weaponParts}.
            </span>
        );
    }

    // Other relationships
    if (grouped.other.length > 0) {
        const otherParts: React.ReactNode[] = [];
        
        grouped.other.slice(0, 5).forEach((rel, idx) => {
            const label = getRelationshipLabel(rel.type);
            otherParts.push(
                <span key={rel.id}>
                    {idx > 0 && ', '}
                    {label}{' '}
                    <ClickableEntity 
                        name={rel.relatedEntity.name}
                        entityId={rel.relatedEntity.id}
                        type={rel.relatedEntity.type}
                        onClick={() => onEntityClick(rel.relatedEntity.id, rel.relatedEntity.name, rel.relatedEntity.type)}
                    />
                </span>
            );
        });

        if (grouped.other.length > 5) {
            otherParts.push(
                <span key="more" className="text-slate-500">
                    {' '}e mais {grouped.other.length - 5} conexões
                </span>
            );
        }

        narrativeParts.push(
            <span key="other" className="text-slate-300">
                {' '}Outras conexões: {otherParts}.
            </span>
        );
    }

    // Cross-case (appears in other investigations)
    if (otherInvestigations.length > 0) {
        narrativeParts.push(
            <span key="crosscase" className="text-amber-400 font-medium">
                {' '}⚠️ Aparece em {otherInvestigations.length} outra(s) operação(ões).
            </span>
        );
    }

    return (
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-xl border border-slate-700/50 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-700/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-purple-400" />
                    <span className="text-sm font-medium text-slate-200">Síntese da Entidade</span>
                </div>
                <div className="text-xs text-slate-500">
                    {relationships.length} conexões diretas
                </div>
            </div>

            {/* Narrative Content */}
            <div className="p-4">
                <p className="text-sm leading-relaxed">
                    <span className="font-bold text-white">{entity.name}</span>
                    {role && (
                        <span className={`ml-2 text-xs px-2 py-0.5 rounded ${
                            role === 'suspeito' || role === 'suspect' ? 'bg-red-500/20 text-red-400' :
                            role === 'vitima' || role === 'victim' ? 'bg-amber-500/20 text-amber-400' :
                            'bg-slate-600/50 text-slate-400'
                        }`}>
                            {role}
                        </span>
                    )}
                    {basicDescription && (
                        <span className="text-slate-400 italic">{' '}{basicDescription}</span>
                    )}
                    {narrativeParts.length > 0 ? (
                        <span className="text-slate-400">{narrativeParts}</span>
                    ) : !basicDescription && relationships.length === 0 ? (
                        <span className="text-slate-500">{' '}— Sem conexões cadastradas nesta operação.</span>
                    ) : null}
                </p>
            </div>

            {/* Google Maps Button for LOCATION entities */}
            {entity.type === 'LOCATION' && (
                <div className="px-4 py-3 border-t border-slate-700/50 bg-slate-900/50">
                    <button
                        onClick={() => {
                            const query = encodeURIComponent(entity.name);
                            window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
                        }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg transition-colors"
                    >
                        <Map className="w-4 h-4" />
                        <span className="font-medium">Abrir no Google Maps</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}

            {/* Indirect Connections Link */}
            {relationships.length > 0 && (
                <div className="px-4 py-3 border-t border-slate-700/50 bg-slate-900/50">
                    <button
                        onClick={onIndirectConnectionsClick}
                        className="w-full flex items-center justify-between text-sm text-purple-400 hover:text-purple-300 transition-colors group"
                    >
                        <div className="flex items-center gap-2">
                            <Network className="w-4 h-4" />
                            <span>Ver Conexões Indiretas (2º grau)</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-500 group-hover:text-purple-400">
                            <span>Expandir teia</span>
                            <ChevronRight className="w-4 h-4" />
                        </div>
                    </button>
                </div>
            )}
        </div>
    );
}
