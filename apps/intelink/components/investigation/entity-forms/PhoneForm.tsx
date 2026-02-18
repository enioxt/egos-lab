'use client';

import { EntityFormProps } from './types';
import { formatCPF, formatPhone } from '@/lib/masks';

const OPERATORS = [
    { value: 'vivo', label: 'Vivo' },
    { value: 'claro', label: 'Claro' },
    { value: 'tim', label: 'TIM' },
    { value: 'oi', label: 'Oi' },
    { value: 'nextel', label: 'Nextel' },
    { value: 'outro', label: 'Outro' },
];

const LINE_TYPES = [
    { value: 'pos_pago', label: 'Pós-pago' },
    { value: 'pre_pago', label: 'Pré-pago' },
    { value: 'controle', label: 'Controle' },
    { value: 'empresarial', label: 'Empresarial' },
];

export function PhoneForm({ entity, onUpdate }: EntityFormProps) {
    const updateMetadata = (key: string, value: string) => {
        onUpdate(entity.id, { metadata: { ...entity.metadata, [key]: value } });
    };

    return (
        <div className="space-y-3 mt-3">
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-xs text-slate-400 mb-1 block">Número</label>
                    <input
                        type="text"
                        placeholder="(00) 00000-0000"
                        value={entity.metadata.numero || ''}
                        onChange={(e) => updateMetadata('numero', formatPhone(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm"
                        maxLength={15}
                    />
                </div>
                <div>
                    <label className="text-xs text-slate-400 mb-1 block">Operadora</label>
                    <select
                        value={entity.metadata.operadora || ''}
                        onChange={(e) => updateMetadata('operadora', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm"
                    >
                        <option value="">Selecione</option>
                        {OPERATORS.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </select>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-xs text-slate-400 mb-1 block">Titular</label>
                    <input
                        type="text"
                        placeholder="Nome do titular"
                        value={entity.metadata.titular || ''}
                        onChange={(e) => updateMetadata('titular', e.target.value.toUpperCase())}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm uppercase"
                    />
                </div>
                <div>
                    <label className="text-xs text-slate-400 mb-1 block">CPF do Titular</label>
                    <input
                        type="text"
                        placeholder="000.000.000-00"
                        value={entity.metadata.cpf_titular || ''}
                        onChange={(e) => updateMetadata('cpf_titular', formatCPF(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm"
                        maxLength={14}
                    />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-xs text-slate-400 mb-1 block">Tipo de Linha</label>
                    <select
                        value={entity.metadata.tipo_linha || ''}
                        onChange={(e) => updateMetadata('tipo_linha', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm"
                    >
                        <option value="">Selecione</option>
                        {LINE_TYPES.map(t => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="text-xs text-slate-400 mb-1 block">IMEI do Aparelho</label>
                    <input
                        type="text"
                        placeholder="15 dígitos"
                        value={entity.metadata.imei || ''}
                        onChange={(e) => {
                            const imei = e.target.value.replace(/\D/g, '').slice(0, 15);
                            updateMetadata('imei', imei);
                        }}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm"
                        maxLength={15}
                    />
                </div>
            </div>
            <div>
                <label className="text-xs text-slate-400 mb-1 block">Observações</label>
                <textarea
                    placeholder="Informações adicionais (ex: telefone usado para tráfico, encontrado no local...)"
                    value={entity.metadata.observacoes || ''}
                    onChange={(e) => updateMetadata('observacoes', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm h-20 resize-none"
                />
            </div>
        </div>
    );
}
