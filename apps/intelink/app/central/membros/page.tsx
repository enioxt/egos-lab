'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { 
    Users, Plus, Edit2, Trash2, Phone, MessageCircle,
    Shield, Save, X, UserCircle, Search
} from 'lucide-react';
import { useRole, AccessDenied, RoleLoading } from '@/hooks/useRole';
import { PageHeaderCompact } from '@/components/shared/PageHeader';
import { useToast } from '@/components/intelink/Toast';

// Roles with their colors - Ordem hierárquica (cores originais do usuário)
const ROLES = [
    { id: 'delegado', name: 'Delegado(a) de Polícia', color: 'red', bgClass: 'bg-red-500', textClass: 'text-red-400', borderClass: 'border-red-500' },
    { id: 'escrivao', name: 'Escrivão(ã) de Polícia', color: 'yellow', bgClass: 'bg-yellow-500', textClass: 'text-yellow-400', borderClass: 'border-yellow-500' },
    { id: 'investigador', name: 'Investigador(a) de Polícia', color: 'green', bgClass: 'bg-green-500', textClass: 'text-green-400', borderClass: 'border-green-500' },
    { id: 'perito', name: 'Perito(a)', color: 'blue', bgClass: 'bg-blue-500', textClass: 'text-blue-400', borderClass: 'border-blue-500' },
    { id: 'medico_legista', name: 'Médico(a) Legista', color: 'teal', bgClass: 'bg-teal-500', textClass: 'text-teal-400', borderClass: 'border-teal-500' },
    { id: 'estagiario', name: 'Estagiário(a)', color: 'purple', bgClass: 'bg-purple-500', textClass: 'text-purple-400', borderClass: 'border-purple-500' },
    { id: 'Visitante', name: 'Visitante', color: 'gray', bgClass: 'bg-gray-500', textClass: 'text-gray-400', borderClass: 'border-gray-500' },
];

// Funções de chefia por cargo base
const CHIEF_FUNCTIONS: Record<string, { id: string; name: string; icon: string }[]> = {
    delegado: [
        { id: 'delegado_regional', name: 'Delegado Chefe Regional', icon: '🏛️' },
        { id: 'delegado_departamento', name: 'Delegado Chefe do Departamento', icon: '🏢' },
    ],
    investigador: [
        { id: 'subinspetor', name: 'Subinspetor', icon: '⭐' },
        { id: 'inspetor', name: 'Inspetor de Polícia', icon: '⭐⭐' },
    ],
    escrivao: [
        { id: 'chefe_cartorio', name: 'Chefe de Cartório', icon: '📋' },
    ],
    perito: [
        { id: 'chefe_pericia', name: 'Chefe da Perícia', icon: '🔬' },
    ],
    medico_legista: [
        { id: 'chefe_iml', name: 'Chefe do IML', icon: '🏥' },
    ],
};

// Role order for sorting members
const ROLE_PRIORITY: Record<string, number> = {
    delegado: 1,
    escrivao: 2,
    investigador: 3,
    perito: 4,
    medico_legista: 5,
    estagiario: 6,
};

interface TeamMember {
    id: string;
    unit_id: string;
    name: string;
    role: string;
    role_color: string;
    rank?: string;
    badge_number?: string;
    phone?: string;
    whatsapp?: string;
    telegram_username?: string;
    telegram_chat_id?: number;
    email?: string;
    is_chief: boolean;
    chief_function?: string; // Função de chefia temporária
    active: boolean;
    created_at: string;
    system_role?: string; // visitor, intern, member, unit_admin, super_admin
    // Extended with unit info
    unit?: {
        id: string;
        code: string;
        name: string;
    };
}

interface PoliceUnit {
    id: string;
    code: string;
    name: string;
}

export default function TeamManagementPage() {
    // RBAC Protection
    const permissions = useRole();
    const { showToast } = useToast();
    
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [allMembers, setAllMembers] = useState<TeamMember[]>([]);
    const [units, setUnits] = useState<PoliceUnit[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUnit, setSelectedUnit] = useState<string>('all'); // 'all' = todos
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        role: 'investigador',
        role_color: 'green',
        rank: '',
        badge_number: '',
        phone: '',
        whatsapp: '',
        telegram_username: '',
        email: '',
        is_chief: false,
        chief_function: '', // Função de chefia temporária
        unit_id: '', // Lotação/Delegacia
        custom_unit: '' // Campo para "Outra" unidade
    });

    useEffect(() => {
        // Todos podem visualizar membros da equipe
        if (!permissions.isLoading && permissions.canViewMembers) {
            loadData();
        }
    }, [permissions.isLoading, permissions.canViewMembers]);

    useEffect(() => {
        // Filter members when unit selection changes
        if (selectedUnit === 'all') {
            setMembers(allMembers);
        } else {
            setMembers(allMembers.filter(m => m.unit_id === selectedUnit));
        }
    }, [selectedUnit, allMembers]);
    
    // RBAC: Todos podem visualizar membros, apenas admins podem gerenciar
    if (permissions.isLoading) return <RoleLoading />;
    if (!permissions.canViewMembers) return <AccessDenied />;
    
    // Flag para esconder botões de edição
    const canEdit = permissions.canManageMembers;

    const loadData = async () => {
        setLoading(true);
        
        try {
            // Load units via API
            const unitsRes = await fetch('/api/units');
            if (unitsRes.ok) {
                const data = await unitsRes.json();
                setUnits(data.units || []);
            }
            
            // Load members via API
            const membersRes = await fetch('/api/members');
            if (membersRes.ok) {
                const data = await membersRes.json();
                // Sort members by role priority
                // Filter out visitors - they appear in /central/permissoes, not here
                const nonVisitors = (data.members || []).filter((m: TeamMember) => 
                    m.system_role !== 'visitor' && m.role?.toLowerCase() !== 'visitante'
                );
                const sortedMembers = nonVisitors.sort((a: TeamMember, b: TeamMember) => {
                    const priorityA = ROLE_PRIORITY[a.role] || 99;
                    const priorityB = ROLE_PRIORITY[b.role] || 99;
                    return priorityA - priorityB;
                });
                setAllMembers(sortedMembers);
                setMembers(sortedMembers);
            }
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const reloadMembers = async () => {
        const membersRes = await fetch('/api/members');
        if (membersRes.ok) {
            const data = await membersRes.json();
            // Sort members by role priority
            // Filter out visitors - they appear in /central/permissoes, not here
            const nonVisitors = (data.members || []).filter((m: TeamMember) => 
                m.system_role !== 'visitor' && m.role?.toLowerCase() !== 'visitante'
            );
            const sortedMembers = nonVisitors.sort((a: TeamMember, b: TeamMember) => {
                const priorityA = ROLE_PRIORITY[a.role] || 99;
                const priorityB = ROLE_PRIORITY[b.role] || 99;
                return priorityA - priorityB;
            });
            setAllMembers(sortedMembers);
            // Re-apply filter
            if (selectedUnit === 'all') {
                setMembers(sortedMembers);
            } else {
                setMembers(sortedMembers.filter((m: TeamMember) => m.unit_id === selectedUnit));
            }
        }
    };

    const handleRoleChange = (roleId: string) => {
        const role = ROLES.find(r => r.id === roleId);
        setFormData({
            ...formData,
            role: roleId,
            role_color: role?.color || 'gray'
        });
    };

    // Format phone number as user types: (00) 00000-0000
    const formatPhone = (value: string) => {
        const digits = value.replace(/\D/g, '');
        if (digits.length <= 2) {
            return digits.length ? `(${digits}` : '';
        } else if (digits.length <= 7) {
            return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
        } else {
            return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
        }
    };

    // Format WhatsApp as user types: +55 (00) 00000-0000
    const formatWhatsAppInput = (value: string) => {
        const digits = value.replace(/\D/g, '');
        if (digits.length <= 2) {
            return digits.length ? `+${digits}` : '';
        } else if (digits.length <= 4) {
            return `+${digits.slice(0, 2)} (${digits.slice(2)}`;
        } else if (digits.length <= 9) {
            return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4)}`;
        } else {
            return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9, 13)}`;
        }
    };

    const formatWhatsApp = (number: string) => {
        // Remove non-digits
        const digits = number.replace(/\D/g, '');
        // Format as wa.me link
        return digits ? `wa.me/${digits}` : '';
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, phone: formatPhone(e.target.value) });
    };

    const handleWhatsAppChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, whatsapp: formatWhatsAppInput(e.target.value) });
    };

    const openAddModal = () => {
        setEditingMember(null);
        setFormData({
            name: '',
            role: 'investigador',
            role_color: 'green',
            rank: '',
            badge_number: '',
            phone: '',
            whatsapp: '',
            telegram_username: '',
            email: '',
            is_chief: false,
            chief_function: '',
            unit_id: units[0]?.id || '', // Default para primeira unidade
            custom_unit: ''
        });
        setIsModalOpen(true);
    };

    const openEditModal = (member: TeamMember) => {
        setEditingMember(member);
        setFormData({
            name: member.name,
            role: member.role,
            role_color: member.role_color || 'gray',
            rank: member.rank || '',
            badge_number: member.badge_number || '',
            phone: formatPhone(member.phone || ''),
            whatsapp: formatWhatsAppInput(member.whatsapp || ''),
            telegram_username: member.telegram_username || '',
            email: member.email || '',
            is_chief: member.is_chief,
            chief_function: member.chief_function || '',
            unit_id: member.unit_id || '', // Lotação atual
            custom_unit: ''
        });
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        // Extract only digits for storage
        const phoneDigits = formData.phone.replace(/\D/g, '');
        const whatsappDigits = formData.whatsapp.replace(/\D/g, '');
        const whatsappFormatted = whatsappDigits ? `wa.me/${whatsappDigits}` : '';
        
        const memberData = {
            unit_id: formData.unit_id || units[0]?.id, // Usar lotação selecionada no form
            name: formData.name.toUpperCase(),
            role: formData.role,
            role_color: formData.role_color,
            rank: formData.rank || null,
            badge_number: formData.badge_number || null,
            phone: phoneDigits || null,
            whatsapp: whatsappFormatted || null,
            telegram_username: formData.telegram_username || null,
            email: formData.email || null,
            is_chief: formData.is_chief || !!formData.chief_function,
            chief_function: formData.chief_function || null
        };

        try {
            if (editingMember) {
                await fetch('/api/members', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: editingMember.id, ...memberData })
                });
            } else {
                await fetch('/api/members', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(memberData)
                });
            }

            setIsModalOpen(false);
            reloadMembers();
        } catch (error) {
            console.error('Error saving member:', error);
            showToast('error', 'Erro ao Salvar', 'Erro ao salvar membro. Tente novamente.');
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Tem certeza que deseja remover este membro?')) {
            try {
                await fetch(`/api/members?id=${id}`, {
                    method: 'DELETE'
                });
                reloadMembers();
            } catch (error) {
                console.error('Error deleting member:', error);
                showToast('error', 'Erro ao Remover', 'Erro ao remover membro.');
            }
        }
    };

    const getRoleInfo = (roleId: string) => {
        // Try exact match first, then case-insensitive
        const role = ROLES.find(r => r.id === roleId) || 
                     ROLES.find(r => r.id.toLowerCase() === roleId?.toLowerCase());
        // Return found role or create a gray "unknown" role
        return role || { id: roleId, name: roleId || 'Desconhecido', color: 'gray', bgClass: 'bg-gray-500', textClass: 'text-gray-400', borderClass: 'border-gray-500' };
    };

    return (
        <>
            <div className="w-full px-4 md:px-6 py-6">
                <PageHeaderCompact
                    title="Membros da Equipe"
                    subtitle="Gerencie os servidores e suas lotações"
                    icon={Users}
                    iconColor="text-emerald-400"
                    actions={
                        loading ? (
                            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                        <div className="flex items-center gap-3 flex-wrap">
                            <select
                                value={selectedUnit}
                                onChange={(e) => setSelectedUnit(e.target.value)}
                                className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                            >
                                <option value="all">Todas as Delegacias ({allMembers.length})</option>
                                {units.map(unit => (
                                    <option key={unit.id} value={unit.id}>
                                        {unit.code} - {unit.name} ({allMembers.filter(m => m.unit_id === unit.id).length})
                                    </option>
                                ))}
                            </select>
                            {canEdit && (
                                <button
                                    onClick={openAddModal}
                                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition-colors flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    Novo Membro
                                </button>
                            )}
                        </div>
                        )
                    }
                />

                {/* Role Legend */}
                <div className="py-4">
                    <div className="flex flex-wrap gap-4 text-sm">
                        {ROLES.map(role => (
                            <div key={role.id} className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${role.bgClass}`}></div>
                                <span className="text-slate-400">{role.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Members Grid */}
                <div className="pb-6">
                    {members.length === 0 ? (
                        <div className="text-center py-16">
                            <UserCircle className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                            <p className="text-slate-400 text-lg">Nenhum membro cadastrado</p>
                            <p className="text-slate-500 text-sm mt-2">Clique em "Novo Membro" para adicionar</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {members.map(member => {
                                const roleInfo = getRoleInfo(member.role);
                                return (
                                    <div
                                        key={member.id}
                                        className={`bg-slate-800/50 border-l-4 ${roleInfo.borderClass} rounded-xl p-4 hover:bg-slate-800 transition-colors h-[220px] flex flex-col`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full ${roleInfo.bgClass} flex items-center justify-center text-white font-bold`}>
                                                    {member.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-white flex items-center gap-2">
                                                        {member.name}
                                                        {member.is_chief && (
                                                            <Shield className="w-4 h-4 text-yellow-400" />
                                                        )}
                                                    </h3>
                                                    <p className={`text-sm ${roleInfo.textClass}`}>
                                                        {roleInfo.name}
                                                    </p>
                                                    {member.chief_function && (
                                                        <p className="text-xs text-amber-400 font-medium">
                                                            {CHIEF_FUNCTIONS[member.role]?.find(f => f.id === member.chief_function)?.icon || '⭐'}{' '}
                                                            {CHIEF_FUNCTIONS[member.role]?.find(f => f.id === member.chief_function)?.name || member.chief_function}
                                                        </p>
                                                    )}
                                                    <p className="text-xs text-slate-500 mt-0.5">
                                                        📍 {member.unit ? `${member.unit.code} - ${member.unit.name}` : 'Sem lotação'}
                                                    </p>
                                                </div>
                                            </div>
                                            {canEdit && (
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => openEditModal(member)}
                                                        className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                                                    >
                                                        <Edit2 className="w-4 h-4 text-slate-400" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(member.id)}
                                                        className="p-2 hover:bg-red-900/50 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4 text-red-400" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Contact Info - Clean UI: só mostra se tiver dado */}
                                        <div className="mt-4 space-y-2 text-sm flex-1">
                                            {member.badge_number && (
                                                <p className="text-slate-400">
                                                    <span className="font-medium">Mat.:</span> {member.badge_number}
                                                </p>
                                            )}
                                            {member.phone && (
                                                <p className="text-slate-400 flex items-center gap-2">
                                                    <Phone className="w-3 h-3" />
                                                    {member.phone}
                                                </p>
                                            )}
                                            {member.whatsapp && (
                                                <a
                                                    href={`https://${member.whatsapp}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-green-400 hover:text-green-300 flex items-center gap-2"
                                                >
                                                    <MessageCircle className="w-3 h-3" />
                                                    WhatsApp
                                                </a>
                                            )}
                                            {member.telegram_username && (
                                                <a
                                                    href={`https://t.me/${member.telegram_username}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-blue-400 hover:text-blue-300 flex items-center gap-2"
                                                >
                                                    @{member.telegram_username}
                                                </a>
                                            )}
                                            {/* Se não tiver nenhum contato, mostra mensagem discreta */}
                                            {!member.badge_number && !member.phone && !member.whatsapp && !member.telegram_username && (
                                                <p className="text-slate-600 text-xs italic">Sem dados de contato</p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-700 flex items-center justify-between">
                            <h2 className="text-xl font-bold">
                                {editingMember ? 'Editar Membro' : 'Novo Membro'}
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 hover:bg-slate-700 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">
                                    Nome Completo *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white uppercase focus:outline-none focus:border-emerald-500"
                                    placeholder="NOME DO SERVIDOR"
                                />
                            </div>

                            {/* Role Selection */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Cargo *
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {ROLES.map(role => (
                                        <button
                                            key={role.id}
                                            type="button"
                                            onClick={() => handleRoleChange(role.id)}
                                            className={`p-3 rounded-lg border-2 transition-all ${
                                                formData.role === role.id
                                                    ? `${role.borderClass} bg-slate-900`
                                                    : 'border-slate-600 hover:border-slate-500'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className={`w-3 h-3 rounded-full ${role.bgClass}`}></div>
                                                <span className="text-sm">{role.name}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Lotação / Delegacia */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">
                                    Lotação (Delegacia) *
                                </label>
                                <select
                                    value={formData.unit_id}
                                    onChange={(e) => setFormData({...formData, unit_id: e.target.value, custom_unit: ''})}
                                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                                >
                                    {units.map(unit => (
                                        <option key={unit.id} value={unit.id}>
                                            {unit.code} - {unit.name}
                                        </option>
                                    ))}
                                </select>
                                
                                {/* Campo customizado quando "Outra" selecionada */}
                                {units.find(u => u.id === formData.unit_id)?.code === 'OUTRA' && (
                                    <div className="mt-2">
                                        <input
                                            type="text"
                                            value={formData.custom_unit}
                                            onChange={(e) => setFormData({...formData, custom_unit: e.target.value.toUpperCase()})}
                                            className="w-full bg-slate-900 border border-amber-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-500"
                                            placeholder="Digite o nome do setor/lotação"
                                        />
                                        <p className="text-xs text-amber-500 mt-1">
                                            O admin irá revisar e aprovar sua lotação.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Badge Number */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">
                                    Matrícula
                                </label>
                                <input
                                    type="text"
                                    value={formData.badge_number}
                                    onChange={(e) => setFormData({...formData, badge_number: e.target.value})}
                                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                                    placeholder="123456"
                                />
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">
                                    Telefone
                                </label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={handlePhoneChange}
                                    maxLength={15}
                                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono"
                                    placeholder="(34) 99999-9999"
                                />
                            </div>

                            {/* WhatsApp */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">
                                    WhatsApp
                                </label>
                                <input
                                    type="tel"
                                    value={formData.whatsapp}
                                    onChange={handleWhatsAppChange}
                                    maxLength={20}
                                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono"
                                    placeholder="+55 (34) 99999-9999"
                                />
                            </div>

                            {/* Telegram */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">
                                    Username Telegram
                                </label>
                                <div className="flex items-center gap-2">
                                    <span className="text-slate-500 text-sm">@</span>
                                    <input
                                        type="text"
                                        value={formData.telegram_username}
                                        onChange={(e) => setFormData({...formData, telegram_username: e.target.value})}
                                        className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                                        placeholder="username"
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">
                                    E-mail
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                                    placeholder="email@pcmg.mg.gov.br"
                                />
                            </div>

                            {/* Função de Chefia */}
                            {CHIEF_FUNCTIONS[formData.role] && CHIEF_FUNCTIONS[formData.role].length > 0 && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Função de Chefia (temporária)
                                    </label>
                                    <div className="space-y-2">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({...formData, chief_function: '', is_chief: false})}
                                            className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                                                !formData.chief_function
                                                    ? 'border-slate-500 bg-slate-900'
                                                    : 'border-slate-700 hover:border-slate-600'
                                            }`}
                                        >
                                            <span className="text-sm text-slate-400">Nenhuma função de chefia</span>
                                        </button>
                                        {CHIEF_FUNCTIONS[formData.role].map(func => (
                                            <button
                                                key={func.id}
                                                type="button"
                                                onClick={() => setFormData({...formData, chief_function: func.id, is_chief: true})}
                                                className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                                                    formData.chief_function === func.id
                                                        ? 'border-amber-500 bg-amber-900/20'
                                                        : 'border-slate-700 hover:border-slate-600'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span>{func.icon}</span>
                                                    <span className="text-sm">{func.name}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2">
                                        Funções de chefia são temporárias e não alteram o cargo permanente.
                                    </p>
                                </div>
                            )}

                            {/* Is Chief (para cargos sem função de chefia específica) */}
                            {(!CHIEF_FUNCTIONS[formData.role] || CHIEF_FUNCTIONS[formData.role].length === 0) && (
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="is_chief"
                                        checked={formData.is_chief}
                                        onChange={(e) => setFormData({...formData, is_chief: e.target.checked})}
                                        className="w-4 h-4 rounded border-slate-600 bg-slate-900"
                                    />
                                    <label htmlFor="is_chief" className="text-sm text-slate-300">
                                        Chefe da Delegacia
                                    </label>
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-slate-700 flex justify-end gap-3">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={!formData.name}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-colors flex items-center gap-2"
                            >
                                <Save className="w-4 h-4" />
                                Salvar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
