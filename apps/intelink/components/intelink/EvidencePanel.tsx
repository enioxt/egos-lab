'use client';

import React, { useState, useEffect } from 'react';
import { 
    Fingerprint, 
    Plus, 
    Search,
    Shield, 
    FileText, 
    Image as ImageIcon, 
    MapPin, 
    Box, 
    Tag, 
    AlertTriangle,
    ChevronDown,
    ChevronRight,
    Clock,
    Loader2,
    Pill,
    Smartphone,
    DollarSign,
    MoreHorizontal,
    Trash2,
    Edit2
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface Evidence {
    id: string;
    type: string;
    description: string;
    quantity?: string;
    collected_at?: string;
    custody_status?: string;
    metadata?: Record<string, any>;
    document_id?: string;
}

interface EvidencePanelProps {
    investigationId: string;
    onAddEvidence?: () => void;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CONSTANTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const EVIDENCE_ICONS: Record<string, any> = {
    'DRUG': Pill,
    'WEAPON': Shield,
    'FIREARM': Shield,
    'DOCUMENT': FileText,
    'DEVICE': Smartphone,
    'MEDIA': ImageIcon,
    'LOCATION': MapPin,
    'MONEY': DollarSign,
    'OBJECT': Box,
    'default': Fingerprint
};

const EVIDENCE_COLORS: Record<string, string> = {
    'DRUG': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    'WEAPON': 'bg-red-500/20 text-red-400 border-red-500/30',
    'FIREARM': 'bg-red-500/20 text-red-400 border-red-500/30',
    'DOCUMENT': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'DEVICE': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    'MONEY': 'bg-green-500/20 text-green-400 border-green-500/30',
    'default': 'bg-slate-500/20 text-slate-400 border-slate-500/30'
};

const TYPE_LABELS: Record<string, string> = {
    'DRUG': 'Droga',
    'WEAPON': 'Arma',
    'FIREARM': 'Arma de Fogo',
    'DOCUMENT': 'Documento',
    'DEVICE': 'Dispositivo',
    'MEDIA': 'Mídia',
    'MONEY': 'Dinheiro',
    'OBJECT': 'Objeto',
};

const STATUS_LABELS: Record<string, string> = {
    'collected': 'Coletada',
    'analyzed': 'Analisada',
    'stored': 'Armazenada',
    'disposed': 'Descartada'
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SUPABASE CLIENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EVIDENCE CARD
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function EvidenceCard({ evidence, onEdit, onDelete }: { 
    evidence: Evidence; 
    onEdit?: () => void;
    onDelete?: () => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    
    const Icon = EVIDENCE_ICONS[evidence.type] || EVIDENCE_ICONS.default;
    const colorClass = EVIDENCE_COLORS[evidence.type] || EVIDENCE_COLORS.default;
    
    return (
        <div className={`border rounded-lg overflow-hidden ${colorClass.split(' ')[2]} bg-slate-800/30`}>
            {/* Header */}
            <div 
                className="p-3 flex items-center justify-between cursor-pointer hover:bg-slate-700/20"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center gap-3">
                    {expanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                    
                    <div className={`p-2 rounded-lg ${colorClass.split(' ').slice(0, 2).join(' ')}`}>
                        <Icon className="w-4 h-4" />
                    </div>
                    
                    <div>
                        <p className="font-medium text-white">{evidence.description}</p>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                            <span className="px-1.5 py-0.5 rounded bg-slate-700">
                                {TYPE_LABELS[evidence.type] || evidence.type}
                            </span>
                            {evidence.quantity && (
                                <span>Qtd: {evidence.quantity}</span>
                            )}
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    {evidence.custody_status && (
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                            {STATUS_LABELS[evidence.custody_status] || evidence.custody_status}
                        </span>
                    )}
                    
                    <div className="relative">
                        <button
                            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                            className="p-1 rounded hover:bg-slate-700 text-slate-400"
                        >
                            <MoreHorizontal className="w-4 h-4" />
                        </button>
                        
                        {showMenu && (
                            <div className="absolute right-0 top-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-10 py-1 min-w-[120px]">
                                <button
                                    onClick={(e) => { e.stopPropagation(); onEdit?.(); setShowMenu(false); }}
                                    className="w-full px-3 py-1.5 text-left text-sm hover:bg-slate-700 flex items-center gap-2"
                                >
                                    <Edit2 className="w-3 h-3" />
                                    Editar
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onDelete?.(); setShowMenu(false); }}
                                    className="w-full px-3 py-1.5 text-left text-sm hover:bg-slate-700 text-red-400 flex items-center gap-2"
                                >
                                    <Trash2 className="w-3 h-3" />
                                    Remover
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Expanded Details */}
            {expanded && (
                <div className="p-3 border-t border-slate-700/50 bg-slate-900/30">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        {evidence.collected_at && (
                            <div>
                                <span className="text-slate-500">Coletada em:</span>
                                <p className="text-white flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {new Date(evidence.collected_at).toLocaleDateString('pt-BR')}
                                </p>
                            </div>
                        )}
                        
                        {evidence.metadata?.serial_number && (
                            <div>
                                <span className="text-slate-500">Nº Série:</span>
                                <p className="text-white font-mono">{evidence.metadata.serial_number}</p>
                            </div>
                        )}
                        
                        {evidence.metadata?.location && (
                            <div>
                                <span className="text-slate-500">Local:</span>
                                <p className="text-white">{evidence.metadata.location}</p>
                            </div>
                        )}
                        
                        {evidence.metadata?.notes && (
                            <div className="col-span-2">
                                <span className="text-slate-500">Observações:</span>
                                <p className="text-slate-300">{evidence.metadata.notes}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function EvidencePanel({ investigationId, onAddEvidence }: EvidencePanelProps) {
    const [evidences, setEvidences] = useState<Evidence[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<string>('all');
    
    // Load evidences
    useEffect(() => {
        const loadEvidences = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('intelink_evidence')
                    .select('*')
                    .eq('investigation_id', investigationId)
                    .order('collected_at', { ascending: false });
                
                if (error) throw error;
                setEvidences(data || []);
            } catch (err) {
                console.error('Error loading evidences:', err);
            } finally {
                setLoading(false);
            }
        };
        
        loadEvidences();
    }, [investigationId]);
    
    // Filter evidences
    const filteredEvidences = evidences.filter(ev => {
        const matchesSearch = ev.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || ev.type === filterType;
        return matchesSearch && matchesType;
    });
    
    // Get unique types for filter
    const uniqueTypes = [...new Set(evidences.map(e => e.type))];
    
    // Group by type
    const groupedByType = filteredEvidences.reduce((acc, ev) => {
        if (!acc[ev.type]) acc[ev.type] = [];
        acc[ev.type].push(ev);
        return acc;
    }, {} as Record<string, Evidence[]>);
    
    if (loading) {
        return (
            <div className="p-6 text-center text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                Carregando evidências...
            </div>
        );
    }
    
    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Fingerprint className="w-5 h-5 text-cyan-400" />
                    <span className="font-medium">Evidências</span>
                    <span className="px-2 py-0.5 text-xs bg-cyan-500/20 text-cyan-400 rounded">
                        {evidences.length}
                    </span>
                </div>
                
                <button
                    onClick={onAddEvidence}
                    className="px-3 py-1.5 text-sm rounded bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/30 text-cyan-400 flex items-center gap-1"
                >
                    <Plus className="w-4 h-4" />
                    Adicionar
                </button>
            </div>
            
            {/* Search & Filter */}
            {evidences.length > 0 && (
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar evidência..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                        />
                    </div>
                    
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:border-cyan-500 focus:outline-none"
                    >
                        <option value="all">Todos os tipos</option>
                        {uniqueTypes.map(type => (
                            <option key={type} value={type}>
                                {TYPE_LABELS[type] || type}
                            </option>
                        ))}
                    </select>
                </div>
            )}
            
            {/* Content */}
            {filteredEvidences.length === 0 ? (
                <div className="p-8 text-center bg-slate-900/30 rounded-lg border border-slate-800">
                    <Box className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                    <p className="text-slate-400 text-sm">
                        {evidences.length === 0 
                            ? 'Nenhuma evidência cadastrada'
                            : 'Nenhuma evidência encontrada'
                        }
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {Object.entries(groupedByType).map(([type, items]) => (
                        <div key={type}>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs text-slate-500 uppercase tracking-wider">
                                    {TYPE_LABELS[type] || type}
                                </span>
                                <span className="text-xs text-slate-600">({items.length})</span>
                            </div>
                            <div className="space-y-2">
                                {items.map(evidence => (
                                    <EvidenceCard
                                        key={evidence.id}
                                        evidence={evidence}
                                        onEdit={() => console.log('Edit', evidence.id)}
                                        onDelete={() => console.log('Delete', evidence.id)}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
