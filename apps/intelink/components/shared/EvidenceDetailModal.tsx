'use client';

/**
 * EvidenceDetailModal - Componente PADRONIZADO para exibir detalhes de evidências
 * 
 * USAR EM TODO O SISTEMA para manter consistência visual.
 * Baseado no EntityDetailModal.tsx.
 * 
 * @see styles/DESIGN_SYSTEM.md para cores e padrões
 */

import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
    X, FileText, Calendar, Tag, ExternalLink,
    FileCheck, AlertTriangle, Users, MapPin, Car,
    Loader2, ChevronDown, ChevronUp, Link2, Building2
} from 'lucide-react';
import Link from 'next/link';
import DeleteButton from '@/components/DeleteButton';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// =====================================================
// DESIGN SYSTEM - CORES POR TIPO DE DOCUMENTO
// =====================================================
const DOC_TYPE_COLORS: Record<string, { icon: string; bg: string; border: string; label: string }> = {
    reds: { icon: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30', label: 'REDS/BO' },
    depoimento: { icon: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/30', label: 'Depoimento' },
    relatorio: { icon: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30', label: 'Relatório/Laudo' },
    laudo: { icon: 'text-purple-400', bg: 'bg-purple-500/20', border: 'border-purple-500/30', label: 'Laudo Pericial' },
    interceptacao: { icon: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/30', label: 'Interceptação' },
    documento: { icon: 'text-slate-400', bg: 'bg-slate-500/20', border: 'border-slate-500/30', label: 'Documento' },
    DOCUMENT: { icon: 'text-cyan-400', bg: 'bg-cyan-500/20', border: 'border-cyan-500/30', label: 'Documento' },
};

const NATUREZA_COLORS: Record<string, string> = {
    'HOMICÍDIO DOLOSO': 'text-red-400 bg-red-500/20',
    'TESTEMUNHO': 'text-blue-400 bg-blue-500/20',
    'PERÍCIA': 'text-purple-400 bg-purple-500/20',
    'TRÁFICO': 'text-orange-400 bg-orange-500/20',
    'ROUBO': 'text-amber-400 bg-amber-500/20',
};

// =====================================================
// INTERFACES
// =====================================================
export interface EvidenceDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    evidenceId: string;
    evidenceTitle?: string;
    evidenceType?: string;
    investigationId?: string;
}

interface EvidenceData {
    id: string;
    title: string;
    document_type: string;
    natureza?: string;
    numero_ocorrencia?: string;
    data_fato?: string;
    summary?: string;
    raw_text?: string;
    historico_completo?: string;
    external_storage_url?: string;
    metadata?: Record<string, any>;
    created_at: string;
    investigation?: { id: string; title: string };
    entities?: Array<{ id: string; name: string; type: string }>;
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================
export default function EvidenceDetailModal({
    isOpen,
    onClose,
    evidenceId,
    evidenceTitle,
    evidenceType,
    investigationId
}: EvidenceDetailModalProps) {
    const [loading, setLoading] = useState(true);
    const [evidence, setEvidence] = useState<EvidenceData | null>(null);
    const [showFullContent, setShowFullContent] = useState(false);

    useEffect(() => {
        if (isOpen && evidenceId) {
            loadEvidenceData();
        }
    }, [isOpen, evidenceId]);

    // Fechar com ESC
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) onClose();
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    const loadEvidenceData = async () => {
        setLoading(true);
        setShowFullContent(false);
        try {
            // 1. Buscar documento via API (bypasses RLS)
            const res = await fetch(`/api/documents/${evidenceId}`);
            
            if (res.ok) {
                const docData = await res.json();
                
                if (docData && docData.id) {
                    // Buscar entidades relacionadas
                    let entities: Array<{ id: string; name: string; type: string }> = [];
                    if (docData.investigation_id) {
                        const entRes = await fetch(`/api/investigation/${docData.investigation_id}`);
                        if (entRes.ok) {
                            const entData = await entRes.json();
                            entities = (entData.entities || []).slice(0, 10).map((e: any) => ({
                                id: e.id,
                                name: e.name,
                                type: e.type
                            }));
                        }
                    }

                    setEvidence({
                        id: docData.id,
                        title: docData.title || docData.original_filename || 'Documento',
                        document_type: docData.document_type || 'documento',
                        natureza: docData.natureza,
                        numero_ocorrencia: docData.numero_ocorrencia,
                        data_fato: docData.data_fato,
                        summary: docData.summary,
                        raw_text: docData.raw_text,
                        historico_completo: docData.historico_completo,
                        external_storage_url: docData.external_storage_url,
                        metadata: docData.metadata,
                        created_at: docData.created_at,
                        investigation: docData.investigation_id ? {
                            id: docData.investigation_id,
                            title: docData.investigation?.title || 'Operação'
                        } : undefined,
                        entities
                    });
                    setLoading(false);
                    return;
                }
            }

            // Fallback: Tentar Supabase direto (tabela intelink_evidence legado)
            const { data: legacyData } = await supabase
                .from('intelink_evidence')
                .select('*')
                .eq('id', evidenceId)
                .single();

            if (legacyData) {
                setEvidence({
                    id: legacyData.id,
                    title: legacyData.description || legacyData.content_text || 'Evidência',
                    document_type: legacyData.type || 'documento',
                    summary: legacyData.content_text,
                    raw_text: legacyData.content_text,
                    external_storage_url: legacyData.url,
                    metadata: legacyData.metadata,
                    created_at: legacyData.created_at
                });
            } else {
                // Fallback final
                setEvidence({
                    id: evidenceId,
                    title: evidenceTitle || 'Evidência',
                    document_type: evidenceType || 'documento',
                    created_at: new Date().toISOString()
                });
            }

        } catch (e) {
            console.error('Error loading evidence:', e);
            // Fallback em caso de erro
            setEvidence({
                id: evidenceId,
                title: evidenceTitle || 'Evidência',
                document_type: evidenceType || 'documento',
                created_at: new Date().toISOString()
            });
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const docType = evidence?.document_type?.toLowerCase() || evidenceType?.toLowerCase() || 'documento';
    const colors = DOC_TYPE_COLORS[docType] || DOC_TYPE_COLORS.documento;
    const naturezaColor = NATUREZA_COLORS[evidence?.natureza || ''] || 'text-slate-400 bg-slate-500/20';

    // Conteúdo completo (historico_completo ou raw_text)
    const fullContent = evidence?.historico_completo || evidence?.raw_text;
    const hasFullContent = fullContent && fullContent.length > 200;

    return (
        <div 
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="bg-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className={`p-6 border-b ${colors.border} flex justify-between items-start`}>
                    <div className="flex items-start gap-4">
                        <div className={`p-3 ${colors.bg} rounded-xl`}>
                            <FileText className={`w-8 h-8 ${colors.icon}`} />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-xl font-bold text-white">
                                {evidence?.title || evidenceTitle || 'Carregando...'}
                            </h2>
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors.bg} ${colors.icon}`}>
                                    {colors.label}
                                </span>
                                {evidence?.natureza && (
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${naturezaColor}`}>
                                        {evidence.natureza}
                                    </span>
                                )}
                                {evidence?.numero_ocorrencia && (
                                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-700 text-slate-300">
                                        {evidence.numero_ocorrencia}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Delete button - Super admin can instant delete < 24h, others vote */}
                        {evidence?.id && (
                            <DeleteButton
                                itemType="document"
                                itemId={evidence.id}
                                itemName={evidence.title}
                                createdAt={evidence.created_at}
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

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                        </div>
                    ) : (
                        <>
                            {/* Resumo */}
                            {evidence?.summary && (
                                <Section
                                    icon={<FileCheck className="w-5 h-5 text-emerald-400" />}
                                    title="Resumo"
                                    subtitle="Síntese do documento"
                                    colorKey="emerald"
                                >
                                    <div className="p-4">
                                        <p className="text-slate-300 text-sm leading-relaxed">
                                            {evidence.summary}
                                        </p>
                                    </div>
                                </Section>
                            )}

                            {/* Metadados */}
                            <Section
                                icon={<Tag className="w-5 h-5 text-blue-400" />}
                                title="Informações"
                                subtitle="Dados do documento"
                                colorKey="blue"
                            >
                                <div className="p-4 grid grid-cols-2 gap-4">
                                    {evidence?.numero_ocorrencia && (
                                        <InfoField 
                                            icon={<FileText className="w-4 h-4" />} 
                                            label="Número REDS" 
                                            value={evidence.numero_ocorrencia} 
                                        />
                                    )}
                                    {evidence?.data_fato && (
                                        <InfoField 
                                            icon={<Calendar className="w-4 h-4" />} 
                                            label="Data do Fato" 
                                            value={new Date(evidence.data_fato).toLocaleString('pt-BR', { 
                                                dateStyle: 'short', 
                                                timeStyle: 'short' 
                                            })} 
                                        />
                                    )}
                                    <InfoField 
                                        icon={<Calendar className="w-4 h-4" />} 
                                        label="Data de Registro" 
                                        value={evidence?.created_at ? new Date(evidence.created_at).toLocaleDateString('pt-BR') : undefined} 
                                    />
                                    {evidence?.investigation && (
                                        <InfoField 
                                            icon={<Link2 className="w-4 h-4" />} 
                                            label="Operação" 
                                            value={evidence.investigation.title}
                                            className="col-span-2"
                                        />
                                    )}
                                    {evidence?.external_storage_url && (
                                        <div className="col-span-2">
                                            <a 
                                                href={evidence.external_storage_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 text-sm"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                                Abrir documento original
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </Section>

                            {/* Entidades Relacionadas */}
                            {evidence?.entities && evidence.entities.length > 0 && (
                                <Section
                                    icon={<Users className="w-5 h-5 text-purple-400" />}
                                    title="Entidades Relacionadas"
                                    subtitle={`${evidence.entities.length} entidade(s) na operação`}
                                    colorKey="purple"
                                >
                                    <div className="divide-y divide-slate-700/30">
                                        {evidence.entities.slice(0, 5).map(entity => (
                                            <EntityItem key={entity.id} entity={entity} />
                                        ))}
                                        {evidence.entities.length > 5 && (
                                            <div className="p-3 text-center">
                                                <span className="text-slate-500 text-sm">
                                                    + {evidence.entities.length - 5} mais
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </Section>
                            )}

                            {/* Conteúdo Completo (Histórico) */}
                            {hasFullContent && (
                                <Section
                                    icon={<FileText className="w-5 h-5 text-amber-400" />}
                                    title="Histórico Completo"
                                    subtitle="Conteúdo integral do documento"
                                    colorKey="amber"
                                >
                                    <div className="p-4">
                                        {!showFullContent ? (
                                            <div className="space-y-3">
                                                <p className="text-slate-400 text-sm">
                                                    {fullContent?.substring(0, 200)}...
                                                </p>
                                                <button
                                                    onClick={() => setShowFullContent(true)}
                                                    className="flex items-center gap-2 text-amber-400 hover:text-amber-300 text-sm font-medium"
                                                >
                                                    <ChevronDown className="w-4 h-4" />
                                                    Ver conteúdo completo ({Math.round((fullContent?.length || 0) / 100) * 100}+ caracteres)
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                <div className="max-h-96 overflow-y-auto p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                                                    <pre className="text-slate-300 text-sm whitespace-pre-wrap font-mono">
                                                        {fullContent}
                                                    </pre>
                                                </div>
                                                <button
                                                    onClick={() => setShowFullContent(false)}
                                                    className="flex items-center gap-2 text-slate-400 hover:text-slate-300 text-sm"
                                                >
                                                    <ChevronUp className="w-4 h-4" />
                                                    Recolher
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </Section>
                            )}

                            {/* Sem dados */}
                            {!evidence?.summary && !hasFullContent && (
                                <div className="text-center py-12">
                                    <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                                    <p className="text-slate-400">Conteúdo não disponível</p>
                                    <p className="text-slate-500 text-sm mt-1">
                                        O documento pode estar em processamento
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-700 bg-slate-800/50 flex items-center justify-between">
                    <p className="text-slate-500 text-xs">
                        ID: {evidenceId.substring(0, 8)}...
                    </p>
                    {evidence?.investigation && (
                        <Link
                            href={`/investigation/${evidence.investigation.id}`}
                            className="text-cyan-400 hover:text-cyan-300 text-sm flex items-center gap-1"
                        >
                            Ver operação
                            <ExternalLink className="w-3 h-3" />
                        </Link>
                    )}
                </div>
            </div>
        </div>
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
        amber: 'border-amber-500/30 bg-amber-500/5',
        rose: 'border-rose-500/30 bg-rose-500/5',
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
            {children}
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

const ENTITY_ICONS: Record<string, typeof Users> = {
    PERSON: Users,
    LOCATION: MapPin,
    VEHICLE: Car,
    ORGANIZATION: Building2,
};

const ENTITY_COLORS: Record<string, { icon: string; bg: string }> = {
    PERSON: { icon: 'text-blue-400', bg: 'bg-blue-500/20' },
    LOCATION: { icon: 'text-emerald-400', bg: 'bg-emerald-500/20' },
    VEHICLE: { icon: 'text-pink-400', bg: 'bg-pink-500/20' },
    ORGANIZATION: { icon: 'text-red-400', bg: 'bg-red-500/20' },
};

function EntityItem({ entity }: { entity: { id: string; name: string; type: string } }) {
    const Icon = ENTITY_ICONS[entity.type] || Users;
    const colors = ENTITY_COLORS[entity.type] || ENTITY_COLORS.PERSON;

    return (
        <div className="px-4 py-3 hover:bg-slate-700/20 transition-colors flex items-center gap-3">
            <div className={`w-8 h-8 ${colors.bg} rounded-full flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${colors.icon}`} />
            </div>
            <div>
                <p className="text-white font-medium text-sm">{entity.name}</p>
                <p className="text-slate-500 text-xs">{entity.type}</p>
            </div>
        </div>
    );
}
