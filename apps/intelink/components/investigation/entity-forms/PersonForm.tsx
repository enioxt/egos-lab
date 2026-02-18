'use client';

import { EntityFormProps } from './types';
import { formatCPF, formatRG, formatPhone, BRAZILIAN_STATES, BrazilianState } from '@/lib/masks';

export function PersonForm({ entity, onUpdate }: EntityFormProps) {
    const updateMetadata = (key: string, value: string) => {
        onUpdate(entity.id, { metadata: { ...entity.metadata, [key]: value } });
    };

    return (
        <div className="space-y-3 mt-3">
            <div className="grid grid-cols-3 gap-3">
                <div>
                    <label className="text-xs text-slate-400 mb-1 block">CPF</label>
                    <input
                        type="text"
                        placeholder="000.000.000-00"
                        value={entity.metadata.cpf || ''}
                        onChange={(e) => updateMetadata('cpf', formatCPF(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm"
                        maxLength={14}
                    />
                </div>
                <div>
                    <label className="text-xs text-slate-400 mb-1 block">UF do RG</label>
                    <select
                        value={entity.metadata.rg_uf || ''}
                        onChange={(e) => {
                            onUpdate(entity.id, { 
                                metadata: { ...entity.metadata, rg_uf: e.target.value, rg: '' }
                            });
                        }}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm"
                    >
                        <option value="">Selecione</option>
                        {BRAZILIAN_STATES.map(state => (
                            <option key={state.code} value={state.code}>{state.code} - {state.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="text-xs text-slate-400 mb-1 block">RG</label>
                    <input
                        type="text"
                        placeholder={entity.metadata.rg_uf ? 'Digite o RG' : 'Selecione UF primeiro'}
                        value={entity.metadata.rg || ''}
                        onChange={(e) => {
                            const uf = entity.metadata.rg_uf as BrazilianState;
                            if (uf) {
                                updateMetadata('rg', formatRG(e.target.value, uf));
                            }
                        }}
                        disabled={!entity.metadata.rg_uf}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm disabled:opacity-50"
                    />
                </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
                <div>
                    <label className="text-xs text-slate-400 mb-1 block">Vulgo/Alcunha</label>
                    <input
                        type="text"
                        placeholder="Ex: Zé do Bar"
                        value={entity.metadata.vulgo || ''}
                        onChange={(e) => updateMetadata('vulgo', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm"
                    />
                </div>
                <div>
                    <label className="text-xs text-slate-400 mb-1 block">Telefone</label>
                    <input
                        type="text"
                        placeholder="(00) 00000-0000"
                        value={entity.metadata.telefone || ''}
                        onChange={(e) => updateMetadata('telefone', formatPhone(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm"
                        maxLength={15}
                    />
                </div>
                <div>
                    <label className="text-xs text-slate-400 mb-1 block">Data Nascimento</label>
                    <input
                        type="date"
                        value={entity.metadata.data_nascimento || ''}
                        onChange={(e) => updateMetadata('data_nascimento', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm"
                    />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-xs text-slate-400 mb-1 block">Nome da Mãe</label>
                    <input
                        type="text"
                        placeholder="Nome completo"
                        value={entity.metadata.mae || ''}
                        onChange={(e) => updateMetadata('mae', e.target.value.toUpperCase())}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm uppercase"
                    />
                </div>
                <div>
                    <label className="text-xs text-slate-400 mb-1 block">Endereço</label>
                    <input
                        type="text"
                        placeholder="Rua, número, bairro, cidade"
                        value={entity.metadata.endereco || ''}
                        onChange={(e) => updateMetadata('endereco', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm"
                    />
                </div>
            </div>
        </div>
    );
}
