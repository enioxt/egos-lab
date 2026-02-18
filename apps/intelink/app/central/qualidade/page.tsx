'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { 
    AlertTriangle, CheckCircle, Clock,
    FileText, MapPin, Users, Trophy, Star, Zap,
    RefreshCw, Filter, Scan, ShieldAlert, Phone, User,
    CalendarClock, AlertCircle, Sparkles, Brain
} from 'lucide-react';
import Link from 'next/link';
import { useRole, RoleLoading, AccessDenied } from '@/hooks/useRole';
import { PageHeaderCompact } from '@/components/shared/PageHeader';
import { useToast } from '@/components/intelink/Toast';
import {
    DataJob,
    UserPoints,
    JOB_TYPES,
    PRIORITY_COLORS,
    MAX_ASSIGNED_TASKS
} from '@/components/qualidade';

interface ScanResult {
    type: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    entityId: string;
    entityName: string;
    investigationId: string;
    investigationTitle?: string;
    description: string;
    suggestion?: string;
    relatedEntityName?: string;
}

export default function QualidadePage() {
    const permissions = useRole();
    const { showToast } = useToast();
    const [jobs, setJobs] = useState<DataJob[]>([]);
    const [myTasks, setMyTasks] = useState<DataJob[]>([]);
    const [leaderboard, setLeaderboard] = useState<UserPoints[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('open');
    const [stats, setStats] = useState({ open: 0, inProgress: 0, completed: 0 });
    
    // Scanner state
    const [scanResults, setScanResults] = useState<ScanResult[]>([]);
    const [scanning, setScanning] = useState(false);
    const [scanSummary, setScanSummary] = useState<any>(null);
    const [showScan, setShowScan] = useState(false);
    
    // Claim modal state
    const [claimingJob, setClaimingJob] = useState<DataJob | null>(null);
    const [selectedDays, setSelectedDays] = useState(3);
    const [aiAnalyzing, setAiAnalyzing] = useState(false);
    const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, [filter]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Carregar jobs disponíveis
            const res = await fetch(`/api/jobs?status=${filter}`);
            if (res.ok) {
                const data = await res.json();
                setJobs(data.jobs || []);
                setStats({
                    open: data.stats?.open || 0,
                    inProgress: data.stats?.in_progress || 0,
                    completed: data.stats?.completed || 0,
                });
            }
            
            // Carregar minhas tarefas (assigned to me)
            const myRes = await fetch('/api/jobs?status=my_tasks');
            if (myRes.ok) {
                const myData = await myRes.json();
                setMyTasks(myData.jobs || []);
            }
            
            setLeaderboard([]);
        } catch (e) {
            console.error('Error loading data:', e);
        } finally {
            setLoading(false);
        }
    };

    const runScan = async () => {
        setScanning(true);
        try {
            const res = await fetch('/api/jobs/scan', { method: 'POST' });
            if (res.ok) {
                const data = await res.json();
                setScanResults(data.issues || []);
                setScanSummary(data.summary);
                setShowScan(true);
            }
        } catch (e) {
            console.error('Error running scan:', e);
        } finally {
            setScanning(false);
        }
    };

    // Abrir modal para pegar tarefa
    const openClaimModal = (job: DataJob) => {
        // Verificar limite de tarefas
        if (myTasks.length >= MAX_ASSIGNED_TASKS) {
            showToast('warning', 'Limite atingido', `Você já tem ${MAX_ASSIGNED_TASKS} tarefas em andamento. Conclua uma antes de pegar outra.`);
            return;
        }
        setClaimingJob(job);
        setSelectedDays(3);
        setAiSuggestion(null);
    };
    
    // Confirmar claim com deadline
    const confirmClaim = async () => {
        if (!claimingJob) return;
        
        const deadlineAt = new Date();
        deadlineAt.setDate(deadlineAt.getDate() + selectedDays);
        
        try {
            await fetch('/api/jobs', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    id: claimingJob.id, 
                    status: 'in_progress',
                    deadline_days: selectedDays,
                    deadline_at: deadlineAt.toISOString()
                })
            });
            setClaimingJob(null);
            loadData();
        } catch (e) {
            console.error('Error claiming job:', e);
        }
    };
    
    // Analisar com IA
    const analyzeWithAI = async () => {
        if (!claimingJob) return;
        
        setAiAnalyzing(true);
        try {
            const res = await fetch('/api/jobs/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    jobId: claimingJob.id,
                    jobType: claimingJob.job_type,
                    entityName: claimingJob.entity_name,
                    description: claimingJob.description,
                    originalValue: claimingJob.original_value
                })
            });
            
            if (res.ok) {
                const data = await res.json();
                setAiSuggestion(data.suggestion || 'Sem sugestão disponível.');
            }
        } catch (e) {
            console.error('Error analyzing with AI:', e);
            setAiSuggestion('Erro ao analisar. Tente novamente.');
        } finally {
            setAiAnalyzing(false);
        }
    };

    const completeJob = async (jobId: string, notes: string, appliedValue: string) => {
        try {
            await fetch('/api/jobs', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    id: jobId, 
                    status: 'completed',
                    resolution_notes: notes || 'Tarefa concluída pelo usuário',
                    applied_value: appliedValue
                })
            });
            loadData();
        } catch (e) {
            console.error('Error completing job:', e);
        }
    };

    // RBAC: Wait for permissions to load
    if (permissions.isLoading) return <RoleLoading />;
    if (!permissions.canViewInvestigations) return <AccessDenied />;

    return (
        <div className="w-full px-4 md:px-6 py-6">
            {/* Page Header */}
            <PageHeaderCompact
                title="Qualidade de Dados"
                subtitle="Tarefas de correção e validação de dados"
                icon={Zap}
                iconColor="text-amber-400"
                actions={
                    <button 
                        onClick={() => { runScan(); loadData(); }}
                        disabled={scanning || loading}
                        className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg transition-colors disabled:opacity-50"
                        title="Escanear problemas e atualizar lista"
                    >
                        {scanning || loading ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                            <Scan className="w-4 h-4" />
                        )}
                        {scanning ? 'Escaneando...' : loading ? 'Atualizando...' : 'Escanear'}
                    </button>
                }
            />

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <StatCard 
                    label="Abertas" 
                    value={stats.open} 
                    icon={<Clock className="w-5 h-5" />}
                    color="yellow"
                    onClick={() => setFilter('open')}
                    active={filter === 'open'}
                />
                <StatCard 
                    label="Em Progresso" 
                    value={stats.inProgress} 
                    icon={<RefreshCw className="w-5 h-5" />}
                    color="blue"
                    onClick={() => setFilter('in_progress')}
                    active={filter === 'in_progress'}
                />
                <StatCard 
                    label="Concluídas" 
                    value={stats.completed} 
                    icon={<CheckCircle className="w-5 h-5" />}
                    color="green"
                    onClick={() => setFilter('completed')}
                    active={filter === 'completed'}
                />
                <StatCard 
                    label="Total Pontos" 
                    value={leaderboard.reduce((acc, u) => acc + u.total_points, 0)} 
                    icon={<Star className="w-5 h-5" />}
                    color="amber"
                    onClick={() => setFilter('all')}
                    active={filter === 'all'}
                />
            </div>

            {/* Minhas Tarefas - Dashboard do Usuário */}
            {myTasks.length > 0 && (
                <div className="mb-8 bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border border-blue-500/30 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-blue-400 flex items-center gap-2">
                            <CalendarClock className="w-5 h-5" />
                            Minhas Tarefas ({myTasks.length}/{MAX_ASSIGNED_TASKS})
                        </h2>
                        <span className="text-xs text-slate-400">
                            Máximo: {MAX_ASSIGNED_TASKS} tarefas simultâneas
                        </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {myTasks.map(task => {
                            const isOverdue = task.deadline_at && new Date(task.deadline_at) < new Date();
                            const daysRemaining = task.deadline_at 
                                ? Math.ceil((new Date(task.deadline_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                                : null;
                            
                            return (
                                <div 
                                    key={task.id}
                                    className={`p-4 rounded-lg border ${
                                        isOverdue 
                                            ? 'bg-red-500/10 border-red-500/40' 
                                            : 'bg-slate-800/50 border-slate-700'
                                    }`}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <span className={`px-2 py-0.5 rounded text-xs ${
                                            JOB_TYPES[task.job_type]?.color === 'yellow' ? 'bg-yellow-500/20 text-yellow-400' :
                                            JOB_TYPES[task.job_type]?.color === 'orange' ? 'bg-orange-500/20 text-orange-400' :
                                            JOB_TYPES[task.job_type]?.color === 'blue' ? 'bg-blue-500/20 text-blue-400' :
                                            JOB_TYPES[task.job_type]?.color === 'green' ? 'bg-green-500/20 text-green-400' :
                                            'bg-slate-500/20 text-slate-400'
                                        }`}>
                                            {JOB_TYPES[task.job_type]?.label || task.job_type}
                                        </span>
                                        {isOverdue && (
                                            <span className="flex items-center gap-1 text-xs text-red-400">
                                                <AlertCircle className="w-3 h-3" />
                                                ATRASADA
                                            </span>
                                        )}
                                    </div>
                                    
                                    <p className="font-semibold text-white text-sm mb-1">{task.entity_name}</p>
                                    <p className="text-xs text-slate-400 line-clamp-2 mb-3">{task.description}</p>
                                    
                                    {/* Prazo */}
                                    <div className={`flex items-center gap-2 text-xs ${
                                        isOverdue ? 'text-red-400' : 
                                        daysRemaining !== null && daysRemaining <= 1 ? 'text-yellow-400' : 
                                        'text-slate-500'
                                    }`}>
                                        <Clock className="w-3 h-3" />
                                        {isOverdue ? (
                                            `Atrasada há ${Math.abs(daysRemaining || 0)} dia(s)`
                                        ) : daysRemaining !== null ? (
                                            daysRemaining === 0 ? 'Vence hoje!' :
                                            daysRemaining === 1 ? 'Vence amanhã' :
                                            `${daysRemaining} dias restantes`
                                        ) : (
                                            'Sem prazo definido'
                                        )}
                                    </div>
                                    
                                    {/* Ações */}
                                    <div className="flex gap-2 mt-3">
                                        <button
                                            onClick={() => completeJob(task.id, '', '')}
                                            className="flex-1 px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded text-xs hover:bg-emerald-500/30 transition-colors"
                                        >
                                            Concluir
                                        </button>
                                        <Link
                                            href={`/investigation/${task.investigation_id || ''}`}
                                            className="px-3 py-1.5 bg-slate-700 text-slate-300 rounded text-xs hover:bg-slate-600 transition-colors"
                                        >
                                            Ver
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Scan Results Panel */}
            {showScan && scanResults.length > 0 && (
                <div className="mb-8 bg-slate-900 border border-amber-500/30 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-amber-400 flex items-center gap-2">
                            <ShieldAlert className="w-5 h-5" />
                            Problemas Detectados ({scanResults.length})
                        </h2>
                        <button 
                            onClick={() => setShowScan(false)}
                            className="text-slate-400 hover:text-white text-sm"
                        >
                            Fechar
                        </button>
                    </div>
                    
                    {scanSummary && (
                        <div className="flex gap-4 mb-4 text-sm">
                            <span className="text-red-400">🔴 Críticos: {scanSummary.critical}</span>
                            <span className="text-orange-400">🟠 Altos: {scanSummary.high}</span>
                            <span className="text-yellow-400">🟡 Médios: {scanSummary.medium}</span>
                            <span className="text-slate-400">⚪ Baixos: {scanSummary.low}</span>
                        </div>
                    )}
                    
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {scanResults.map((issue, idx) => (
                            <div 
                                key={idx}
                                className={`p-4 rounded-lg border ${
                                    issue.severity === 'critical' ? 'bg-red-500/10 border-red-500/30' :
                                    issue.severity === 'high' ? 'bg-orange-500/10 border-orange-500/30' :
                                    issue.severity === 'medium' ? 'bg-yellow-500/10 border-yellow-500/30' :
                                    'bg-slate-800/50 border-slate-700'
                                }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="font-semibold text-white flex items-center gap-2">
                                            {issue.type === 'cpf_duplicate' && <User className="w-4 h-4 text-red-400" />}
                                            {issue.type === 'cpf_invalid' && <ShieldAlert className="w-4 h-4 text-orange-400" />}
                                            {issue.type === 'phone_duplicate' && <Phone className="w-4 h-4 text-yellow-400" />}
                                            {issue.entityName}
                                        </p>
                                        <p className="text-sm text-slate-300 mt-1">{issue.description}</p>
                                        {issue.suggestion && (
                                            <p className="text-xs text-emerald-400 mt-2">💡 {issue.suggestion}</p>
                                        )}
                                        {issue.relatedEntityName && (
                                            <p className="text-xs text-slate-400 mt-1">
                                                Relacionado com: {issue.relatedEntityName}
                                            </p>
                                        )}
                                    </div>
                                    <Link
                                        href={`/investigation/${issue.investigationId}`}
                                        className="text-xs text-blue-400 hover:text-blue-300 whitespace-nowrap"
                                    >
                                        {issue.investigationTitle || 'Ver operação'}
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Jobs List */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold flex items-center gap-2 text-white">
                            <AlertTriangle className="w-5 h-5 text-amber-400" />
                            Tarefas Disponíveis
                        </h2>
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-slate-500" />
                            <select 
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white"
                            >
                                <option value="open">Abertas</option>
                                <option value="in_progress">Em Progresso</option>
                                <option value="completed">Concluídas</option>
                                <option value="all">Todas</option>
                            </select>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : jobs.length === 0 ? (
                        <div className="bg-slate-800/50 rounded-xl p-12 text-center border border-slate-700">
                            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-white mb-2">Tudo em ordem!</h3>
                            <p className="text-slate-400">Não há tarefas pendentes no momento.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {jobs.map(job => (
                                <JobCard 
                                    key={job.id} 
                                    job={job} 
                                    onClaim={() => openClaimModal(job)}
                                    onComplete={(notes, appliedValue) => completeJob(job.id, notes, appliedValue)}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Leaderboard */}
                <div className="space-y-4">
                    <div className="bg-slate-800/50 rounded-xl border border-slate-700">
                        <div className="px-6 py-4 border-b border-slate-700/50">
                            <h2 className="font-semibold flex items-center gap-2 text-white">
                                <Trophy className="w-5 h-5 text-amber-400" />
                                Ranking de Contribuição
                            </h2>
                        </div>
                        <div className="p-4">
                            {leaderboard.length === 0 ? (
                                <p className="text-slate-500 text-center py-8">
                                    Nenhuma contribuição ainda
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {leaderboard.map((user, index) => (
                                        <div 
                                            key={user.id}
                                            className={`flex items-center gap-3 p-3 rounded-lg ${
                                                index === 0 ? 'bg-amber-500/10 border border-amber-500/30' :
                                                index === 1 ? 'bg-slate-500/10 border border-slate-500/30' :
                                                index === 2 ? 'bg-orange-500/10 border border-orange-500/30' :
                                                'bg-slate-800/50'
                                            }`}
                                        >
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                                                index === 0 ? 'bg-amber-500 text-black' :
                                                index === 1 ? 'bg-slate-400 text-black' :
                                                index === 2 ? 'bg-orange-600 text-white' :
                                                'bg-slate-700 text-slate-300'
                                            }`}>
                                                {index + 1}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-white">{user.username || 'Anônimo'}</p>
                                                <p className="text-xs text-slate-400">{user.rank}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-amber-400">{user.total_points}</p>
                                                <p className="text-xs text-slate-500">pontos</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Ranks Info */}
                    <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
                        <h3 className="font-semibold mb-3 text-sm text-slate-400">PATENTES</h3>
                        <div className="space-y-2 text-sm text-slate-300">
                            <div className="flex justify-between"><span>Delegado Digital</span><span className="text-slate-500">10.000+</span></div>
                            <div className="flex justify-between"><span>Inspetor de Dados</span><span className="text-slate-500">5.000+</span></div>
                            <div className="flex justify-between"><span>Agente Sênior</span><span className="text-slate-500">2.000+</span></div>
                            <div className="flex justify-between"><span>Agente</span><span className="text-slate-500">1.000+</span></div>
                            <div className="flex justify-between"><span>Detetive</span><span className="text-slate-500">500+</span></div>
                            <div className="flex justify-between"><span>Investigador</span><span className="text-slate-500">100+</span></div>
                            <div className="flex justify-between"><span>Recruta</span><span className="text-slate-500">0+</span></div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Modal de Claim com Definição de Prazo */}
            {claimingJob && (
                <div 
                    className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
                    onClick={(e) => e.target === e.currentTarget && setClaimingJob(null)}
                >
                    <div className="bg-slate-800 rounded-2xl w-full max-w-lg overflow-hidden">
                        {/* Header */}
                        <div className="p-6 border-b border-slate-700">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <CalendarClock className="w-5 h-5 text-blue-400" />
                                Pegar Tarefa
                            </h3>
                            <p className="text-sm text-slate-400 mt-1">
                                Defina o prazo para conclusão desta tarefa
                            </p>
                        </div>
                        
                        {/* Content */}
                        <div className="p-6 space-y-4">
                            {/* Detalhes da tarefa */}
                            <div className="p-4 bg-slate-900 rounded-lg">
                                <p className="font-semibold text-white mb-1">{claimingJob.entity_name}</p>
                                <p className="text-sm text-slate-400">{claimingJob.description}</p>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded text-xs">
                                        {JOB_TYPES[claimingJob.job_type]?.label || claimingJob.job_type}
                                    </span>
                                    <span className="text-xs text-slate-500">
                                        +{claimingJob.points_reward || 10} pontos
                                    </span>
                                </div>
                            </div>
                            
                            {/* Seleção de prazo */}
                            <div>
                                <label className="text-sm text-slate-300 mb-2 block">
                                    Prazo para conclusão:
                                </label>
                                <div className="grid grid-cols-4 gap-2">
                                    {[1, 2, 3, 7].map(days => (
                                        <button
                                            key={days}
                                            onClick={() => setSelectedDays(days)}
                                            className={`p-3 rounded-lg text-center transition-colors ${
                                                selectedDays === days
                                                    ? 'bg-blue-500 text-white'
                                                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                            }`}
                                        >
                                            <span className="text-lg font-bold">{days}</span>
                                            <span className="text-xs block">{days === 1 ? 'dia' : 'dias'}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            {/* Análise IA */}
                            <div className="border-t border-slate-700 pt-4">
                                <button
                                    onClick={analyzeWithAI}
                                    disabled={aiAnalyzing}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    {aiAnalyzing ? (
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Brain className="w-4 h-4" />
                                    )}
                                    {aiAnalyzing ? 'Analisando...' : 'Analisar com IA'}
                                </button>
                                
                                {aiSuggestion && (
                                    <div className="mt-3 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                                        <p className="text-sm text-purple-300 flex items-start gap-2">
                                            <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                            {aiSuggestion}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="p-6 border-t border-slate-700 flex gap-3">
                            <button
                                onClick={() => setClaimingJob(null)}
                                className="flex-1 px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmClaim}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
                            >
                                Pegar Tarefa ({selectedDays} {selectedDays === 1 ? 'dia' : 'dias'})
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatCard({ label, value, icon, color, onClick, active }: {
    label: string;
    value: number;
    icon: React.ReactNode;
    color: string;
    onClick: () => void;
    active: boolean;
}) {
    const colors: Record<string, string> = {
        yellow: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
        blue: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
        green: 'bg-green-500/10 border-green-500/30 text-green-400',
        amber: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    };

    return (
        <button 
            onClick={onClick}
            className={`p-4 rounded-xl border transition-all ${colors[color]} ${
                active ? 'ring-2 ring-offset-2 ring-offset-slate-950 ring-white/20' : 'hover:scale-105'
            }`}
        >
            <div className="flex items-center justify-between mb-2">
                {icon}
                <span className="text-2xl font-bold">{value}</span>
            </div>
            <p className="text-sm opacity-80">{label}</p>
        </button>
    );
}

function JobCard({ job, onClaim, onComplete }: { 
    job: DataJob; 
    onClaim: () => void;
    onComplete: (notes: string, appliedValue: string) => void;
}) {
    const [expanded, setExpanded] = React.useState(false);
    const [appliedValue, setAppliedValue] = React.useState(job.suggested_value || '');
    const [notes, setNotes] = React.useState('');
    const [confirming, setConfirming] = React.useState(false);
    
    const typeInfo = JOB_TYPES[job.job_type] || JOB_TYPES['data_validation'];

    const handleComplete = () => {
        if (!confirming) {
            setConfirming(true);
            return;
        }
        onComplete(notes, appliedValue);
        setConfirming(false);
        setExpanded(false);
    };

    return (
        <div className={`bg-slate-800/50 rounded-xl border transition-all ${
            expanded ? 'border-amber-500/50 ring-1 ring-amber-500/20' : 'border-slate-700/50 hover:border-slate-600'
        }`}>
            {/* Header */}
            <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-${typeInfo.color}-500/20 text-${typeInfo.color}-400`}>
                            {typeInfo.icon}
                        </div>
                        <div>
                            <h3 className="font-semibold text-white">{job.title}</h3>
                            <p className="text-sm text-slate-400">{typeInfo.label}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs border ${PRIORITY_COLORS[job.priority]}`}>
                            {job.priority.toUpperCase()}
                        </span>
                        <span className="flex items-center gap-1 text-amber-400 text-sm">
                            <Star className="w-3 h-3" />
                            +{job.points_reward}
                        </span>
                    </div>
                </div>

                {job.entity_name && (
                    <p className="text-sm text-slate-400 mb-2">
                        Entidade: <span className="text-white">{job.entity_name}</span>
                    </p>
                )}

                {job.description && (
                    <p className="text-sm text-slate-500 mb-3">{job.description}</p>
                )}

                {job.ai_suggestion && (
                    <div className="bg-slate-900/50 rounded-lg p-3 mb-3">
                        <p className="text-xs text-slate-500 mb-1">Sugestão da IA ({Math.round((job.ai_confidence || 0) * 100)}% confiança):</p>
                        <p className="text-sm text-emerald-400">{job.ai_suggestion}</p>
                    </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-slate-700/50">
                    <span className="text-xs text-slate-500">
                        {new Date(job.created_at).toLocaleDateString('pt-BR')}
                    </span>
                    
                    {job.status === 'open' && (
                        <button 
                            onClick={onClaim}
                            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black rounded-lg text-sm font-medium transition-colors"
                        >
                            Pegar Tarefa
                        </button>
                    )}
                    {job.status === 'in_progress' && !expanded && (
                        <button 
                            onClick={() => setExpanded(true)}
                            className="px-4 py-1.5 bg-blue-500 hover:bg-blue-400 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                            Executar Tarefa
                        </button>
                    )}
                    {job.status === 'completed' && (
                        <span className="flex items-center gap-1 text-green-400 text-sm">
                            <CheckCircle className="w-4 h-4" />
                            Concluída
                        </span>
                    )}
                </div>
            </div>

            {/* Expanded Work Area */}
            {expanded && job.status === 'in_progress' && (
                <div className="border-t border-slate-700/50 p-4 bg-slate-900/30 space-y-4">
                    <h4 className="font-medium text-amber-400 text-sm flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        Área de Trabalho
                    </h4>
                    
                    {/* Before/After */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-slate-500 block mb-1">Valor Original</label>
                            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-300">
                                {job.original_value || 'N/A'}
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 block mb-1">Valor Corrigido</label>
                            <input
                                type="text"
                                value={appliedValue}
                                onChange={(e) => setAppliedValue(e.target.value)}
                                className="w-full bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-sm text-green-300 focus:outline-none focus:border-green-500"
                                placeholder="Digite o valor corrigido..."
                            />
                        </div>
                    </div>
                    
                    {/* Notes */}
                    <div>
                        <label className="text-xs text-slate-500 block mb-1">Observações (opcional)</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={2}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-amber-500 resize-none"
                            placeholder="Adicione observações sobre a correção..."
                        />
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2">
                        <button
                            onClick={() => { setExpanded(false); setConfirming(false); }}
                            className="px-4 py-2 text-slate-400 hover:text-white text-sm transition-colors"
                        >
                            Cancelar
                        </button>
                        
                        <div className="flex items-center gap-2">
                            {confirming && (
                                <span className="text-amber-400 text-sm animate-pulse mr-2">
                                    Confirma a correção?
                                </span>
                            )}
                            <button 
                                onClick={handleComplete}
                                className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                                    confirming 
                                        ? 'bg-green-500 hover:bg-green-400 text-black' 
                                        : 'bg-amber-500 hover:bg-amber-400 text-black'
                                }`}
                            >
                                <CheckCircle className="w-4 h-4" />
                                {confirming ? 'Confirmar' : 'Concluir Tarefa'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
