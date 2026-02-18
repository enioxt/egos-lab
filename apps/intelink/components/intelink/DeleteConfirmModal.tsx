'use client';

import React from 'react';
import { AlertTriangle, X, Trash2, Shield, Users, FileText, Clock } from 'lucide-react';

interface DeleteConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    investigationTitle: string;
    entityCount: number;
    relationshipCount: number;
    createdAt: string;
    isDeleting?: boolean;
}

// Calcula a classificação da operação
function getClassification(entityCount: number, createdAt: string): {
    level: 'teste' | 'pequena' | 'media' | 'grande' | 'critica';
    label: string;
    color: string;
    quorum: number;
    description: string;
} {
    const ageInHours = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
    const ageInDays = ageInHours / 24;

    // Teste: ≤2 entidades e <24h
    if (entityCount <= 2 && ageInHours < 24) {
        return {
            level: 'teste',
            label: 'TESTE',
            color: 'text-slate-400 bg-slate-500/10 border-slate-500/30',
            quorum: 1,
            description: 'Operação de teste. Pode ser excluída pelo criador.'
        };
    }

    // Pequena: 3-10 entidades
    if (entityCount <= 10) {
        return {
            level: 'pequena',
            label: 'PEQUENA',
            color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
            quorum: 2,
            description: 'Requer aprovação de 2 pessoas da equipe.'
        };
    }

    // Média: 11-50 entidades
    if (entityCount <= 50) {
        return {
            level: 'media',
            label: 'MÉDIA',
            color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
            quorum: 3,
            description: 'Requer aprovação de 3 pessoas (50% da equipe).'
        };
    }

    // Grande: 51-100 entidades
    if (entityCount <= 100) {
        return {
            level: 'grande',
            label: 'GRANDE',
            color: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
            quorum: 5,
            description: 'Requer aprovação de 5 pessoas + supervisor.'
        };
    }

    // Crítica: >100 entidades ou >1 ano
    return {
        level: 'critica',
        label: 'CRÍTICA',
        color: 'text-red-400 bg-red-500/10 border-red-500/30',
        quorum: 999, // Requer admin
        description: 'Requer aprovação do Administrador Geral + equipe.'
    };
}

export default function DeleteConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    investigationTitle,
    entityCount,
    relationshipCount,
    createdAt,
    isDeleting = false
}: DeleteConfirmModalProps) {
    if (!isOpen) return null;

    const classification = getClassification(entityCount, createdAt);
    const canDeleteDirectly = classification.level === 'teste';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
                {/* Header com ícone de alerta */}
                <div className="bg-red-500/10 border-b border-red-500/20 p-6">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-red-500/20 rounded-xl">
                            <AlertTriangle className="w-8 h-8 text-red-400" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-xl font-bold text-white">
                                Excluir Operação
                            </h2>
                            <p className="text-red-300 text-sm mt-1">
                                Esta ação moverá a operação para a lixeira
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
                    {/* Investigation info */}
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                        <h3 className="font-semibold text-white text-lg mb-3">
                            {investigationTitle}
                        </h3>
                        <div className="grid grid-cols-3 gap-3 text-center">
                            <div className="bg-slate-700/30 rounded-lg p-2">
                                <Users className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                                <span className="text-lg font-bold text-white">{entityCount}</span>
                                <p className="text-xs text-slate-400">Entidades</p>
                            </div>
                            <div className="bg-slate-700/30 rounded-lg p-2">
                                <FileText className="w-4 h-4 text-purple-400 mx-auto mb-1" />
                                <span className="text-lg font-bold text-white">{relationshipCount}</span>
                                <p className="text-xs text-slate-400">Conexões</p>
                            </div>
                            <div className="bg-slate-700/30 rounded-lg p-2">
                                <Clock className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                                <span className="text-sm font-bold text-white">
                                    {new Date(createdAt).toLocaleDateString('pt-BR')}
                                </span>
                                <p className="text-xs text-slate-400">Criada em</p>
                            </div>
                        </div>
                    </div>

                    {/* Classification badge */}
                    <div className={`rounded-xl p-4 border ${classification.color}`}>
                        <div className="flex items-center gap-3">
                            <Shield className="w-5 h-5" />
                            <div>
                                <span className="font-semibold">
                                    Classificação: {classification.label}
                                </span>
                                <p className="text-sm opacity-80 mt-0.5">
                                    {classification.description}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Warning message */}
                    <div className="text-sm text-slate-400">
                        <p>
                            {canDeleteDirectly ? (
                                <>
                                    ✅ Você pode excluir esta operação diretamente.
                                    <br />
                                    Os dados serão movidos para a lixeira por 30 dias.
                                </>
                            ) : (
                                <>
                                    ⚠️ Esta operação requer aprovação de <strong className="text-white">{classification.quorum} pessoa(s)</strong> para ser excluída.
                                    <br />
                                    Uma solicitação será enviada para a equipe.
                                </>
                            )}
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-slate-700 p-4 flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={isDeleting}
                        className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl font-medium transition-colors disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-500 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isDeleting ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Excluindo...
                            </>
                        ) : (
                            <>
                                <Trash2 className="w-4 h-4" />
                                {canDeleteDirectly ? 'Excluir Agora' : 'Solicitar Exclusão'}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
