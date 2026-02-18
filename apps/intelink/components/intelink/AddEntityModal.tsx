'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
    X, 
    User, 
    Car, 
    MapPin, 
    Phone, 
    Building,
    Shield,
    AlertTriangle,
    Check,
    Loader2,
    Search,
    ChevronRight,
    Sparkles
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

type EntityType = 'PERSON' | 'VEHICLE' | 'LOCATION' | 'PHONE' | 'ORGANIZATION' | 'FIREARM';

interface SimilarEntity {
    id: string;
    name: string;
    type: string;
    investigation_title?: string;
    similarity: number;
    match_reason: string;
}

interface AddEntityModalProps {
    isOpen: boolean;
    onClose: () => void;
    investigationId: string;
    onEntityCreated?: (entity: any) => void;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CONSTANTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const ENTITY_TYPES: { type: EntityType; label: string; icon: any; color: string }[] = [
    { type: 'PERSON', label: 'Pessoa', icon: User, color: 'blue' },
    { type: 'VEHICLE', label: 'Veículo', icon: Car, color: 'green' },
    { type: 'LOCATION', label: 'Local', icon: MapPin, color: 'amber' },
    { type: 'PHONE', label: 'Telefone', icon: Phone, color: 'purple' },
    { type: 'ORGANIZATION', label: 'Organização', icon: Building, color: 'cyan' },
    { type: 'FIREARM', label: 'Arma', icon: Shield, color: 'red' },
];

const FIELD_CONFIG: Record<EntityType, { name: string; placeholder: string; fields: { key: string; label: string; placeholder: string }[] }> = {
    PERSON: {
        name: 'Nome Completo',
        placeholder: 'Ex: João da Silva Santos',
        fields: [
            { key: 'cpf', label: 'CPF', placeholder: '000.000.000-00' },
            { key: 'rg', label: 'RG', placeholder: 'MG-00.000.000' },
            { key: 'birth_date', label: 'Nascimento', placeholder: 'DD/MM/AAAA' },
            { key: 'alias', label: 'Vulgo', placeholder: 'Apelido conhecido' },
        ]
    },
    VEHICLE: {
        name: 'Descrição do Veículo',
        placeholder: 'Ex: Honda Civic Preto 2020',
        fields: [
            { key: 'placa', label: 'Placa', placeholder: 'ABC-1234' },
            { key: 'chassi', label: 'Chassi', placeholder: '9BWZZZ377VT004251' },
            { key: 'renavam', label: 'Renavam', placeholder: '00000000000' },
        ]
    },
    LOCATION: {
        name: 'Nome do Local',
        placeholder: 'Ex: Residência do investigado',
        fields: [
            { key: 'address', label: 'Endereço', placeholder: 'Rua, número, bairro' },
            { key: 'city', label: 'Cidade', placeholder: 'Belo Horizonte' },
            { key: 'coordinates', label: 'Coordenadas', placeholder: '-19.9167, -43.9345' },
        ]
    },
    PHONE: {
        name: 'Número',
        placeholder: '(31) 99999-9999',
        fields: [
            { key: 'owner', label: 'Titular', placeholder: 'Nome do titular' },
            { key: 'operator', label: 'Operadora', placeholder: 'Vivo, Claro, Tim...' },
            { key: 'imei', label: 'IMEI', placeholder: '000000000000000' },
        ]
    },
    ORGANIZATION: {
        name: 'Nome da Organização',
        placeholder: 'Ex: Empresa XYZ Ltda',
        fields: [
            { key: 'cnpj', label: 'CNPJ', placeholder: '00.000.000/0001-00' },
            { key: 'address', label: 'Endereço', placeholder: 'Sede da empresa' },
            { key: 'type', label: 'Tipo', placeholder: 'Empresa, ONG, Facção...' },
        ]
    },
    FIREARM: {
        name: 'Descrição da Arma',
        placeholder: 'Ex: Pistola 9mm Taurus',
        fields: [
            { key: 'serial', label: 'Nº Série', placeholder: 'ABC123456' },
            { key: 'caliber', label: 'Calibre', placeholder: '9mm, .38, .40...' },
            { key: 'registration', label: 'Registro', placeholder: 'Nº do registro' },
        ]
    },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SUPABASE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function AddEntityModal({ 
    isOpen, 
    onClose, 
    investigationId,
    onEntityCreated 
}: AddEntityModalProps) {
    const [step, setStep] = useState<'type' | 'form' | 'review'>('type');
    const [selectedType, setSelectedType] = useState<EntityType | null>(null);
    const [name, setName] = useState('');
    const [metadata, setMetadata] = useState<Record<string, string>>({});
    const [isChecking, setIsChecking] = useState(false);
    const [similarEntities, setSimilarEntities] = useState<SimilarEntity[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [guardianApproved, setGuardianApproved] = useState(false);
    
    // Reset on close
    useEffect(() => {
        if (!isOpen) {
            setStep('type');
            setSelectedType(null);
            setName('');
            setMetadata({});
            setSimilarEntities([]);
            setGuardianApproved(false);
        }
    }, [isOpen]);
    
    // Check for similar entities (Guardian AI)
    const checkSimilarEntities = useCallback(async () => {
        if (!name || !selectedType) return;
        
        setIsChecking(true);
        try {
            // Build search query
            const searchTerms = [name];
            if (metadata.cpf) searchTerms.push(metadata.cpf);
            if (metadata.placa) searchTerms.push(metadata.placa);
            if (metadata.cnpj) searchTerms.push(metadata.cnpj);
            if (metadata.serial) searchTerms.push(metadata.serial);
            
            // Search existing entities
            const { data, error } = await supabase
                .from('intelink_entities')
                .select(`
                    id, name, type, metadata,
                    investigation:intelink_investigations(title)
                `)
                .eq('type', selectedType)
                .or(searchTerms.map(t => `name.ilike.%${t}%`).join(','))
                .limit(10);
            
            if (error) throw error;
            
            // Calculate similarity
            const similar: SimilarEntity[] = (data || []).map((entity: any) => {
                let similarity = 0;
                let reason = '';
                
                // Name match
                if (entity.name.toLowerCase().includes(name.toLowerCase()) || 
                    name.toLowerCase().includes(entity.name.toLowerCase())) {
                    similarity += 0.5;
                    reason = 'Nome similar';
                }
                
                // Exact document match
                if (metadata.cpf && entity.metadata?.cpf === metadata.cpf) {
                    similarity = 1;
                    reason = 'CPF idêntico';
                }
                if (metadata.placa && entity.metadata?.placa === metadata.placa) {
                    similarity = 1;
                    reason = 'Placa idêntica';
                }
                if (metadata.cnpj && entity.metadata?.cnpj === metadata.cnpj) {
                    similarity = 1;
                    reason = 'CNPJ idêntico';
                }
                
                return {
                    id: entity.id,
                    name: entity.name,
                    type: entity.type,
                    investigation_title: entity.investigation?.[0]?.title || entity.investigation?.title,
                    similarity,
                    match_reason: reason
                };
            }).filter((e: SimilarEntity) => e.similarity > 0.3);
            
            setSimilarEntities(similar);
            setGuardianApproved(similar.length === 0 || similar.every(s => s.similarity < 0.8));
            setStep('review');
            
        } catch (err) {
            console.error('Error checking similar entities:', err);
            setGuardianApproved(true);
            setStep('review');
        } finally {
            setIsChecking(false);
        }
    }, [name, selectedType, metadata]);
    
    // Save entity
    const handleSave = async () => {
        if (!selectedType || !name) return;
        
        setIsSaving(true);
        try {
            const { data, error } = await supabase
                .from('intelink_entities')
                .insert({
                    investigation_id: investigationId,
                    type: selectedType,
                    name: name.trim(),
                    metadata: metadata
                })
                .select()
                .single();
            
            if (error) throw error;
            
            onEntityCreated?.(data);
            onClose();
        } catch (err) {
            console.error('Error creating entity:', err);
        } finally {
            setIsSaving(false);
        }
    };
    
    if (!isOpen) return null;
    
    const config = selectedType ? FIELD_CONFIG[selectedType] : null;
    
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg mx-4 overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-700">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-amber-400" />
                        <h2 className="font-semibold text-white">Nova Entidade</h2>
                        <span className="text-xs px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded">
                            Guardian AI
                        </span>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                {/* Step 1: Select Type */}
                {step === 'type' && (
                    <div className="p-4">
                        <p className="text-sm text-slate-400 mb-4">Selecione o tipo de entidade:</p>
                        <div className="grid grid-cols-2 gap-2">
                            {ENTITY_TYPES.map(({ type, label, icon: Icon, color }) => (
                                <button
                                    key={type}
                                    onClick={() => { setSelectedType(type); setStep('form'); }}
                                    className={`p-4 rounded-lg border border-slate-700 hover:border-${color}-500/50 hover:bg-slate-800/50 flex items-center gap-3 transition-all`}
                                >
                                    <div className={`p-2 rounded-lg bg-${color}-500/20 text-${color}-400`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <span className="font-medium">{label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                
                {/* Step 2: Form */}
                {step === 'form' && config && (
                    <div className="p-4 space-y-4">
                        <button
                            onClick={() => setStep('type')}
                            className="text-sm text-slate-400 hover:text-white flex items-center gap-1"
                        >
                            ← Voltar
                        </button>
                        
                        {/* Name field */}
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">{config.name} *</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder={config.placeholder}
                                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                                autoFocus
                            />
                        </div>
                        
                        {/* Additional fields */}
                        <div className="grid grid-cols-2 gap-3">
                            {config.fields.map(field => (
                                <div key={field.key}>
                                    <label className="block text-sm text-slate-400 mb-1">{field.label}</label>
                                    <input
                                        type="text"
                                        value={metadata[field.key] || ''}
                                        onChange={(e) => setMetadata(prev => ({ ...prev, [field.key]: e.target.value }))}
                                        placeholder={field.placeholder}
                                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                                    />
                                </div>
                            ))}
                        </div>
                        
                        {/* Check button */}
                        <button
                            onClick={checkSimilarEntities}
                            disabled={!name || isChecking}
                            className="w-full py-3 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-700 disabled:text-slate-500 rounded-lg font-medium flex items-center justify-center gap-2"
                        >
                            {isChecking ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Verificando duplicatas...
                                </>
                            ) : (
                                <>
                                    <Search className="w-4 h-4" />
                                    Verificar com Guardian AI
                                </>
                            )}
                        </button>
                    </div>
                )}
                
                {/* Step 3: Review */}
                {step === 'review' && (
                    <div className="p-4 space-y-4">
                        <button
                            onClick={() => setStep('form')}
                            className="text-sm text-slate-400 hover:text-white flex items-center gap-1"
                        >
                            ← Voltar
                        </button>
                        
                        {/* Similar entities found */}
                        {similarEntities.length > 0 ? (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-amber-400">
                                    <AlertTriangle className="w-5 h-5" />
                                    <span className="font-medium">Entidades similares encontradas!</span>
                                </div>
                                
                                <div className="space-y-2">
                                    {similarEntities.map(entity => (
                                        <div 
                                            key={entity.id}
                                            className={`p-3 rounded-lg border ${
                                                entity.similarity >= 0.8 
                                                    ? 'bg-red-500/10 border-red-500/30' 
                                                    : 'bg-amber-500/10 border-amber-500/30'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-medium text-white">{entity.name}</p>
                                                    <p className="text-xs text-slate-400">
                                                        {entity.investigation_title || 'Outra investigação'} • {entity.match_reason}
                                                    </p>
                                                </div>
                                                <span className={`text-xs px-2 py-0.5 rounded ${
                                                    entity.similarity >= 0.8 
                                                        ? 'bg-red-500/20 text-red-400' 
                                                        : 'bg-amber-500/20 text-amber-400'
                                                }`}>
                                                    {Math.round(entity.similarity * 100)}% similar
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                
                                {!guardianApproved && (
                                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                                        <p className="text-sm text-red-400">
                                            ⚠️ Guardian AI recomenda NÃO criar esta entidade. 
                                            Existe uma duplicata provável. Considere usar a entidade existente.
                                        </p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-center">
                                <Check className="w-8 h-8 text-green-400 mx-auto mb-2" />
                                <p className="font-medium text-green-400">Nenhuma duplicata encontrada!</p>
                                <p className="text-sm text-slate-400 mt-1">Guardian AI aprovou a criação.</p>
                            </div>
                        )}
                        
                        {/* Action buttons */}
                        <div className="flex gap-2 pt-2">
                            <button
                                onClick={onClose}
                                className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className={`flex-1 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 ${
                                    guardianApproved 
                                        ? 'bg-green-600 hover:bg-green-500' 
                                        : 'bg-amber-600 hover:bg-amber-500'
                                }`}
                            >
                                {isSaving ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : guardianApproved ? (
                                    <>
                                        <Check className="w-4 h-4" />
                                        Criar Entidade
                                    </>
                                ) : (
                                    <>
                                        <AlertTriangle className="w-4 h-4" />
                                        Criar Mesmo Assim
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
