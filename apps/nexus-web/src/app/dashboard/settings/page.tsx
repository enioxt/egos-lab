'use client';
/**
 * Settings Page — Cost Tracker + API Usage Dashboard
 * 
 * Tracks estimated costs for AI enrichment services:
 *  - Web Search (Serper/Brave/Exa)
 *  - Image Generation (OpenRouter/Gemini)
 *  - Database operations
 */

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface CostEstimate {
    service: string;
    icon: string;
    freeTier: string;
    costPer1k: string;
    estimatedUsage: number;
    estimatedCost: number;
    status: 'active' | 'inactive' | 'free-tier';
}

export default function SettingsPage() {
    const [productCount, setProductCount] = useState(0);
    const [enrichedCount, setEnrichedCount] = useState(0);

    useEffect(() => {
        async function load() {
            const { count: total } = await supabase
                .from('nexusmkt_products')
                .select('*', { count: 'exact', head: true });

            const { count: enriched } = await supabase
                .from('nexusmkt_products')
                .select('*', { count: 'exact', head: true })
                .gt('data_quality_score', 50);

            setProductCount(total || 0);
            setEnrichedCount(enriched || 0);
        }
        load();
    }, []);

    const services: CostEstimate[] = [
        {
            service: 'Serper.dev (Google Search)',
            icon: '🔍',
            freeTier: '2,500 queries grátis',
            costPer1k: 'R$ 7,00/1k queries',
            estimatedUsage: productCount,
            estimatedCost: Math.max(0, (productCount - 2500) * 0.0013),
            status: productCount <= 2500 ? 'free-tier' : 'active',
        },
        {
            service: 'Brave Search (backup)',
            icon: '🦁',
            freeTier: '~1k queries/mês grátis',
            costPer1k: 'R$ 27,00/1k queries',
            estimatedUsage: 0,
            estimatedCost: 0,
            status: 'inactive',
        },
        {
            service: 'Exa AI Search (backup)',
            icon: '🧠',
            freeTier: '1k queries/mês grátis',
            costPer1k: 'R$ 27,00/1k queries',
            estimatedUsage: 0,
            estimatedCost: 0,
            status: 'inactive',
        },
        {
            service: 'OpenRouter (Image Gen)',
            icon: '🎨',
            freeTier: 'Créditos iniciais grátis',
            costPer1k: '~R$ 0,22/imagem',
            estimatedUsage: productCount - enrichedCount,
            estimatedCost: (productCount - enrichedCount) * 0.04,
            status: productCount > enrichedCount ? 'active' : 'inactive',
        },
        {
            service: 'Supabase (Database)',
            icon: '💾',
            freeTier: '500MB + 50k auth users',
            costPer1k: 'R$ 0',
            estimatedUsage: productCount,
            estimatedCost: 0,
            status: 'free-tier',
        },
    ];

    const totalEstimatedCost = services.reduce((sum, s) => sum + s.estimatedCost, 0);

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">⚙️ Configurações</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Monitor de custos, uso de API e configurações do sistema
                </p>
            </div>

            {/* Cost Summary Card */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 mb-8 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-400 font-medium">Custo Estimado Total</p>
                        <p className="text-4xl font-black mt-1">
                            R$ {totalEstimatedCost.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                            Baseado em {productCount} produtos • {enrichedCount} já enriquecidos
                        </p>
                    </div>
                    <div className="text-right">
                        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${totalEstimatedCost === 0
                                ? 'bg-green-500/20 text-green-400'
                                : totalEstimatedCost < 5
                                    ? 'bg-yellow-500/20 text-yellow-400'
                                    : 'bg-red-500/20 text-red-400'
                            }`}>
                            {totalEstimatedCost === 0 ? '✅ Tudo gratuito' : totalEstimatedCost < 5 ? '💰 Custo baixo' : '⚠️ Revisar custos'}
                        </div>
                    </div>
                </div>

                {/* Mini Stats */}
                <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-700">
                    <div>
                        <p className="text-2xl font-bold">{productCount}</p>
                        <p className="text-xs text-gray-400">Produtos total</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold">{enrichedCount}</p>
                        <p className="text-xs text-gray-400">Já enriquecidos</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold">{productCount - enrichedCount}</p>
                        <p className="text-xs text-gray-400">Pendente de IA</p>
                    </div>
                </div>
            </div>

            {/* Services Grid */}
            <h2 className="font-bold text-gray-900 mb-4">📡 Serviços & APIs</h2>
            <div className="space-y-3">
                {services.map(s => (
                    <div key={s.service} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                        <span className="text-2xl">{s.icon}</span>
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-gray-900 text-sm">{s.service}</h3>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${s.status === 'active' ? 'bg-green-100 text-green-700'
                                        : s.status === 'free-tier' ? 'bg-blue-100 text-blue-700'
                                            : 'bg-gray-100 text-gray-400'
                                    }`}>
                                    {s.status === 'active' ? 'Ativo' : s.status === 'free-tier' ? 'Free Tier' : 'Stand-by'}
                                </span>
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">
                                {s.freeTier} • {s.costPer1k}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className={`text-lg font-bold ${s.estimatedCost > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                                R$ {s.estimatedCost.toFixed(2)}
                            </p>
                            <p className="text-[10px] text-gray-400">{s.estimatedUsage} queries est.</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Free Tier Tip */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-800">
                💡 <strong>Dica:</strong> O sistema usa uma cascade inteligente (Serper → Brave → Exa) que prioriza
                os providers mais baratos. Com menos de 2.500 produtos, o custo de busca é <strong>R$ 0,00</strong>.
            </div>
        </div>
    );
}
