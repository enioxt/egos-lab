'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, AlertTriangle, Loader2, Check } from 'lucide-react';

interface EditEntityModalProps {
    isOpen: boolean;
    onClose: () => void;
    entityId: string;
    investigationId: string;
    entityName: string;
    currentData: Record<string, any>;
    entityType?: string;
}

// Campos editáveis por tipo de entidade
const EDITABLE_FIELDS: Record<string, { key: string; label: string; type: 'text' | 'textarea' }[]> = {
    PERSON: [
        { key: 'cpf', label: 'CPF', type: 'text' },
        { key: 'rg', label: 'RG', type: 'text' },
        { key: 'nome_mae', label: 'Nome da Mãe', type: 'text' },
        { key: 'nome_pai', label: 'Nome do Pai', type: 'text' },
        { key: 'data_nascimento', label: 'Data de Nascimento', type: 'text' },
        { key: 'endereco', label: 'Endereço', type: 'text' },
        { key: 'telefone', label: 'Telefone', type: 'text' },
        { key: 'profissao', label: 'Profissão', type: 'text' },
        { key: 'observacoes', label: 'Observações', type: 'textarea' },
    ],
    VEHICLE: [
        { key: 'plate', label: 'Placa', type: 'text' },
        { key: 'brand', label: 'Marca', type: 'text' },
        { key: 'model', label: 'Modelo', type: 'text' },
        { key: 'color', label: 'Cor', type: 'text' },
        { key: 'year', label: 'Ano', type: 'text' },
        { key: 'chassis', label: 'Chassi', type: 'text' },
        { key: 'renavam', label: 'Renavam', type: 'text' },
        { key: 'owner', label: 'Proprietário', type: 'text' },
    ],
    LOCATION: [
        { key: 'endereco', label: 'Endereço Completo', type: 'text' },
        { key: 'cep', label: 'CEP', type: 'text' },
        { key: 'bairro', label: 'Bairro', type: 'text' },
        { key: 'cidade', label: 'Cidade', type: 'text' },
        { key: 'estado', label: 'Estado', type: 'text' },
        { key: 'latitude', label: 'Latitude', type: 'text' },
        { key: 'longitude', label: 'Longitude', type: 'text' },
        { key: 'descricao', label: 'Descrição', type: 'textarea' },
    ],
    ORGANIZATION: [
        { key: 'cnpj', label: 'CNPJ', type: 'text' },
        { key: 'razao_social', label: 'Razão Social', type: 'text' },
        { key: 'nome_fantasia', label: 'Nome Fantasia', type: 'text' },
        { key: 'endereco', label: 'Endereço', type: 'text' },
        { key: 'telefone', label: 'Telefone', type: 'text' },
        { key: 'email', label: 'E-mail', type: 'text' },
        { key: 'atividade', label: 'Atividade Principal', type: 'text' },
    ],
    FIREARM: [
        { key: 'type', label: 'Tipo', type: 'text' },
        { key: 'brand', label: 'Marca', type: 'text' },
        { key: 'model', label: 'Modelo', type: 'text' },
        { key: 'caliber', label: 'Calibre', type: 'text' },
        { key: 'serial_number', label: 'Número de Série', type: 'text' },
        { key: 'registration', label: 'Registro', type: 'text' },
        { key: 'origin', label: 'Origem', type: 'text' },
    ],
    DEFAULT: [
        { key: 'descricao', label: 'Descrição', type: 'textarea' },
        { key: 'observacoes', label: 'Observações', type: 'textarea' },
    ],
};

export default function EditEntityModal({
    isOpen,
    onClose,
    entityId,
    investigationId,
    entityName,
    currentData,
    entityType = 'DEFAULT'
}: EditEntityModalProps) {
    const [formData, setFormData] = useState<Record<string, string>>({});
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    // Initialize form with current data
    useEffect(() => {
        if (isOpen) {
            const initialData: Record<string, string> = {};
            const fields = EDITABLE_FIELDS[entityType] || EDITABLE_FIELDS.DEFAULT;
            fields.forEach(field => {
                initialData[field.key] = currentData[field.key] || '';
            });
            setFormData(initialData);
            setReason('');
            setSuccess(false);
            setError('');
        }
    }, [isOpen, currentData, entityType]);

    const handleChange = (key: string, value: string) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const handleSubmit = async () => {
        // Check if anything changed
        const changes: Record<string, { old: any; new: any }> = {};
        Object.keys(formData).forEach(key => {
            if (formData[key] !== (currentData[key] || '')) {
                changes[key] = {
                    old: currentData[key] || null,
                    new: formData[key] || null
                };
            }
        });

        if (Object.keys(changes).length === 0) {
            setError('Nenhuma alteração detectada.');
            return;
        }

        if (!reason.trim()) {
            setError('Por favor, informe o motivo da edição.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Get chat_id for edit system (bigint in database)
            const chatId = localStorage.getItem('intelink_chat_id');
            const memberName = localStorage.getItem('intelink_username') || 'Usuário';
            
            if (!chatId) {
                setError('Sessão expirada. Por favor, faça login novamente.');
                return;
            }
            
            const res = await fetch('/api/intelink/edits', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    entity_id: entityId,
                    investigation_id: investigationId,
                    proposed_by: parseInt(chatId), // Database uses bigint chat_id
                    proposed_by_name: memberName,
                    changes,
                    reason: reason.trim()
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Erro ao propor edição');
            }

            setSuccess(true);
            setTimeout(() => {
                onClose();
            }, 2000);

        } catch (e: any) {
            setError(e.message || 'Erro ao salvar edição');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const fields = EDITABLE_FIELDS[entityType] || EDITABLE_FIELDS.DEFAULT;

    return (
        <div 
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-[70] p-4"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="bg-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-900/50 to-cyan-900/50 p-5 border-b border-blue-500/30 flex items-center justify-between flex-shrink-0">
                    <div>
                        <h2 className="text-lg font-bold text-white">Editar Entidade</h2>
                        <p className="text-blue-300/70 text-sm">{entityName}</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Success State */}
                {success ? (
                    <div className="p-8 text-center">
                        <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Check className="w-8 h-8 text-emerald-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Edição Proposta!</h3>
                        <p className="text-slate-400">
                            Aguardando aprovação de outro membro da equipe.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Content - Scrollable */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-4">
                            {/* Error */}
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                                    <p className="text-red-300 text-sm">{error}</p>
                                </div>
                            )}

                            {/* Fields */}
                            {fields.map(field => (
                                <div key={field.key}>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">
                                        {field.label}
                                    </label>
                                    {field.type === 'textarea' ? (
                                        <textarea
                                            value={formData[field.key] || ''}
                                            onChange={(e) => handleChange(field.key, e.target.value)}
                                            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                            rows={3}
                                            placeholder={`Digite ${field.label.toLowerCase()}...`}
                                        />
                                    ) : (
                                        <input
                                            type="text"
                                            value={formData[field.key] || ''}
                                            onChange={(e) => handleChange(field.key, e.target.value)}
                                            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder={`Digite ${field.label.toLowerCase()}...`}
                                        />
                                    )}
                                    {currentData[field.key] && formData[field.key] !== currentData[field.key] && (
                                        <p className="text-xs text-amber-400 mt-1">
                                            Anterior: {currentData[field.key]}
                                        </p>
                                    )}
                                </div>
                            ))}

                            {/* Reason */}
                            <div className="pt-4 border-t border-slate-700">
                                <label className="block text-sm font-medium text-slate-300 mb-1">
                                    Motivo da Edição <span className="text-red-400">*</span>
                                </label>
                                <textarea
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                    rows={2}
                                    placeholder="Ex: Correção de dados após conferência com documento oficial..."
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-5 border-t border-slate-700 flex gap-3 flex-shrink-0">
                            <button
                                onClick={onClose}
                                disabled={loading}
                                className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 rounded-xl text-slate-300 font-medium transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50 rounded-xl text-white font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4" />
                                )}
                                Propor Edição
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
