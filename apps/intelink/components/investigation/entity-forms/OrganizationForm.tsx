'use client';

import { EntityFormProps } from './types';
import { formatPhone } from '@/lib/masks';

const ORG_TYPES = [
    { value: 'empresa', label: 'Empresa' },
    { value: 'ong', label: 'ONG' },
    { value: 'associacao', label: 'Associação' },
    { value: 'sindicato', label: 'Sindicato' },
    { value: 'partido', label: 'Partido Político' },
    { value: 'faccao', label: 'Facção Criminosa' },
    { value: 'milicia', label: 'Milícia' },
    { value: 'quadrilha', label: 'Quadrilha' },
    { value: 'outro', label: 'Outro' },
];

export function OrganizationForm({ entity, onUpdate }: EntityFormProps) {
    const updateMetadata = (key: string, value: string) => {
        onUpdate(entity.id, { metadata: { ...entity.metadata, [key]: value } });
    };

    const formatCNPJ = (value: string) => {
        const digits = value.replace(/\D/g, '').slice(0, 14);
        let formatted = digits;
        if (digits.length > 2) formatted = `${digits.slice(0, 2)}.${digits.slice(2)}`;
        if (digits.length > 5) formatted = `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
        if (digits.length > 8) formatted = `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
        if (digits.length > 12) formatted = `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
        return formatted;
    };

    return (
        <div className="space-y-3 mt-3">
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-xs text-slate-400 mb-1 block">Tipo</label>
                    <select
                        value={entity.metadata.tipo_org || ''}
                        onChange={(e) => updateMetadata('tipo_org', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm"
                    >
                        <option value="">Selecione</option>
                        {ORG_TYPES.map(t => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="text-xs text-slate-400 mb-1 block">CNPJ</label>
                    <input
                        type="text"
                        placeholder="00.000.000/0000-00"
                        value={entity.metadata.cnpj || ''}
                        onChange={(e) => updateMetadata('cnpj', formatCNPJ(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm"
                        maxLength={18}
                    />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-xs text-slate-400 mb-1 block">Nome Fantasia</label>
                    <input
                        type="text"
                        placeholder="Nome fantasia"
                        value={entity.metadata.nome_fantasia || ''}
                        onChange={(e) => updateMetadata('nome_fantasia', e.target.value.toUpperCase())}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm uppercase"
                    />
                </div>
                <div>
                    <label className="text-xs text-slate-400 mb-1 block">Responsável Legal</label>
                    <input
                        type="text"
                        placeholder="Nome do responsável"
                        value={entity.metadata.responsavel || ''}
                        onChange={(e) => updateMetadata('responsavel', e.target.value.toUpperCase())}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm uppercase"
                    />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-xs text-slate-400 mb-1 block">Telefone</label>
                    <input
                        type="text"
                        placeholder="(00) 0000-0000"
                        value={entity.metadata.telefone || ''}
                        onChange={(e) => updateMetadata('telefone', formatPhone(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm"
                        maxLength={15}
                    />
                </div>
                <div>
                    <label className="text-xs text-slate-400 mb-1 block">Endereço</label>
                    <input
                        type="text"
                        placeholder="Endereço completo"
                        value={entity.metadata.endereco || ''}
                        onChange={(e) => updateMetadata('endereco', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm"
                    />
                </div>
            </div>
            <div>
                <label className="text-xs text-slate-400 mb-1 block">Atividade Principal</label>
                <input
                    type="text"
                    placeholder="Ex: Comércio de veículos, Tráfico de drogas..."
                    value={entity.metadata.atividade || ''}
                    onChange={(e) => updateMetadata('atividade', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm"
                />
            </div>
        </div>
    );
}
