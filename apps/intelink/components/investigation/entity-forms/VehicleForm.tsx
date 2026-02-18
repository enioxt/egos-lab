'use client';

import { EntityFormProps } from './types';
import { formatPlaca, formatRenavam, formatChassi } from '@/lib/masks';

const VEHICLE_TYPES = [
    { value: 'carro', label: 'Carro' },
    { value: 'moto', label: 'Moto' },
    { value: 'caminhao', label: 'Caminhão' },
    { value: 'van', label: 'Van' },
    { value: 'onibus', label: 'Ônibus' },
    { value: 'outro', label: 'Outro' },
];

const VEHICLE_SITUATIONS = [
    { value: 'regular', label: 'Regular' },
    { value: 'roubo', label: 'Roubo/Furto' },
    { value: 'apreendido', label: 'Apreendido' },
    { value: 'restricao', label: 'Com Restrição' },
];

export function VehicleForm({ entity, onUpdate }: EntityFormProps) {
    const updateMetadata = (key: string, value: string) => {
        onUpdate(entity.id, { metadata: { ...entity.metadata, [key]: value } });
    };

    return (
        <div className="space-y-3 mt-3">
            <div className="grid grid-cols-4 gap-3">
                <div>
                    <label className="text-xs text-slate-400 mb-1 block">Placa</label>
                    <input
                        type="text"
                        placeholder="ABC1D23"
                        value={entity.metadata.placa || ''}
                        onChange={(e) => updateMetadata('placa', formatPlaca(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm uppercase"
                        maxLength={7}
                    />
                </div>
                <div>
                    <label className="text-xs text-slate-400 mb-1 block">Tipo</label>
                    <select
                        value={entity.metadata.tipo || ''}
                        onChange={(e) => updateMetadata('tipo', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm"
                    >
                        <option value="">Selecione</option>
                        {VEHICLE_TYPES.map(t => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="text-xs text-slate-400 mb-1 block">Marca</label>
                    <input
                        type="text"
                        placeholder="Ex: Volkswagen"
                        value={entity.metadata.marca || ''}
                        onChange={(e) => updateMetadata('marca', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm"
                    />
                </div>
                <div>
                    <label className="text-xs text-slate-400 mb-1 block">Modelo</label>
                    <input
                        type="text"
                        placeholder="Ex: Gol"
                        value={entity.metadata.modelo || ''}
                        onChange={(e) => updateMetadata('modelo', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm"
                    />
                </div>
            </div>
            <div className="grid grid-cols-4 gap-3">
                <div>
                    <label className="text-xs text-slate-400 mb-1 block">Cor</label>
                    <input
                        type="text"
                        placeholder="Ex: Prata"
                        value={entity.metadata.cor || ''}
                        onChange={(e) => updateMetadata('cor', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm"
                    />
                </div>
                <div>
                    <label className="text-xs text-slate-400 mb-1 block">Ano</label>
                    <input
                        type="number"
                        placeholder="2020"
                        value={entity.metadata.ano || ''}
                        onChange={(e) => updateMetadata('ano', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm"
                        min="1900"
                        max="2030"
                    />
                </div>
                <div>
                    <label className="text-xs text-slate-400 mb-1 block">RENAVAM</label>
                    <input
                        type="text"
                        placeholder="11 dígitos"
                        value={entity.metadata.renavam || ''}
                        onChange={(e) => updateMetadata('renavam', formatRenavam(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm"
                        maxLength={11}
                    />
                </div>
                <div>
                    <label className="text-xs text-slate-400 mb-1 block">Situação</label>
                    <select
                        value={entity.metadata.situacao || ''}
                        onChange={(e) => updateMetadata('situacao', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm"
                    >
                        <option value="">Selecione</option>
                        {VEHICLE_SITUATIONS.map(s => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                    </select>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-xs text-slate-400 mb-1 block">Chassi</label>
                    <input
                        type="text"
                        placeholder="17 caracteres"
                        value={entity.metadata.chassi || ''}
                        onChange={(e) => updateMetadata('chassi', formatChassi(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm uppercase"
                        maxLength={17}
                    />
                </div>
                <div>
                    <label className="text-xs text-slate-400 mb-1 block">Proprietário</label>
                    <input
                        type="text"
                        placeholder="Nome do proprietário"
                        value={entity.metadata.proprietario || ''}
                        onChange={(e) => updateMetadata('proprietario', e.target.value.toUpperCase())}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm uppercase"
                    />
                </div>
            </div>
        </div>
    );
}
