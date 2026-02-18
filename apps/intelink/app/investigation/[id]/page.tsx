'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { 
    Activity, Users, Network, FileText, Car, Globe, Brain, AlertTriangle,
    ArrowLeft, Calendar, MapPin, Building2, Target, Clock,
    Search, Download, Play, File, ExternalLink, Trash2, Settings,
    Sparkles, FileUp, CheckCircle2, ChevronRight, ChevronDown, ChevronUp, X
} from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase-client';

const supabase = getSupabaseClient();
import Link from 'next/link';
import nextDynamic from 'next/dynamic';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import EntityDetailModal from '@/components/shared/EntityDetailModal';
import FeedbackButton from '@/components/intelink/FeedbackButton';
import InvestigationTimeline, { buildTimelineEvents } from '@/components/intelink/InvestigationTimeline';
import QuickStats from '@/components/intelink/QuickStats';
import ReportModal from '@/components/intelink/ReportModal';
import DeleteConfirmModal from '@/components/intelink/DeleteConfirmModal';
import DocumentActionButtons, { DocumentType } from '@/components/intelink/DocumentActionButtons';
import DocumentUploadModal from '@/components/intelink/DocumentUploadModal';
import FindingsPanel from '@/components/FindingsPanel';
import CrossCaseAlertsPanel from '@/components/CrossCaseAlertsPanel';
import PredictedLinksPanel from '@/components/graph/PredictedLinksPanel';
import EvidenceDetailModal from '@/components/shared/EvidenceDetailModal';
import SetupWizard from '@/components/investigation/SetupWizard';
import { matchesSearch } from '@/lib/utils/search';
import { prettifyFilename } from '@/lib/utils/formatters';
import RhoHealthWidget from '@/components/rho/RhoHealthWidget';
import RhoHistoryChart from '@/components/rho/RhoHistoryChart';
import { TunnelVisionBanner } from '@/components/rho/TunnelVisionAlert';
import NarrativeSummary from '@/components/intelink/NarrativeSummary';
import GroupedEntityList from '@/components/intelink/GroupedEntityList';
import CollapsibleCard from '@/components/shared/CollapsibleCard';
import CollapsibleWidget from '@/components/shared/CollapsibleWidget';
import DraggableWidget from '@/components/shared/DraggableWidget';
import SortableWidgetGrid from '@/components/shared/SortableWidgetGrid';
import { DashboardLayoutProvider, LayoutSettingsButton } from '@/components/shared/DashboardLayoutContext';
import { ResponsiveWidgetRow, ResponsiveWidget } from '@/components/shared/ResponsiveWidgetRow';
import DragDropOnboarding from '@/components/shared/DragDropOnboarding';
import { useCollapsible } from '@/hooks/useCollapsible';
import { useAudit } from '@/hooks/useAudit';
import UrgencyIndicator from '@/components/intelink/UrgencyIndicator';
import UrgencyBadge from '@/components/intelink/UrgencyBadge';
import { useToast } from '@/components/intelink/Toast';
import ConnectionList from '@/components/graph/ConnectionList';
import { 
    TYPE_LABELS, 
    ENTITY_COLORS,
    getEntityColor 
} from '@/components/investigation/constants';

// Dynamically import ForceGraph (client-side only - hidden on mobile)
const ForceGraph2D = nextDynamic(() => import('react-force-graph-2d'), { ssr: false });

export default function InvestigationPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const id = params?.id as string;
    const { logView } = useAudit();
    const { showToast } = useToast();
    
    // Setup mode (shown after creating a new investigation)
    const isSetupMode = searchParams.get('mode') === 'setup';
    const [showSetupWizard, setShowSetupWizard] = useState(isSetupMode);
    const [processedDocs, setProcessedDocs] = useState<number>(0);
    
    // Graph ref for programmatic control
    const graphRef = useRef<any>(null);

    // Handler para fechar o wizard e limpar o query param
    const closeSetupWizard = () => {
        setShowSetupWizard(false);
        // Remove o query param da URL
        router.replace(`/investigation/${id}`, { scroll: false });
    };

    // Handler para quando a análise IA for gerada (chamado pelo SetupWizard após mostrar resultados)
    const handleGenerateAnalysis = () => {
        // Recarregar dados da investigação para refletir os novos findings
        loadData();
        // NÃO fecha o wizard - o wizard fecha sozinho quando o usuário clica "Concluir"
    };

    const [investigation, setInvestigation] = useState<any>(null);
    const [entities, setEntities] = useState<any[]>([]);
    const [relationships, setRelationships] = useState<any[]>([]);
    const [evidence, setEvidence] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [graphData, setGraphData] = useState<any>({ nodes: [], links: [] });
    
    // Search state
    const [entitySearchTerm, setEntitySearchTerm] = useState('');
    
    // Collapsible sections with memory (localStorage)
    const evidenceCollapse = useCollapsible('evidence', true);
    const timelineCollapse = useCollapsible('timeline', true);
    const findingsCollapse = useCollapsible('findings', true);
    const rhoCollapse = useCollapsible('rho', true);
    
    // Widget open states for responsive layout
    // ROW 1: Síntese + Cross-Case
    const [synthesisOpen, setSynthesisOpen] = useState(true);
    const [crosscaseOpen, setCrosscaseOpen] = useState(true);
    // ROW 2: Links Previstos + Envolvidos (Links começa fechado)
    const [linksOpen, setLinksOpen] = useState(false);
    const [envolvidosOpen, setEnvolvidosOpen] = useState(true);
    // ROW 3: Evidências + Timeline
    const [evidenciasOpen, setEvidenciasOpen] = useState(true);
    const [timelineOpen, setTimelineOpen] = useState(true);
    // ROW 4: Grafo + Rho
    const [grafoOpen, setGrafoOpen] = useState(true);
    const [rhoOpen, setRhoOpen] = useState(true);
    
    // Entity Modal State (unified)
    const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
    const [isEntityModalOpen, setIsEntityModalOpen] = useState(false);

    // Report Modal State
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

    // Delete Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    
    // Settings Modal State
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [editingTitle, setEditingTitle] = useState('');
    const [editingDescription, setEditingDescription] = useState('');
    const [isSavingSettings, setIsSavingSettings] = useState(false);

    // Document Upload Modal State
    const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
    const [documentType, setDocumentType] = useState<DocumentType>('reds');

    // Evidence Detail Modal State
    const [selectedEvidence, setSelectedEvidence] = useState<any>(null);
    const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);

    // Handler para clique em evidência
    const handleEvidenceClick = (ev: any) => {
        setSelectedEvidence(ev);
        setIsEvidenceModalOpen(true);
    };

    // Graph hibernation state - only enable interactions after first click
    const [isGraphActive, setIsGraphActive] = useState(false);

    // Handler para abrir modal de documento
    const handleDocumentUpload = (type: DocumentType) => {
        setDocumentType(type);
        setIsDocumentModalOpen(true);
    };

    // Unified entity click handler - opens EntityDetailModal
    const handleEntityClick = (entity: any) => {
        setSelectedEntityId(entity.id);
        setIsEntityModalOpen(true);
    };

    // Opens the delete confirmation modal
    const openDeleteModal = () => {
        setIsDeleteModalOpen(true);
    };

    // Opens settings modal
    const openSettingsModal = () => {
        setEditingTitle(investigation?.title || '');
        setEditingDescription(investigation?.description || '');
        setIsSettingsModalOpen(true);
    };

    // Save settings
    const handleSaveSettings = async () => {
        if (!editingTitle.trim()) return;
        setIsSavingSettings(true);
        try {
            const res = await fetch(`/api/investigation/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: editingTitle.trim(),
                    description: editingDescription.trim()
                })
            });
            
            if (!res.ok) throw new Error('Erro ao salvar');
            
            // Update local state
            setInvestigation((prev: any) => ({
                ...prev,
                title: editingTitle.trim(),
                description: editingDescription.trim()
            }));
            setIsSettingsModalOpen(false);
            showToast('success', 'Configurações Salvas', 'Nome da operação atualizado');
        } catch (error) {
            showToast('error', 'Erro', 'Não foi possível salvar as configurações');
        } finally {
            setIsSavingSettings(false);
        }
    };

    // Handles the actual deletion (soft delete)
    const handleConfirmDelete = async () => {
        setIsDeleting(true);
        try {
            // Get member info to check role
            const systemRole = localStorage.getItem('intelink_system_role');
            const isSuperAdmin = systemRole === 'super_admin';
            
            // Calculate classification for quorum check
            const ageInHours = (Date.now() - new Date(investigation?.created_at || '').getTime()) / (1000 * 60 * 60);
            const isTestOperation = entities.length <= 2 && ageInHours < 24;
            
            // Super admin OR test operation: delete directly
            if (isSuperAdmin || isTestOperation) {
                const res = await fetch('/api/admin/delete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        item_type: 'investigation',
                        item_id: id,
                        reason: 'Excluído pelo painel',
                        force: isSuperAdmin, // Super admin can force delete
                        cascade: true // Also delete entities
                    })
                });
                
                const data = await res.json();
                
                if (!res.ok) {
                    // Handle error object or string
                    const errorMsg = typeof data.error === 'object' 
                        ? (data.error?.message || JSON.stringify(data.error))
                        : (data.error || 'Erro ao excluir');
                    throw new Error(errorMsg);
                }
                
                // Success - show toast and redirect
                showToast('success', 'Operação Excluída', data.message);
                router.push('/?deleted=success');
                return;
            }
            
            // Regular users: Create deletion request (quorum vote)
            const memberId = localStorage.getItem('intelink_member_id');
            const memberName = localStorage.getItem('intelink_username') || 'Usuário';
            
            const res = await fetch('/api/admin/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    item_type: 'investigation',
                    item_id: id,
                    reason: 'Solicitado via painel'
                })
            });
            
            const data = await res.json();
            
            if (!res.ok) {
                if (data.already_voted) {
                    showToast('warning', 'Já Votado', 'Você já votou para excluir esta operação.');
                } else {
                    // Handle error object or string
                    const errorMsg = typeof data.error === 'object' 
                        ? (data.error?.message || JSON.stringify(data.error))
                        : (data.error || 'Erro ao solicitar exclusão');
                    throw new Error(errorMsg);
                }
                setIsDeleting(false);
                setIsDeleteModalOpen(false);
                return;
            }
            
            if (data.deleted) {
                showToast('success', 'Operação Excluída', data.message);
                router.push('/?deleted=success');
            } else {
                showToast('info', 'Solicitação Registrada', data.message);
                setIsDeleting(false);
                setIsDeleteModalOpen(false);
            }
            
        } catch (error: any) {
            console.error('Error deleting investigation:', error);
            showToast('error', 'Erro ao Excluir', error.message);
            setIsDeleting(false);
            setIsDeleteModalOpen(false);
        }
    };

    useEffect(() => {
        if (id) loadData();
    }, [id]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Load all data via API (bypasses RLS) - force fresh data
            const res = await fetch(`/api/investigation/${id}`, {
                cache: 'no-store',
                headers: { 'Cache-Control': 'no-cache' }
            });
            if (!res.ok) {
                console.error('Investigation not found');
                return;
            }

            const data = await res.json();
            
            setInvestigation(data.investigation);
            
            // Audit: Log page view
            if (data.investigation) {
                logView('operation', id, { 
                    title: data.investigation.title,
                    status: data.investigation.status 
                });
            }
            const ent = data.entities || [];
            const rel = data.relationships || [];
            
            // Calculate connection count for each entity
            const connectionCount: Record<string, number> = {};
            rel.forEach((r: any) => {
                connectionCount[r.source_id] = (connectionCount[r.source_id] || 0) + 1;
                connectionCount[r.target_id] = (connectionCount[r.target_id] || 0) + 1;
            });
            
            // Sort entities by: 1) Type priority, 2) Number of connections (descending)
            const typePriority: Record<string, number> = {
                'PERSON': 1,
                'ORGANIZATION': 2,
                'VEHICLE': 3,
                'LOCATION': 4,
                'FIREARM': 5,
                'WEAPON': 5,
                'OTHER': 6
            };
            
            const sortedEntities = ent.sort((a: any, b: any) => {
                // First by connections (descending)
                const connA = connectionCount[a.id] || 0;
                const connB = connectionCount[b.id] || 0;
                if (connB !== connA) return connB - connA;
                // Then by type priority
                const prioA = typePriority[a.type] || 99;
                const prioB = typePriority[b.type] || 99;
                return prioA - prioB;
            });
            
            setEntities(sortedEntities);
            setRelationships(rel);
            setEvidence(data.evidence || []);

            // 5. Prepare Graph Data
            if (ent && rel) {
                const nodes = ent.map((e: any) => ({
                    id: e.id,
                    name: e.name,
                    group: e.type,
                    val: 1 // Size
                }));

                // Create a Set of valid node IDs for fast lookup
                const nodeIds = new Set(nodes.map((n: any) => n.id));

                // Filter links to only include those with valid source AND target nodes
                const links = rel
                    .filter((r: any) => nodeIds.has(r.source_id) && nodeIds.has(r.target_id))
                    .map((r: any) => ({
                        source: r.source_id,
                        target: r.target_id,
                        name: r.type
                    }));

                setGraphData({ nodes, links });
            }

        } catch (e) {
            console.error('Error loading data:', e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="h-screen bg-slate-950 flex items-center justify-center text-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-400">Carregando operação...</p>
                </div>
            </div>
        );
    }

    if (!investigation) {
        return (
            <div className="h-screen bg-slate-950 flex items-center justify-center text-white">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-2">Operação não encontrada</h1>
                    <Link href="/" className="text-blue-400 hover:underline">Voltar ao Dashboard</Link>
                </div>
            </div>
        );
    }

    return (
        <DashboardLayoutProvider investigationId={id as string}>
        <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden">
            <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                
                {/* Header */}
                <header className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-50">
                    <div className="w-full px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Link href="/" className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
                                    <ArrowLeft className="w-5 h-5 text-slate-400" />
                                </Link>
                                <div className="min-w-0">
                                    {/* Breadcrumb - hidden on mobile */}
                                    <p className="hidden md:block text-slate-500 text-xs mb-1">
                                        <Link href="/" className="hover:text-slate-300">Operações</Link>
                                        <span className="mx-2">/</span>
                                        <span className="text-slate-400">{investigation.title}</span>
                                    </p>
                                    <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                                        <h1 className="text-base md:text-xl font-bold truncate max-w-[150px] md:max-w-none">{investigation.title.toUpperCase()}</h1>
                                        <span className={`px-2 md:px-3 py-0.5 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wide ${
                                            investigation.status === 'active' 
                                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                : investigation.status === 'archived'
                                                    ? 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                                                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                        }`}>
                                            {investigation.status === 'active' ? 'EM ANDAMENTO' : 
                                             investigation.status === 'archived' ? 'ARQUIVADO' : 
                                             investigation.status.toUpperCase()}
                                        </span>
                                    </div>
                                    <p className="hidden md:flex text-slate-400 text-xs items-center gap-2 mt-1">
                                        <Calendar className="w-3 h-3" />
                                        Atualizado em {new Date(investigation.updated_at).toLocaleDateString('pt-BR')}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 md:gap-3">
                                {/* Urgency Badge - Tempo decorrido */}
                                <UrgencyBadge
                                    investigationTitle={investigation.title}
                                    investigationDescription={investigation.description}
                                    crimeDatetime={investigation.crime_datetime || investigation.created_at}
                                />
                                
                                {/* Botão de Adicionar Documento - DESTAQUE */}
                                <DocumentActionButtons 
                                    investigationId={id}
                                    onUploadClick={handleDocumentUpload}
                                />
                                
                                {/* Ir para o Grafo - Scroll suave (Desktop only) */}
                                <button 
                                    onClick={() => {
                                        document.getElementById('graph-section')?.scrollIntoView({ behavior: 'smooth' });
                                    }}
                                    className="hidden md:flex px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg text-sm text-blue-400 font-medium transition-colors items-center gap-2"
                                    title="Ver Grafo de Vínculos"
                                >
                                    <Network className="w-4 h-4" />
                                    Grafo
                                </button>
                                
                                {/* Relatórios - Desktop: full button, Mobile: inside menu */}
                                <Link 
                                    href={`/investigation/${id}/reports`}
                                    className="hidden md:flex px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm text-white font-medium transition-colors items-center gap-2"
                                >
                                    <FileText className="w-4 h-4" />
                                    Relatórios
                                </Link>
                                {/* Menu Mais Opções */}
                                <div className="relative group">
                                    <button 
                                        className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-400 transition-colors"
                                        title="Mais opções"
                                    >
                                        <Settings className="w-4 h-4" />
                                    </button>
                                    {/* Dropdown */}
                                    <div className="absolute right-0 mt-1 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                                        <div className="p-1">
                                            {/* Mobile only: Relatórios */}
                                            <Link 
                                                href={`/investigation/${id}/reports`}
                                                className="md:hidden flex items-center gap-2 px-3 py-2 text-slate-300 hover:bg-slate-700 rounded-lg transition-colors text-sm"
                                            >
                                                <FileText className="w-4 h-4" />
                                                Relatórios
                                            </Link>
                                            {/* Mobile only: Grafo */}
                                            <button 
                                                onClick={() => {
                                                    document.getElementById('graph-section')?.scrollIntoView({ behavior: 'smooth' });
                                                }}
                                                className="md:hidden w-full flex items-center gap-2 px-3 py-2 text-slate-300 hover:bg-slate-700 rounded-lg transition-colors text-sm"
                                            >
                                                <Network className="w-4 h-4" />
                                                Ver Grafo
                                            </button>
                                            <div className="md:hidden border-t border-slate-700 my-1"></div>
                                            <Link 
                                                href={`/investigation/${id}/history`}
                                                className="flex items-center gap-2 px-3 py-2 text-slate-300 hover:bg-slate-700 rounded-lg transition-colors text-sm"
                                            >
                                                <Clock className="w-4 h-4" />
                                                Histórico
                                            </Link>
                                            <button 
                                                onClick={openSettingsModal}
                                                className="w-full flex items-center gap-2 px-3 py-2 text-slate-300 hover:bg-slate-700 rounded-lg transition-colors text-sm"
                                            >
                                                <Settings className="w-4 h-4" />
                                                Configurações
                                            </button>
                                            <div className="border-t border-slate-700 my-1"></div>
                                            <button 
                                                onClick={openDeleteModal}
                                                className="w-full flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-sm"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                Excluir Operação
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="w-full px-4 md:px-6 py-6">
                    
                    {/* GRID LAYOUT - Individual draggable widgets */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* Widget 1: Síntese */}
                        <DraggableWidget id="widget-synthesis">
                            <CollapsibleWidget
                                storageKey={`synthesis_${id}`}
                                title="Síntese da Investigação"
                                icon={<Brain className="w-4 h-4" />}
                                badge={`${entities.length}`}
                                badgeVariant="default"
                                defaultOpen={true}
                                collapsedSummary={`${relationships.length} vínculos mapeados`}
                                onOpenChange={setSynthesisOpen}
                            >
                                <div className="min-h-[300px] max-h-[400px] overflow-y-auto">
                                    <NarrativeSummary
                                        investigation={investigation}
                                        entities={entities}
                                        relationships={relationships}
                                        evidence={evidence}
                                        onEntityClick={handleEntityClick}
                                        hideHeader={true}
                                    />
                                </div>
                            </CollapsibleWidget>
                        </DraggableWidget>
                        
                        {/* Widget 2: Cross-Case */}
                        <DraggableWidget id="widget-crosscase">
                            <CollapsibleWidget
                                storageKey={`crosscase_${id}`}
                                title="Análise Cross-Case"
                                icon={<AlertTriangle className="w-4 h-4" />}
                                badgeVariant="warning"
                                defaultOpen={true}
                                collapsedSummary="Entidades que aparecem em outras operações"
                                onOpenChange={setCrosscaseOpen}
                            >
                                <div className="min-h-[300px] max-h-[400px] overflow-y-auto flex items-center justify-center">
                                    <CrossCaseAlertsPanel 
                                        investigationId={id as string}
                                        maxItems={4}
                                        title=""
                                        className="h-full w-full"
                                    />
                                </div>
                            </CollapsibleWidget>
                        </DraggableWidget>
                    
                        {/* Widget 3: Links Previstos */}
                        <DraggableWidget id="widget-links">
                            <CollapsibleWidget
                                storageKey={`predictedLinks_${id}`}
                                title="Links Previstos"
                                icon={<Sparkles className="w-4 h-4 text-amber-400" />}
                                badgeVariant="warning"
                                defaultOpen={false}
                                collapsedSummary="Análise de conexões pendentes"
                                onOpenChange={setLinksOpen}
                            >
                                <div className="min-h-[300px] max-h-[400px] overflow-y-auto">
                                    <PredictedLinksPanel
                                        investigationId={id as string}
                                        onViewEntity={(entityId) => {
                                            setSelectedEntityId(entityId);
                                            setIsEntityModalOpen(true);
                                        }}
                                        hideContainer={true}
                                        className="h-full"
                                    />
                                </div>
                            </CollapsibleWidget>
                        </DraggableWidget>
                        
                        {/* Widget 4: Envolvidos */}
                        <DraggableWidget id="widget-envolvidos">
                            <CollapsibleWidget
                                storageKey={`entities_${id}`}
                                title="Envolvidos"
                                icon={<Users className="w-4 h-4" />}
                                badge={entities.length}
                                defaultOpen={true}
                                collapsedSummary={`${entities.filter(e => e.type === 'PERSON').length} pessoas, ${entities.filter(e => e.type === 'VEHICLE').length} veículos`}
                                onOpenChange={setEnvolvidosOpen}
                            >
                                <div className="min-h-[300px] max-h-[400px] overflow-y-auto">
                                    <GroupedEntityList
                                        entities={entities}
                                        onEntityClick={handleEntityClick}
                                        searchTerm={entitySearchTerm}
                                        onSearchChange={setEntitySearchTerm}
                                        hideHeader={true}
                                    />
                                </div>
                            </CollapsibleWidget>
                        </DraggableWidget>
                    
                        {/* Widget 5: Evidências */}
                        <DraggableWidget id="widget-evidence">
                            <CollapsibleWidget
                                storageKey={`evidence_${id}`}
                                title="Evidências"
                                icon={<FileText className="w-4 h-4" />}
                                badge={evidence.length}
                                badgeVariant="success"
                                defaultOpen={true}
                                collapsedSummary="Arquivos anexados"
                                onOpenChange={setEvidenciasOpen}
                                headerAction={evidence.length > 0 ? (
                                    <Link
                                        href={`/central/evidencias?inv=${id}`}
                                        onClick={(e) => e.stopPropagation()}
                                        className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                                    >
                                        Ver tudo →
                                    </Link>
                                ) : undefined}
                            >
                                <div className="min-h-[300px] max-h-[400px] overflow-y-auto p-3 space-y-2">
                                    {evidence.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full py-6 px-4">
                                            <div className="w-16 h-16 rounded-full border-2 border-dashed border-slate-600 flex items-center justify-center mb-3">
                                                <FileText className="w-6 h-6 text-slate-600" />
                                            </div>
                                            <p className="text-sm text-slate-400 text-center">Nenhuma evidência anexada</p>
                                            <p className="text-xs text-slate-500 text-center mt-1">
                                                Adicione B.O.s, Laudos ou Documentos
                                            </p>
                                        </div>
                                    ) : (
                                        evidence.slice(0, 5).map(ev => (
                                            <button
                                                key={ev.id}
                                                onClick={() => handleEvidenceClick(ev)}
                                                className="w-full flex items-center gap-2 p-2 bg-slate-800/30 rounded-lg border border-slate-700/30 hover:border-emerald-500/50 hover:bg-slate-800/50 transition-all text-left cursor-pointer group"
                                            >
                                                <div className={`p-1.5 rounded-lg transition-colors ${
                                                    ev.type === 'AUDIO' || ev.type === 'audio' ? 'bg-purple-500/10 text-purple-400' :
                                                    ev.type === 'IMAGE' || ev.type === 'image' ? 'bg-blue-500/10 text-blue-400' :
                                                    'bg-slate-800 text-slate-400'
                                                }`}>
                                                    {ev.type === 'AUDIO' || ev.type === 'audio' ? <Play className="w-3 h-3" /> : <File className="w-3 h-3" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-medium text-white truncate group-hover:text-emerald-400 transition-colors">
                                                        {ev.description || prettifyFilename(ev.metadata?.fileName) || 'Evidência'}
                                                    </p>
                                                </div>
                                                <ExternalLink className="w-3 h-3 text-slate-600 group-hover:text-emerald-400" />
                                            </button>
                                        ))
                                    )}
                                    {evidence.length > 5 && (
                                        <p className="text-xs text-center text-slate-500">+{evidence.length - 5} mais</p>
                                    )}
                                </div>
                            </CollapsibleWidget>
                        </DraggableWidget>
                        
                        {/* Widget 6: Timeline */}
                        <DraggableWidget id="widget-timeline">
                            <CollapsibleWidget
                                storageKey={`timeline_${id}`}
                                title="Linha do Tempo"
                                icon={<Activity className="w-4 h-4" />}
                                defaultOpen={true}
                                collapsedSummary="Histórico de eventos"
                                onOpenChange={setTimelineOpen}
                                headerAction={
                                    <Link 
                                        href={`/investigation/${id}/history`}
                                        className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        Ver tudo →
                                    </Link>
                                }
                            >
                                <div className="min-h-[300px] max-h-[400px] overflow-y-auto px-4 py-3">
                                    <InvestigationTimeline 
                                        events={buildTimelineEvents({ entities, relationships, evidence }).slice(0, 6)}
                                        onEventClick={(event) => {
                                            if (event.metadata?.id) {
                                                if (event.type === 'evidence_uploaded') {
                                                    const ev = evidence.find(e => e.id === event.metadata?.id);
                                                    if (ev) handleEvidenceClick(ev);
                                                } else {
                                                    const entity = entities.find(e => e.id === event.metadata?.id);
                                                    if (entity) handleEntityClick(entity);
                                                }
                                            }
                                        }}
                                    />
                                </div>
                            </CollapsibleWidget>
                        </DraggableWidget>

                    {/* ROW 4: Achados Investigativos - HIDDEN (tabela não existe)
                       TODO: Implementar intelink_findings table e API
                       Feature: Notas do investigador durante entrevistas, vigilâncias, análises técnicas
                    <div className="w-full">
                        <CollapsibleWidget
                            storageKey={`findings_${id}`}
                            title="Achados Investigativos"
                            icon={<Target className="w-4 h-4" />}
                            defaultOpen={true}
                            collapsedSummary="Observações do investigador"
                        >
                            <FindingsPanel 
                                investigationId={id as string}
                                maxItems={6}
                                title=""
                            />
                        </CollapsibleWidget>
                    </div>
                    */}

                        {/* Widget 7: Grafo */}
                        <DraggableWidget id="widget-graph">
                            <CollapsibleWidget
                                storageKey={`network_${id}`}
                                title="Rede de Vínculos"
                                icon={<Network className="w-4 h-4" />}
                                badge={relationships.length}
                                defaultOpen={true}
                                collapsedSummary={`${entities.length} entidades conectadas`}
                                headerClassName="border-b-0"
                                onOpenChange={setGrafoOpen}
                            >
                                <div className="relative min-h-[300px] max-h-[400px]">
                                    {/* Link para tela cheia */}
                                    <div className="absolute top-2 right-2 z-10">
                                        <Link 
                                            href={`/graph/${id}`}
                                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs text-white transition-colors flex items-center gap-2"
                                        >
                                            <Network className="w-3 h-3" />
                                            Tela Cheia
                                        </Link>
                                    </div>
                                    
                                    {/* MOBILE: Lista de Vínculos */}
                                    <div className="md:hidden h-[280px] overflow-y-auto">
                                        <ConnectionList 
                                            entities={entities}
                                            relationships={relationships}
                                            onEntityClick={handleEntityClick}
                                        />
                                    </div>
                                    
                                    {/* DESKTOP: Grafo Visual Interativo */}
                                    <div className="hidden md:block h-[300px] w-full relative">
                                        {!isGraphActive && (
                                            <div 
                                                className="absolute inset-0 z-20 cursor-pointer flex items-center justify-center bg-slate-900/30 hover:bg-slate-900/10 transition-colors"
                                                onClick={() => setIsGraphActive(true)}
                                            >
                                                <div className="bg-slate-800/90 backdrop-blur px-6 py-3 rounded-lg border border-slate-600 text-slate-300">
                                                    🖱️ Clique para interagir com o grafo
                                                </div>
                                            </div>
                                        )}
                                        
                                        <ForceGraph2D
                                            ref={graphRef}
                                            width={600}
                                            height={300}
                                            graphData={graphData}
                                            nodeLabel="name"
                                            nodeColor={node => getEntityColor((node as any).group)}
                                            nodeRelSize={5}
                                            nodeVal={node => {
                                                const connCount = relationships.filter(
                                                    r => r.source_id === (node as any).id || r.target_id === (node as any).id
                                                ).length;
                                                return Math.min(4, Math.max(1.5, connCount * 0.3));
                                            }}
                                            linkColor={() => '#64748b'}
                                            linkWidth={1.5}
                                            backgroundColor="transparent"
                                            enableZoomInteraction={isGraphActive}
                                            enablePanInteraction={isGraphActive}
                                            enableNodeDrag={isGraphActive}
                                            onNodeClick={(node) => {
                                                const entity = entities.find(e => e.id === (node as any).id);
                                                if (entity) handleEntityClick(entity);
                                            }}
                                            d3VelocityDecay={0.3}
                                            cooldownTime={1500}
                                            d3AlphaDecay={0.02}
                                            warmupTicks={100}
                                            onEngineStop={() => {
                                                graphRef.current?.zoomToFit(400, 40);
                                            }}
                                        />
                                    </div>
                                </div>
                            </CollapsibleWidget>
                        </DraggableWidget>
                        
                        {/* Widget 8: Rho Health */}
                        <DraggableWidget id="widget-rho">
                            <CollapsibleWidget
                                storageKey={`rho_${id}`}
                                title="Índice Rho"
                                icon={<Activity className="w-4 h-4" />}
                                defaultOpen={true}
                                collapsedSummary="Análise de centralização da rede"
                                onOpenChange={setRhoOpen}
                            >
                                <div className="min-h-[300px] max-h-[400px] overflow-y-auto">
                                    <RhoHealthWidget 
                                        investigationId={id as string}
                                        hideHeader={true}
                                    />
                                </div>
                            </CollapsibleWidget>
                        </DraggableWidget>
                        
                    </div>
                    {/* End of Grid */}

                    {/* Tunnel Vision Banner (conditional) */}
                    <TunnelVisionBanner 
                        investigationId={id as string}
                    />

                </main>
                
                {/* Drag & Drop Onboarding - First visit tutorial */}
                <DragDropOnboarding />
            </div>

            {/* Entity Detail Modal (unified) */}
            {selectedEntityId && (
                <EntityDetailModal
                    isOpen={isEntityModalOpen}
                    onClose={() => {
                        setIsEntityModalOpen(false);
                        setSelectedEntityId(null);
                    }}
                    entityId={selectedEntityId}
                    investigationId={id}
                    investigationTitle={investigation?.title}
                />
            )}

            {/* Report Modal */}
            <ReportModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                investigationId={id}
                investigationTitle={investigation?.title || 'Operação'}
            />

            {/* Delete Confirmation Modal */}
            <DeleteConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                investigationTitle={investigation?.title || 'Operação'}
                entityCount={entities.length}
                relationshipCount={relationships.length}
                createdAt={investigation?.created_at || new Date().toISOString()}
                isDeleting={isDeleting}
            />

            {/* Settings Modal */}
            {isSettingsModalOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                    <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md mx-4">
                        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-white">Configurações da Operação</h3>
                            <button onClick={() => setIsSettingsModalOpen(false)} className="p-1 hover:bg-slate-800 rounded">
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>
                        <div className="p-4 space-y-4">
                            {/* Nome da Operação */}
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Nome da Operação</label>
                                <input 
                                    type="text" 
                                    value={editingTitle} 
                                    onChange={(e) => setEditingTitle(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    placeholder="Ex: Operação Thunder"
                                />
                            </div>
                            {/* Descrição */}
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Descrição</label>
                                <textarea 
                                    value={editingDescription} 
                                    onChange={(e) => setEditingDescription(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                                    rows={3}
                                    placeholder="Descrição breve da operação..."
                                />
                            </div>
                            {/* Informações */}
                            <div className="p-3 bg-slate-800/50 rounded-lg space-y-2 text-xs text-slate-400">
                                <div className="flex justify-between">
                                    <span>ID:</span>
                                    <span className="text-slate-300 font-mono">{id.slice(0, 8)}...</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Criada em:</span>
                                    <span className="text-slate-300">{investigation?.created_at ? new Date(investigation.created_at).toLocaleDateString('pt-BR') : '-'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Entidades:</span>
                                    <span className="text-slate-300">{entities.length}</span>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 border-t border-slate-700 flex items-center justify-end gap-3">
                            <button
                                onClick={() => setIsSettingsModalOpen(false)}
                                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveSettings}
                                disabled={isSavingSettings || !editingTitle.trim()}
                                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-600/50 text-white rounded-lg font-medium flex items-center gap-2"
                            >
                                {isSavingSettings ? 'Salvando...' : 'Salvar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Document Upload Modal */}
            <DocumentUploadModal
                isOpen={isDocumentModalOpen}
                onClose={() => setIsDocumentModalOpen(false)}
                investigationId={id}
                documentType={documentType}
                onSuccess={(result) => {
                    // Reload entities after successful extraction
                    loadData();
                    setIsDocumentModalOpen(false);
                    // Increment processed docs counter
                    setProcessedDocs(prev => prev + 1);
                }}
            />

            {/* Evidence Detail Modal */}
            <EvidenceDetailModal
                isOpen={isEvidenceModalOpen}
                onClose={() => setIsEvidenceModalOpen(false)}
                evidenceId={selectedEvidence?.id || ''}
                evidenceTitle={selectedEvidence?.description || selectedEvidence?.metadata?.fileName}
                evidenceType={selectedEvidence?.type}
                investigationId={id}
            />

            {/* Setup Wizard (shown after creating new investigation) */}
            {showSetupWizard && investigation && (
                <SetupWizard
                    investigationId={id}
                    investigationTitle={investigation.title}
                    onClose={closeSetupWizard}
                    onUploadClick={(type) => {
                        handleDocumentUpload(type as any);
                    }}
                    processedDocs={processedDocs}
                    entities={entities}
                    evidence={evidence}
                    onGenerateAnalysis={handleGenerateAnalysis}
                />
            )}

            {/* Feedback Button */}
            <FeedbackButton />
        </div>
        </DashboardLayoutProvider>
    );
}
