'use client';
/**
 * Dashboard Overview — Inventory Health Score + Stats
 */

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Stats {
    totalProducts: number;
    avgQuality: number;
    withImages: number;
    withoutImages: number;
    categories: number;
}

export default function DashboardPage() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            const { data, error } = await supabase
                .from('nexusmkt_products')
                .select('id, image_url, data_quality_score, category');

            if (error || !data) {
                setLoading(false);
                return;
            }

            const totalProducts = data.length;
            const avgQuality = Math.round(
                data.reduce((sum, p) => sum + (p.data_quality_score || 0), 0) / Math.max(totalProducts, 1)
            );
            const withImages = data.filter(p => p.image_url && !p.image_url.includes('placeholder')).length;
            const categories = new Set(data.map(p => p.category).filter(Boolean)).size;

            setStats({
                totalProducts,
                avgQuality,
                withImages,
                withoutImages: totalProducts - withImages,
                categories,
            });
            setLoading(false);
        }
        load();
    }, []);

    const healthColor = !stats ? 'text-gray-400'
        : stats.avgQuality >= 75 ? 'text-green-500'
            : stats.avgQuality >= 50 ? 'text-yellow-500'
                : 'text-red-500';

    const healthBg = !stats ? 'from-gray-100 to-gray-200'
        : stats.avgQuality >= 75 ? 'from-green-50 to-green-100'
            : stats.avgQuality >= 50 ? 'from-yellow-50 to-yellow-100'
                : 'from-red-50 to-red-100';

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Visão Geral</h1>
                <p className="text-gray-500 text-sm mt-1">Saúde do inventário e métricas de qualidade</p>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500" />
                </div>
            ) : stats ? (
                <>
                    {/* Health Score Hero */}
                    <div className={`bg-gradient-to-br ${healthBg} rounded-2xl p-8 mb-8 flex items-center gap-8`}>
                        <div className="relative">
                            <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                                <circle cx="60" cy="60" r="52" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                                <circle
                                    cx="60" cy="60" r="52" fill="none"
                                    stroke="currentColor"
                                    strokeWidth="8"
                                    strokeLinecap="round"
                                    strokeDasharray={`${(stats.avgQuality / 100) * 327} 327`}
                                    className={healthColor}
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className={`text-3xl font-black ${healthColor}`}>{stats.avgQuality}</span>
                            </div>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Inventory Health Score</h2>
                            <p className="text-gray-500 mt-1">
                                {stats.avgQuality >= 75
                                    ? '✅ Excelente! Seus dados estão bem enriquecidos pela IA.'
                                    : stats.avgQuality >= 50
                                        ? '⚠️ Bom, mas alguns produtos precisam de atenção.'
                                        : '🚨 Atenção! Muitos produtos com dados faltando.'}
                            </p>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-4 gap-4">
                        <StatCard title="Total Produtos" value={stats.totalProducts} icon="📦" />
                        <StatCard title="Com Imagem" value={stats.withImages} icon="🖼️" accent="green" />
                        <StatCard title="Sem Imagem" value={stats.withoutImages} icon="📷" accent={stats.withoutImages > 0 ? 'red' : 'green'} />
                        <StatCard title="Categorias" value={stats.categories} icon="🏷️" />
                    </div>
                </>
            ) : (
                <div className="text-center text-gray-400 py-20">
                    <p className="text-4xl mb-4">🛒</p>
                    <p>Nenhum produto encontrado. Importe seus dados!</p>
                </div>
            )}
        </div>
    );
}

function StatCard({ title, value, icon, accent }: {
    title: string;
    value: number;
    icon: string;
    accent?: 'green' | 'red';
}) {
    const accentClass = accent === 'green' ? 'text-green-600' : accent === 'red' ? 'text-red-500' : 'text-gray-900';

    return (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{icon}</span>
            </div>
            <p className={`text-3xl font-bold ${accentClass}`}>{value}</p>
            <p className="text-xs text-gray-400 mt-1 font-medium">{title}</p>
        </div>
    );
}
