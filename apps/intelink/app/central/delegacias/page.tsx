'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { 
    Building2, Plus, Edit2, Trash2, Phone, Mail, MapPin,
    Save, X, Search, Shield, AlertTriangle, Users, Check
} from 'lucide-react';
import { useRole, SystemRole, RoleLoading, AccessDenied } from '@/hooks/useRole';
import { useToast } from '@/components/intelink/Toast';

interface PoliceUnit {
    id: string;
    code: string;
    name: string;
    full_name: string;
    specialty: string;
    address: string;
    phone: string;
    email: string;
    city: string;
    active: boolean;
}

const SPECIALTIES = [
    { id: 'homicidios', name: 'Homicídios' },
    { id: 'drogas', name: 'Drogas' },
    { id: 'patrimonio', name: 'Crimes Patrimoniais' },
    { id: 'cibercrimes', name: 'Crimes Cibernéticos' },
    { id: 'fraudes', name: 'Fraudes' },
    { id: 'geral', name: 'Geral' },
];

export default function DelegaciasPage() {
    const permissions = useRole();
    const { showToast } = useToast();
    const [units, setUnits] = useState<PoliceUnit[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUnit, setEditingUnit] = useState<PoliceUnit | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; unit: PoliceUnit | null }>({ isOpen: false, unit: null });
    const [deleteReason, setDeleteReason] = useState('');
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        full_name: '',
        specialty: 'geral',
        address: '',
        phone: '',
        email: '',
        city: ''
    });

    useEffect(() => {
        loadUnits();
    }, []);

    const loadUnits = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/units');
            if (res.ok) {
                const data = await res.json();
                setUnits(data.units || []);
            }
        } catch (error) {
            console.error('Error loading units:', error);
        } finally {
            setLoading(false);
        }
    };

    const openAddModal = () => {
        setEditingUnit(null);
        setFormData({
            code: '',
            name: '',
            full_name: '',
            specialty: 'geral',
            address: '',
            phone: '',
            email: '',
            city: ''
        });
        setIsModalOpen(true);
    };

    const openEditModal = (unit: PoliceUnit) => {
        setEditingUnit(unit);
        setFormData({
            code: unit.code || '',
            name: unit.name || '',
            full_name: unit.full_name || '',
            specialty: unit.specialty || 'geral',
            address: unit.address || '',
            phone: unit.phone || '',
            email: unit.email || '',
            city: unit.city || ''
        });
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        try {
            if (editingUnit) {
                await fetch('/api/units', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: editingUnit.id, ...formData })
                });
            } else {
                await fetch('/api/units', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
            }
            setIsModalOpen(false);
            loadUnits();
        } catch (error) {
            console.error('Error saving unit:', error);
            showToast('error', 'Erro ao Salvar', 'Erro ao salvar delegacia. Tente novamente.');
        }
    };

    const openDeleteModal = (unit: PoliceUnit) => {
        setDeleteModal({ isOpen: true, unit });
        setDeleteReason('');
    };

    const handleDeleteRequest = async () => {
        if (!deleteModal.unit) return;
        
        setDeleteLoading(true);
        try {
            // Get current user ID from token
            const token = localStorage.getItem('intelink_token');
            const meRes = await fetch('/api/v2/auth/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const me = await meRes.json();

            const res = await fetch('/api/units/delete-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    unit_id: deleteModal.unit.id,
                    requester_id: me.id,
                    reason: deleteReason || 'Solicitação de exclusão'
                })
            });

            const data = await res.json();

            if (data.success) {
                showToast('success', 'Sucesso', data.message);
                if (data.directDelete || data.request?.status === 'approved') {
                    loadUnits();
                }
                setDeleteModal({ isOpen: false, unit: null });
            } else {
                showToast('error', 'Erro', data.error || 'Erro ao solicitar exclusão');
            }
        } catch (error) {
            console.error('Error requesting delete:', error);
            showToast('error', 'Erro', 'Erro ao solicitar exclusão');
        } finally {
            setDeleteLoading(false);
        }
    };

    const filteredUnits = units.filter(u => 
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.city?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // RBAC: Wait for permissions to load
    if (permissions.isLoading) return <RoleLoading />;
    if (!permissions.canViewInvestigations) return <AccessDenied />;

    return (
        <>
            
            <div className="w-full px-4 md:px-6 py-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Building2 className="w-7 h-7 text-blue-400" />
                            Delegacias
                        </h2>
                        <p className="text-slate-400 mt-1">Gerencie as unidades policiais do sistema</p>
                    </div>
                    
                    <button
                        onClick={openAddModal}
                        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-medium transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        Nova Delegacia
                    </button>
                </div>

                {/* Search */}
                <div className="relative mb-6">
                    <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Buscar por nome, código ou cidade..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                </div>

                {/* Units Grid */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                ) : filteredUnits.length === 0 ? (
                    <div className="text-center py-12 bg-slate-900/50 rounded-xl border border-slate-800">
                        <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-400">Nenhuma delegacia cadastrada</p>
                        <button
                            onClick={openAddModal}
                            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white text-sm transition-colors"
                        >
                            Adicionar Primeira Delegacia
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 auto-rows-fr">
                        {filteredUnits.map((unit) => (
                            <div
                                key={unit.id}
                                className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors flex flex-col h-full min-h-[180px]"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-500/20 rounded-lg">
                                            <Shield className="w-5 h-5 text-blue-400" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-white">{unit.name}</h3>
                                            <p className="text-xs text-slate-500">{unit.code}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => openEditModal(unit)}
                                            className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => openDeleteModal(unit)}
                                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {unit.full_name && (
                                    <p className="text-sm text-slate-400 mb-3">{unit.full_name}</p>
                                )}

                                <div className="space-y-2 text-sm">
                                    {unit.specialty && (
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <span className="px-2 py-0.5 bg-slate-800 rounded text-xs">
                                                {SPECIALTIES.find(s => s.id === unit.specialty)?.name || unit.specialty}
                                            </span>
                                        </div>
                                    )}
                                    {unit.city && (
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <MapPin className="w-4 h-4" />
                                            <span>{unit.city}</span>
                                        </div>
                                    )}
                                    {unit.phone && (
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <Phone className="w-4 h-4" />
                                            <span>{unit.phone}</span>
                                        </div>
                                    )}
                                    {unit.email && (
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <Mail className="w-4 h-4" />
                                            <span className="truncate">{unit.email}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 rounded-xl border border-slate-700 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-white">
                                {editingUnit ? 'Editar Delegacia' : 'Nova Delegacia'}
                            </h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Código */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">
                                    Código *
                                </label>
                                <input
                                    type="text"
                                    value={formData.code}
                                    onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                    placeholder="DHPP, DEIC, 1DP..."
                                />
                            </div>

                            {/* Nome */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">
                                    Nome *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                    placeholder="DHPP Uberlândia"
                                />
                            </div>

                            {/* Nome Completo */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">
                                    Nome Completo
                                </label>
                                <input
                                    type="text"
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                    placeholder="Delegacia de Homicídios e Proteção à Pessoa"
                                />
                            </div>

                            {/* Especialidade */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">
                                    Especialidade
                                </label>
                                <select
                                    value={formData.specialty}
                                    onChange={(e) => setFormData({...formData, specialty: e.target.value})}
                                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                >
                                    {SPECIALTIES.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Cidade */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">
                                    Cidade
                                </label>
                                <input
                                    type="text"
                                    value={formData.city}
                                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                    placeholder="Uberlândia - MG"
                                />
                            </div>

                            {/* Endereço */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">
                                    Endereço
                                </label>
                                <input
                                    type="text"
                                    value={formData.address}
                                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                    placeholder="Rua..."
                                />
                            </div>

                            {/* Telefone */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">
                                    Telefone
                                </label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                    placeholder="(34) 3239-0000"
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                    placeholder="dhpp.uberlandia@pcmg.mg.gov.br"
                                />
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-800 flex gap-3 justify-end">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={!formData.code || !formData.name}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Save className="w-4 h-4" />
                                {editingUnit ? 'Salvar' : 'Criar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal with Quorum */}
            {deleteModal.isOpen && deleteModal.unit && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 rounded-xl border border-slate-700 w-full max-w-md">
                        {/* Header */}
                        <div className="p-6 border-b border-slate-800">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-500/20 rounded-lg">
                                    <AlertTriangle className="w-6 h-6 text-red-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-white">Excluir Delegacia</h3>
                                    <p className="text-sm text-slate-400">Esta ação requer aprovação</p>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-4">
                            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                                <p className="text-white font-medium">{deleteModal.unit.code} - {deleteModal.unit.name}</p>
                                <p className="text-sm text-slate-400 mt-1">{deleteModal.unit.full_name}</p>
                            </div>

                            {/* Quorum Info */}
                            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <Users className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-amber-300 font-medium text-sm">Sistema de Quorum</p>
                                        <p className="text-amber-300/70 text-xs mt-1">
                                            {permissions.role === 'super_admin' 
                                                ? 'Super Admin: precisa de +1 membro para aprovar.'
                                                : 'Necessário metade dos membros + 1 para aprovar a exclusão.'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Reason */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">
                                    Motivo da exclusão
                                </label>
                                <textarea
                                    value={deleteReason}
                                    onChange={(e) => setDeleteReason(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 resize-none"
                                    placeholder="Descreva o motivo..."
                                    rows={3}
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-slate-800 flex gap-3 justify-end">
                            <button
                                onClick={() => setDeleteModal({ isOpen: false, unit: null })}
                                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDeleteRequest}
                                disabled={deleteLoading}
                                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-white font-medium transition-colors disabled:opacity-50"
                            >
                                {deleteLoading ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <Trash2 className="w-4 h-4" />
                                )}
                                Solicitar Exclusão
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
