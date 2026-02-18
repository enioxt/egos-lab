'use client';

import React, { useState } from 'react';
import { AlertTriangle, Shield, Lock, X, Loader2 } from 'lucide-react';
import { useAudit } from '@/hooks/useAudit';

interface BreakTheGlassModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (justification: string) => void;
    resourceType: string;
    resourceId: string;
    resourceName: string;
    targetOperation?: string;
}

export default function BreakTheGlassModal({
    isOpen,
    onClose,
    onConfirm,
    resourceType,
    resourceId,
    resourceName,
    targetOperation
}: BreakTheGlassModalProps) {
    const [justification, setJustification] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { logBreakTheGlass } = useAudit();

    const handleConfirm = async () => {
        if (!justification.trim()) {
            setError('Justificativa é obrigatória');
            return;
        }

        if (justification.length < 10) {
            setError('Justificativa deve ter no mínimo 10 caracteres');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Log to audit trail
            await logBreakTheGlass(resourceType as any, resourceId, justification);
            
            // Call parent callback
            onConfirm(justification);
            
            // Reset and close
            setJustification('');
            onClose();
        } catch (err) {
            setError('Erro ao registrar acesso');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-slate-900 border border-red-500/30 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
                {/* Header - Warning Style */}
                <div className="bg-red-500/10 border-b border-red-500/30 p-6">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-red-500/20 rounded-xl">
                            <AlertTriangle className="w-8 h-8 text-red-400" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-xl font-bold text-white">
                                Acesso a Dados Restritos
                            </h2>
                            <p className="text-sm text-red-300 mt-1">
                                Esta ação será registrada na auditoria do sistema
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {/* Resource Info */}
                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                        <div className="flex items-center gap-3 mb-2">
                            <Shield className="w-5 h-5 text-slate-400" />
                            <span className="text-sm text-slate-400">Recurso solicitado:</span>
                        </div>
                        <p className="font-medium text-white">{resourceName}</p>
                        {targetOperation && (
                            <p className="text-sm text-slate-500 mt-1">
                                Operação: {targetOperation}
                            </p>
                        )}
                    </div>

                    {/* Justification */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Justificativa do Acesso <span className="text-red-400">*</span>
                        </label>
                        <textarea
                            value={justification}
                            onChange={(e) => {
                                setJustification(e.target.value);
                                setError('');
                            }}
                            placeholder="Ex: Investigação de vínculo cruzado com arma de fogo apreendida na Op. Raposa..."
                            rows={4}
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-red-500 resize-none"
                        />
                        {error && (
                            <p className="text-sm text-red-400 mt-2">{error}</p>
                        )}
                    </div>

                    {/* Warning */}
                    <div className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                        <Lock className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-amber-300">
                            <p className="font-medium">Aviso de Compliance</p>
                            <p className="text-amber-400/80 mt-1">
                                O responsável pela operação será notificado sobre este acesso.
                                A justificativa ficará registrada permanentemente no histórico.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-800/50 border-t border-slate-800 flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                        disabled={loading}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={loading || !justification.trim()}
                        className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 disabled:bg-red-600/50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Registrando...
                            </>
                        ) : (
                            <>
                                <Shield className="w-4 h-4" />
                                Confirmar Acesso
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
