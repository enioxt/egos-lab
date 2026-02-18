'use client';

import React, { useState, useEffect } from 'react';
import { Edit3, AlertTriangle, Check, X, Users, Clock, Shield } from 'lucide-react';
import EditEntityModal from './EditEntityModal';

interface EditButtonProps {
    entityId: string;
    investigationId: string;
    entityName: string;
    currentData: Record<string, any>;
    entityType?: string;
    onEditStart?: () => void;
}

export default function EditButton({ 
    entityId, 
    investigationId, 
    entityName,
    currentData,
    entityType = 'DEFAULT',
    onEditStart 
}: EditButtonProps) {
    const [showInfo, setShowInfo] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);

    // Check for pending edits
    useEffect(() => {
        const checkPending = async () => {
            try {
                const res = await fetch(`/api/intelink/edits?entity_id=${entityId}&status=pending`);
                if (res.ok) {
                    const data = await res.json();
                    setPendingCount(data.edits?.length || 0);
                }
            } catch (e) {
                console.error('Error checking pending edits:', e);
            }
        };
        checkPending();
    }, [entityId]);

    const handleClick = () => {
        setShowInfo(true);
    };

    const handleContinue = () => {
        setShowInfo(false);
        setShowEditModal(true);
        onEditStart?.();
    };

    return (
        <>
            {/* Edit Button with Badge */}
            <button
                onClick={handleClick}
                className="relative flex items-center gap-2 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 rounded-lg text-amber-400 text-sm transition-colors"
                title="Editar entidade"
            >
                <Edit3 className="w-4 h-4" />
                <span className="hidden sm:inline">Editar</span>
                
                {/* Pending Badge */}
                {pendingCount > 0 && (
                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {pendingCount}
                    </span>
                )}
            </button>

            {/* Info Modal */}
            {showInfo && (
                <div 
                    className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4"
                    onClick={(e) => e.target === e.currentTarget && setShowInfo(false)}
                >
                    <div className="bg-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-amber-900/50 to-orange-900/50 p-5 border-b border-amber-500/30">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-500/20 rounded-xl">
                                    <Shield className="w-6 h-6 text-amber-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white">Sistema de Edições</h2>
                                    <p className="text-amber-300/70 text-sm">Governança e Auditoria</p>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-5 space-y-4">
                            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700">
                                <p className="text-slate-300 text-sm mb-3">
                                    Você está prestes a editar:
                                </p>
                                <p className="text-white font-semibold text-lg">
                                    {entityName}
                                </p>
                            </div>

                            {/* Rules */}
                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <div className="p-1.5 bg-blue-500/20 rounded-lg mt-0.5">
                                        <Users className="w-4 h-4 text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="text-white font-medium text-sm">Quorum de 2 pessoas</p>
                                        <p className="text-slate-400 text-xs">
                                            Edições precisam de aprovação de outro membro da equipe.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="p-1.5 bg-emerald-500/20 rounded-lg mt-0.5">
                                        <Check className="w-4 h-4 text-emerald-400" />
                                    </div>
                                    <div>
                                        <p className="text-white font-medium text-sm">100% Auditável</p>
                                        <p className="text-slate-400 text-xs">
                                            Todas as edições ficam registradas com autor e timestamp.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="p-1.5 bg-purple-500/20 rounded-lg mt-0.5">
                                        <Clock className="w-4 h-4 text-purple-400" />
                                    </div>
                                    <div>
                                        <p className="text-white font-medium text-sm">Pendente até aprovação</p>
                                        <p className="text-slate-400 text-xs">
                                            A edição só é aplicada após o quorum ser atingido.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Pending Warning */}
                            {pendingCount > 0 && (
                                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-red-300 font-medium text-sm">
                                            {pendingCount} edição(ões) pendente(s)
                                        </p>
                                        <p className="text-red-300/70 text-xs">
                                            Aguarde a resolução antes de propor novas edições.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-5 border-t border-slate-700 flex gap-3">
                            <button
                                onClick={() => setShowInfo(false)}
                                className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-xl text-slate-300 font-medium transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleContinue}
                                disabled={pendingCount > 0}
                                className="flex-1 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                <Edit3 className="w-4 h-4" />
                                Continuar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Entity Modal */}
            <EditEntityModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                entityId={entityId}
                investigationId={investigationId}
                entityName={entityName}
                currentData={currentData}
                entityType={entityType}
            />
        </>
    );
}
