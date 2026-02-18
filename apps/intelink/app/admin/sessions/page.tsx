'use client';

/**
 * Admin - Sessions Management
 * 
 * View and manage active user sessions
 * Only accessible by super_admin
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
    Shield, Loader2, RefreshCw, Trash2, 
    Monitor, Smartphone, Globe, Clock,
    User, AlertTriangle, CheckCircle
} from 'lucide-react';
import { useRole } from '@/hooks/useRole';

interface Session {
    id: string;
    member_id: string;
    member_name: string;
    device_info: {
        userAgent?: string;
        ip?: string;
    } | null;
    created_at: string;
    expires_at: string;
    last_activity_at: string;
    revoked_at: string | null;
}

export default function SessionsAdminPage() {
    const router = useRouter();
    const permissions = useRole();
    
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [revoking, setRevoking] = useState<string | null>(null);

    const loadSessions = async () => {
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/admin/sessions');
            const data = await res.json();

            if (!res.ok || !data.success) {
                setError(data.error || 'Erro ao carregar sessões');
                return;
            }

            setSessions(data.sessions || []);
        } catch (e) {
            setError('Erro de conexão');
        } finally {
            setLoading(false);
        }
    };

    // Check permissions
    useEffect(() => {
        if (!permissions.isLoading) {
            if (!permissions.canManageMembers) {
                router.push('/');
                return;
            }
            loadSessions();
        }
    }, [permissions.isLoading, permissions.canManageMembers, router]);

    const revokeSession = async (sessionId: string) => {
        setRevoking(sessionId);

        try {
            const res = await fetch(`/api/admin/sessions/${sessionId}/revoke`, {
                method: 'POST',
            });

            if (res.ok) {
                loadSessions();
            }
        } catch (e) {
            console.error('Revoke error:', e);
        } finally {
            setRevoking(null);
        }
    };

    const parseUserAgent = (ua: string | undefined): { device: string; browser: string } => {
        if (!ua) return { device: 'Desconhecido', browser: 'Desconhecido' };
        
        const isMobile = /Mobile|Android|iPhone/i.test(ua);
        const device = isMobile ? 'Mobile' : 'Desktop';
        
        let browser = 'Outro';
        if (ua.includes('Chrome')) browser = 'Chrome';
        else if (ua.includes('Firefox')) browser = 'Firefox';
        else if (ua.includes('Safari')) browser = 'Safari';
        else if (ua.includes('Edge')) browser = 'Edge';
        
        return { device, browser };
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (permissions.isLoading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
            </div>
        );
    }

    if (!permissions.canManageMembers) {
        return null; // Will redirect
    }

    return (
        <div className="min-h-screen bg-slate-900 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Shield className="w-6 h-6 text-cyan-500" />
                            Sessões Ativas
                        </h1>
                        <p className="text-slate-400 text-sm mt-1">
                            Gerencie sessões de usuários do sistema
                        </p>
                    </div>
                    <button
                        onClick={loadSessions}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Atualizar
                    </button>
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        <span className="text-red-400">{error}</span>
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                        <div className="text-3xl font-bold text-white">
                            {sessions.filter(s => !s.revoked_at).length}
                        </div>
                        <div className="text-slate-400 text-sm">Sessões Ativas</div>
                    </div>
                    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                        <div className="text-3xl font-bold text-white">
                            {new Set(sessions.filter(s => !s.revoked_at).map(s => s.member_id)).size}
                        </div>
                        <div className="text-slate-400 text-sm">Usuários Online</div>
                    </div>
                    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                        <div className="text-3xl font-bold text-white">
                            {sessions.filter(s => s.revoked_at).length}
                        </div>
                        <div className="text-slate-400 text-sm">Sessões Revogadas</div>
                    </div>
                </div>

                {/* Sessions List */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
                    </div>
                ) : sessions.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                        Nenhuma sessão encontrada
                    </div>
                ) : (
                    <div className="space-y-3">
                        {sessions.map((session) => {
                            const { device, browser } = parseUserAgent(session.device_info?.userAgent);
                            const isRevoked = !!session.revoked_at;
                            const isExpired = new Date(session.expires_at) < new Date();

                            return (
                                <div
                                    key={session.id}
                                    className={`bg-slate-800/50 border rounded-lg p-4 ${
                                        isRevoked ? 'border-red-500/30 opacity-60' : 
                                        isExpired ? 'border-amber-500/30 opacity-60' : 
                                        'border-slate-700'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            {/* Device Icon */}
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                                isRevoked ? 'bg-red-500/10' : 'bg-cyan-500/10'
                                            }`}>
                                                {device === 'Mobile' ? (
                                                    <Smartphone className={`w-5 h-5 ${isRevoked ? 'text-red-500' : 'text-cyan-500'}`} />
                                                ) : (
                                                    <Monitor className={`w-5 h-5 ${isRevoked ? 'text-red-500' : 'text-cyan-500'}`} />
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <User className="w-4 h-4 text-slate-500" />
                                                    <span className="text-white font-medium">{session.member_name}</span>
                                                    {isRevoked && (
                                                        <span className="px-2 py-0.5 text-xs bg-red-500/20 text-red-400 rounded">
                                                            Revogada
                                                        </span>
                                                    )}
                                                    {!isRevoked && isExpired && (
                                                        <span className="px-2 py-0.5 text-xs bg-amber-500/20 text-amber-400 rounded">
                                                            Expirada
                                                        </span>
                                                    )}
                                                    {!isRevoked && !isExpired && (
                                                        <span className="px-2 py-0.5 text-xs bg-emerald-500/20 text-emerald-400 rounded">
                                                            Ativa
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                                                    <span>{browser}</span>
                                                    {session.device_info?.ip && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="flex items-center gap-1">
                                                                <Globe className="w-3 h-3" />
                                                                {session.device_info.ip}
                                                            </span>
                                                        </>
                                                    )}
                                                    <span>•</span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        Última atividade: {formatDate(session.last_activity_at)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        {!isRevoked && !isExpired && (
                                            <button
                                                onClick={() => revokeSession(session.id)}
                                                disabled={revoking === session.id}
                                                className="flex items-center gap-2 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                                            >
                                                {revoking === session.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="w-4 h-4" />
                                                )}
                                                Revogar
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
