'use client';

import { User, Car, MapPin, Building2, Target, Phone, X } from 'lucide-react';
import { 
    EntityInput, 
    ENTITY_ROLES,
    PersonForm, 
    VehicleForm, 
    LocationForm, 
    OrganizationForm, 
    FirearmForm, 
    PhoneForm 
} from './entity-forms';

interface EntityCardProps {
    entity: EntityInput;
    onUpdate: (id: string, updates: Partial<EntityInput>) => void;
    onRemove: (id: string) => void;
}

const ENTITY_CONFIG = {
    PERSON: { icon: User, color: 'text-blue-400', label: 'Pessoa' },
    VEHICLE: { icon: Car, color: 'text-pink-400', label: 'Veículo' },
    LOCATION: { icon: MapPin, color: 'text-emerald-400', label: 'Local' },
    ORGANIZATION: { icon: Building2, color: 'text-amber-400', label: 'Organização' },
    FIREARM: { icon: Target, color: 'text-red-400', label: 'Arma' },
    PHONE: { icon: Phone, color: 'text-cyan-400', label: 'Telefone' },
};

export function EntityCard({ entity, onUpdate, onRemove }: EntityCardProps) {
    const config = ENTITY_CONFIG[entity.type];
    const Icon = config.icon;

    return (
        <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/30">
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Icon className={`w-5 h-5 ${config.color}`} />
                    <span className="font-medium capitalize">{config.label}</span>
                </div>
                <button 
                    onClick={() => onRemove(entity.id)} 
                    className="p-1 hover:bg-red-500/20 rounded"
                >
                    <X className="w-4 h-4 text-red-400" />
                </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <input
                    type="text"
                    value={entity.name}
                    onChange={(e) => onUpdate(entity.id, { name: e.target.value })}
                    placeholder="Nome"
                    className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm"
                />
                <select
                    value={entity.role}
                    onChange={(e) => onUpdate(entity.id, { role: e.target.value as EntityInput['role'] })}
                    className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm"
                >
                    {ENTITY_ROLES.map(r => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                </select>
            </div>

            {/* Type-specific forms */}
            {entity.type === 'PERSON' && <PersonForm entity={entity} onUpdate={onUpdate} />}
            {entity.type === 'VEHICLE' && <VehicleForm entity={entity} onUpdate={onUpdate} />}
            {entity.type === 'LOCATION' && <LocationForm entity={entity} onUpdate={onUpdate} />}
            {entity.type === 'ORGANIZATION' && <OrganizationForm entity={entity} onUpdate={onUpdate} />}
            {entity.type === 'FIREARM' && <FirearmForm entity={entity} onUpdate={onUpdate} />}
            {entity.type === 'PHONE' && <PhoneForm entity={entity} onUpdate={onUpdate} />}
        </div>
    );
}
