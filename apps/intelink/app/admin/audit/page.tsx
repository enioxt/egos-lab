'use client';

import React, { useEffect, useState } from 'react';
import { 
    Shield, Clock, User, FileText, Link2, CheckCircle, XCircle,
    RefreshCw, Filter, Search, Calendar, ChevronDown, ChevronUp,
    AlertTriangle, Activity
} from 'lucide-react';
import Link from 'next/link';
import { useRole, AccessDenied, RoleLoading } from '@/hooks/useRole';

interface AuditLog {
    id: string;
    action: string;
    actor_id: string;
    actor_name: string;
    actor_role: string;
    target_type?: string;
    target_id?: string;
    target_name?: string;
    details?: Record<string, any>;
    ip_address?: string;
    created_at: string;
}

const ACTION_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
    'login': { label: 'Login', icon: User, color: 'text-green-400 bg-green-500/10' },
    'logout': { label: 'Logout', icon: User, color: 'text-slate-400 bg-slate-500/10' },
    'role_change': { label: 'Mudança de Cargo', icon: Shield, color: 'text-amber-400 bg-amber-500/10' },
    'investigation_create': { label: 'Operação Criada', icon: FileText, color: 'text-blue-400 bg-blue-500/10' },
    'investigation_delete': { label: 'Operação Excluída', icon: FileText, color: 'text-red-400 bg-red-500/10' },
    'entity_create': { label: 'Entidade Criada', icon: User, color: 'text-cyan-400 bg-cyan-500/10' },
    'link_confirm': { label: 'Vínculo Confirmado', icon: CheckCircle, color: 'text-emerald-400 bg-emerald-500/10' },
    'link_reject': { label: 'Vínculo Rejeitado', icon: XCircle, color: 'text-red-400 bg-red-500/10' },
    'document_upload': { label: 'Documento Enviado', icon: FileText, color: 'text-purple-400 bg-purple-500/10' },
};

export default function AuditDashboardPage() {
    const permissions = useRole();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Filtros
    const [actionFilter, setActionFilter] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    
    // Estatísticas
    const [stats, setStats] = useState({
        total: 0,
        today: 0,
        byAction: {} as Record<string, number>
    });

    useEffect(() => {
        if (!permissions.isLoading && permissions.isSuperAdmin) {
            loadLogs();
        }
    }, [permissions.isLoading, permissions.isSuperAdmin, actionFilter, dateRange]);

    const loadLogs = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const params = new URLSearchParams();
            if (actionFilter) params.set('action', actionFilter);
            if (dateRange.start) params.set('start_date', dateRange.start);
            if (dateRange.end) params.set('end_date', dateRange.end);
            params.set('limit', '200');
            
            const res = await fetch(`/api/audit?${params.toString()}`);
            
            if (!res.ok) {
                throw new Error('Erro ao carregar logs');
            }
            
            const data = await res.json();
            setLogs(data.logs || []);
            
            // Calcular estatísticas
            const allLogs = data.logs || [];
            const today = new Date().toDateString();
            const byAction: Record<string, number> = {};
            
            allLogs.forEach((log: AuditLog) => {
                byAction[log.action] = (byAction[log.action] || 0) + 1;
            });
            
            setStats({
                total: allLogs.length,
                today: allLogs.filter((l: AuditLog) => new Date(l.created_at).toDateString() === today).length,
                byAction
            });
            
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    // Filtrar logs localmente por busca
    const filteredLogs = logs.filter(log => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            log.actor_name?.toLowerCase().includes(q) ||
            log.target_name?.toLowerCase().includes(q) ||
            log.action?.toLowerCase().includes(q)
        );
    });

    // RBAC
    if (permissions.isLoading) return <RoleLoading />;
    if (!permissions.isSuperAdmin) return <AccessDenied message="Apenas super admins podem acessar o log de auditoria." />;

    return (
        <div className="w-full px-4 md:px-6 py-6 min-h-screen bg-slate-950">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <Link 
                        href="/central"
                        className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-2 text-sm"
                    >
                        ← Voltar à Central
                    </Link>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Activity className="w-7 h-7 text-amber-400" />
                        Log de Auditoria
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Registro de todas as ações do sistema
                    </p>
                </div>
                <button
                    onClick={loadLogs}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Atualizar
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                    <p className="text-slate-400 text-sm">Total de Ações</p>
                    <p className="text-2xl font-bold text-white">{stats.total}</p>
                </div>
                <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                    <p className="text-slate-400 text-sm">Ações Hoje</p>
                    <p className="text-2xl font-bold text-amber-400">{stats.today}</p>
                </div>
                <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                    <p className="text-slate-400 text-sm">Links Confirmados</p>
                    <p className="text-2xl font-bold text-emerald-400">{stats.byAction['link_confirm'] || 0}</p>
                </div>
                <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                    <p className="text-slate-400 text-sm">Links Rejeitados</p>
                    <p className="text-2xl font-bold text-red-400">{stats.byAction['link_reject'] || 0}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Buscar por usuário ou alvo..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                </div>
                
                <select
                    value={actionFilter}
                    onChange={(e) => setActionFilter(e.target.value)}
                    className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                >
                    <option value="">Todas as ações</option>
                    {Object.entries(ACTION_CONFIG).map(([key, config]) => (
                        <option key={key} value={key}>{config.label}</option>
                    ))}
                </select>
            </div>

            {/* Error */}
            {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
                    <AlertTriangle className="w-4 h-4 inline mr-2" />
                    {error}
                </div>
            )}

            {/* Logs Table */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-900/50">
                            <tr>
                                <th className="text-left px-4 py-3 text-slate-400 text-sm font-medium">Quando</th>
                                <th className="text-left px-4 py-3 text-slate-400 text-sm font-medium">Ação</th>
                                <th className="text-left px-4 py-3 text-slate-400 text-sm font-medium">Usuário</th>
                                <th className="text-left px-4 py-3 text-slate-400 text-sm font-medium">Alvo</th>
                                <th className="text-left px-4 py-3 text-slate-400 text-sm font-medium">Detalhes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-12 text-center">
                                        <RefreshCw className="w-6 h-6 text-blue-400 animate-spin mx-auto mb-2" />
                                        <p className="text-slate-400">Carregando...</p>
                                    </td>
                                </tr>
                            ) : filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                                        Nenhum registro encontrado
                                    </td>
                                </tr>
                            ) : (
                                filteredLogs.map((log) => {
                                    const config = ACTION_CONFIG[log.action] || { 
                                        label: log.action, 
                                        icon: Activity, 
                                        color: 'text-slate-400 bg-slate-500/10' 
                                    };
                                    const Icon = config.icon;
                                    
                                    return (
                                        <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="text-sm text-white">
                                                    {new Date(log.created_at).toLocaleDateString('pt-BR')}
                                                </div>
                                                <div className="text-xs text-slate-500">
                                                    {new Date(log.created_at).toLocaleTimeString('pt-BR')}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs ${config.color}`}>
                                                    <Icon className="w-3 h-3" />
                                                    {config.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="text-sm text-white">{log.actor_name}</div>
                                                <div className="text-xs text-slate-500">{log.actor_role}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                {log.target_name ? (
                                                    <div className="text-sm text-slate-300">{log.target_name}</div>
                                                ) : (
                                                    <span className="text-slate-600">-</span>
                                                )}
                                                {log.target_type && (
                                                    <div className="text-xs text-slate-500">{log.target_type}</div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                {log.details ? (
                                                    <pre className="text-xs text-slate-400 max-w-xs truncate">
                                                        {JSON.stringify(log.details)}
                                                    </pre>
                                                ) : (
                                                    <span className="text-slate-600">-</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Footer info */}
            <div className="mt-4 text-center text-sm text-slate-500">
                Mostrando {filteredLogs.length} de {logs.length} registros
            </div>
        </div>
    );
}
