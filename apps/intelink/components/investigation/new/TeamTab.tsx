'use client';

/**
 * TeamTab - Team member selection
 * ~100 lines
 */

import { User, CheckCircle, Shield } from 'lucide-react';
import { TeamMember } from './types';

interface TeamTabProps {
    allMembers: TeamMember[];
    selectedMembers: string[];
    setSelectedMembers: (members: string[]) => void;
    selectedUnit: string;
}

export function TeamTab({
    allMembers,
    selectedMembers,
    setSelectedMembers,
    selectedUnit,
}: TeamTabProps) {
    // Sort members: selected unit first
    const sortedMembers = [...allMembers].sort((a, b) => {
        if (selectedUnit) {
            if (a.unit_id === selectedUnit && b.unit_id !== selectedUnit) return -1;
            if (b.unit_id === selectedUnit && a.unit_id !== selectedUnit) return 1;
        }
        return a.name.localeCompare(b.name);
    });

    const toggleMember = (memberId: string) => {
        if (selectedMembers.includes(memberId)) {
            setSelectedMembers(selectedMembers.filter(id => id !== memberId));
        } else {
            setSelectedMembers([...selectedMembers, memberId]);
        }
    };

    const allSelected = sortedMembers.length > 0 && selectedMembers.length === sortedMembers.length;
    const someSelected = selectedMembers.length > 0 && selectedMembers.length < sortedMembers.length;

    const toggleSelectAll = () => {
        if (allSelected) {
            setSelectedMembers([]);
        } else {
            setSelectedMembers(sortedMembers.map(m => m.id));
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Membros da Equipe</h2>
                    
                    {/* Checkbox Selecionar Todos */}
                    <button
                        onClick={toggleSelectAll}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-700/50 transition-colors text-sm"
                    >
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                            allSelected 
                                ? 'bg-blue-600 border-blue-600' 
                                : someSelected 
                                    ? 'bg-blue-600/50 border-blue-500' 
                                    : 'border-slate-500'
                        }`}>
                            {(allSelected || someSelected) && (
                                <CheckCircle className="w-3.5 h-3.5 text-white" />
                            )}
                        </div>
                        <span className="text-slate-300">
                            {allSelected ? 'Desmarcar todos' : 'Selecionar todos'}
                        </span>
                    </button>
                </div>
                
                <p className="text-slate-400 text-sm mb-4">
                    Selecione os membros que participarão desta operação.
                    {selectedUnit && ' Membros da delegacia selecionada aparecem primeiro.'}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                    {sortedMembers.map(member => {
                        const isFromSelectedUnit = selectedUnit && member.unit_id === selectedUnit;
                        const isSelected = selectedMembers.includes(member.id);
                        
                        return (
                            <button
                                key={member.id}
                                onClick={() => toggleMember(member.id)}
                                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
                                    isSelected
                                        ? 'bg-blue-600/20 border-blue-500'
                                        : isFromSelectedUnit
                                            ? 'bg-emerald-600/10 border-emerald-500/30 hover:bg-emerald-600/20'
                                            : 'bg-slate-700/30 border-slate-600/30 hover:bg-slate-700/50'
                                }`}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                    isSelected ? 'bg-blue-600' : 'bg-slate-600'
                                }`}>
                                    {isSelected ? (
                                        <CheckCircle className="w-5 h-5 text-white" />
                                    ) : (
                                        <User className="w-5 h-5 text-slate-300" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-white">{member.name}</p>
                                    <p className="text-xs text-slate-400">{member.role}</p>
                                </div>
                                {isFromSelectedUnit && (
                                    <Shield className="w-4 h-4 text-emerald-400" />
                                )}
                            </button>
                        );
                    })}
                </div>

                {selectedMembers.length > 0 && (
                    <div className="mt-4 p-3 bg-blue-900/20 rounded-lg border border-blue-500/30">
                        <p className="text-sm text-blue-300">
                            {selectedMembers.length} membro(s) selecionado(s)
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
