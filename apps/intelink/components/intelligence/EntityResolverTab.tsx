'use client';

/**
 * EntityResolverTab - Resolução de Entidades Duplicadas
 * 
 * Detecta entidades duplicadas por CPF, nome similar, etc.
 * e permite fazer merge manual ou automático.
 * 
 * Sistema de Pontuação (Score de Completude):
 * - CPF válido: +100 pontos
 * - CNPJ válido: +100 pontos
 * - Chassi: +100 pontos
 * - Placa: +50 pontos
 * - RG: +50 pontos
 * - Telefone: +30 pontos
 * - Nome da mãe: +20 pontos
 * - Nome do pai: +20 pontos
 * - Endereço: +15 pontos
 * - Data de nascimento: +15 pontos
 * - Profissão: +10 pontos
 * - Vulgo: +5 pontos
 * - Role: +5 pontos
 * - Conexões: +1 ponto por conexão
 * 
 * A entidade com MAIOR score se torna a "mestre".
 */

import React, { useState, useCallback, useEffect } from 'react';
import { 
    Users, Search, Merge, AlertTriangle, Check, X, 
    Loader2, ChevronDown, ChevronUp, Link2, FolderOpen, Info,
    HelpCircle, Trophy, Crown, Scale
} from 'lucide-react';

// ============================================================================
// SCORING SYSTEM CONSTANTS
// ============================================================================

const SCORE_WEIGHTS = {
    cpf: { points: 100, label: 'CPF válido', description: 'Identificador único nacional' },
    cnpj: { points: 100, label: 'CNPJ válido', description: 'Identificador único de empresa' },
    chassi: { points: 100, label: 'Chassi', description: 'Identificador único de veículo' },
    placa: { points: 50, label: 'Placa', description: 'Identificador do veículo' },
    rg: { points: 50, label: 'RG', description: 'Documento de identidade' },
    telefone: { points: 30, label: 'Telefone', description: 'Contato para investigação' },
    mae: { points: 20, label: 'Nome da mãe', description: 'Filiação materna' },
    pai: { points: 20, label: 'Nome do pai', description: 'Filiação paterna' },
    endereco: { points: 15, label: 'Endereço', description: 'Localização' },
    data_nascimento: { points: 15, label: 'Data de nascimento', description: 'Identificação' },
    profissao: { points: 10, label: 'Profissão', description: 'Ocupação' },
    vulgo: { points: 5, label: 'Vulgo/Apelido', description: 'Nome conhecido' },
    role: { points: 5, label: 'Papel no caso', description: 'Autor/Vítima/Testemunha' },
    conexao: { points: 1, label: 'Conexão', description: 'Relacionamento com outra entidade' },
};

/**
 * Calculate completeness score for an entity
 */
function calculateScore(metadata: Record<string, any> | undefined, connections: number = 0): number {
    if (!metadata) return connections;
    
    let score = connections; // +1 per connection
    
    // Check each field
    if (metadata.cpf && String(metadata.cpf).replace(/\D/g, '').length >= 11) score += SCORE_WEIGHTS.cpf.points;
    if (metadata.cnpj && String(metadata.cnpj).replace(/\D/g, '').length >= 14) score += SCORE_WEIGHTS.cnpj.points;
    if (metadata.chassi) score += SCORE_WEIGHTS.chassi.points;
    if (metadata.placa) score += SCORE_WEIGHTS.placa.points;
    if (metadata.rg) score += SCORE_WEIGHTS.rg.points;
    if (metadata.telefone && metadata.telefone !== 'XXXX') score += SCORE_WEIGHTS.telefone.points;
    if (metadata.mae || metadata.nome_mae) score += SCORE_WEIGHTS.mae.points;
    if (metadata.pai || metadata.nome_pai) score += SCORE_WEIGHTS.pai.points;
    if (metadata.endereco) score += SCORE_WEIGHTS.endereco.points;
    if (metadata.data_nascimento) score += SCORE_WEIGHTS.data_nascimento.points;
    if (metadata.profissao || metadata.ocupacao) score += SCORE_WEIGHTS.profissao.points;
    if (metadata.vulgo) score += SCORE_WEIGHTS.vulgo.points;
    if (metadata.role) score += SCORE_WEIGHTS.role.points;
    
    return score;
}

/**
 * Get score breakdown for display
 */
function getScoreBreakdown(metadata: Record<string, any> | undefined, connections: number = 0): Array<{ field: string; points: number; label: string }> {
    const breakdown: Array<{ field: string; points: number; label: string }> = [];
    
    if (!metadata) {
        if (connections > 0) breakdown.push({ field: 'conexoes', points: connections, label: `${connections} conexões` });
        return breakdown;
    }
    
    if (metadata.cpf && String(metadata.cpf).replace(/\D/g, '').length >= 11) 
        breakdown.push({ field: 'cpf', points: SCORE_WEIGHTS.cpf.points, label: 'CPF válido' });
    if (metadata.cnpj && String(metadata.cnpj).replace(/\D/g, '').length >= 14) 
        breakdown.push({ field: 'cnpj', points: SCORE_WEIGHTS.cnpj.points, label: 'CNPJ válido' });
    if (metadata.chassi) 
        breakdown.push({ field: 'chassi', points: SCORE_WEIGHTS.chassi.points, label: 'Chassi' });
    if (metadata.placa) 
        breakdown.push({ field: 'placa', points: SCORE_WEIGHTS.placa.points, label: 'Placa' });
    if (metadata.rg) 
        breakdown.push({ field: 'rg', points: SCORE_WEIGHTS.rg.points, label: 'RG' });
    if (metadata.telefone && metadata.telefone !== 'XXXX') 
        breakdown.push({ field: 'telefone', points: SCORE_WEIGHTS.telefone.points, label: 'Telefone' });
    if (metadata.mae || metadata.nome_mae) 
        breakdown.push({ field: 'mae', points: SCORE_WEIGHTS.mae.points, label: 'Nome da mãe' });
    if (metadata.pai || metadata.nome_pai) 
        breakdown.push({ field: 'pai', points: SCORE_WEIGHTS.pai.points, label: 'Nome do pai' });
    if (metadata.endereco) 
        breakdown.push({ field: 'endereco', points: SCORE_WEIGHTS.endereco.points, label: 'Endereço' });
    if (metadata.data_nascimento) 
        breakdown.push({ field: 'data_nascimento', points: SCORE_WEIGHTS.data_nascimento.points, label: 'Data nasc.' });
    if (metadata.profissao || metadata.ocupacao) 
        breakdown.push({ field: 'profissao', points: SCORE_WEIGHTS.profissao.points, label: 'Profissão' });
    if (metadata.vulgo) 
        breakdown.push({ field: 'vulgo', points: SCORE_WEIGHTS.vulgo.points, label: 'Vulgo' });
    if (metadata.role) 
        breakdown.push({ field: 'role', points: SCORE_WEIGHTS.role.points, label: 'Papel' });
    
    if (connections > 0) 
        breakdown.push({ field: 'conexoes', points: connections, label: `${connections} conexões` });
    
    return breakdown;
}

interface EntityInfo {
    id: string;
    name: string;
    type: string;
    investigation_id: string;
    investigation_title?: string;
    metadata?: Record<string, any>;
}

interface DuplicateCandidate {
    entity1: EntityInfo;
    entity2: EntityInfo;
    score: number;
    matchType: 'exact' | 'fuzzy' | 'phonetic' | 'partial';
    matchedFields: string[];
    confidence: 'high' | 'medium' | 'low';
}

interface ResolutionStats {
    totalEntities: number;
    totalMatches: number;
    highConfidence: number;
    mediumConfidence: number;
}

interface Investigation {
    id: string;
    title: string;
    status: string;
}

export default function EntityResolverTab() {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [candidates, setCandidates] = useState<DuplicateCandidate[]>([]);
    const [stats, setStats] = useState<ResolutionStats | null>(null);
    const [expandedPairs, setExpandedPairs] = useState<Set<string>>(new Set());
    const [mergedPairs, setMergedPairs] = useState<Set<string>>(new Set());
    const [error, setError] = useState<string | null>(null);
    const [showScoringHelp, setShowScoringHelp] = useState(false);
    const [isMerging, setIsMerging] = useState<string | null>(null);
    
    // Investigation filter
    const [investigations, setInvestigations] = useState<Investigation[]>([]);
    const [selectedInvestigation, setSelectedInvestigation] = useState<string>('all');
    const [loadingInvestigations, setLoadingInvestigations] = useState(false);
    
    // Load investigations on mount
    useEffect(() => {
        loadInvestigations();
    }, []);
    
    const loadInvestigations = async () => {
        setLoadingInvestigations(true);
        try {
            const response = await fetch('/api/central');
            if (response.ok) {
                const data = await response.json();
                const allInvs: Investigation[] = [];
                if (data.investigationsByUnit) {
                    Object.values(data.investigationsByUnit).forEach((unitInvs: any) => {
                        if (Array.isArray(unitInvs)) {
                            unitInvs.forEach((inv: any) => {
                                if (!allInvs.some(i => i.id === inv.id)) {
                                    allInvs.push({ id: inv.id, title: inv.title, status: inv.status });
                                }
                            });
                        }
                    });
                }
                setInvestigations(allInvs);
            }
        } catch (err) {
            console.error('Error loading investigations:', err);
        } finally {
            setLoadingInvestigations(false);
        }
    };

    const analyzeDuplicates = useCallback(async () => {
        setIsAnalyzing(true);
        setError(null);
        
        try {
            const response = await fetch('/api/entity-resolution', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    minScore: 0.7,
                    sameInvestigation: true,
                    limit: 100,
                    investigation_ids: selectedInvestigation !== 'all' ? [selectedInvestigation] : undefined
                })
            });
            
            if (!response.ok) {
                throw new Error('Erro ao analisar duplicatas');
            }
            
            const data = await response.json();
            setCandidates(data.candidates || []);
            setStats(data.stats || null);
        } catch (err: any) {
            setError(err.message || 'Erro desconhecido');
        } finally {
            setIsAnalyzing(false);
        }
    }, []);

    const handleMerge = async (candidate: DuplicateCandidate) => {
        const pairKey = `${candidate.entity1.id}-${candidate.entity2.id}`;
        setIsMerging(pairKey);
        setError(null);
        
        try {
            // Calculate scores to determine master
            const score1 = calculateScore(candidate.entity1.metadata, 0);
            const score2 = calculateScore(candidate.entity2.metadata, 0);
            
            // Master is the one with higher score
            const masterId = score1 >= score2 ? candidate.entity1.id : candidate.entity2.id;
            const duplicateId = score1 >= score2 ? candidate.entity2.id : candidate.entity1.id;
            
            const response = await fetch('/api/entities/merge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'merge',
                    source_id: duplicateId,      // Entity to be merged INTO master
                    target_id: masterId,         // Master entity
                    reason: `Merge manual: ${candidate.matchedFields.join(', ')} (score ${Math.max(score1, score2)} pts)`
                })
            });
            
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Erro ao fazer merge');
            }
            
            setMergedPairs(prev => new Set([...prev, pairKey]));
            // Remove from candidates
            setCandidates(prev => prev.filter(c => 
                `${c.entity1.id}-${c.entity2.id}` !== pairKey
            ));
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsMerging(null);
        }
    };

    const toggleExpand = (pairKey: string) => {
        setExpandedPairs(prev => {
            const next = new Set(prev);
            if (next.has(pairKey)) {
                next.delete(pairKey);
            } else {
                next.add(pairKey);
            }
            return next;
        });
    };

    const getConfidenceColor = (score: number) => {
        if (score >= 0.9) return 'text-green-400 bg-green-500/10';
        if (score >= 0.8) return 'text-yellow-400 bg-yellow-500/10';
        return 'text-orange-400 bg-orange-500/10';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Merge className="w-6 h-6 text-purple-400" />
                    Resolução de Entidades
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                    Detecta e funde entidades duplicadas automaticamente
                </p>
            </div>
            
            {/* Info about scoring system */}
            <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-xl overflow-hidden">
                <button
                    onClick={() => setShowScoringHelp(!showScoringHelp)}
                    className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <Scale className="w-5 h-5 text-purple-400" />
                        <div className="text-left">
                            <p className="text-white font-medium">Sistema de Pontuação de Completude</p>
                            <p className="text-xs text-slate-400">Clique para ver como escolhemos a entidade mestre</p>
                        </div>
                    </div>
                    <HelpCircle className={`w-5 h-5 text-purple-400 transition-transform ${showScoringHelp ? 'rotate-180' : ''}`} />
                </button>
                
                {showScoringHelp && (
                    <div className="px-4 pb-4 border-t border-purple-500/20">
                        <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-2">
                            {Object.entries(SCORE_WEIGHTS).map(([key, { points, label, description }]) => (
                                <div key={key} className="flex items-center justify-between p-2 bg-slate-800/50 rounded-lg">
                                    <div>
                                        <span className="text-xs text-slate-300">{label}</span>
                                        <p className="text-[10px] text-slate-500">{description}</p>
                                    </div>
                                    <span className="text-sm font-bold text-purple-400">+{points}</span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                            <p className="text-amber-200 text-xs">
                                <Crown className="w-4 h-4 inline mr-1 text-amber-400" />
                                <strong>Entidade Mestre:</strong> A entidade com <strong>maior pontuação</strong> se torna a mestre.
                                Os dados da entidade duplicada são mesclados na mestre, e os relacionamentos são redirecionados.
                            </p>
                        </div>
                        <div className="mt-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                            <p className="text-blue-200 text-xs">
                                <Info className="w-4 h-4 inline mr-1 text-blue-400" />
                                CPFs inválidos (XXXX, 0000, etc.) são ignorados. Apenas CPFs de 11+ dígitos são considerados identificadores mestres.
                            </p>
                        </div>
                    </div>
                )}
            </div>
            
            {/* Filter and Action */}
            <div className="flex items-center gap-4">
                {/* Operation Filter */}
                <div className="flex-1">
                    <label className="text-xs font-medium text-slate-400 mb-1 block">
                        <FolderOpen className="w-3 h-3 inline mr-1" />
                        Filtrar por Operação
                    </label>
                    <div className="relative">
                        <select
                            value={selectedInvestigation}
                            onChange={(e) => setSelectedInvestigation(e.target.value)}
                            disabled={loadingInvestigations}
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent [&>option]:bg-slate-800 [&>option]:text-white"
                        >
                            <option value="all" className="bg-slate-800 text-white">Todas as operações</option>
                            {investigations.map(inv => (
                                <option key={inv.id} value={inv.id} className="bg-slate-800 text-white">
                                    {inv.title}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    </div>
                </div>
                
                {/* Analyze Button */}
                <button
                    onClick={analyzeDuplicates}
                    disabled={isAnalyzing}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-600/50 text-white rounded-lg font-medium transition-colors mt-5"
                >
                    {isAnalyzing ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Analisando...
                        </>
                    ) : (
                        <>
                            <Search className="w-4 h-4" />
                            Detectar Duplicatas
                        </>
                    )}
                </button>
            </div>

            {/* Error */}
            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
                    <AlertTriangle className="w-4 h-4 inline mr-2" />
                    {error}
                </div>
            )}

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-4 gap-4">
                    <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-white">{stats.totalEntities}</div>
                        <div className="text-xs text-slate-400">Entidades</div>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-purple-400">{stats.totalMatches}</div>
                        <div className="text-xs text-slate-400">Duplicatas</div>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-green-400">{stats.highConfidence}</div>
                        <div className="text-xs text-slate-400">Alta Confiança</div>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-yellow-400">{stats.mediumConfidence}</div>
                        <div className="text-xs text-slate-400">Média Confiança</div>
                    </div>
                </div>
            )}

            {/* Results */}
            {candidates.length === 0 && stats && (
                <div className="text-center py-12 bg-slate-900/50 rounded-xl border border-slate-800">
                    <Check className="w-12 h-12 text-green-400 mx-auto mb-3" />
                    <p className="text-white font-medium">Nenhuma duplicata encontrada!</p>
                    <p className="text-sm text-slate-400 mt-1">Todas as entidades estão únicas</p>
                </div>
            )}

            {candidates.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-sm font-medium text-slate-400">
                        {candidates.length} pares de duplicatas encontrados
                    </h3>
                    
                    {candidates.map((candidate) => {
                        const pairKey = `${candidate.entity1.id}-${candidate.entity2.id}`;
                        const isExpanded = expandedPairs.has(pairKey);
                        const isMerged = mergedPairs.has(pairKey);
                        
                        if (isMerged) return null;
                        
                        return (
                            <div 
                                key={pairKey}
                                className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden"
                            >
                                {/* Header */}
                                <div 
                                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-800/50 transition-colors"
                                    onClick={() => toggleExpand(pairKey)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`px-2 py-1 rounded text-xs font-medium ${getConfidenceColor(candidate.score)}`}>
                                            {Math.round(candidate.score * 100)}%
                                        </div>
                                        
                                        <div className="flex items-center gap-2">
                                            <Users className="w-4 h-4 text-slate-400" />
                                            <span className="text-white font-medium">{candidate.entity1.name}</span>
                                            <Link2 className="w-4 h-4 text-purple-400" />
                                            <span className="text-white font-medium">{candidate.entity2.name}</span>
                                        </div>
                                        
                                        <span className="text-xs px-2 py-0.5 bg-slate-800 rounded text-slate-400">
                                            {candidate.entity1.type}
                                        </span>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-slate-500">{candidate.matchedFields.join(', ')}</span>
                                        {isExpanded ? (
                                            <ChevronUp className="w-4 h-4 text-slate-400" />
                                        ) : (
                                            <ChevronDown className="w-4 h-4 text-slate-400" />
                                        )}
                                    </div>
                                </div>
                                
                                {/* Expanded Details */}
                                {isExpanded && (() => {
                                    // Calculate scores to determine master
                                    const score1 = calculateScore(candidate.entity1.metadata, 0);
                                    const score2 = calculateScore(candidate.entity2.metadata, 0);
                                    const breakdown1 = getScoreBreakdown(candidate.entity1.metadata, 0);
                                    const breakdown2 = getScoreBreakdown(candidate.entity2.metadata, 0);
                                    const isMaster1 = score1 >= score2;
                                    
                                    return (
                                        <div className="px-4 pb-4 border-t border-slate-800">
                                            <div className="grid grid-cols-2 gap-4 mt-4">
                                                {/* Entity A */}
                                                <div className={`rounded-lg p-3 ${isMaster1 ? 'bg-green-500/10 border border-green-500/30' : 'bg-slate-800/50'}`}>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <h4 className="text-sm font-medium text-white flex items-center gap-2">
                                                            {isMaster1 && <Crown className="w-4 h-4 text-amber-400" />}
                                                            {isMaster1 ? 'Entidade Mestre' : 'Duplicada'}
                                                        </h4>
                                                        <span className={`text-lg font-bold ${isMaster1 ? 'text-green-400' : 'text-slate-400'}`}>
                                                            {score1} pts
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-slate-400 space-y-1">
                                                        <p><strong>Nome:</strong> {candidate.entity1.name}</p>
                                                        <p><strong>Tipo:</strong> {candidate.entity1.type}</p>
                                                        {candidate.entity1.metadata?.cpf && (
                                                            <p><strong>CPF:</strong> {String(candidate.entity1.metadata.cpf || '')}</p>
                                                        )}
                                                        <p><strong>Operação:</strong> {candidate.entity1.investigation_title || 'N/A'}</p>
                                                    </div>
                                                    {/* Score breakdown */}
                                                    <div className="mt-2 flex flex-wrap gap-1">
                                                        {breakdown1.map((item, idx) => (
                                                            <span key={idx} className="text-[10px] px-1.5 py-0.5 bg-slate-700 rounded text-slate-300">
                                                                {item.label}: +{item.points}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                                
                                                {/* Entity B */}
                                                <div className={`rounded-lg p-3 ${!isMaster1 ? 'bg-green-500/10 border border-green-500/30' : 'bg-slate-800/50'}`}>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <h4 className="text-sm font-medium text-white flex items-center gap-2">
                                                            {!isMaster1 && <Crown className="w-4 h-4 text-amber-400" />}
                                                            {!isMaster1 ? 'Entidade Mestre' : 'Duplicada'}
                                                        </h4>
                                                        <span className={`text-lg font-bold ${!isMaster1 ? 'text-green-400' : 'text-slate-400'}`}>
                                                            {score2} pts
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-slate-400 space-y-1">
                                                        <p><strong>Nome:</strong> {candidate.entity2.name}</p>
                                                        <p><strong>Tipo:</strong> {candidate.entity2.type}</p>
                                                        {candidate.entity2.metadata?.cpf && (
                                                            <p><strong>CPF:</strong> {String(candidate.entity2.metadata.cpf || '')}</p>
                                                        )}
                                                        <p><strong>Operação:</strong> {candidate.entity2.investigation_title || 'N/A'}</p>
                                                    </div>
                                                    {/* Score breakdown */}
                                                    <div className="mt-2 flex flex-wrap gap-1">
                                                        {breakdown2.map((item, idx) => (
                                                            <span key={idx} className="text-[10px] px-1.5 py-0.5 bg-slate-700 rounded text-slate-300">
                                                                {item.label}: +{item.points}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* Merge explanation */}
                                            <div className="mt-3 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                                                <p className="text-xs text-amber-200">
                                                    <strong>Ao fundir:</strong> Os dados de "{isMaster1 ? candidate.entity2.name : candidate.entity1.name}" 
                                                    serão mesclados em "{isMaster1 ? candidate.entity1.name : candidate.entity2.name}" (mestre).
                                                    Todos os relacionamentos serão redirecionados.
                                                </p>
                                            </div>
                                            
                                            {/* Actions */}
                                            <div className="flex justify-end gap-2 mt-4">
                                                <button
                                                    onClick={() => toggleExpand(pairKey)}
                                                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-slate-400 hover:text-white transition-colors"
                                                >
                                                    <X className="w-4 h-4" />
                                                    Ignorar
                                                </button>
                                                <button
                                                    onClick={() => handleMerge(candidate)}
                                                    disabled={isMerging === pairKey}
                                                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-purple-600 hover:bg-purple-500 disabled:bg-purple-600/50 text-white rounded-lg transition-colors"
                                                >
                                                    {isMerging === pairKey ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <Merge className="w-4 h-4" />
                                                    )}
                                                    Fundir Entidades
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Initial State */}
            {!stats && !isAnalyzing && (
                <div className="text-center py-16 bg-slate-900/50 rounded-xl border border-slate-800">
                    <Merge className="w-16 h-16 text-purple-400/50 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">Resolução de Entidades</h3>
                    <p className="text-slate-400 max-w-md mx-auto mb-6">
                        Analise as entidades para encontrar duplicatas (mesmo CPF, nome similar, etc.) 
                        e funda-as de forma segura. Selecione uma operação específica ou analise todas.
                    </p>
                    <button
                        onClick={analyzeDuplicates}
                        className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-colors"
                    >
                        Iniciar Análise
                    </button>
                </div>
            )}
        </div>
    );
}
