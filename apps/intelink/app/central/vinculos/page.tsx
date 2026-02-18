'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState, Suspense } from 'react';
import { 
    Link2, AlertTriangle, CheckCircle2, XCircle, Clock,
    User, Building2, Car, MapPin, Filter, RefreshCw,
    ChevronDown, ExternalLink, Search, Loader2, 
    Sparkles, Trophy, TrendingUp, BarChart3, Calendar,
    FileText, SlidersHorizontal, ThumbsUp, AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import VoteModal from '@/components/shared/VoteModal';
import EntityDetailModal from '@/components/shared/EntityDetailModal';
import { useToast } from '@/components/intelink/Toast';
import { useRole, AccessDenied, RoleLoading } from '@/hooks/useRole';
import { matchesSearch } from '@/lib/utils/search';
import { PageHeaderCompact } from '@/components/shared/PageHeader';
import { SkeletonOperationsList } from '@/components/shared/Skeleton';
import {
    StatCard,
    TabButton,
    EmptyState,
    ConfidenceBadge,
    StatusBadge,
} from '@/components/vinculos';

// Types (local - specific to this page)

interface Investigation {
    id: string;
    title: string;
    unit_id?: string;
}

interface UnifiedLink {
    id: string;
    type: 'alert' | 'job';
    
    // Entity info (da OUTRA operação - que fez match)
    entityId: string;
    entityName: string;
    entityType: string;
    
    // Source Entity info (da operação SELECIONADA - NOVO!)
    sourceEntityId?: string;
    sourceEntityName?: string;
    sourceEntityType?: string;
    
    // Match info
    confidence: number;
    matchCriteria: Record<string, any>;
    matchReason?: string;
    
    // Investigation info
    sourceInvestigationId?: string;
    sourceInvestigationTitle?: string;
    targetInvestigationId?: string;
    targetInvestigationTitle?: string;
    
    // Status
    status: 'pending' | 'in_progress' | 'confirmed' | 'rejected';
    priority?: 'high' | 'medium' | 'low';
    
    // Alerta de qualidade de dados (erros críticos)
    dataQualityAlert?: {
        type: 'cpf_name_mismatch' | 'filiation_cpf_mismatch' | 'rg_without_cpf';
        severity: 'critical' | 'high' | 'medium';
        message: string;
    };
    
    // Timestamps
    createdAt: string;
    updatedAt?: string;
}

interface Stats {
    totalAlerts: number;
    pendingAlerts: number;
    confirmedToday: number;
    avgConfidence: number;
}

// Icons map
const TYPE_ICONS: Record<string, typeof User> = {
    PERSON: User,
    ORGANIZATION: Building2,
    COMPANY: Building2,
    VEHICLE: Car,
    LOCATION: MapPin,
};

const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    in_progress: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    confirmed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const STATUS_LABELS: Record<string, string> = {
    pending: 'Pendente',
    in_progress: 'Em Análise',
    confirmed: 'Confirmado',
    rejected: 'Rejeitado',
};

// Cache para links por operação
const linksCache = new Map<string, { data: UnifiedLink[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

function VinculosContent() {
    // RBAC Protection
    const permissions = useRole();
    
    // URL params
    const searchParams = useSearchParams();
    const invFromUrl = searchParams.get('inv');
    
    // Investigations
    const [investigations, setInvestigations] = useState<Investigation[]>([]);
    const [selectedInvestigation, setSelectedInvestigation] = useState<string | null>(invFromUrl);
    
    // Links data
    const [links, setLinks] = useState<UnifiedLink[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(false);
    const [loadingInvestigations, setLoadingInvestigations] = useState(true);
    const [isOperationDrawerOpen, setIsOperationDrawerOpen] = useState(false);
    
    // Background preloading
    const [preloadProgress, setPreloadProgress] = useState<number>(0);
    const [isPreloading, setIsPreloading] = useState(false);
    
    // Filters
    const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'in_review' | 'confirmed'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [minConfidence, setMinConfidence] = useState(0);
    const [entityTypeFilter, setEntityTypeFilter] = useState<string>('all');
    const [showFilters, setShowFilters] = useState(false);
    
    // Vote Modal
    const [votingLink, setVotingLink] = useState<UnifiedLink | null>(null);
    const [isVoteModalOpen, setIsVoteModalOpen] = useState(false);
    
    // Entity Detail Modal (entidade LOCAL/fonte)
    const [selectedEntity, setSelectedEntity] = useState<UnifiedLink | null>(null);
    const [isEntityModalOpen, setIsEntityModalOpen] = useState(false);
    
    // Matched Entity Modal (entidade da OUTRA operação)
    const [matchedEntity, setMatchedEntity] = useState<UnifiedLink | null>(null);
    const [isMatchedModalOpen, setIsMatchedModalOpen] = useState(false);
    
    // Toast notifications
    const { showToast } = useToast();
    
    // Load investigations on mount + start background preload
    // IMPORTANT: All hooks must be called BEFORE any early returns (Rules of Hooks)
    useEffect(() => {
        if (permissions.isLoading || !permissions.canViewInvestigations) return;
        loadInvestigations();
    }, [permissions.isLoading, permissions.canViewInvestigations]);
    
    // Auto-select investigation from URL param
    useEffect(() => {
        if (invFromUrl && investigations.length > 0) {
            const exists = investigations.find(inv => inv.id === invFromUrl);
            if (exists && selectedInvestigation !== invFromUrl) {
                setSelectedInvestigation(invFromUrl);
            }
        }
    }, [invFromUrl, investigations]);

    // Load data when investigation is selected
    useEffect(() => {
        if (permissions.isLoading || !permissions.canViewInvestigations) return;
        if (selectedInvestigation && investigations.length > 0) {
            loadData();
        }
    }, [selectedInvestigation, investigations.length, permissions.isLoading, permissions.canViewInvestigations]);
    
    // RBAC: Only members+ can access Vínculos (after all hooks)
    if (permissions.isLoading) return <RoleLoading />;
    if (!permissions.canViewInvestigations) return <AccessDenied />;
    
    // Open entity detail modal (entidade LOCAL)
    const openEntityModal = (link: UnifiedLink) => {
        setSelectedEntity(link);
        setIsEntityModalOpen(true);
    };
    
    // Open matched entity modal (entidade da OUTRA operação)
    const openMatchedEntityModal = (link: UnifiedLink) => {
        setMatchedEntity(link);
        setIsMatchedModalOpen(true);
    };

    const loadInvestigations = async () => {
        setLoadingInvestigations(true);
        try {
            const res = await fetch('/api/investigations?limit=200');
            if (res.ok) {
                const data = await res.json();
                const invs = data.investigations || [];
                setInvestigations(invs);
                
                // Start background preloading after a short delay
                if (invs.length > 0 && invs.length <= 20) {
                    setTimeout(() => preloadInvestigations(invs), 500);
                }
            }
        } catch (error) {
            console.error('Error loading investigations:', error);
        } finally {
            setLoadingInvestigations(false);
        }
    };

    // Helper to update stats from links
    const updateStats = (unifiedLinks: UnifiedLink[]) => {
        const pending = unifiedLinks.filter(l => l.status === 'pending');
        const confirmed = unifiedLinks.filter(l => l.status === 'confirmed');
        const today = new Date().toDateString();
        const confirmedToday = confirmed.filter(l => new Date(l.updatedAt || l.createdAt).toDateString() === today);
        
        setStats({
            totalAlerts: unifiedLinks.length,
            pendingAlerts: pending.length,
            confirmedToday: confirmedToday.length,
            avgConfidence: unifiedLinks.length > 0 
                ? Math.round(unifiedLinks.reduce((acc, l) => acc + l.confidence, 0) / unifiedLinks.length)
                : 0
        });
    };

    // Background preload for all investigations (runs while user picks)
    const preloadInvestigations = async (invs: Investigation[]) => {
        setIsPreloading(true);
        let loaded = 0;
        
        // Load in parallel batches of 5
        const batchSize = 5;
        for (let i = 0; i < invs.length; i += batchSize) {
            const batch = invs.slice(i, i + batchSize);
            await Promise.all(batch.map(async (inv) => {
                const cached = linksCache.get(inv.id);
                if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
                    loaded++;
                    setPreloadProgress(Math.round((loaded / invs.length) * 100));
                    return;
                }
                
                try {
                    const res = await fetch(`/api/intelink/cross-references?investigation_id=${inv.id}`);
                    if (res.ok) {
                        const data = await res.json();
                        const unifiedLinks = (data.matches || []).map((match: any) => ({
                            id: `alert_${match.entityId}_${match.sourceEntityId || match.investigationId}`,
                            type: 'alert' as const,
                            // Entidade que FEZ MATCH (da outra operação)
                            entityId: match.entityId,
                            entityName: match.entityName,
                            entityType: match.entityType,
                            // Entidade FONTE (da operação selecionada) - NOVO!
                            sourceEntityId: match.sourceEntityId,
                            sourceEntityName: match.sourceEntityName,
                            sourceEntityType: match.sourceEntityType,
                            // Match info
                            confidence: match.matchConfidence,
                            matchCriteria: match.matchCriteria || {},
                            matchReason: match.confidenceLevel?.description,
                            sourceInvestigationId: inv.id,
                            sourceInvestigationTitle: inv.title,
                            targetInvestigationId: match.investigationId,
                            targetInvestigationTitle: match.investigationTitle,
                            status: match.status || 'pending',
                            priority: match.matchConfidence >= 90 ? 'high' : match.matchConfidence >= 70 ? 'medium' : 'low',
                            createdAt: match.createdAt || new Date().toISOString()
                        }));
                        linksCache.set(inv.id, { data: unifiedLinks, timestamp: Date.now() });
                    }
                } catch (e) {
                    // Silent fail for preload
                }
                loaded++;
                setPreloadProgress(Math.round((loaded / invs.length) * 100));
            }));
        }
        setIsPreloading(false);
    };

    // Load data with cache support
    // Note: Not using useCallback to avoid Rules of Hooks violation
    const loadData = async () => {
        if (!selectedInvestigation) return;
        
        setLoading(true);
        try {
            const unifiedLinks: UnifiedLink[] = [];
            
            // Single investigation - use cache if available
            if (selectedInvestigation !== 'all') {
                const cached = linksCache.get(selectedInvestigation);
                if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
                    setLinks(cached.data);
                    updateStats(cached.data);
                    setLoading(false);
                    return;
                }
                
                // Load single investigation
                const inv = investigations.find(i => i.id === selectedInvestigation);
                if (inv) {
                    try {
                        const res = await fetch(`/api/intelink/cross-references?investigation_id=${inv.id}`);
                        if (res.ok) {
                            const data = await res.json();
                            // DEBUG: Log raw API response
                            console.log('[Vinculos] API Response for', inv.title, ':', data.matches?.map((m: any) => ({
                                entityId: m.entityId,
                                entityName: m.entityName,
                                sourceEntityId: m.sourceEntityId,
                                sourceEntityName: m.sourceEntityName
                            })));
                            const newLinks = (data.matches || []).map((match: any) => ({
                                id: `alert_${match.entityId}_${match.sourceEntityId || match.investigationId}`,
                                type: 'alert' as const,
                                entityId: match.entityId,
                                entityName: match.entityName,
                                entityType: match.entityType,
                                sourceEntityId: match.sourceEntityId,
                                sourceEntityName: match.sourceEntityName,
                                sourceEntityType: match.sourceEntityType,
                                confidence: match.matchConfidence,
                                matchCriteria: match.matchCriteria || {},
                                matchReason: match.confidenceLevel?.description,
                                sourceInvestigationId: inv.id,
                                sourceInvestigationTitle: inv.title,
                                targetInvestigationId: match.investigationId,
                                targetInvestigationTitle: match.investigationTitle,
                                status: match.status || 'pending',
                                priority: match.matchConfidence >= 90 ? 'high' : match.matchConfidence >= 70 ? 'medium' : 'low',
                                createdAt: match.createdAt || new Date().toISOString()
                            }));
                            linksCache.set(inv.id, { data: newLinks, timestamp: Date.now() });
                            unifiedLinks.push(...newLinks);
                        }
                    } catch (e) {
                        console.warn(`Failed to load alerts for ${inv.id}:`, e);
                    }
                }
            } else {
                // All investigations - use cached data where available
                for (const inv of investigations) {
                    const cached = linksCache.get(inv.id);
                    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
                        unifiedLinks.push(...cached.data);
                    } else {
                        try {
                            const res = await fetch(`/api/intelink/cross-references?investigation_id=${inv.id}`);
                            if (res.ok) {
                                const data = await res.json();
                                const newLinks = (data.matches || []).map((match: any) => ({
                                    id: `alert_${match.entityId}_${match.sourceEntityId || match.investigationId}`,
                                    type: 'alert' as const,
                                    entityId: match.entityId,
                                    entityName: match.entityName,
                                    entityType: match.entityType,
                                    sourceEntityId: match.sourceEntityId,
                                    sourceEntityName: match.sourceEntityName,
                                    sourceEntityType: match.sourceEntityType,
                                    confidence: match.matchConfidence,
                                    matchCriteria: match.matchCriteria || {},
                                    matchReason: match.confidenceLevel?.description,
                                    sourceInvestigationId: inv.id,
                                    sourceInvestigationTitle: inv.title,
                                    targetInvestigationId: match.investigationId,
                                    targetInvestigationTitle: match.investigationTitle,
                                    status: match.status || 'pending',
                                    priority: match.matchConfidence >= 90 ? 'high' : match.matchConfidence >= 70 ? 'medium' : 'low',
                                    createdAt: match.createdAt || new Date().toISOString()
                                }));
                                linksCache.set(inv.id, { data: newLinks, timestamp: Date.now() });
                                unifiedLinks.push(...newLinks);
                            }
                        } catch (e) {
                            // Silent fail
                        }
                    }
                }
            }
            
            // NOTE: Jobs removed from this page - they are data quality tasks, not entity links
            // Jobs are now shown ONLY in /jobs page
            
            // Sort by confidence (desc) then date (desc)
            unifiedLinks.sort((a, b) => {
                if (b.confidence !== a.confidence) return b.confidence - a.confidence;
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });
            
            setLinks(unifiedLinks);
            
            // Calculate stats
            const pending = unifiedLinks.filter(l => l.status === 'pending');
            const confirmed = unifiedLinks.filter(l => l.status === 'confirmed');
            const today = new Date().toDateString();
            const confirmedToday = confirmed.filter(l => new Date(l.updatedAt || l.createdAt).toDateString() === today);
            
            setStats({
                totalAlerts: unifiedLinks.length,
                pendingAlerts: pending.length,
                confirmedToday: confirmedToday.length,
                avgConfidence: unifiedLinks.length > 0 
                    ? Math.round(unifiedLinks.reduce((acc, l) => acc + l.confidence, 0) / unifiedLinks.length)
                    : 0
            });
            
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Filter links
    const filteredLinks = links.filter(link => {
        // Tab filter
        if (activeTab === 'pending' && link.status !== 'pending') return false;
        if (activeTab === 'in_review' && link.status !== 'in_progress') return false;
        if (activeTab === 'confirmed' && link.status !== 'confirmed' && link.status !== 'rejected') return false;
        
        // Confidence filter
        if (minConfidence > 0 && link.confidence < minConfidence) return false;
        
        // Entity type filter
        if (entityTypeFilter !== 'all' && link.entityType !== entityTypeFilter) return false;
        
        // Search filter (accent-insensitive)
        if (searchTerm) {
            if (!matchesSearch(link.entityName, searchTerm) &&
                !matchesSearch(link.sourceEntityName, searchTerm) &&
                !matchesSearch(link.targetInvestigationTitle, searchTerm) &&
                !matchesSearch(link.sourceInvestigationTitle, searchTerm)) {
                return false;
            }
        }
        
        return true;
    });
    
    // Get unique entity types for filter
    const entityTypes = [...new Set(links.map(l => l.entityType))];

    // Open vote modal
    const openVoteModal = (link: UnifiedLink) => {
        setVotingLink(link);
        setIsVoteModalOpen(true);
    };

    // Handle vote from modal
    const handleVote = async (action: 'confirm' | 'reject', evidence?: { type: 'text' | 'file'; content: string; fileName?: string }) => {
        if (!votingLink) return;
        
        const memberId = localStorage.getItem('intelink_member_id');
        const memberName = localStorage.getItem('intelink_username') || 'Usuário';
        
        if (!memberId) {
            showToast('error', 'Não autenticado', 'Você precisa estar logado para votar.');
            return;
        }
        
        const response = await fetch('/api/links/confirm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sourceEntityId: votingLink.entityId,
                targetEntityId: votingLink.entityId,
                action,
                memberId,
                memberName,
                confidence: votingLink.confidence,
                matchCriteria: votingLink.matchCriteria,
                evidence
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            // Handle "already voted" as a warning, not an error
            if (data.existingVote) {
                const voteType = data.existingVote === 'confirm' ? 'confirmou' : 'rejeitou';
                showToast('warning', 'Já Votado', `Você já ${voteType} este vínculo. Aguarde outros membros votarem.`);
                return; // Don't throw error, just return
            }
            showToast('error', 'Erro', data.error || 'Erro ao processar voto.');
            throw new Error(data.error);
        }
        
        // Show success feedback
        if (data.isComplete) {
            showToast('success', 'Vínculo Confirmado!', data.message);
        } else {
            showToast('info', 'Voto Registrado', data.message);
        }
        
        // Update local state - move to in_review if first vote
        const newStatus = data.status === 'pending' && action === 'confirm' ? 'in_progress' : data.status;
        setLinks(prev => prev.map(l => 
            l.id === votingLink.id 
                ? { ...l, status: newStatus, updatedAt: new Date().toISOString() }
                : l
        ));
        
        // Update stats
        updateStats(links.map(l => l.id === votingLink.id ? { ...l, status: newStatus } : l));
    };

    // Confirm/Reject link with quorum system (legacy - now uses modal)
    const handleAction = async (linkId: string, _action: 'confirm' | 'reject') => {
        const link = links.find(l => l.id === linkId);
        if (link) {
            openVoteModal(link);
        }
    };

    return (
        <div className="w-full px-4 md:px-6 py-6">
                <PageHeaderCompact
                    title="Central de Vínculos"
                    subtitle="Alertas cruzados, jobs de correção e vínculos confirmados"
                    icon={Link2}
                    actions={
                        <button
                            onClick={loadData}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors disabled:opacity-50"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            Atualizar
                        </button>
                    }
                />

                {/* Info Banner - Cross-Case vs Entity Resolver */}
                <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-blue-100 text-sm font-medium">Cross-Case Alerts (Vínculos entre Operações)</p>
                            <p className="text-blue-200/70 text-xs mt-1">
                                Esta página mostra entidades que aparecem em <strong>diferentes operações</strong> (ex: mesmo CPF em TESTE TEU e DHPP TESTES). 
                                Requer <strong>confirmação humana</strong> de 2 membros para garantir que é a mesma pessoa.
                            </p>
                            <p className="text-slate-400 text-xs mt-2">
                                💡 Para duplicatas na <strong>mesma operação</strong>, use o <a href="/central/intelligence-lab" className="text-purple-400 hover:underline">Entity Resolver (IA Lab)</a>.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Investigation Selector */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-slate-400" />
                            <label className="text-sm text-slate-400 hidden sm:inline">Operação:</label>
                        </div>
                        
                        {/* Mobile: Touch-friendly button that opens drawer */}
                        <button
                            onClick={() => setIsOperationDrawerOpen(true)}
                            disabled={loadingInvestigations}
                            className="sm:hidden flex-1 flex items-center justify-between gap-2 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 disabled:opacity-50 min-h-[48px]"
                        >
                            <span className="truncate">
                                {selectedInvestigation === 'all' 
                                    ? `📊 Todas (${investigations.length})`
                                    : selectedInvestigation 
                                        ? investigations.find(i => i.id === selectedInvestigation)?.title || 'Operação'
                                        : '🔍 Selecionar operação...'
                                }
                            </span>
                            <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                        </button>
                        
                        {/* Desktop: Standard select dropdown */}
                        <div className="relative flex-1 min-w-[200px] max-w-md hidden sm:block">
                            <select
                                value={selectedInvestigation || ''}
                                onChange={(e) => setSelectedInvestigation(e.target.value || null)}
                                disabled={loadingInvestigations}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-blue-500 disabled:opacity-50"
                            >
                                <option value="">🔍 Selecione uma operação...</option>
                                <option value="all">📊 Todas as operações ({investigations.length})</option>
                                {investigations.map(inv => (
                                    <option key={inv.id} value={inv.id}>{inv.title}</option>
                                ))}
                            </select>
                        </div>
                        
                        {/* Loading indicator - separate from dropdown */}
                        {loadingInvestigations && (
                            <div className="flex items-center gap-2 text-sm text-slate-400">
                                <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                                <span className="hidden sm:inline">Carregando...</span>
                            </div>
                        )}
                        
                        {/* Preload progress indicator */}
                        {isPreloading && !loadingInvestigations && (
                            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                <span>Background: {preloadProgress}%</span>
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Mobile Operation Drawer */}
                {isOperationDrawerOpen && (
                    <div className="fixed inset-0 z-50 sm:hidden">
                        {/* Backdrop */}
                        <div 
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setIsOperationDrawerOpen(false)}
                        />
                        {/* Drawer */}
                        <div className="absolute bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700 rounded-t-2xl max-h-[70vh] flex flex-col animate-in slide-in-from-bottom duration-300">
                            {/* Handle */}
                            <div className="flex justify-center py-3">
                                <div className="w-10 h-1 bg-slate-600 rounded-full" />
                            </div>
                            {/* Header */}
                            <div className="px-4 pb-3 border-b border-slate-800">
                                <h3 className="text-lg font-semibold text-white">Selecionar Operação</h3>
                                <p className="text-sm text-slate-400">{investigations.length} operações disponíveis</p>
                            </div>
                            {/* Options */}
                            <div className="flex-1 overflow-y-auto p-2">
                                <button
                                    onClick={() => { setSelectedInvestigation(null); setIsOperationDrawerOpen(false); }}
                                    className={`w-full text-left p-4 rounded-xl mb-2 transition-colors ${
                                        !selectedInvestigation 
                                            ? 'bg-blue-500/20 border border-blue-500/50' 
                                            : 'bg-slate-800/50 hover:bg-slate-800'
                                    }`}
                                >
                                    <span className="text-white font-medium">🔍 Nenhuma selecionada</span>
                                </button>
                                <button
                                    onClick={() => { setSelectedInvestigation('all'); setIsOperationDrawerOpen(false); }}
                                    className={`w-full text-left p-4 rounded-xl mb-2 transition-colors ${
                                        selectedInvestigation === 'all'
                                            ? 'bg-blue-500/20 border border-blue-500/50' 
                                            : 'bg-slate-800/50 hover:bg-slate-800'
                                    }`}
                                >
                                    <span className="text-white font-medium">📊 Todas as operações</span>
                                    <span className="text-slate-400 text-sm ml-2">({investigations.length})</span>
                                </button>
                                {investigations.map(inv => (
                                    <button
                                        key={inv.id}
                                        onClick={() => { setSelectedInvestigation(inv.id); setIsOperationDrawerOpen(false); }}
                                        className={`w-full text-left p-4 rounded-xl mb-2 transition-colors ${
                                            selectedInvestigation === inv.id
                                                ? 'bg-blue-500/20 border border-blue-500/50' 
                                                : 'bg-slate-800/50 hover:bg-slate-800'
                                        }`}
                                    >
                                        <span className="text-white font-medium">{inv.title}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Stats removed - info already in tabs */}

                {/* Tabs */}
                <div className="flex items-center gap-4 mb-6 border-b border-slate-800">
                    <TabButton 
                        active={activeTab === 'all'} 
                        onClick={() => setActiveTab('all')}
                        label="Todos"
                        count={links.length}
                    />
                    <TabButton 
                        active={activeTab === 'pending'} 
                        onClick={() => setActiveTab('pending')}
                        label="Pendentes"
                        count={links.filter(l => l.status === 'pending').length}
                        color="yellow"
                    />
                    <TabButton 
                        active={activeTab === 'in_review'} 
                        onClick={() => setActiveTab('in_review')}
                        label="Em Análise"
                        count={links.filter(l => l.status === 'in_progress').length}
                        color="blue"
                        icon={<ThumbsUp className="w-3.5 h-3.5" />}
                    />
                    <TabButton 
                        active={activeTab === 'confirmed'} 
                        onClick={() => setActiveTab('confirmed')}
                        label="Resolvidos"
                        count={links.filter(l => l.status === 'confirmed' || l.status === 'rejected').length}
                        color="emerald"
                    />
                </div>

                {/* Search Bar + Filters */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Buscar por nome, entidade ou operação..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                        />
                    </div>
                    
                    {/* Filters button - next to search */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
                            showFilters ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        <SlidersHorizontal className="w-4 h-4" />
                        Filtros
                    </button>
                </div>
                
                {/* Advanced Filters (expandable) */}
                {showFilters && (
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6">
                        <div className="flex flex-wrap gap-3">
                            <select
                                value={entityTypeFilter}
                                onChange={(e) => setEntityTypeFilter(e.target.value)}
                                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                            >
                                <option value="all">Todos os tipos</option>
                                <option value="PERSON">👤 Pessoas</option>
                                <option value="VEHICLE">🚗 Veículos</option>
                                <option value="COMPANY">🏢 Empresas</option>
                                <option value="ORGANIZATION">🔗 Org. Criminosas</option>
                                <option value="LOCATION">📍 Locais</option>
                                <option value="PHONE">📱 Telefones</option>
                            </select>
                            
                            <select
                                value={minConfidence}
                                onChange={(e) => setMinConfidence(Number(e.target.value))}
                                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                            >
                                <option value={0}>Todas confianças</option>
                                <option value={100}>🔴 Crítico (100%)</option>
                                <option value={90}>🟠 Alto (90%+)</option>
                                <option value={70}>🟡 Médio (70%+)</option>
                                <option value={50}>⚪ Baixo (50%+)</option>
                            </select>
                        </div>
                    </div>
                )}

                {/* Results */}
                {loading ? (
                    <SkeletonOperationsList count={4} />
                ) : filteredLinks.length === 0 ? (
                    <EmptyState 
                        icon={activeTab === 'confirmed' ? CheckCircle2 : Link2}
                        title={activeTab === 'confirmed' ? 'Nenhum vínculo resolvido' : 'Nenhum alerta pendente'}
                        description={activeTab === 'pending' ? 'Sistema está em dia! 🎉' : 'Comece confirmando alertas pendentes'}
                    />
                ) : (
                    <div className="space-y-3">
                        {filteredLinks.map(link => (
                            <LinkCard 
                                key={link.id} 
                                link={link} 
                                onConfirm={() => openVoteModal(link)}
                                onReject={() => openVoteModal(link)}
                                onEntityClick={() => openEntityModal(link)}
                                onMatchedEntityClick={() => openMatchedEntityModal(link)}
                            />
                        ))}
                    </div>
                )}
                
                {/* Vote Modal */}
                {votingLink && (
                    <VoteModal
                        isOpen={isVoteModalOpen}
                        onClose={() => {
                            setIsVoteModalOpen(false);
                            setVotingLink(null);
                        }}
                        onVote={handleVote}
                        entityName={votingLink.entityName}
                        entityType={votingLink.entityType}
                        matchConfidence={votingLink.confidence}
                        matchCriteria={votingLink.matchCriteria}
                        targetInvestigation={votingLink.targetInvestigationTitle || 'Operação'}
                        requiredQuorum={votingLink.confidence >= 90 ? 2 : 1}
                    />
                )}
                
                {/* Entity Detail Modal - Shows LOCAL entity (source) - AZUL */}
                {selectedEntity && (
                    <EntityDetailModal
                        isOpen={isEntityModalOpen}
                        onClose={() => {
                            setIsEntityModalOpen(false);
                            setSelectedEntity(null);
                        }}
                        // Use SOURCE entity (local) - this is the entity from the selected investigation
                        entityId={selectedEntity.sourceEntityId || selectedEntity.entityId}
                        entityName={selectedEntity.sourceEntityName || selectedEntity.entityName}
                        entityType={selectedEntity.sourceEntityType || selectedEntity.entityType}
                        investigationId={selectedEntity.sourceInvestigationId}
                        investigationTitle={selectedEntity.sourceInvestigationTitle}
                        isFromAlert={true}
                        matchConfidence={selectedEntity.confidence}
                        // Pass target entity info for cross-reference display in modal
                        targetInvestigationId={selectedEntity.targetInvestigationId}
                        targetInvestigationTitle={selectedEntity.targetInvestigationTitle}
                        matchedEntityId={selectedEntity.entityId}
                        matchedEntityName={selectedEntity.entityName}
                    />
                )}
                
                {/* Matched Entity Modal - Shows MATCHED entity (from other investigation) - AMARELA */}
                {matchedEntity && (
                    <EntityDetailModal
                        isOpen={isMatchedModalOpen}
                        onClose={() => {
                            setIsMatchedModalOpen(false);
                            setMatchedEntity(null);
                        }}
                        // Use MATCHED entity (from other investigation)
                        entityId={matchedEntity.entityId}
                        entityName={matchedEntity.entityName}
                        entityType={matchedEntity.entityType}
                        investigationId={matchedEntity.targetInvestigationId}
                        investigationTitle={matchedEntity.targetInvestigationTitle}
                        isFromAlert={true}
                        matchConfidence={matchedEntity.confidence}
                        // Pass source entity info for cross-reference display
                        targetInvestigationId={matchedEntity.sourceInvestigationId}
                        targetInvestigationTitle={matchedEntity.sourceInvestigationTitle}
                        matchedEntityId={matchedEntity.sourceEntityId}
                        matchedEntityName={matchedEntity.sourceEntityName}
                    />
                )}
        </div>
    );
}

// StatCard and TabButton imported from @/components/vinculos

// Entity type labels in Portuguese
const TYPE_LABELS_PT: Record<string, string> = {
    PERSON: 'Pessoa',
    VEHICLE: 'Veículo',
    LOCATION: 'Local',
    PHONE: 'Telefone',
    COMPANY: 'Empresa',
    ORGANIZATION: 'Organização',
    FIREARM: 'Arma de fogo',
};

// Confidence level descriptions
const CONFIDENCE_DESCRIPTIONS: Record<string, string> = {
    critical: 'Dados idênticos (CPF, placa, etc)',
    high: 'Alta similaridade no nome e dados',
    medium: 'Nome similar, verificar dados',
    low: 'Possível coincidência, analisar',
};

function getConfidenceDescription(confidence: number): string {
    if (confidence >= 100) return CONFIDENCE_DESCRIPTIONS.critical;
    if (confidence >= 90) return CONFIDENCE_DESCRIPTIONS.high;
    if (confidence >= 70) return CONFIDENCE_DESCRIPTIONS.medium;
    return CONFIDENCE_DESCRIPTIONS.low;
}

// Mapeamento de critérios para descrições em português
const MATCH_CRITERIA_LABELS: Record<string, string> = {
    cpf: 'CPF idêntico',
    rg: 'RG idêntico',
    cnpj: 'CNPJ idêntico',
    telefone: 'Telefone idêntico',
    nomeSimilar: 'Nome similar',
    nomeDataNascimento: 'Nome + Data de Nascimento',
    nomeFiliacao: 'Nome + Filiação',
    endereco: 'Endereço similar',
    placa: 'Placa idêntica',
    chassi: 'Chassi idêntico',
    alcunha: 'Alcunha/Vulgo idêntico',
};

// Função para gerar narrativa do match
function generateMatchNarrative(link: UnifiedLink): { 
    title: string; 
    details: string[];
    addressInfo?: { source?: string; target?: string };
} {
    const sourceName = link.sourceEntityName || 'Entidade';
    const sourceOp = link.sourceInvestigationTitle || 'operação atual';
    const targetName = link.entityName || 'outra entidade';
    const targetOp = link.targetInvestigationTitle || 'outra operação';
    
    const details: string[] = [];
    let addressInfo: { source?: string; target?: string } | undefined;
    
    // Analisar critérios de match
    const criteria = link.matchCriteria || {};
    
    if (criteria.cpf) {
        details.push('CPF idêntico encontrado em ambas as entidades');
    }
    if (criteria.rg) {
        details.push('RG idêntico encontrado em ambas as entidades');
    }
    if (criteria.telefone) {
        details.push('Telefone idêntico encontrado');
    }
    if (criteria.nomeSimilar) {
        const score = typeof criteria.nomeSimilar === 'number' ? criteria.nomeSimilar : 0;
        if (criteria.nomeDetalhes) {
            details.push(criteria.nomeDetalhes as string);
        } else {
            details.push(`Nome muito similar (${score}% de similaridade)`);
        }
    }
    if (criteria.nomeDataNascimento) {
        details.push('Mesmo nome e data de nascimento');
    }
    if (criteria.nomeFiliacao) {
        details.push('Mesmo nome e filiação (nome da mãe ou pai)');
    }
    if (criteria.endereco) {
        const score = typeof criteria.endereco === 'number' ? criteria.endereco : 0;
        if (criteria.enderecoDetalhes) {
            details.push(`Endereço similar: ${criteria.enderecoDetalhes}`);
        } else {
            details.push(`Endereço similar (${score}% de similaridade)`);
        }
    }
    if (criteria.placa) {
        details.push('Placa de veículo idêntica');
    }
    if (criteria.chassi) {
        details.push('Chassi de veículo idêntico');
    }
    if (criteria.alcunha) {
        details.push('Mesma alcunha/vulgo');
    }
    
    // Se não tem detalhes específicos, adicionar genérico
    if (details.length === 0) {
        const keys = Object.keys(criteria).filter(k => criteria[k]);
        if (keys.length > 0) {
            details.push(`Critérios: ${keys.map(k => MATCH_CRITERIA_LABELS[k] || k).join(', ')}`);
        }
    }
    
    return {
        title: `**${sourceName}** da **${sourceOp}** possui possível vínculo com **${targetName}** da **${targetOp}**`,
        details,
        addressInfo
    };
}

// Link Card Component - VERSÃO NARRATIVA
function LinkCard({ link, onConfirm, onReject, onEntityClick, onMatchedEntityClick }: {
    link: UnifiedLink;
    onConfirm: () => void;
    onReject: () => void;
    onEntityClick?: () => void;
    onMatchedEntityClick?: () => void; // Para abrir popup da entidade que fez match
}) {
    const Icon = TYPE_ICONS[link.entityType] || User;
    const entityTypeLabel = TYPE_LABELS_PT[link.entityType] || link.entityType;
    const narrative = generateMatchNarrative(link);
    
    // Verificar se é um alerta de qualidade de dados
    const isDataQualityAlert = link.dataQualityAlert?.severity === 'critical';
    
    return (
        <div className={`rounded-xl p-4 transition-colors ${
            isDataQualityAlert 
                ? 'bg-red-950/50 border-2 border-red-500/50 hover:border-red-400/70' 
                : 'bg-slate-900 border border-slate-800 hover:border-slate-700'
        }`}>
            {/* ALERTA DE QUALIDADE DE DADOS - Erro Crítico */}
            {link.dataQualityAlert && (
                <div className={`mb-4 p-3 rounded-lg border ${
                    link.dataQualityAlert.severity === 'critical' 
                        ? 'bg-red-500/10 border-red-500/30' 
                        : link.dataQualityAlert.severity === 'high'
                        ? 'bg-orange-500/10 border-orange-500/30'
                        : 'bg-yellow-500/10 border-yellow-500/30'
                }`}>
                    <div className="flex items-start gap-2">
                        <AlertTriangle className={`w-5 h-5 mt-0.5 ${
                            link.dataQualityAlert.severity === 'critical' ? 'text-red-400' :
                            link.dataQualityAlert.severity === 'high' ? 'text-orange-400' : 'text-yellow-400'
                        }`} />
                        <div>
                            <p className={`text-sm font-bold ${
                                link.dataQualityAlert.severity === 'critical' ? 'text-red-400' :
                                link.dataQualityAlert.severity === 'high' ? 'text-orange-400' : 'text-yellow-400'
                            }`}>
                                ⚠️ ERRO DE CADASTRO
                            </p>
                            <p className="text-xs text-slate-300 mt-1">
                                {link.dataQualityAlert.message}
                            </p>
                            <p className="text-xs text-slate-400 mt-2">
                                🛠️ <strong>Ação necessária:</strong> Corrija o CPF ou o nome em uma das entidades.
                            </p>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Header: Confidence + Status + Actions */}
            <div className="flex items-center justify-between gap-4 mb-3">
                <div className="flex items-center gap-2">
                    {/* Confidence badge with hover tooltip */}
                    <div className="relative group">
                        <div 
                            className={`px-2.5 py-1 rounded-lg text-sm font-bold cursor-help ${
                                link.confidence >= 100 ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                link.confidence >= 90 ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                                link.confidence >= 70 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                                'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                            }`}
                        >
                            {link.confidence}%
                        </div>
                        {/* Tooltip on hover */}
                        <div className="absolute left-0 top-full mt-1 hidden group-hover:block bg-slate-800 border border-slate-700 rounded-lg p-3 z-50 w-56 shadow-xl">
                            <p className="text-sm font-semibold text-white mb-1">
                                Confiança: {link.confidence}%
                            </p>
                            <p className="text-xs text-slate-300">
                                {getConfidenceDescription(link.confidence)}
                            </p>
                            <div className="mt-2 pt-2 border-t border-slate-700">
                                <p className="text-xs text-slate-400">
                                    {link.confidence >= 100 && '🔴 Match exato - verificar urgente'}
                                    {link.confidence >= 90 && link.confidence < 100 && '🟠 Alta probabilidade - investigar'}
                                    {link.confidence >= 70 && link.confidence < 90 && '🟡 Probabilidade média - analisar'}
                                    {link.confidence < 70 && '⚪ Baixa probabilidade - pode ser coincidência'}
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    {/* Status badge */}
                    <span className={`px-2 py-0.5 rounded text-xs border ${STATUS_COLORS[link.status]}`}>
                        {STATUS_LABELS[link.status]}
                    </span>
                    
                    {/* Entity type */}
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Icon className="w-3.5 h-3.5" />
                        {entityTypeLabel}
                    </span>
                </div>
                
                {/* Actions - Touch-friendly (min 44px height) */}
                {link.status === 'pending' && (
                    <div className="flex gap-2">
                        <button
                            onClick={onReject}
                            className="flex items-center justify-center gap-1.5 px-3 py-2 min-h-[44px] bg-red-500/10 hover:bg-red-500/20 active:bg-red-500/30 text-red-400 border border-red-500/30 rounded-lg transition-colors text-sm font-medium"
                            title="Não é a mesma entidade"
                        >
                            <XCircle className="w-4 h-4" />
                            <span className="hidden sm:inline">Rejeitar</span>
                        </button>
                        <button
                            onClick={onConfirm}
                            className="flex items-center justify-center gap-1.5 px-3 py-2 min-h-[44px] bg-emerald-500/10 hover:bg-emerald-500/20 active:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 rounded-lg transition-colors text-sm font-medium"
                            title="Confirmar vínculo"
                        >
                            <CheckCircle2 className="w-4 h-4" />
                            <span className="hidden sm:inline">Confirmar</span>
                        </button>
                    </div>
                )}
            </div>
            
            {/* NARRATIVA PRINCIPAL */}
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                {/* Título narrativo com links */}
                <p className="text-sm text-slate-200 leading-relaxed">
                    <button 
                        onClick={onEntityClick}
                        className="font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                    >
                        {link.sourceEntityName || link.entityName}
                    </button>
                    <span className="text-slate-400"> da </span>
                    <Link 
                        href={`/investigation/${link.sourceInvestigationId}`}
                        className="font-medium text-emerald-400 hover:text-emerald-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {link.sourceInvestigationTitle}
                    </Link>
                    <span className="text-slate-400"> possui possível vínculo com </span>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            // Abrir popup da entidade que fez match (não a página)
                            if (onMatchedEntityClick) {
                                onMatchedEntityClick();
                            }
                        }}
                        className="font-semibold text-amber-400 hover:text-amber-300 transition-colors"
                        title="Clique para ver detalhes desta entidade"
                    >
                        {link.entityName}
                    </button>
                    <span className="text-slate-400"> da </span>
                    <Link 
                        href={`/investigation/${link.targetInvestigationId}`}
                        className="font-medium text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                        title="Abrir operação em nova aba"
                    >
                        {link.targetInvestigationTitle}
                        <ExternalLink className="w-3 h-3" />
                    </Link>
                </p>
                
                {/* Detalhes do match */}
                {narrative.details.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-700/50">
                        <p className="text-xs font-medium text-slate-400 mb-2">
                            🔍 Motivo do match:
                        </p>
                        <ul className="space-y-1">
                            {narrative.details.map((detail, idx) => (
                                <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                                    <span className="text-emerald-500 mt-0.5">•</span>
                                    <span>{detail}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                
                {/* Badges de critérios */}
                <div className="flex gap-1.5 mt-3 flex-wrap">
                    {Object.entries(link.matchCriteria)
                        .filter(([,v]) => v)
                        .map(([key]) => (
                            <span 
                                key={key} 
                                className="px-2 py-0.5 bg-slate-700/50 rounded text-xs text-slate-400 border border-slate-600/50"
                            >
                                {MATCH_CRITERIA_LABELS[key] || key}
                            </span>
                        ))
                    }
                </div>
            </div>
        </div>
    );
}

// EmptyState imported from @/components/vinculos

// Suspense wrapper for useSearchParams
export default function VinculosUnificadosPage() {
    return (
        <Suspense fallback={<RoleLoading />}>
            <VinculosContent />
        </Suspense>
    );
}
