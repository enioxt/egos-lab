'use client';
/**
 * Import Wizard — CSV Upload + AI Enrichment Pipeline
 * 
 * Steps:
 *  1. Upload CSV file
 *  2. Preview & map columns
 *  3. AI enrichment (image search, generation, scoring)
 *  4. Results summary
 */

import { useState, useCallback, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface CsvRow {
    [key: string]: string;
}

interface ImportResult {
    name: string;
    status: 'success' | 'error';
    quality_score: number;
    image_source: string;
    error?: string;
}

type WizardStep = 'upload' | 'preview' | 'enriching' | 'done';

export default function ImportPage() {
    const [step, setStep] = useState<WizardStep>('upload');
    const [csvData, setCsvData] = useState<CsvRow[]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [columnMap, setColumnMap] = useState<Record<string, string>>({});
    const [results, setResults] = useState<ImportResult[]>([]);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const REQUIRED_FIELDS = ['name', 'price'];
    const OPTIONAL_FIELDS = ['barcode', 'category', 'description', 'image_url', 'expiry_date'];
    const ALL_FIELDS = [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS];

    // ─── CSV Parsing ────────────────────────────────
    const parseCsv = useCallback((text: string) => {
        const lines = text.trim().split('\n');
        if (lines.length < 2) return;

        // Detect separator (comma, semicolon, tab)
        const firstLine = lines[0];
        const separator = firstLine.includes(';') ? ';' : firstLine.includes('\t') ? '\t' : ',';

        const rawHeaders = firstLine.split(separator).map(h => h.trim().replace(/^"|"$/g, ''));
        setHeaders(rawHeaders);

        const rows = lines.slice(1).map(line => {
            const values = line.split(separator).map(v => v.trim().replace(/^"|"$/g, ''));
            const row: CsvRow = {};
            rawHeaders.forEach((h, i) => { row[h] = values[i] || ''; });
            return row;
        }).filter(row => Object.values(row).some(v => v.length > 0));

        setCsvData(rows);

        // Auto-map columns
        const autoMap: Record<string, string> = {};
        const normalize = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');
        rawHeaders.forEach(h => {
            const hn = normalize(h);
            if (['nome', 'name', 'produto', 'product'].includes(hn)) autoMap[h] = 'name';
            else if (['preco', 'price', 'valor'].includes(hn)) autoMap[h] = 'price';
            else if (['ean', 'barcode', 'codigodebarras', 'gtin'].includes(hn)) autoMap[h] = 'barcode';
            else if (['categoria', 'category', 'grupo'].includes(hn)) autoMap[h] = 'category';
            else if (['descricao', 'description'].includes(hn)) autoMap[h] = 'description';
            else if (['imagem', 'imageurl', 'image', 'foto'].includes(hn)) autoMap[h] = 'image_url';
            else if (['validade', 'expirydate', 'vencimento'].includes(hn)) autoMap[h] = 'expiry_date';
        });
        setColumnMap(autoMap);
        setStep('preview');
    }, []);

    const handleFile = useCallback((file: File) => {
        if (!file.name.match(/\.(csv|tsv|txt)$/i)) {
            alert('Formato não suportado. Use CSV, TSV ou TXT.');
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => parseCsv(e.target?.result as string);
        reader.readAsText(file, 'UTF-8');
    }, [parseCsv]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragActive(false);
        if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]);
    }, [handleFile]);

    // ─── Import Execution ───────────────────────────
    const startImport = async () => {
        setStep('enriching');
        setProgress({ current: 0, total: csvData.length });
        const importResults: ImportResult[] = [];

        for (let i = 0; i < csvData.length; i++) {
            const row = csvData[i];
            setProgress({ current: i + 1, total: csvData.length });

            try {
                // Map CSV columns to product fields
                const product: Record<string, string | number> = {};
                Object.entries(columnMap).forEach(([csvCol, field]) => {
                    if (field === 'price') {
                        product[field] = parseFloat(row[csvCol]?.replace(',', '.') || '0');
                    } else {
                        product[field] = row[csvCol] || '';
                    }
                });

                if (!product.name) throw new Error('Nome do produto vazio');

                // Insert to Supabase
                const { error } = await supabase.from('nexusmkt_products').insert({
                    name: product.name,
                    price: product.price || 0,
                    barcode: product.barcode || null,
                    category: product.category || null,
                    description: product.description || null,
                    image_url: product.image_url || null,
                    data_quality_score: product.image_url ? 60 : 30,
                    is_available: true,
                    ai_suggestions: product.image_url ? [] : ['Produto sem imagem. Enriqueça com IA.'],
                });

                if (error) throw error;

                importResults.push({
                    name: String(product.name),
                    status: 'success',
                    quality_score: product.image_url ? 60 : 30,
                    image_source: product.image_url ? 'csv' : 'pending',
                });
            } catch (err: any) {
                importResults.push({
                    name: row[Object.keys(columnMap).find(k => columnMap[k] === 'name') || ''] || `Linha ${i + 1}`,
                    status: 'error',
                    quality_score: 0,
                    image_source: 'none',
                    error: err.message,
                });
            }
        }

        setResults(importResults);
        setStep('done');
    };

    // Check if required fields are mapped
    const isMappingValid = REQUIRED_FIELDS.every(f =>
        Object.values(columnMap).includes(f)
    );

    return (
        <div className="p-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">⬆️ Importar Produtos</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Upload de CSV/Excel → mapeamento de colunas → salvamento no banco
                </p>
            </div>

            {/* Step Indicator */}
            <div className="flex items-center gap-2 mb-8">
                {[
                    { key: 'upload', label: '1. Upload', icon: '📁' },
                    { key: 'preview', label: '2. Mapear', icon: '🔗' },
                    { key: 'enriching', label: '3. Importando', icon: '⚡' },
                    { key: 'done', label: '4. Concluído', icon: '✅' },
                ].map((s, i) => (
                    <div key={s.key} className="flex items-center gap-2">
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${step === s.key
                                ? 'bg-green-600 text-white shadow-lg shadow-green-200'
                                : (['upload', 'preview', 'enriching', 'done'].indexOf(step) > i
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-gray-100 text-gray-400')
                            }`}>
                            <span>{s.icon}</span> {s.label}
                        </div>
                        {i < 3 && <div className="w-8 h-0.5 bg-gray-200" />}
                    </div>
                ))}
            </div>

            {/* ─── Step 1: Upload ──────────────────────────── */}
            {step === 'upload' && (
                <div
                    onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all ${dragActive
                            ? 'border-green-400 bg-green-50 scale-[1.02]'
                            : 'border-gray-200 hover:border-green-300 hover:bg-green-50/30'
                        }`}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv,.tsv,.txt"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                    />
                    <div className="text-5xl mb-4">{dragActive ? '📥' : '📄'}</div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">
                        {dragActive ? 'Solte o arquivo aqui!' : 'Arraste seu CSV ou clique para selecionar'}
                    </h2>
                    <p className="text-sm text-gray-500 max-w-md mx-auto">
                        Aceitamos CSV com separador vírgula ou ponto-e-vírgula.
                        Colunas comuns (nome, preço, código de barras) são detectadas automaticamente.
                    </p>
                    <div className="mt-6 flex items-center justify-center gap-6 text-xs text-gray-400">
                        <span>📊 .csv</span>
                        <span>📊 .tsv</span>
                        <span>📊 .txt</span>
                    </div>
                </div>
            )}

            {/* ─── Step 2: Preview & Map ──────────────────── */}
            {step === 'preview' && (
                <div className="space-y-6">
                    {/* Column Mapping */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                        <h2 className="font-bold text-gray-900 mb-1">🔗 Mapeamento de Colunas</h2>
                        <p className="text-xs text-gray-400 mb-4">
                            Associe as colunas do seu CSV aos campos do Nexus Market.
                            Campos com ⚡ foram detectados automaticamente.
                        </p>

                        <div className="grid grid-cols-2 gap-3">
                            {headers.map(h => (
                                <div key={h} className="flex items-center gap-2">
                                    <span className="text-sm text-gray-600 font-mono bg-gray-50 px-3 py-2 rounded-lg flex-1 truncate">
                                        {h}
                                    </span>
                                    <span className="text-gray-300">→</span>
                                    <select
                                        value={columnMap[h] || ''}
                                        onChange={(e) => setColumnMap(prev => {
                                            const next = { ...prev };
                                            // Remove any other mapping to this field
                                            Object.keys(next).forEach(k => { if (next[k] === e.target.value && k !== h) delete next[k]; });
                                            if (e.target.value) next[h] = e.target.value;
                                            else delete next[h];
                                            return next;
                                        })}
                                        className="text-sm border border-gray-200 rounded-lg px-3 py-2 flex-1 bg-white focus:ring-2 focus:ring-green-400 focus:border-green-400 outline-none"
                                    >
                                        <option value="">— ignorar —</option>
                                        {ALL_FIELDS.map(f => (
                                            <option key={f} value={f} disabled={Object.values(columnMap).includes(f) && columnMap[h] !== f}>
                                                {f === 'name' ? 'Nome *' : f === 'price' ? 'Preço *' : f}
                                                {columnMap[h] === f ? ' ⚡' : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                        </div>

                        {!isMappingValid && (
                            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                                ⚠️ Campos obrigatórios: <strong>Nome</strong> e <strong>Preço</strong> devem ser mapeados.
                            </div>
                        )}
                    </div>

                    {/* Data Preview */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900 text-sm">
                                📋 Preview ({csvData.length} produtos)
                            </h3>
                            <span className="text-xs text-gray-400">Mostrando primeiros 5</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        {headers.map(h => (
                                            <th key={h} className="text-left px-3 py-2 text-xs text-gray-500 font-medium">
                                                {h}
                                                {columnMap[h] && (
                                                    <span className="ml-1 text-green-500">→ {columnMap[h]}</span>
                                                )}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {csvData.slice(0, 5).map((row, i) => (
                                        <tr key={i} className="hover:bg-gray-50">
                                            {headers.map(h => (
                                                <td key={h} className="px-3 py-2 text-gray-700 truncate max-w-[200px]">
                                                    {row[h] || '—'}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => { setStep('upload'); setCsvData([]); setHeaders([]); setColumnMap({}); }}
                            className="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
                        >
                            ← Voltar
                        </button>
                        <button
                            onClick={startImport}
                            disabled={!isMappingValid}
                            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${isMappingValid
                                    ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-200'
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                }`}
                        >
                            ⚡ Importar {csvData.length} Produtos
                        </button>
                    </div>
                </div>
            )}

            {/* ─── Step 3: Enriching ─────────────────────── */}
            {step === 'enriching' && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                    <div className="animate-pulse text-6xl mb-6">⚡</div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Importando produtos...</h2>
                    <p className="text-sm text-gray-500 mb-8">
                        {progress.current} de {progress.total} produtos processados
                    </p>

                    {/* Progress Bar */}
                    <div className="w-full max-w-md mx-auto bg-gray-100 rounded-full h-3 overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-green-400 to-emerald-600 rounded-full transition-all duration-300"
                            style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }}
                        />
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                        {progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0}% completo
                    </p>
                </div>
            )}

            {/* ─── Step 4: Done ───────────────────────────── */}
            {step === 'done' && (
                <div className="space-y-6">
                    {/* Summary Card */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-2xl p-8 text-center">
                        <div className="text-5xl mb-4">🎉</div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Importação Concluída!</h2>
                        <div className="flex items-center justify-center gap-8 mt-6">
                            <div>
                                <p className="text-3xl font-black text-green-600">
                                    {results.filter(r => r.status === 'success').length}
                                </p>
                                <p className="text-xs text-gray-500">Importados</p>
                            </div>
                            <div className="w-px h-10 bg-gray-200" />
                            <div>
                                <p className="text-3xl font-black text-red-500">
                                    {results.filter(r => r.status === 'error').length}
                                </p>
                                <p className="text-xs text-gray-500">Erros</p>
                            </div>
                            <div className="w-px h-10 bg-gray-200" />
                            <div>
                                <p className="text-3xl font-black text-amber-500">
                                    {results.filter(r => r.quality_score < 50).length}
                                </p>
                                <p className="text-xs text-gray-500">Precisam de IA</p>
                            </div>
                        </div>
                    </div>

                    {/* Results Table */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Produto</th>
                                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Status</th>
                                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Qualidade</th>
                                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Imagem</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {results.map((r, i) => (
                                    <tr key={i} className={r.status === 'error' ? 'bg-red-50/50' : ''}>
                                        <td className="px-4 py-3 font-medium text-gray-900">{r.name}</td>
                                        <td className="px-4 py-3 text-center">
                                            {r.status === 'success' ? (
                                                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">✅ OK</span>
                                            ) : (
                                                <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium" title={r.error}>❌ Erro</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${r.quality_score >= 75 ? 'bg-green-100 text-green-700'
                                                    : r.quality_score >= 50 ? 'bg-yellow-100 text-yellow-700'
                                                        : 'bg-red-100 text-red-700'
                                                }`}>{r.quality_score}%</span>
                                        </td>
                                        <td className="px-4 py-3 text-center text-xs text-gray-500">{r.image_source}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => { setStep('upload'); setCsvData([]); setHeaders([]); setColumnMap({}); setResults([]); }}
                            className="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
                        >
                            📁 Importar outro arquivo
                        </button>
                        <a
                            href="/dashboard/products"
                            className="flex-1 text-center py-3 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-colors shadow-lg shadow-green-200"
                        >
                            📦 Ver Produtos Importados
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
}
