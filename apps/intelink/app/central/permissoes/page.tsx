'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { 
    Shield, Users, Search, Save, AlertTriangle,
    Crown, UserCog, User, GraduationCap, Check, Eye, Plus, X, Phone, Mail, Loader2,
    Edit2, Trash2, MessageCircle, KeyRound, Copy, CheckCircle
} from 'lucide-react';
import { useRole, AccessDenied, RoleLoading, SystemRole, ROLE_LABELS } from '@/hooks/useRole';
import { useToast } from '@/components/intelink/Toast';
import { OTPModal } from '@/components/security';
import { 
    Member, 
    ROLE_ICONS, 
    ROLE_COLORS, 
    INITIAL_VISITOR_FORM,
    VisitorFormData,
    PendingRoleChange,
    PasswordResetModal
} from '@/components/permissoes';

export default function PermissoesPage() {
    const permissions = useRole();
    const { showToast } = useToast();
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [saving, setSaving] = useState<string | null>(null);
    const [saved, setSaved] = useState<string | null>(null);
    
    // Visitor creation modal state
    const [showVisitorModal, setShowVisitorModal] = useState(false);
    const [visitorForm, setVisitorForm] = useState({ name: '', phone: '', email: '', notes: '' });
    const [creatingVisitor, setCreatingVisitor] = useState(false);
    const [visitorError, setVisitorError] = useState('');
    
    // Visitor edit modal state
    const [editingVisitor, setEditingVisitor] = useState<Member | null>(null);
    const [editVisitorForm, setEditVisitorForm] = useState({ name: '', phone: '', email: '', notes: '' });
    const [savingVisitor, setSavingVisitor] = useState(false);
    
    // OTP Modal state for admin elevation
    const [showOTPModal, setShowOTPModal] = useState(false);
    const [pendingRoleChange, setPendingRoleChange] = useState<{ memberId: string; memberName: string; newRole: SystemRole } | null>(null);
    
    // Password reset modal state
    const [resetPasswordModal, setResetPasswordModal] = useState<{ memberId: string; memberName: string } | null>(null);
    const [tempPassword, setTempPassword] = useState<string | null>(null);
    const [resettingPassword, setResettingPassword] = useState(false);

    useEffect(() => {
        if (!permissions.isLoading && permissions.canManagePermissions) {
            loadMembers();
        }
    }, [permissions.isLoading, permissions.canManagePermissions]);

    const loadMembers = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/members');
            if (res.ok) {
                const data = await res.json();
                setMembers(data.members || []);
            }
        } catch (error) {
            console.error('Error loading members:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateRole = async (memberId: string, newRole: SystemRole, otpAuthToken?: string) => {
        setSaving(memberId);
        try {
            const res = await fetch('/api/members/role', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    member_id: memberId, 
                    system_role: newRole,
                    otp_auth_token: otpAuthToken 
                })
            });

            const data = await res.json();

            if (res.ok) {
                setMembers(prev => prev.map(m => 
                    m.id === memberId ? { ...m, system_role: newRole } : m
                ));
                setSaved(memberId);
                setTimeout(() => setSaved(null), 2000);
                
                // Clear pending change after success
                setPendingRoleChange(null);
            } else if (data.otp_required) {
                // OTP is required - show modal
                const member = members.find(m => m.id === memberId);
                setPendingRoleChange({ 
                    memberId, 
                    memberName: member?.name || 'Membro', 
                    newRole 
                });
                setShowOTPModal(true);
            } else {
                showToast('error', 'Erro ao atualizar permissão', data.error || 'Tente novamente');
            }
        } catch (error) {
            console.error('Error updating role:', error);
            showToast('error', 'Erro ao atualizar permissão', 'Verifique sua conexão');
        } finally {
            setSaving(null);
        }
    };
    
    // Handle OTP verification success
    const handleOTPVerified = async (authToken: string) => {
        setShowOTPModal(false);
        if (pendingRoleChange) {
            await updateRole(pendingRoleChange.memberId, pendingRoleChange.newRole, authToken);
        }
    };

    // Reset password for a member (admin only)
    const resetMemberPassword = async () => {
        if (!resetPasswordModal) return;
        
        setResettingPassword(true);
        try {
            const res = await fetch('/api/members/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ member_id: resetPasswordModal.memberId })
            });
            
            const data = await res.json();
            
            if (res.ok && data.tempPassword) {
                setTempPassword(data.tempPassword);
                showToast('success', 'Senha resetada', 'Uma nova senha temporária foi gerada');
            } else {
                showToast('error', 'Erro ao resetar senha', data.error || 'Tente novamente');
                setResetPasswordModal(null);
            }
        } catch (error) {
            console.error('Error resetting password:', error);
            showToast('error', 'Erro ao resetar senha', 'Verifique sua conexão');
            setResetPasswordModal(null);
        } finally {
            setResettingPassword(false);
        }
    };

    const deleteMember = async (memberId: string) => {
        if (!confirm('Tem certeza que deseja remover este visitante?')) return;
        
        try {
            const res = await fetch('/api/members', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: memberId })
            });
            
            if (res.ok) {
                setMembers(prev => prev.filter(m => m.id !== memberId));
                showToast('success', 'Visitante removido', 'O visitante foi removido com sucesso');
            } else {
                const data = await res.json();
                showToast('error', 'Erro ao remover visitante', data.error || 'Tente novamente');
            }
        } catch (error) {
            console.error('Error deleting member:', error);
            showToast('error', 'Erro ao remover visitante', 'Verifique sua conexão');
        }
    };

    const openEditVisitor = (member: Member) => {
        setEditingVisitor(member);
        setEditVisitorForm({
            name: member.name || '',
            phone: member.phone || '',
            email: member.email || '',
            notes: ''
        });
    };

    const saveVisitorEdit = async () => {
        if (!editingVisitor || !editVisitorForm.name.trim()) return;
        
        setSavingVisitor(true);
        try {
            const res = await fetch('/api/members', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: editingVisitor.id,
                    name: editVisitorForm.name.trim().toUpperCase(),
                    phone: editVisitorForm.phone.trim(),
                    email: editVisitorForm.email.trim() || null
                })
            });
            
            if (res.ok) {
                setMembers(prev => prev.map(m => 
                    m.id === editingVisitor.id 
                        ? { ...m, name: editVisitorForm.name.trim().toUpperCase(), phone: editVisitorForm.phone, email: editVisitorForm.email }
                        : m
                ));
                setEditingVisitor(null);
            } else {
                const data = await res.json();
                alert(data.error || 'Erro ao atualizar visitante');
            }
        } catch (error) {
            console.error('Error updating visitor:', error);
            alert('Erro ao atualizar visitante');
        } finally {
            setSavingVisitor(false);
        }
    };

    const createVisitor = async () => {
        if (!visitorForm.name.trim() || !visitorForm.phone.trim()) {
            setVisitorError('Nome e telefone são obrigatórios');
            return;
        }
        
        setCreatingVisitor(true);
        setVisitorError('');
        
        try {
            // Get current user's unit_id from localStorage or API
            const memberId = localStorage.getItem('intelink_member_id');
            let unitId = localStorage.getItem('intelink_unit_id');
            
            // If no unit_id cached, try to get from member info
            if (!unitId && memberId) {
                const memberRes = await fetch(`/api/members/${memberId}`);
                if (memberRes.ok) {
                    const memberData = await memberRes.json();
                    unitId = memberData.member?.unit_id || memberData.unit_id;
                    if (unitId) localStorage.setItem('intelink_unit_id', unitId);
                }
            }
            
            if (!unitId) {
                setVisitorError('Erro: Unidade não identificada. Faça login novamente.');
                setCreatingVisitor(false);
                return;
            }
            
            const res = await fetch('/api/members', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: visitorForm.name.trim(),
                    phone: visitorForm.phone.replace(/\D/g, ''),
                    email: visitorForm.email.trim() || null,
                    role: 'Visitante',
                    system_role: 'visitor',
                    unit_id: unitId,
                    notes: visitorForm.notes.trim() || null
                })
            });
            
            if (res.ok) {
                setShowVisitorModal(false);
                setVisitorForm({ name: '', phone: '', email: '', notes: '' });
                loadMembers();
            } else {
                const data = await res.json();
                
                // Handle duplicate phone error with admin contact info
                if (data.duplicate && data.adminContact) {
                    const contact = data.adminContact;
                    setVisitorError(
                        `${data.error}\n\n` +
                        `📞 WhatsApp: ${contact.whatsapp}\n` +
                        `📱 Telegram: ${contact.telegram}\n\n` +
                        `${contact.message}`
                    );
                } else {
                    // Handle other error formats
                    const errorMsg = typeof data.error === 'object' 
                        ? (data.error.message || JSON.stringify(data.error))
                        : (data.error || data.message || 'Erro ao criar visitante');
                    setVisitorError(errorMsg);
                }
            }
        } catch (error) {
            setVisitorError('Erro de conexão');
        } finally {
            setCreatingVisitor(false);
        }
    };

    // Check permissions
    if (permissions.isLoading) return <RoleLoading />;
    if (!permissions.canManagePermissions) return <AccessDenied />;

    const filteredMembers = members.filter(m => 
        m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.unit?.code?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Group by role (including visitors!)
    const membersByRole = {
        super_admin: filteredMembers.filter(m => m.system_role === 'super_admin'),
        unit_admin: filteredMembers.filter(m => m.system_role === 'unit_admin'),
        member: filteredMembers.filter(m => m.system_role === 'member' || (!m.system_role && m.role?.toLowerCase() !== 'visitante')),
        intern: filteredMembers.filter(m => m.system_role === 'intern'),
        visitor: filteredMembers.filter(m => m.system_role === 'visitor' || m.role?.toLowerCase() === 'visitante'),
    };

    return (
        <>
            
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
                {/* Header */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Shield className="w-7 h-7 text-red-400" />
                        Gerenciar Permissões
                    </h2>
                    <p className="text-slate-400 mt-1">Controle de acesso ao sistema por perfil de usuário</p>
                </div>

                {/* Warning */}
                <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-yellow-300 font-medium">Atenção: Área Restrita</p>
                        <p className="text-yellow-300/70 text-sm">Alterações aqui afetam o acesso dos usuários ao sistema. Super Admins têm acesso total.</p>
                    </div>
                </div>

                {/* Role Legend */}
                <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-3">
                    {(Object.keys(ROLE_LABELS) as SystemRole[]).map(role => {
                        const Icon = ROLE_ICONS[role];
                        const info = ROLE_LABELS[role];
                        return (
                            <div 
                                key={role}
                                className={`p-3 rounded-lg border ${ROLE_COLORS[role]} bg-opacity-10`}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <Icon className="w-4 h-4" />
                                    <span className="font-medium text-sm">{info.label}</span>
                                </div>
                                <p className="text-xs opacity-70">{info.description}</p>
                            </div>
                        );
                    })}
                </div>

                {/* Search + Add Visitor Button */}
                <div className="flex gap-3 mb-6">
                    <div className="relative flex-1">
                        <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Buscar membro por nome ou delegacia..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                        />
                    </div>
                    {permissions.role === 'super_admin' && (
                        <button
                            onClick={() => setShowVisitorModal(true)}
                            className="flex items-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                            <span className="hidden sm:inline">Criar Visitante</span>
                        </button>
                    )}
                </div>

                {/* Members List */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {(Object.entries(membersByRole) as [SystemRole, Member[]][]).map(([role, roleMembers]) => {
                            if (roleMembers.length === 0) return null;
                            const RoleIcon = ROLE_ICONS[role];
                            const roleInfo = ROLE_LABELS[role];
                            
                            // Special card layout for visitors
                            if (role === 'visitor') {
                                return (
                                    <div key={role} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                                        <div className={`px-4 py-3 border-b border-slate-800 flex items-center gap-3 ${ROLE_COLORS[role]} bg-opacity-20`}>
                                            <RoleIcon className="w-5 h-5" />
                                            <span className="font-semibold">{roleInfo.label}</span>
                                            <span className="text-sm opacity-70">({roleMembers.length})</span>
                                        </div>
                                        
                                        {/* Grid de cards para visitantes */}
                                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {roleMembers.map(member => (
                                                <div 
                                                    key={member.id}
                                                    className="bg-slate-800 border border-slate-700 rounded-xl p-4 hover:border-slate-600 transition-colors"
                                                >
                                                    {/* Header com avatar e ações */}
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center text-white font-bold text-lg">
                                                                {member.name?.charAt(0) || '?'}
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-white">{member.name}</p>
                                                                <p className="text-xs text-gray-400">Visitante</p>
                                                            </div>
                                                        </div>
                                                        
                                                        {/* Action buttons */}
                                                        {permissions.role === 'super_admin' && (
                                                            <div className="flex gap-1">
                                                                <button
                                                                    onClick={() => openEditVisitor(member)}
                                                                    className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                                                                    title="Editar visitante"
                                                                >
                                                                    <Edit2 className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => deleteMember(member.id)}
                                                                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                                    title="Remover visitante"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    {/* Contact info */}
                                                    <div className="space-y-2 text-sm">
                                                        {member.phone && (
                                                            <div className="flex items-center gap-2 text-slate-400">
                                                                <Phone className="w-4 h-4" />
                                                                <span>{member.phone}</span>
                                                            </div>
                                                        )}
                                                        {member.email && (
                                                            <div className="flex items-center gap-2 text-slate-400">
                                                                <Mail className="w-4 h-4" />
                                                                <span>{member.email}</span>
                                                            </div>
                                                        )}
                                                        {!member.phone && !member.email && (
                                                            <p className="text-slate-500 text-xs italic">Sem contato cadastrado</p>
                                                        )}
                                                    </div>
                                                    
                                                    {/* Role selector */}
                                                    <div className="mt-3 pt-3 border-t border-slate-700">
                                                        <select
                                                            value={member.system_role || 'visitor'}
                                                            onChange={(e) => updateRole(member.id, e.target.value as SystemRole)}
                                                            disabled={saving === member.id}
                                                            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
                                                        >
                                                            <option value="visitor">Visitante</option>
                                                            <option value="intern">Estagiário</option>
                                                            <option value="member">Membro</option>
                                                            <option value="unit_admin">Admin Unidade</option>
                                                            <option value="super_admin">Super Admin</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            }
                            
                            // Default list layout for other roles
                            return (
                                <div key={role} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                                    <div className={`px-4 py-3 border-b border-slate-800 flex items-center gap-3 ${ROLE_COLORS[role]} bg-opacity-20`}>
                                        <RoleIcon className="w-5 h-5" />
                                        <span className="font-semibold">{roleInfo.label}</span>
                                        <span className="text-sm opacity-70">({roleMembers.length})</span>
                                    </div>
                                    
                                    <div className="divide-y divide-slate-800">
                                        {roleMembers.map(member => (
                                            <div 
                                                key={member.id}
                                                className="px-4 py-3 flex items-center justify-between hover:bg-slate-800/50"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold">
                                                        {member.name?.charAt(0) || '?'}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-white">{member.name}</p>
                                                        <p className="text-sm text-slate-400">
                                                            {member.unit?.code || 'Sem lotação'} • {member.role}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    {/* Reset Password Button */}
                                                    <button
                                                        onClick={() => setResetPasswordModal({ memberId: member.id, memberName: member.name })}
                                                        className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                                                        title="Resetar senha"
                                                    >
                                                        <KeyRound className="w-4 h-4" />
                                                    </button>
                                                    
                                                    <select
                                                        value={member.system_role || 'member'}
                                                        onChange={(e) => updateRole(member.id, e.target.value as SystemRole)}
                                                        disabled={saving === member.id}
                                                        className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
                                                    >
                                                        <option value="super_admin">Super Admin</option>
                                                        <option value="unit_admin">Admin Unidade</option>
                                                        <option value="member">Membro</option>
                                                        <option value="intern">Estagiário</option>
                                                        <option value="visitor">Visitante</option>
                                                    </select>

                                                    {saving === member.id && (
                                                        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                                    )}
                                                    {saved === member.id && (
                                                        <Check className="w-5 h-5 text-emerald-400" />
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}

                        {filteredMembers.length === 0 && (
                            <div className="text-center py-12 bg-slate-900/50 rounded-xl border border-slate-800">
                                <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                                <p className="text-slate-400">Nenhum membro encontrado</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
            
            {/* Visitor Creation Modal */}
            {showVisitorModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center">
                                    <Eye className="w-5 h-5 text-emerald-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">Criar Visitante</h3>
                                    <p className="text-sm text-slate-400">Acesso limitado ao sistema</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowVisitorModal(false)}
                                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">
                                    Nome Completo *
                                </label>
                                <div className="relative">
                                    <User className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        placeholder="Nome do visitante"
                                        value={visitorForm.name}
                                        onChange={(e) => setVisitorForm(f => ({ ...f, name: e.target.value }))}
                                        className="w-full pl-11 pr-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                            </div>
                            
                            {/* Phone */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">
                                    Telefone *
                                </label>
                                <div className="relative">
                                    <Phone className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="tel"
                                        placeholder="(00) 00000-0000"
                                        value={visitorForm.phone}
                                        onChange={(e) => setVisitorForm(f => ({ ...f, phone: e.target.value }))}
                                        className="w-full pl-11 pr-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                            </div>
                            
                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">
                                    Email (opcional)
                                </label>
                                <div className="relative">
                                    <Mail className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="email"
                                        placeholder="email@exemplo.com"
                                        value={visitorForm.email}
                                        onChange={(e) => setVisitorForm(f => ({ ...f, email: e.target.value }))}
                                        className="w-full pl-11 pr-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                            </div>
                            
                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">
                                    Observações (opcional)
                                </label>
                                <textarea
                                    placeholder="Motivo da visita, período de acesso, etc."
                                    value={visitorForm.notes}
                                    onChange={(e) => setVisitorForm(f => ({ ...f, notes: e.target.value }))}
                                    rows={2}
                                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
                                />
                            </div>
                            
                            {visitorError && (
                                <p className="text-red-400 text-sm text-center">{visitorError}</p>
                            )}
                            
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setShowVisitorModal(false)}
                                    className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={createVisitor}
                                    disabled={creatingVisitor}
                                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {creatingVisitor ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            <Plus className="w-4 h-4" />
                                            Criar Visitante
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Visitor Edit Modal */}
            {editingVisitor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                                    <Edit2 className="w-5 h-5 text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">Editar Visitante</h3>
                                    <p className="text-sm text-slate-400">Atualizar dados do visitante</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setEditingVisitor(null)}
                                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">
                                    Nome Completo *
                                </label>
                                <div className="relative">
                                    <User className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        placeholder="Nome do visitante"
                                        value={editVisitorForm.name}
                                        onChange={(e) => setEditVisitorForm(f => ({ ...f, name: e.target.value }))}
                                        className="w-full pl-11 pr-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                            </div>
                            
                            {/* Phone */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">
                                    Telefone
                                </label>
                                <div className="relative">
                                    <Phone className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="tel"
                                        placeholder="(00) 00000-0000"
                                        value={editVisitorForm.phone}
                                        onChange={(e) => setEditVisitorForm(f => ({ ...f, phone: e.target.value }))}
                                        className="w-full pl-11 pr-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                            </div>
                            
                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">
                                    Email (opcional)
                                </label>
                                <div className="relative">
                                    <Mail className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="email"
                                        placeholder="email@exemplo.com"
                                        value={editVisitorForm.email}
                                        onChange={(e) => setEditVisitorForm(f => ({ ...f, email: e.target.value }))}
                                        className="w-full pl-11 pr-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                            </div>
                            
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setEditingVisitor(null)}
                                    className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={saveVisitorEdit}
                                    disabled={savingVisitor || !editVisitorForm.name.trim()}
                                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {savingVisitor ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            Salvar
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Password Reset Modal */}
            {resetPasswordModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center">
                                    <KeyRound className="w-5 h-5 text-amber-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">Resetar Senha</h3>
                                    <p className="text-sm text-slate-400">{resetPasswordModal.memberName}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setResetPasswordModal(null);
                                    setTempPassword(null);
                                }}
                                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>
                        
                        {!tempPassword ? (
                            <div className="space-y-4">
                                <p className="text-slate-300 text-sm">
                                    Será gerada uma senha temporária que você deverá informar ao usuário.
                                </p>
                                <p className="text-slate-400 text-xs">
                                    O usuário será obrigado a criar uma nova senha no próximo login.
                                </p>
                                
                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => {
                                            setResetPasswordModal(null);
                                            setTempPassword(null);
                                        }}
                                        className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={resetMemberPassword}
                                        disabled={resettingPassword}
                                        className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 rounded-lg text-white font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {resettingPassword ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>
                                                <KeyRound className="w-4 h-4" />
                                                Gerar Senha
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-center">
                                    <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                                    <p className="text-slate-400 text-sm mb-2">Senha temporária gerada:</p>
                                    <div className="flex items-center justify-center gap-2">
                                        <p className="text-3xl font-mono font-bold text-white tracking-widest">
                                            {tempPassword}
                                        </p>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(tempPassword);
                                                alert('Senha copiada!');
                                            }}
                                            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                                            title="Copiar"
                                        >
                                            <Copy className="w-4 h-4 text-slate-400" />
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="bg-slate-700/50 rounded-lg p-3 text-sm text-slate-300">
                                    <p className="font-medium mb-1">Próximos passos:</p>
                                    <ol className="list-decimal list-inside space-y-1 text-slate-400">
                                        <li>Envie esta senha ao usuário (WhatsApp/telefone)</li>
                                        <li>O usuário faz login com a senha temporária</li>
                                        <li>O sistema pedirá para criar uma nova senha</li>
                                    </ol>
                                </div>
                                
                                <button
                                    onClick={() => {
                                        setResetPasswordModal(null);
                                        setTempPassword(null);
                                    }}
                                    className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors"
                                >
                                    Fechar
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
            
            {/* OTP Modal for Admin Elevation */}
            <OTPModal
                isOpen={showOTPModal}
                onClose={() => {
                    setShowOTPModal(false);
                    setPendingRoleChange(null);
                }}
                onVerified={handleOTPVerified}
                action="role_elevation"
                context={pendingRoleChange ? {
                    targetMemberId: pendingRoleChange.memberId,
                    targetRole: pendingRoleChange.newRole,
                    targetMemberName: pendingRoleChange.memberName,
                } : undefined}
            />
        </>
    );
}
