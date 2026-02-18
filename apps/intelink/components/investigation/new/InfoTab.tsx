'use client';

/**
 * InfoTab - Basic investigation information form
 * ~80 lines
 */

import { PoliceUnit } from './types';

interface InfoTabProps {
    title: string;
    setTitle: (value: string) => void;
    description: string;
    setDescription: (value: string) => void;
    selectedUnit: string;
    setSelectedUnit: (value: string) => void;
    status: 'active' | 'archived';
    setStatus: (value: 'active' | 'archived') => void;
    units: PoliceUnit[];
}

export function InfoTab({
    title,
    setTitle,
    description,
    setDescription,
    selectedUnit,
    setSelectedUnit,
    status,
    setStatus,
    units,
}: InfoTabProps) {
    return (
        <div className="space-y-6">
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
                <h2 className="text-lg font-semibold mb-4">Dados Básicos</h2>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Título da Operação *
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ex: Operação Tsunami - Tráfico Zona Norte"
                            className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Descrição
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Descreva brevemente o objetivo e contexto da operação..."
                            rows={4}
                            className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Delegacia Responsável
                            </label>
                            <select
                                value={selectedUnit}
                                onChange={(e) => setSelectedUnit(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Selecione uma delegacia</option>
                                {units.map(unit => (
                                    <option key={unit.id} value={unit.id}>
                                        {unit.code} - {unit.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Status
                            </label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value as 'active' | 'archived')}
                                className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="active">Ativo</option>
                                <option value="archived">Arquivado</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
