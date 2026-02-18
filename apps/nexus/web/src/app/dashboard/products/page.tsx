'use client';
/**
 * Products Management — AI-Enriched Product Table
 * Features: quality badges, AI suggestions, image previews, bulk actions
 */

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Product {
    id: string;
    name: string;
    category: string | null;
    price: number;
    image_url: string | null;
    barcode: string | null;
    data_quality_score: number;
    ai_suggestions: string[] | null;
    is_available: boolean;
    created_at: string;
}

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [filter, setFilter] = useState<'all' | 'needs_attention' | 'excellent'>('all');

    useEffect(() => {
        async function load() {
            const { data } = await supabase
                .from('nexusmkt_products')
                .select('*')
                .order('data_quality_score', { ascending: true });
            setProducts(data || []);
            setLoading(false);
        }
        load();
    }, []);

    const filtered = products.filter(p => {
        if (filter === 'needs_attention') return p.data_quality_score < 70;
        if (filter === 'excellent') return p.data_quality_score >= 80;
        return true;
    });

    const needsAttention = products.filter(p => p.data_quality_score < 70).length;

    return (
        <div className="flex h-screen">
            {/* Main Table Area */}
            <div className="flex-1 p-8 overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            {products.length} produtos · {needsAttention > 0 && (
                                <span className="text-amber-600 font-medium">{needsAttention} precisam de atenção</span>
                            )}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {(['all', 'needs_attention', 'excellent'] as const).map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f
                                        ? 'bg-green-600 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {f === 'all' ? 'Todos' : f === 'needs_attention' ? '⚠️ Atenção' : '✅ Excelentes'}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500" />
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Produto</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Categoria</th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Preço</th>
                                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Qualidade IA</th>
                                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filtered.map(product => (
                                    <tr
                                        key={product.id}
                                        onClick={() => setSelectedProduct(product)}
                                        className={`hover:bg-green-50/50 cursor-pointer transition-colors ${selectedProduct?.id === product.id ? 'bg-green-50' : ''
                                            } ${product.data_quality_score < 50 ? 'bg-red-50/30' : ''}`}
                                    >
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                                    {product.image_url ? (
                                                        <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-lg">📷</div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900 text-sm">{product.name}</p>
                                                    {product.barcode && (
                                                        <p className="text-xs text-gray-400 font-mono">{product.barcode}</p>
                                                    )}
                                                </div>
                                                {product.ai_suggestions && product.ai_suggestions.length > 0 && (
                                                    <span className="ml-1 text-sm" title="IA tem sugestões">✨</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-sm text-gray-500 capitalize">
                                                {product.category || '—'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <span className="text-sm font-semibold text-gray-900">
                                                R$ {Number(product.price).toFixed(2)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <QualityBadge score={product.data_quality_score} />
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {product.is_available ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                                                    ● Ativo
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-500 text-xs font-medium">
                                                    ○ Inativo
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* AI Suggestions Side Panel */}
            {selectedProduct && (
                <aside className="w-80 bg-white border-l border-gray-100 p-6 overflow-y-auto">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="font-bold text-gray-900">✨ Assistente IA</h2>
                        <button
                            onClick={() => setSelectedProduct(null)}
                            className="text-gray-400 hover:text-gray-600 text-lg"
                        >✕</button>
                    </div>

                    {/* Product Preview */}
                    <div className="rounded-xl overflow-hidden bg-gray-50 mb-6">
                        {selectedProduct.image_url ? (
                            <img src={selectedProduct.image_url} alt="" className="w-full h-40 object-cover" />
                        ) : (
                            <div className="w-full h-40 flex items-center justify-center text-4xl bg-gray-100">📷</div>
                        )}
                    </div>

                    <h3 className="font-semibold text-gray-900 mb-1">{selectedProduct.name}</h3>
                    <p className="text-sm text-gray-400 mb-4">{selectedProduct.category || 'Sem categoria'}</p>

                    {/* Quality Score */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-gray-500">Qualidade dos Dados</span>
                            <QualityBadge score={selectedProduct.data_quality_score} />
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                            <div
                                className={`h-2 rounded-full transition-all ${selectedProduct.data_quality_score >= 75 ? 'bg-green-500'
                                        : selectedProduct.data_quality_score >= 50 ? 'bg-yellow-500'
                                            : 'bg-red-500'
                                    }`}
                                style={{ width: `${selectedProduct.data_quality_score}%` }}
                            />
                        </div>
                    </div>

                    {/* AI Suggestions */}
                    <div>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Sugestões da IA</h4>
                        {selectedProduct.ai_suggestions && selectedProduct.ai_suggestions.length > 0 ? (
                            <div className="space-y-2">
                                {selectedProduct.ai_suggestions.map((suggestion, i) => (
                                    <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-100">
                                        <span className="text-amber-500 mt-0.5">💡</span>
                                        <p className="text-sm text-amber-800">{suggestion}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-400">
                                <p className="text-2xl mb-2">✅</p>
                                <p className="text-sm">Produto completo! Nenhuma sugestão.</p>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="mt-6 space-y-2">
                        <button className="w-full py-2 px-4 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
                            🔄 Re-enriquecer com IA
                        </button>
                        <button className="w-full py-2 px-4 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                            ✏️ Editar Manualmente
                        </button>
                    </div>
                </aside>
            )}
        </div>
    );
}

function QualityBadge({ score }: { score: number }) {
    const color = score >= 75 ? 'bg-green-100 text-green-700'
        : score >= 50 ? 'bg-yellow-100 text-yellow-700'
            : 'bg-red-100 text-red-700';

    return (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${color}`}>
            {score}%
        </span>
    );
}
