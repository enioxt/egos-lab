'use client';

import { EntityFormProps } from './types';
import { BRAZILIAN_STATES } from '@/lib/masks';

const LOCATION_TYPES = [
    { value: 'residencia', label: 'Residência' },
    { value: 'comercio', label: 'Comércio' },
    { value: 'via_publica', label: 'Via Pública' },
    { value: 'terreno_baldio', label: 'Terreno Baldio' },
    { value: 'local_crime', label: 'Local do Crime' },
    { value: 'carcere', label: 'Cárcere/Prisão' },
    { value: 'hospital', label: 'Hospital' },
    { value: 'escola', label: 'Escola' },
    { value: 'outro', label: 'Outro' },
];

export function LocationForm({ entity, onUpdate }: EntityFormProps) {
    const updateMetadata = (key: string, value: string) => {
        onUpdate(entity.id, { metadata: { ...entity.metadata, [key]: value } });
    };

    const formatCEP = (value: string) => {
        const cep = value.replace(/\D/g, '').slice(0, 8);
        return cep.length > 5 ? `${cep.slice(0, 5)}-${cep.slice(5)}` : cep;
    };

    return (
        <div className="space-y-3 mt-3">
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-xs text-slate-400 mb-1 block">Tipo de Local</label>
                    <select
                        value={entity.metadata.tipo_local || ''}
                        onChange={(e) => updateMetadata('tipo_local', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm"
                    >
                        <option value="">Selecione</option>
                        {LOCATION_TYPES.map(t => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="text-xs text-slate-400 mb-1 block">CEP</label>
                    <input
                        type="text"
                        placeholder="00000-000"
                        value={entity.metadata.cep || ''}
                        onChange={(e) => updateMetadata('cep', formatCEP(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm"
                        maxLength={9}
                    />
                </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                    <label className="text-xs text-slate-400 mb-1 block">Logradouro</label>
                    <input
                        type="text"
                        placeholder="Rua, Avenida, Praça..."
                        value={entity.metadata.logradouro || ''}
                        onChange={(e) => updateMetadata('logradouro', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm"
                    />
                </div>
                <div>
                    <label className="text-xs text-slate-400 mb-1 block">Número</label>
                    <input
                        type="text"
                        placeholder="123 ou S/N"
                        value={entity.metadata.numero || ''}
                        onChange={(e) => updateMetadata('numero', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm"
                    />
                </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
                <div>
                    <label className="text-xs text-slate-400 mb-1 block">Bairro</label>
                    <input
                        type="text"
                        placeholder="Bairro"
                        value={entity.metadata.bairro || ''}
                        onChange={(e) => updateMetadata('bairro', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm"
                    />
                </div>
                <div>
                    <label className="text-xs text-slate-400 mb-1 block">Cidade</label>
                    <input
                        type="text"
                        placeholder="Cidade"
                        value={entity.metadata.cidade || ''}
                        onChange={(e) => updateMetadata('cidade', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm"
                    />
                </div>
                <div>
                    <label className="text-xs text-slate-400 mb-1 block">UF</label>
                    <select
                        value={entity.metadata.uf || ''}
                        onChange={(e) => updateMetadata('uf', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm"
                    >
                        <option value="">UF</option>
                        {BRAZILIAN_STATES.map(state => (
                            <option key={state.code} value={state.code}>{state.code}</option>
                        ))}
                    </select>
                </div>
            </div>
            <div>
                <label className="text-xs text-slate-400 mb-1 block">Ponto de Referência</label>
                <input
                    type="text"
                    placeholder="Próximo a..."
                    value={entity.metadata.referencia || ''}
                    onChange={(e) => updateMetadata('referencia', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm"
                />
            </div>
        </div>
    );
}
