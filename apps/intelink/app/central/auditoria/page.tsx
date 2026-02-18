'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
    Shield, Search, Filter, Download, Clock, User, Eye,
    FileText, AlertTriangle, Lock, Unlock, RefreshCw, ChevronDown,
    ChevronRight, ExternalLink, Copy, CheckCircle2
} from 'lucide-react';
import { useRole, AccessDenied, RoleLoading } from '@/hooks/useRole';
import { StatusBadge } from '@/components/ui';

interface AuditLog {
    id: string;
    action: string;
    actor_id?: string;
    actor_name: string;
    actor_role: string;
    target_type?: string;
    target_id?: string;
    target_name?: string;
    details?: Record<string, any>;
    ip_address?: string;
    user_agent?: string;
    created_at: string;
}

const ACTION_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
    'view': { icon: Eye, color: 'text-blue-400', label: 'Visualização' },
    'search': { icon: Search, color: 'text-cyan-400', label: 'Busca' },
    'create': { icon: FileText, color: 'text-emerald-400', label: 'Criação' },
    'update': { icon: RefreshCw, color: 'text-amber-400', label: 'Atualização' },
    'delete': { icon: AlertTriangle, color: 'text-red-400', label: 'Exclusão' },
    'login': { icon: Unlock, color: 'text-emerald-400', label: 'Login' },
    'logout': { icon: Lock, color: 'text-slate-400', label: 'Logout' },
    'break_the_glass': { icon: AlertTriangle, color: 'text-red-500', label: 'Break the Glass' },
    'access_grant': { icon: Shield, color: 'text-purple-400', label: 'Acesso Concedido' },
    // Backend actions
    'role_change': { icon: User, color: 'text-amber-400', label: 'Alteração de Cargo' },
    'permission_change': { icon: Shield, color: 'text-purple-400', label: 'Alteração de Permissão' },
    'investigation_create': { icon: FileText, color: 'text-emerald-400', label: 'Operação Criada' },
    'investigation_delete': { icon: AlertTriangle, color: 'text-red-400', label: 'Operação Excluída' },
    'investigation_archive': { icon: Lock, color: 'text-slate-400', label: 'Operação Arquivada' },
    'entity_create': { icon: FileText, color: 'text-emerald-400', label: 'Entidade Criada' },
    'entity_delete': { icon: AlertTriangle, color: 'text-red-400', label: 'Entidade Excluída' },
    'link_confirm': { icon: Shield, color: 'text-emerald-400', label: 'Vínculo Confirmado' },
    'link_reject': { icon: AlertTriangle, color: 'text-red-400', label: 'Vínculo Rejeitado' },
    'document_upload': { icon: FileText, color: 'text-blue-400', label: 'Documento Enviado' },
    'document_delete': { icon: AlertTriangle, color: 'text-red-400', label: 'Documento Excluído' },
    'config_change': { icon: RefreshCw, color: 'text-amber-400', label: 'Configuração Alterada' },
    'api_access': { icon: Eye, color: 'text-slate-400', label: 'Acesso API' },
};

export default function AuditoriaPage() {
    const permissions = useRole();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterAction, setFilterAction] = useState('all');
    const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const toggleExpand = (id: string) => {
        setExpandedLogs(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const getTargetLink = (log: AuditLog): string | null => {
        if (!log.target_id) return null;
        if (log.target_type === 'investigation' || log.target_type === 'operation') {
            return `/investigation/${log.target_id}`;
        }
        if (log.target_type === 'entity') {
            return `/entity/${log.target_id}`;
        }
        if (log.target_type === 'member') {
            return `/central/membros?id=${log.target_id}`;
        }
        return null;
    };

    const getActorLink = (log: AuditLog): string | null => {
        if (!log.actor_id || log.actor_id === 'anonymous') return null;
        return `/central/membros?id=${log.actor_id}`;
    };

    useEffect(() => {
        if (!permissions.isLoading && permissions.role === 'super_admin') {
            loadLogs();
        }
    }, [permissions.isLoading, permissions.role]);

    const loadLogs = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/audit?limit=100');
            if (res.ok) {
                const data = await res.json();
                setLogs(data.logs || []);
            }
        } catch (error) {
            console.error('Error loading audit logs:', error);
        } finally {
            setLoading(false);
        }
    };

    // Check permissions
    if (permissions.isLoading) return <RoleLoading />;
    if (permissions.role !== 'super_admin') return <AccessDenied />;

    const filteredLogs = logs.filter(log => {
        const matchesSearch = 
            log.actor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.target_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.action?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesAction = filterAction === 'all' || log.action === filterAction;
        return matchesSearch && matchesAction;
    });

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);

        if (diffMins < 60) return `há ${diffMins}min`;
        if (diffHours < 24) return `há ${diffHours}h`;
        return date.toLocaleString('pt-BR');
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Shield className="w-8 h-8 text-red-400" />
                        Auditoria do Sistema
                    </h1>
                    <p className="text-slate-400 mt-1">
                        Registro imutável de todas as ações (Corregedoria)
                    </p>
                </div>
                
                <div className="flex items-center gap-3">
                    <button 
                        onClick={loadLogs}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 transition-colors"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Atualizar
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors">
                        <Download className="w-4 h-4" />
                        Exportar
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar por usuário, alvo ou ação..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                </div>
                <select
                    value={filterAction}
                    onChange={(e) => setFilterAction(e.target.value)}
                    className="px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                >
                    <option value="all">Todas as ações</option>
                    <option value="view">Visualização</option>
                    <option value="search">Busca</option>
                    <option value="create">Criação</option>
                    <option value="update">Atualização</option>
                    <option value="delete">Exclusão</option>
                    <option value="break_the_glass">Break the Glass</option>
                </select>
            </div>

            {/* Stats */}
            <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                    <p className="text-2xl font-bold text-white">{logs.length}</p>
                    <p className="text-sm text-slate-400">Total de registros</p>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                    <p className="text-2xl font-bold text-blue-400">
                        {logs.filter(l => l.action === 'view').length}
                    </p>
                    <p className="text-sm text-slate-400">Visualizações</p>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                    <p className="text-2xl font-bold text-cyan-400">
                        {logs.filter(l => l.action === 'search').length}
                    </p>
                    <p className="text-sm text-slate-400">Buscas</p>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                    <p className="text-2xl font-bold text-red-400">
                        {logs.filter(l => l.action === 'break_the_glass').length}
                    </p>
                    <p className="text-sm text-slate-400">Break the Glass</p>
                </div>
            </div>

            {/* Timeline */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
            ) : filteredLogs.length === 0 ? (
                <div className="text-center py-20 bg-slate-900/50 rounded-xl border border-slate-800">
                    <Shield className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400">Nenhum registro de auditoria encontrado</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {filteredLogs.map((log) => {
                        const config = ACTION_CONFIG[log.action] || { 
                            icon: Eye, 
                            color: 'text-slate-400', 
                            label: log.action 
                        };
                        const Icon = config.icon;
                        const isHighRisk = log.action === 'break_the_glass' || log.action === 'delete' || log.action === 'investigation_delete';
                        const isExpanded = expandedLogs.has(log.id);
                        const actorLink = getActorLink(log);
                        const targetLink = getTargetLink(log);

                        return (
                            <div 
                                key={log.id}
                                className={`bg-slate-900 border rounded-xl transition-all ${
                                    isHighRisk ? 'border-red-500/30' : 'border-slate-800'
                                } ${isExpanded ? 'ring-1 ring-blue-500/30' : ''}`}
                            >
                                {/* Main Row - Clickable */}
                                <button
                                    onClick={() => toggleExpand(log.id)}
                                    className="w-full p-4 text-left hover:bg-slate-800/50 transition-colors rounded-xl"
                                >
                                    <div className="flex items-start gap-4">
                                        {/* Icon */}
                                        <div className={`p-2 rounded-lg shrink-0 ${
                                            isHighRisk ? 'bg-red-500/10' : 'bg-slate-800'
                                        }`}>
                                            <Icon className={`w-5 h-5 ${config.color}`} />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                {/* Actor Name - Clickable if has link */}
                                                {actorLink ? (
                                                    <Link 
                                                        href={actorLink}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="font-medium text-white hover:text-blue-400 transition-colors inline-flex items-center gap-1"
                                                    >
                                                        {log.actor_name || 'Sistema'}
                                                        <ExternalLink className="w-3 h-3 opacity-50" />
                                                    </Link>
                                                ) : (
                                                    <span className="font-medium text-white">
                                                        {log.actor_name || 'Sistema'}
                                                    </span>
                                                )}
                                                <StatusBadge status={isHighRisk ? 'critical' : 'info'} size="sm">
                                                    {config.label}
                                                </StatusBadge>
                                            </div>

                                            <p className="text-sm text-slate-400">
                                                {log.target_type && (
                                                    <span>
                                                        {log.target_type}: {targetLink ? (
                                                            <Link 
                                                                href={targetLink}
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1"
                                                            >
                                                                {log.target_name || log.target_id}
                                                                <ExternalLink className="w-3 h-3" />
                                                            </Link>
                                                        ) : (
                                                            <span className="text-slate-300">{log.target_name || log.details?.target_id}</span>
                                                        )}
                                                    </span>
                                                )}
                                                {log.details?.term && (
                                                    <span>Buscou: "<span className="text-cyan-400">{log.details.term}</span>"</span>
                                                )}
                                                {log.details?.justification && (
                                                    <span className="text-red-300">
                                                        Motivo: "{log.details.justification}"
                                                    </span>
                                                )}
                                            </p>
                                        </div>

                                        {/* Time + Expand */}
                                        <div className="text-right flex-shrink-0 flex items-start gap-2">
                                            <div>
                                                <p className="text-xs text-slate-500 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {formatDate(log.created_at)}
                                                </p>
                                                <p className="text-xs text-slate-600">{log.actor_role}</p>
                                            </div>
                                            <ChevronRight className={`w-4 h-4 text-slate-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                        </div>
                                    </div>
                                </button>

                                {/* Expanded Details */}
                                {isExpanded && (
                                    <div className="px-4 pb-4 pt-0 border-t border-slate-800/50 mt-0">
                                        <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                            {/* Left Column */}
                                            <div className="space-y-3">
                                                <div>
                                                    <span className="text-slate-500 text-xs uppercase tracking-wider">ID do Registro</span>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <code className="text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded font-mono">
                                                            {log.id.substring(0, 8)}...
                                                        </code>
                                                        <button 
                                                            onClick={() => copyToClipboard(log.id, log.id)}
                                                            className="p-1 hover:bg-slate-700 rounded"
                                                        >
                                                            {copiedId === log.id ? (
                                                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                                            ) : (
                                                                <Copy className="w-3 h-3 text-slate-500" />
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                                
                                                <div>
                                                    <span className="text-slate-500 text-xs uppercase tracking-wider">Data/Hora Completa</span>
                                                    <p className="text-slate-300 mt-1">
                                                        {new Date(log.created_at).toLocaleString('pt-BR', {
                                                            weekday: 'long',
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                            second: '2-digit'
                                                        })}
                                                    </p>
                                                </div>

                                                {log.actor_id && log.actor_id !== 'anonymous' && (
                                                    <div>
                                                        <span className="text-slate-500 text-xs uppercase tracking-wider">ID do Ator</span>
                                                        <p className="text-slate-300 mt-1 font-mono text-xs">{log.actor_id}</p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Right Column */}
                                            <div className="space-y-3">
                                                {log.ip_address && (
                                                    <div>
                                                        <span className="text-slate-500 text-xs uppercase tracking-wider">Endereço IP</span>
                                                        <p className="text-slate-300 mt-1 font-mono">{log.ip_address}</p>
                                                    </div>
                                                )}
                                                
                                                {log.user_agent && (
                                                    <div>
                                                        <span className="text-slate-500 text-xs uppercase tracking-wider">Navegador</span>
                                                        <p className="text-slate-400 mt-1 text-xs truncate" title={log.user_agent}>
                                                            {log.user_agent.substring(0, 60)}...
                                                        </p>
                                                    </div>
                                                )}

                                                {log.details && Object.keys(log.details).length > 0 && (
                                                    <div>
                                                        <span className="text-slate-500 text-xs uppercase tracking-wider">Detalhes</span>
                                                        <pre className="mt-1 text-xs bg-slate-800 p-2 rounded overflow-x-auto text-slate-300">
                                                            {JSON.stringify(log.details, null, 2)}
                                                        </pre>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Quick Actions */}
                                        <div className="mt-4 pt-3 border-t border-slate-800/50 flex gap-2">
                                            {targetLink && (
                                                <Link 
                                                    href={targetLink}
                                                    className="text-xs px-3 py-1.5 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded-lg transition-colors inline-flex items-center gap-1"
                                                >
                                                    <ExternalLink className="w-3 h-3" />
                                                    Ver {log.target_type}
                                                </Link>
                                            )}
                                            {actorLink && (
                                                <Link 
                                                    href={actorLink}
                                                    className="text-xs px-3 py-1.5 bg-slate-700/50 text-slate-300 hover:bg-slate-700 rounded-lg transition-colors inline-flex items-center gap-1"
                                                >
                                                    <User className="w-3 h-3" />
                                                    Ver Perfil
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
