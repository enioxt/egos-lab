'use client';

/**
 * Justification Modal (Compliance)
 * 
 * Requires user to provide a case number before accessing sensitive data.
 * This protects officers from accusations of authority abuse.
 * 
 * Usage:
 * <JustificationModal
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   onConfirm={(caseNumber) => handleAccess(caseNumber)}
 *   dataType="sigilo_bancario"
 * />
 */

import React, { useState } from 'react';
import { X, Shield, FileText, AlertTriangle, Lock } from 'lucide-react';

export type SensitiveDataType = 
    | 'sigilo_bancario'
    | 'sigilo_fiscal'
    | 'sigilo_telefonico'
    | 'dados_medicos'
    | 'antecedentes'
    | 'interceptacao'
    | 'outro';

interface JustificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (justification: JustificationData) => void;
    dataType: SensitiveDataType;
    entityName?: string;
}

export interface JustificationData {
    caseNumber: string;
    caseType: string;
    reason: string;
    dataType: SensitiveDataType;
    timestamp: string;
}

const DATA_TYPE_LABELS: Record<SensitiveDataType, string> = {
    sigilo_bancario: 'Sigilo Bancário',
    sigilo_fiscal: 'Sigilo Fiscal',
    sigilo_telefonico: 'Sigilo Telefônico',
    dados_medicos: 'Dados Médicos',
    antecedentes: 'Antecedentes Criminais',
    interceptacao: 'Interceptação Telefônica',
    outro: 'Dados Sensíveis'
};

const CASE_TYPES = [
    { value: 'inquerito', label: 'Inquérito Policial' },
    { value: 'procedimento', label: 'Procedimento Investigatório' },
    { value: 'mandado', label: 'Mandado Judicial' },
    { value: 'autorizacao', label: 'Autorização Judicial' },
    { value: 'requisicao', label: 'Requisição do MP' },
];

export default function JustificationModal({
    isOpen,
    onClose,
    onConfirm,
    dataType,
    entityName
}: JustificationModalProps) {
    const [caseNumber, setCaseNumber] = useState('');
    const [caseType, setCaseType] = useState('inquerito');
    const [reason, setReason] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = () => {
        setError(null);

        // Validate case number
        if (!caseNumber.trim()) {
            setError('Informe o número do procedimento');
            return;
        }

        // Validate format (basic check for numbers/letters/dashes)
        const caseRegex = /^[\w\-\/\.]+$/;
        if (!caseRegex.test(caseNumber)) {
            setError('Número do procedimento inválido');
            return;
        }

        // Create justification data
        const justification: JustificationData = {
            caseNumber: caseNumber.trim().toUpperCase(),
            caseType,
            reason: reason.trim() || 'Consulta para investigação',
            dataType,
            timestamp: new Date().toISOString()
        };

        onConfirm(justification);
        
        // Reset form
        setCaseNumber('');
        setReason('');
        setCaseType('inquerito');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
                onClick={onClose}
            />
            
            {/* Modal */}
            <div className="relative bg-slate-900 rounded-2xl border border-amber-500/30 shadow-2xl w-full max-w-md overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-amber-900/50 to-red-900/50 px-6 py-4 border-b border-amber-500/30">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-500/20 rounded-lg">
                                <Shield className="w-5 h-5 text-amber-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">
                                    Acesso a Dados Sensíveis
                                </h2>
                                <p className="text-sm text-amber-400/80">
                                    {DATA_TYPE_LABELS[dataType]}
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={onClose}
                            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>
                </div>

                {/* Warning */}
                <div className="px-6 py-3 bg-amber-500/10 border-b border-amber-500/20">
                    <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-amber-300/90">
                            <strong>Aviso Legal:</strong> O acesso a dados protegidos por sigilo 
                            requer fundamentação legal. Este registro será armazenado para 
                            auditoria e poderá ser requisitado em processos judiciais.
                        </p>
                    </div>
                </div>

                {/* Form */}
                <div className="p-6 space-y-4">
                    {entityName && (
                        <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                            <p className="text-xs text-slate-400">Consultando dados de:</p>
                            <p className="text-sm font-medium text-white">{entityName}</p>
                        </div>
                    )}

                    {/* Case Type */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">
                            Tipo de Procedimento *
                        </label>
                        <select
                            value={caseType}
                            onChange={(e) => setCaseType(e.target.value)}
                            className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-amber-500 focus:outline-none"
                        >
                            {CASE_TYPES.map(type => (
                                <option key={type.value} value={type.value}>
                                    {type.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Case Number */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">
                            <Lock className="w-3.5 h-3.5 inline mr-1" />
                            Número do Procedimento *
                        </label>
                        <input
                            type="text"
                            value={caseNumber}
                            onChange={(e) => setCaseNumber(e.target.value)}
                            placeholder="Ex: 0024.25.000001-0"
                            className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                            autoFocus
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            Número do inquérito, procedimento ou mandado judicial
                        </p>
                    </div>

                    {/* Reason (optional) */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">
                            <FileText className="w-3.5 h-3.5 inline mr-1" />
                            Justificativa (opcional)
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Descreva brevemente o motivo da consulta..."
                            rows={2}
                            className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none resize-none"
                        />
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                            <p className="text-sm text-red-400">{error}</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-800/50 border-t border-slate-700 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-5 py-2 bg-amber-600 hover:bg-amber-500 rounded-lg text-white font-medium transition-colors flex items-center gap-2"
                    >
                        <Shield className="w-4 h-4" />
                        Confirmar Acesso
                    </button>
                </div>
            </div>
        </div>
    );
}

/**
 * Hook to use justification modal
 */
export function useJustificationRequired() {
    const [isOpen, setIsOpen] = React.useState(false);
    const [dataType, setDataType] = React.useState<SensitiveDataType>('outro');
    const [entityName, setEntityName] = React.useState<string>();
    const [resolveRef, setResolveRef] = React.useState<((data: JustificationData | null) => void) | null>(null);

    const requireJustification = (
        type: SensitiveDataType,
        entity?: string
    ): Promise<JustificationData | null> => {
        return new Promise((resolve) => {
            setDataType(type);
            setEntityName(entity);
            setResolveRef(() => resolve);
            setIsOpen(true);
        });
    };

    const handleConfirm = (data: JustificationData) => {
        setIsOpen(false);
        resolveRef?.(data);
    };

    const handleClose = () => {
        setIsOpen(false);
        resolveRef?.(null);
    };

    const ModalComponent = () => (
        <JustificationModal
            isOpen={isOpen}
            onClose={handleClose}
            onConfirm={handleConfirm}
            dataType={dataType}
            entityName={entityName}
        />
    );

    return {
        requireJustification,
        JustificationModalComponent: ModalComponent
    };
}
