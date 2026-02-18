'use client';

import { EntityFormProps } from './types';

const FIREARM_TYPES = [
    { value: 'pistola', label: 'Pistola' },
    { value: 'revolver', label: 'Revólver' },
    { value: 'fuzil', label: 'Fuzil' },
    { value: 'espingarda', label: 'Espingarda' },
    { value: 'submetralhadora', label: 'Submetralhadora' },
    { value: 'carabina', label: 'Carabina' },
    { value: 'faca', label: 'Faca/Arma Branca' },
    { value: 'outro', label: 'Outro' },
];

const CALIBERS = [
    { value: '.22', label: '.22' },
    { value: '.32', label: '.32' },
    { value: '.38', label: '.38' },
    { value: '.380', label: '.380 ACP' },
    { value: '9mm', label: '9mm' },
    { value: '.40', label: '.40 S&W' },
    { value: '.45', label: '.45 ACP' },
    { value: '5.56', label: '5.56x45mm' },
    { value: '7.62', label: '7.62x39mm' },
    { value: '12', label: 'Calibre 12' },
    { value: 'outro', label: 'Outro' },
];

const FIREARM_SITUATIONS = [
    { value: 'apreendida', label: 'Apreendida' },
    { value: 'roubo_furto', label: 'Roubo/Furto' },
    { value: 'legal', label: 'Legal/Registrada' },
    { value: 'ilegal', label: 'Ilegal' },
    { value: 'destruida', label: 'Destruída' },
];

export function FirearmForm({ entity, onUpdate }: EntityFormProps) {
    const updateMetadata = (key: string, value: string) => {
        onUpdate(entity.id, { metadata: { ...entity.metadata, [key]: value } });
    };

    return (
        <div className="space-y-3 mt-3">
            <div className="grid grid-cols-3 gap-3">
                <div>
                    <label className="text-xs text-slate-400 mb-1 block">Tipo</label>
                    <select
                        value={entity.metadata.tipo_arma || ''}
                        onChange={(e) => updateMetadata('tipo_arma', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm"
                    >
                        <option value="">Selecione</option>
                        {FIREARM_TYPES.map(t => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="text-xs text-slate-400 mb-1 block">Calibre</label>
                    <select
                        value={entity.metadata.calibre || ''}
                        onChange={(e) => updateMetadata('calibre', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm"
                    >
                        <option value="">Selecione</option>
                        {CALIBERS.map(c => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="text-xs text-slate-400 mb-1 block">Marca</label>
                    <input
                        type="text"
                        placeholder="Ex: Taurus, Glock"
                        value={entity.metadata.marca || ''}
                        onChange={(e) => updateMetadata('marca', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm"
                    />
                </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
                <div>
                    <label className="text-xs text-slate-400 mb-1 block">Modelo</label>
                    <input
                        type="text"
                        placeholder="Ex: PT92, G17"
                        value={entity.metadata.modelo || ''}
                        onChange={(e) => updateMetadata('modelo', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm"
                    />
                </div>
                <div>
                    <label className="text-xs text-slate-400 mb-1 block">Nº de Série</label>
                    <input
                        type="text"
                        placeholder="Número de série"
                        value={entity.metadata.numero_serie || ''}
                        onChange={(e) => updateMetadata('numero_serie', e.target.value.toUpperCase())}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm uppercase"
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
                        {FIREARM_SITUATIONS.map(s => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                    </select>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-xs text-slate-400 mb-1 block">Registro (SINARM/Sigma)</label>
                    <input
                        type="text"
                        placeholder="Número do registro"
                        value={entity.metadata.registro || ''}
                        onChange={(e) => updateMetadata('registro', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm"
                    />
                </div>
                <div>
                    <label className="text-xs text-slate-400 mb-1 block">Proprietário/Possuidor</label>
                    <input
                        type="text"
                        placeholder="Nome do proprietário"
                        value={entity.metadata.proprietario || ''}
                        onChange={(e) => updateMetadata('proprietario', e.target.value.toUpperCase())}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm uppercase"
                    />
                </div>
            </div>
            <div>
                <label className="text-xs text-slate-400 mb-1 block">Observações (Local encontrado, condição, etc.)</label>
                <textarea
                    placeholder="Informações adicionais sobre a arma..."
                    value={entity.metadata.observacoes || ''}
                    onChange={(e) => updateMetadata('observacoes', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm h-20 resize-none"
                />
            </div>
        </div>
    );
}
