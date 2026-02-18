'use client';

/**
 * Loading Step Components for Document Upload
 * 
 * Small reusable components for loading states
 */

import { Loader2, AlertTriangle, CheckCircle2, FileText, Save, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { DuplicateMatch } from './constants';

interface BatchProgress {
    current: number;
    total: number;
    currentFileName: string;
}

// ============================================
// CHECKING STEP
// ============================================

export function CheckingStep() {
    return (
        <div className="py-12 text-center">
            <Loader2 className="w-16 h-16 mx-auto text-cyan-500 animate-spin" />
            <p className="mt-4 text-lg font-medium text-white">Verificando documento...</p>
            <p className="text-sm text-slate-400">Checando se já foi processado anteriormente</p>
        </div>
    );
}

// ============================================
// EXTRACTING STEP
// ============================================

interface ExtractingStepProps {
    batchProgress: BatchProgress;
}

export function ExtractingStep({ batchProgress }: ExtractingStepProps) {
    return (
        <div className="py-12 text-center">
            <Loader2 className="w-16 h-16 mx-auto text-blue-500 animate-spin" />
            
            {batchProgress.total > 1 ? (
                <>
                    <p className="mt-4 text-lg font-medium text-white">
                        Processando arquivo {batchProgress.current} de {batchProgress.total}
                    </p>
                    <p className="text-sm text-slate-400 truncate max-w-xs mx-auto">
                        {batchProgress.currentFileName}
                    </p>
                    <div className="mt-4 w-64 mx-auto h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-blue-500 transition-all duration-300"
                            style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                        />
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                        Cada arquivo leva alguns segundos...
                    </p>
                </>
            ) : (
                <>
                    <p className="mt-4 text-lg font-medium text-white">Analisando documento...</p>
                    <p className="text-sm text-slate-400">Isso pode levar alguns segundos</p>
                </>
            )}
        </div>
    );
}

// ============================================
// SAVING STEP
// ============================================

export function SavingStep() {
    return (
        <div className="py-12 text-center">
            <div className="relative w-16 h-16 mx-auto">
                <Save className="w-16 h-16 text-blue-500" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
            </div>
            <p className="mt-4 text-lg font-medium text-white">Salvando no banco de dados...</p>
            <p className="text-sm text-slate-400">Verificando duplicatas e criando conexões</p>
        </div>
    );
}

// ============================================
// ERROR STEP
// ============================================

interface ErrorStepProps {
    error: string;
    onRetry: () => void;
}

export function ErrorStep({ error, onRetry }: ErrorStepProps) {
    return (
        <div className="py-12 text-center">
            <AlertTriangle className="w-16 h-16 mx-auto text-red-500" />
            <p className="mt-4 text-lg font-medium text-white">Erro na extração</p>
            <p className="text-sm text-red-400 mt-2">{error}</p>
            <button
                onClick={onRetry}
                className="mt-6 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg flex items-center gap-2 mx-auto transition-colors"
            >
                <RotateCcw className="w-4 h-4" />
                Tentar Novamente
            </button>
        </div>
    );
}

// ============================================
// SUCCESS STEP
// ============================================

interface SuccessStepProps {
    saveResult: any;
    investigationId: string;
}

export function SuccessStep({ saveResult, investigationId }: SuccessStepProps) {
    const entitiesCount = saveResult?.stats?.entities_saved || saveResult?.stats?.entidades_salvas || 0;
    const relationshipsCount = saveResult?.stats?.relationships_saved || saveResult?.stats?.relacionamentos_salvos || 0;
    
    return (
        <div className="py-8 text-center space-y-6">
            <CheckCircle2 className="w-16 h-16 mx-auto text-emerald-500" />
            <div>
                <p className="text-lg font-medium text-white">Documento processado com sucesso!</p>
                <p className="text-sm text-slate-400 mt-1">
                    {entitiesCount} entidades e {relationshipsCount} relacionamentos salvos
                </p>
            </div>
            
            {/* Stats Cards */}
            {saveResult?.stats && (
                <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                    <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                        <p className="text-2xl font-bold text-blue-400">{entitiesCount}</p>
                        <p className="text-xs text-slate-400">Entidades</p>
                    </div>
                    <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
                        <p className="text-2xl font-bold text-purple-400">{relationshipsCount}</p>
                        <p className="text-xs text-slate-400">Vínculos</p>
                    </div>
                </div>
            )}
            
            {/* Cross-Case Alerts */}
            {saveResult?.crossCaseAlerts && saveResult.crossCaseAlerts.length > 0 && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-left">
                    <p className="font-medium text-amber-400 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        {saveResult.crossCaseAlerts.length} alerta(s) cross-case gerados!
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                        Entidades encontradas em outras operações. Verifique na Central.
                    </p>
                </div>
            )}
            
            {/* Action Link */}
            <Link
                href={`/investigation/${investigationId}`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
            >
                Ver Operação
            </Link>
        </div>
    );
}

// ============================================
// DUPLICATE WARNING STEP
// ============================================

interface DuplicateWarningStepProps {
    duplicateMatches: DuplicateMatch[];
    onProceed: () => void;
    onCancel: () => void;
}

export function DuplicateWarningStep({ duplicateMatches, onProceed, onCancel }: DuplicateWarningStepProps) {
    return (
        <div className="py-6 space-y-6">
            <div className="text-center">
                <AlertTriangle className="w-16 h-16 mx-auto text-amber-400" />
                <p className="mt-4 text-lg font-medium text-white">Documento já existe!</p>
                <p className="text-sm text-slate-400">
                    Este arquivo foi encontrado em {duplicateMatches.length} operação(ões)
                </p>
            </div>

            <div className="space-y-3">
                {duplicateMatches.map((match, idx) => (
                    <div 
                        key={idx}
                        className={`p-4 rounded-xl border ${
                            match.is_same_investigation 
                                ? 'bg-amber-500/10 border-amber-500/30' 
                                : 'bg-cyan-500/10 border-cyan-500/30'
                        }`}
                    >
                        <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${
                                match.is_same_investigation 
                                    ? 'bg-amber-500/20' 
                                    : 'bg-cyan-500/20'
                            }`}>
                                <FileText className={`w-5 h-5 ${
                                    match.is_same_investigation 
                                        ? 'text-amber-400' 
                                        : 'text-cyan-400'
                                }`} />
                            </div>
                            <div className="flex-1">
                                <a 
                                    href={`/investigation/${match.investigation_id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-medium text-white hover:text-blue-400 hover:underline inline-flex items-center gap-1"
                                >
                                    {match.investigation_title}
                                    <span className="text-slate-500 text-xs">↗</span>
                                </a>
                                {match.unit_name && (
                                    <p className="text-xs text-slate-400">{match.unit_name}</p>
                                )}
                                <p className="text-xs text-slate-500 mt-1">
                                    Processado em {new Date(match.uploaded_at).toLocaleDateString('pt-BR')}
                                    {match.is_same_investigation && (
                                        <span className="ml-2 px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded">
                                            Mesma operação
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-4 bg-slate-800 rounded-xl">
                <p className="text-sm text-slate-300">
                    <strong>O que acontece se processar novamente?</strong>
                </p>
                <ul className="mt-2 space-y-1 text-sm text-slate-400">
                    <li>• Entidades idênticas <strong>não serão duplicadas</strong></li>
                    <li>• Apenas informações novas serão adicionadas</li>
                    <li>• Conexões cross-case serão detectadas automaticamente</li>
                </ul>
            </div>
        </div>
    );
}
