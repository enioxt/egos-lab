'use client';

import { useEffect, useState } from 'react';
import { 
    Trophy, Users, Target, Link2, FileText, 
    TrendingUp, Award, Activity, Zap, Crown,
    Medal, Star, RefreshCw
} from 'lucide-react';

interface GamificationStats {
    success: boolean;
    timestamp: string;
    summary: {
        totalPoints: number;
        totalMembers: number;
        avgPoints: number;
        totalInvestigations: number;
        totalEntities: number;
        crossCaseLinks: number;
    };
    leaderboard: Array<{
        id: string;
        name: string;
        points: number;
        rank: number;
    }>;
    xpByEvent: Record<string, number>;
    xpValues: Record<string, number>;
    recentActivity: Array<{
        event_type: string;
        points_awarded: number;
        created_at: string;
    }>;
}

export default function GamificationDevPage() {
    const [stats, setStats] = useState<GamificationStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const fetchStats = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/gamification/stats');
            const data = await res.json();
            if (data.success) {
                setStats(data);
                setError(null);
            } else {
                setError(data.error || 'Failed to load stats');
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        fetchStats();
    }, []);
    
    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <RefreshCw className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
                    <p className="text-slate-400">Carregando estatísticas...</p>
                </div>
            </div>
        );
    }
    
    if (error || !stats) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-400 mb-4">Erro: {error}</p>
                    <button 
                        onClick={fetchStats}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                    >
                        Tentar novamente
                    </button>
                </div>
            </div>
        );
    }
    
    const { summary, leaderboard, xpByEvent, xpValues, recentActivity } = stats;
    
    return (
        <div className="min-h-screen bg-slate-900 p-6">
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            <Trophy className="w-8 h-8 text-yellow-500" />
                            Gamification Dashboard
                        </h1>
                        <p className="text-slate-400 mt-1">
                            Sistema de pontuação e recompensas do Intelink
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-xs text-slate-500 bg-red-500/20 px-3 py-1 rounded-full">
                            🔒 DEV ONLY
                        </span>
                        <button 
                            onClick={fetchStats}
                            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400"
                        >
                            <RefreshCw className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
            
            {/* Summary Cards */}
            <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                <StatCard 
                    icon={<Zap className="w-6 h-6" />}
                    label="Total XP"
                    value={summary.totalPoints.toLocaleString()}
                    color="yellow"
                />
                <StatCard 
                    icon={<Users className="w-6 h-6" />}
                    label="Membros"
                    value={summary.totalMembers.toString()}
                    color="blue"
                />
                <StatCard 
                    icon={<TrendingUp className="w-6 h-6" />}
                    label="XP Médio"
                    value={summary.avgPoints.toLocaleString()}
                    color="green"
                />
                <StatCard 
                    icon={<Target className="w-6 h-6" />}
                    label="Operações"
                    value={summary.totalInvestigations.toString()}
                    color="purple"
                />
                <StatCard 
                    icon={<FileText className="w-6 h-6" />}
                    label="Entidades"
                    value={summary.totalEntities.toLocaleString()}
                    color="cyan"
                />
                <StatCard 
                    icon={<Link2 className="w-6 h-6" />}
                    label="Cross-Case"
                    value={summary.crossCaseLinks.toString()}
                    color="orange"
                />
            </div>
            
            {/* Main Content Grid */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Leaderboard */}
                <div className="lg:col-span-2 bg-slate-800 rounded-2xl p-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
                        <Crown className="w-5 h-5 text-yellow-500" />
                        Ranking de Investigadores
                    </h2>
                    
                    <div className="space-y-3">
                        {leaderboard.slice(0, 10).map((member, i) => (
                            <div 
                                key={member.id}
                                className={`flex items-center gap-4 p-3 rounded-xl transition-colors ${
                                    i === 0 ? 'bg-yellow-500/10 border border-yellow-500/30' :
                                    i === 1 ? 'bg-slate-400/10 border border-slate-400/30' :
                                    i === 2 ? 'bg-amber-700/10 border border-amber-700/30' :
                                    'bg-slate-700/50'
                                }`}
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                                    i === 0 ? 'bg-yellow-500 text-yellow-900' :
                                    i === 1 ? 'bg-slate-400 text-slate-900' :
                                    i === 2 ? 'bg-amber-700 text-white' :
                                    'bg-slate-600 text-slate-300'
                                }`}>
                                    {member.rank}
                                </div>
                                
                                <div className="flex-1">
                                    <p className="font-medium text-white">{member.name}</p>
                                </div>
                                
                                <div className="text-right">
                                    <p className="font-mono font-bold text-lg text-yellow-400">
                                        {member.points.toLocaleString()}
                                    </p>
                                    <p className="text-xs text-slate-500">XP</p>
                                </div>
                                
                                {i === 0 && <Trophy className="w-6 h-6 text-yellow-500" />}
                                {i === 1 && <Medal className="w-6 h-6 text-slate-400" />}
                                {i === 2 && <Medal className="w-6 h-6 text-amber-700" />}
                            </div>
                        ))}
                    </div>
                </div>
                
                {/* XP Values Reference */}
                <div className="bg-slate-800 rounded-2xl p-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
                        <Award className="w-5 h-5 text-purple-400" />
                        Tabela de XP
                    </h2>
                    
                    <div className="space-y-2">
                        {Object.entries(xpValues)
                            .sort(([, a], [, b]) => b - a)
                            .map(([event, value]) => (
                                <div 
                                    key={event}
                                    className="flex items-center justify-between p-2 bg-slate-700/50 rounded-lg"
                                >
                                    <span className="text-xs text-slate-400 truncate max-w-[180px]">
                                        {event.replace(/_/g, ' ')}
                                    </span>
                                    <span className={`font-mono font-bold ${
                                        value >= 100 ? 'text-yellow-400' :
                                        value >= 50 ? 'text-green-400' :
                                        value >= 20 ? 'text-blue-400' :
                                        'text-slate-400'
                                    }`}>
                                        +{value}
                                    </span>
                                </div>
                            ))}
                    </div>
                </div>
                
                {/* Recent Activity */}
                <div className="lg:col-span-3 bg-slate-800 rounded-2xl p-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
                        <Activity className="w-5 h-5 text-green-400" />
                        Atividade Recente (7 dias)
                    </h2>
                    
                    {recentActivity.length === 0 ? (
                        <p className="text-slate-500 text-center py-8">
                            Nenhuma atividade registrada
                        </p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                            {Object.entries(xpByEvent)
                                .sort(([, a], [, b]) => b - a)
                                .map(([event, total]) => (
                                    <div 
                                        key={event}
                                        className="bg-slate-700/50 rounded-xl p-4"
                                    >
                                        <p className="text-xs text-slate-400 mb-1">
                                            {event.replace(/_/g, ' ')}
                                        </p>
                                        <p className="text-2xl font-bold text-green-400">
                                            +{total.toLocaleString()}
                                        </p>
                                        <p className="text-xs text-slate-500">XP esta semana</p>
                                    </div>
                                ))}
                        </div>
                    )}
                </div>
            </div>
            
            {/* Footer */}
            <div className="max-w-7xl mx-auto mt-8 text-center">
                <p className="text-xs text-slate-600">
                    Atualizado em: {new Date(stats.timestamp).toLocaleString('pt-BR')}
                </p>
            </div>
        </div>
    );
}

function StatCard({ 
    icon, label, value, color 
}: { 
    icon: React.ReactNode; 
    label: string; 
    value: string; 
    color: string 
}) {
    const colorClasses: Record<string, string> = {
        yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
        blue: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
        green: 'bg-green-500/10 text-green-400 border-green-500/30',
        purple: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
        cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
        orange: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    };
    
    return (
        <div className={`rounded-xl p-4 border ${colorClasses[color]}`}>
            <div className="flex items-center gap-2 mb-2">
                {icon}
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-xs text-slate-400">{label}</p>
        </div>
    );
}
