'use client';

/**
 * Rho Demo Dashboard - Mock Homicide Investigation for Training
 * 
 * Shows a realistic mock investigation with:
 * - Entities (suspects, victims, witnesses)
 * - Vehicles involved
 * - Locations of interest
 * - Relationships and connections
 * - Timeline of events
 * - Graph visualization
 */

import { useState } from 'react';
import Link from 'next/link';
import { 
    ArrowLeft,
    Users, 
    Car, 
    MapPin, 
    Building2,
    Phone,
    Clock,
    Link2,
    AlertTriangle,
    FileText,
    Shield,
    Target,
    Eye
} from 'lucide-react';

// Mock investigation data for homicide case
const MOCK_INVESTIGATION = {
    id: 'demo-homicidio-001',
    title: 'HOMICÍDIO QUALIFICADO - BAIRRO CENTRO',
    reds_number: 'REDS-2025-DEMO-001',
    status: 'active',
    created_at: '2025-01-10',
    unit: 'DHPP',
    nature: 'Homicídio Qualificado - Art. 121 § 2º CP',
    summary: 'Vítima encontrada sem vida em via pública com múltiplas lesões por arma de fogo. Testemunhas relatam veículo escuro saindo do local.',
};

const MOCK_ENTITIES = [
    // Victim
    { id: 'e1', name: 'JOÃO CARLOS SILVA', type: 'PERSON', role: 'Vítima', cpf: '123.456.789-00', age: 34, metadata: { profession: 'Comerciante', address: 'Rua das Flores, 123' } },
    
    // Suspects
    { id: 'e2', name: 'MARCOS ROBERTO SOUZA', type: 'PERSON', role: 'Suspeito', cpf: '987.654.321-00', age: 28, metadata: { antecedents: ['Tráfico', 'Porte Ilegal de Arma'] } },
    { id: 'e3', name: 'RAFAEL LIMA SANTOS', type: 'PERSON', role: 'Suspeito', cpf: '456.789.123-00', age: 25, metadata: { antecedents: ['Roubo', 'Receptação'] } },
    
    // Witnesses
    { id: 'e4', name: 'MARIA DAS GRAÇAS OLIVEIRA', type: 'PERSON', role: 'Testemunha', age: 52, metadata: { reliability: 'Alta', statement: 'Ouviu disparos e viu carro escuro' } },
    { id: 'e5', name: 'CARLOS HENRIQUE FERREIRA', type: 'PERSON', role: 'Testemunha', age: 45, metadata: { reliability: 'Média', statement: 'Viu dois homens discutindo antes dos tiros' } },
    
    // Vehicles
    { id: 'v1', name: 'HB20 PRETO - ABC-1234', type: 'VEHICLE', role: 'Veículo Suspeito', metadata: { brand: 'Hyundai', model: 'HB20', color: 'Preto', plate: 'ABC-1234', year: 2020 } },
    { id: 'v2', name: 'GOL CINZA - DEF-5678', type: 'VEHICLE', role: 'Veículo da Vítima', metadata: { brand: 'Volkswagen', model: 'Gol', color: 'Cinza', plate: 'DEF-5678', year: 2018 } },
    
    // Locations
    { id: 'l1', name: 'Rua XV de Novembro, 456 - Local do Crime', type: 'LOCATION', role: 'Local do Fato', metadata: { neighborhood: 'Centro', city: 'Cidade Demo', coordinates: '-19.9245, -43.9352' } },
    { id: 'l2', name: 'Bar do Zé - Último local visto com vida', type: 'LOCATION', role: 'Ponto de Interesse', metadata: { neighborhood: 'Centro', type: 'Estabelecimento Comercial' } },
    { id: 'l3', name: 'Rua das Palmeiras, 789 - Residência Suspeito 1', type: 'LOCATION', role: 'Endereço Suspeito', metadata: { neighborhood: 'Jardim América' } },
    
    // Organization
    { id: 'o1', name: 'FACÇÃO DEMONSTRAÇÃO', type: 'ORGANIZATION', role: 'Organização Criminosa', metadata: { territory: 'Centro', members_estimated: 50 } },
];

const MOCK_RELATIONSHIPS = [
    { source: 'e1', target: 'e2', type: 'CONHECIDO_DE', description: 'Vítima conhecida do suspeito - dívida de R$ 5.000' },
    { source: 'e2', target: 'e3', type: 'COMPARSA_DE', description: 'Suspeitos vistos juntos frequentemente' },
    { source: 'e2', target: 'v1', type: 'PROPRIETARIO', description: 'Veículo registrado em nome da mãe do suspeito' },
    { source: 'e1', target: 'v2', type: 'PROPRIETARIO', description: 'Veículo da vítima' },
    { source: 'e1', target: 'l2', type: 'FREQUENTADOR', description: 'Vítima era cliente regular' },
    { source: 'e2', target: 'l3', type: 'RESIDE_EM', description: 'Endereço residencial do suspeito' },
    { source: 'e2', target: 'o1', type: 'MEMBRO_DE', description: 'Suspeito vinculado à organização' },
    { source: 'e3', target: 'o1', type: 'MEMBRO_DE', description: 'Suspeito vinculado à organização' },
    { source: 'e4', target: 'l1', type: 'ESTAVA_EM', description: 'Testemunha morava próximo ao local' },
    { source: 'e5', target: 'l1', type: 'ESTAVA_EM', description: 'Testemunha passava pelo local' },
    { source: 'v1', target: 'l1', type: 'VISTO_EM', description: 'Veículo visto saindo do local após os disparos' },
];

const MOCK_TIMELINE = [
    { time: '18:30', event: 'Vítima vista no Bar do Zé', type: 'info' },
    { time: '19:15', event: 'Vítima sai do bar acompanhada de desconhecido', type: 'warning' },
    { time: '19:45', event: 'Testemunha ouve discussão na Rua XV de Novembro', type: 'warning' },
    { time: '19:50', event: 'Disparos de arma de fogo - 4 a 5 tiros ouvidos', type: 'critical' },
    { time: '19:52', event: 'Veículo HB20 preto visto saindo em alta velocidade', type: 'critical' },
    { time: '19:55', event: 'SAMU acionado por vizinhos', type: 'info' },
    { time: '20:10', event: 'PM chega ao local - vítima sem vida', type: 'info' },
    { time: '20:30', event: 'Perícia criminal acionada', type: 'info' },
];

const ENTITY_ICONS: Record<string, any> = {
    PERSON: Users,
    VEHICLE: Car,
    LOCATION: MapPin,
    ORGANIZATION: Building2,
};

const ENTITY_COLORS: Record<string, string> = {
    PERSON: 'bg-blue-500',
    VEHICLE: 'bg-emerald-500',
    LOCATION: 'bg-amber-500',
    ORGANIZATION: 'bg-purple-500',
};

const ROLE_COLORS: Record<string, string> = {
    'Vítima': 'text-red-400 bg-red-500/10',
    'Suspeito': 'text-orange-400 bg-orange-500/10',
    'Testemunha': 'text-blue-400 bg-blue-500/10',
    'Veículo Suspeito': 'text-orange-400 bg-orange-500/10',
    'Veículo da Vítima': 'text-red-400 bg-red-500/10',
    'Local do Fato': 'text-red-400 bg-red-500/10',
    'Ponto de Interesse': 'text-amber-400 bg-amber-500/10',
    'Endereço Suspeito': 'text-orange-400 bg-orange-500/10',
    'Organização Criminosa': 'text-purple-400 bg-purple-500/10',
};

export default function RhoDemoPage() {
    const [selectedEntity, setSelectedEntity] = useState<typeof MOCK_ENTITIES[0] | null>(null);
    
    const getEntityConnections = (entityId: string) => {
        return MOCK_RELATIONSHIPS.filter(r => r.source === entityId || r.target === entityId);
    };
    
    return (
        <div className="min-h-screen bg-gray-950 text-white">
            {/* Header */}
            <header className="bg-gray-900 border-b border-gray-800 px-6 py-4">
                <div className="flex items-center justify-between max-w-7xl mx-auto">
                    <div className="flex items-center gap-4">
                        <Link href="/central" className="text-gray-400 hover:text-white">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2">
                                <Shield className="w-5 h-5 text-amber-500" />
                                <h1 className="text-xl font-bold">Rho Demo Dashboard</h1>
                                <span className="px-2 py-0.5 text-xs bg-amber-500/20 text-amber-400 rounded-full">
                                    SIMULAÇÃO
                                </span>
                            </div>
                            <p className="text-gray-400 text-sm">Caso fictício para treinamento e demonstração</p>
                        </div>
                    </div>
                </div>
            </header>
            
            <main className="max-w-7xl mx-auto p-6">
                {/* Investigation Header */}
                <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 mb-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-lg font-bold mb-2">{MOCK_INVESTIGATION.title}</h2>
                            <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                                <span className="flex items-center gap-1">
                                    <FileText className="w-4 h-4" />
                                    {MOCK_INVESTIGATION.reds_number}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    {MOCK_INVESTIGATION.created_at}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Target className="w-4 h-4" />
                                    {MOCK_INVESTIGATION.unit}
                                </span>
                            </div>
                            <p className="mt-3 text-gray-300">{MOCK_INVESTIGATION.summary}</p>
                        </div>
                        <div className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-sm font-medium">
                            {MOCK_INVESTIGATION.nature}
                        </div>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Entities Column */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Stats */}
                        <div className="grid grid-cols-4 gap-4">
                            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                                <div className="flex items-center gap-2 text-blue-400 mb-2">
                                    <Users className="w-5 h-5" />
                                    <span className="text-sm">Pessoas</span>
                                </div>
                                <div className="text-2xl font-bold">
                                    {MOCK_ENTITIES.filter(e => e.type === 'PERSON').length}
                                </div>
                            </div>
                            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                                <div className="flex items-center gap-2 text-emerald-400 mb-2">
                                    <Car className="w-5 h-5" />
                                    <span className="text-sm">Veículos</span>
                                </div>
                                <div className="text-2xl font-bold">
                                    {MOCK_ENTITIES.filter(e => e.type === 'VEHICLE').length}
                                </div>
                            </div>
                            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                                <div className="flex items-center gap-2 text-amber-400 mb-2">
                                    <MapPin className="w-5 h-5" />
                                    <span className="text-sm">Locais</span>
                                </div>
                                <div className="text-2xl font-bold">
                                    {MOCK_ENTITIES.filter(e => e.type === 'LOCATION').length}
                                </div>
                            </div>
                            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                                <div className="flex items-center gap-2 text-cyan-400 mb-2">
                                    <Link2 className="w-5 h-5" />
                                    <span className="text-sm">Vínculos</span>
                                </div>
                                <div className="text-2xl font-bold">
                                    {MOCK_RELATIONSHIPS.length}
                                </div>
                            </div>
                        </div>
                        
                        {/* Entities Grid */}
                        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
                            <h3 className="text-lg font-bold mb-4">Envolvidos</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {MOCK_ENTITIES.map(entity => {
                                    const Icon = ENTITY_ICONS[entity.type] || FileText;
                                    const connections = getEntityConnections(entity.id);
                                    
                                    return (
                                        <button
                                            key={entity.id}
                                            onClick={() => setSelectedEntity(entity)}
                                            className={`p-4 rounded-xl border transition-all text-left ${
                                                selectedEntity?.id === entity.id
                                                    ? 'bg-gray-800 border-cyan-500'
                                                    : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
                                            }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={`w-10 h-10 ${ENTITY_COLORS[entity.type]} rounded-lg flex items-center justify-center`}>
                                                    <Icon className="w-5 h-5 text-white" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium truncate">{entity.name}</div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className={`px-2 py-0.5 text-xs rounded-full ${ROLE_COLORS[entity.role] || 'text-gray-400 bg-gray-500/10'}`}>
                                                            {entity.role}
                                                        </span>
                                                        <span className="text-xs text-gray-500">
                                                            {connections.length} conexões
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                    
                    {/* Timeline Column */}
                    <div className="space-y-6">
                        {/* Timeline */}
                        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Clock className="w-5 h-5 text-cyan-400" />
                                Linha do Tempo
                            </h3>
                            <div className="space-y-4">
                                {MOCK_TIMELINE.map((event, idx) => (
                                    <div key={idx} className="flex gap-3">
                                        <div className="flex flex-col items-center">
                                            <div className={`w-3 h-3 rounded-full ${
                                                event.type === 'critical' ? 'bg-red-500' :
                                                event.type === 'warning' ? 'bg-amber-500' :
                                                'bg-gray-500'
                                            }`} />
                                            {idx < MOCK_TIMELINE.length - 1 && (
                                                <div className="w-0.5 h-full bg-gray-700 mt-1" />
                                            )}
                                        </div>
                                        <div className="pb-4">
                                            <div className="text-xs text-gray-500 font-mono">{event.time}</div>
                                            <div className={`text-sm ${
                                                event.type === 'critical' ? 'text-red-400' :
                                                event.type === 'warning' ? 'text-amber-400' :
                                                'text-gray-300'
                                            }`}>
                                                {event.event}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        {/* Entity Details */}
                        {selectedEntity && (
                            <div className="bg-gray-900 rounded-2xl border border-cyan-500/40 p-6">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <Eye className="w-5 h-5 text-cyan-400" />
                                    Detalhes
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <div className="text-xs text-gray-500 uppercase">Nome</div>
                                        <div className="font-medium">{selectedEntity.name}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500 uppercase">Tipo</div>
                                        <div className="text-sm">{selectedEntity.type}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500 uppercase">Papel</div>
                                        <div className={`inline-block px-2 py-0.5 text-sm rounded-full ${ROLE_COLORS[selectedEntity.role]}`}>
                                            {selectedEntity.role}
                                        </div>
                                    </div>
                                    {selectedEntity.metadata && (
                                        <div>
                                            <div className="text-xs text-gray-500 uppercase mb-2">Informações</div>
                                            <div className="space-y-1">
                                                {Object.entries(selectedEntity.metadata).map(([key, value]) => (
                                                    <div key={key} className="flex justify-between text-sm">
                                                        <span className="text-gray-400 capitalize">{key.replace('_', ' ')}</span>
                                                        <span className="text-gray-300">
                                                            {Array.isArray(value) ? value.join(', ') : String(value)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* Connections */}
                                    <div>
                                        <div className="text-xs text-gray-500 uppercase mb-2">Conexões</div>
                                        <div className="space-y-2">
                                            {getEntityConnections(selectedEntity.id).map((rel, idx) => {
                                                const targetId = rel.source === selectedEntity.id ? rel.target : rel.source;
                                                const targetEntity = MOCK_ENTITIES.find(e => e.id === targetId);
                                                return (
                                                    <div key={idx} className="flex items-center gap-2 text-sm">
                                                        <Link2 className="w-3 h-3 text-cyan-400" />
                                                        <span className="text-gray-400">{rel.type}</span>
                                                        <span className="text-cyan-400">{targetEntity?.name}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Warning Banner */}
                <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <div className="font-medium text-amber-400">Dados Fictícios para Demonstração</div>
                            <p className="text-sm text-amber-300/70 mt-1">
                                Todos os nomes, CPFs, endereços e informações nesta página são completamente fictícios 
                                e foram criados exclusivamente para fins de treinamento e demonstração do sistema. 
                                Qualquer semelhança com pessoas ou fatos reais é mera coincidência.
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
