'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { 
    ArrowLeft, User, Shield, Phone, Building2, 
    Check, X, Crown, UserCog, GraduationCap,
    Mail, Clock, BadgeCheck, AlertCircle, Settings, Eye,
    Edit2, Loader2, Send, ShieldCheck, MessageCircle
} from 'lucide-react';
import { useRole, SystemRole, ROLE_LABELS } from '@/hooks/useRole';

interface MemberInfo {
    id: string;
    name: string;
    role: string;
    system_role: SystemRole;
    phone?: string;
    email?: string;
    whatsapp?: string;
    telegram_username?: string;
    unit?: { code: string; name: string };
    created_at?: string;
}

const ROLE_ICONS: Record<SystemRole, typeof Crown> = {
    super_admin: Crown,
    unit_admin: UserCog,
    member: User,
    intern: GraduationCap,
    visitor: Eye,
};

const ROLE_COLORS: Record<SystemRole, string> = {
    super_admin: 'bg-red-500/20 text-red-400 border-red-500',
    unit_admin: 'bg-orange-500/20 text-orange-400 border-orange-500',
    member: 'bg-blue-500/20 text-blue-400 border-blue-500',
    intern: 'bg-slate-500/20 text-slate-400 border-slate-500',
    visitor: 'bg-slate-600/20 text-slate-500 border-slate-600',
};

type EditField = 'email' | 'phone' | 'whatsapp' | 'telegram' | null;
type EditStep = 'input' | 'otp_sent' | 'verifying' | 'success';

export default function ProfilePage() {
    const permissions = useRole();
    const [memberInfo, setMemberInfo] = useState<MemberInfo | null>(null);
    const [loading, setLoading] = useState(true);
    
    // Edit modal state
    const [editField, setEditField] = useState<EditField>(null);
    const [editStep, setEditStep] = useState<EditStep>('input');
    const [newValue, setNewValue] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [editLoading, setEditLoading] = useState(false);
    const [editError, setEditError] = useState('');
    const [countdown, setCountdown] = useState(0);

    useEffect(() => {
        loadProfile();
    }, []);
    
    // Countdown timer for OTP
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const loadProfile = async () => {
        setLoading(true);
        try {
            // Try multiple ways to get member info
            const memberId = localStorage.getItem('intelink_member_id');
            const chatId = localStorage.getItem('intelink_chat_id');
            const token = localStorage.getItem('intelink_token');
            
            // Method 1: Direct member ID lookup
            if (memberId) {
                const res = await fetch(`/api/members/${memberId}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.member) {
                        setMemberInfo(data.member);
                        setLoading(false);
                        return;
                    }
                }
            }
            
            // Method 2: Use auth/me API to get member info
            const authValue = memberId || token;
            if (authValue) {
                const res = await fetch('/api/v2/auth/me', {
                    headers: { 'Authorization': `Bearer ${authValue}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.id) {
                        // Now fetch full member info
                        const memberRes = await fetch(`/api/members/${data.id}`);
                        if (memberRes.ok) {
                            const memberData = await memberRes.json();
                            if (memberData.member) {
                                // Save member_id for future use
                                localStorage.setItem('intelink_member_id', data.id);
                                setMemberInfo(memberData.member);
                                setLoading(false);
                                return;
                            }
                        }
                        
                        // Fallback: use auth/me data directly
                        setMemberInfo({
                            id: data.id,
                            name: data.name || 'Usuário',
                            role: data.role || 'member',
                            system_role: data.system_role || 'member',
                            unit: data.unit
                        });
                        return;
                    }
                }
            }
            
            // Method 3: Use session to find member
            if (chatId) {
                const sessionRes = await fetch('/api/session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chat_id: chatId })
                });
                if (sessionRes.ok) {
                    const sessionData = await sessionRes.json();
                    if (sessionData.member_id) {
                        localStorage.setItem('intelink_member_id', sessionData.member_id);
                        const memberRes = await fetch(`/api/members/${sessionData.member_id}`);
                        if (memberRes.ok) {
                            const memberData = await memberRes.json();
                            setMemberInfo(memberData.member);
                            return;
                        }
                    }
                }
            }
            
            console.log('[Profile] No authentication found');
        } catch (error) {
            console.error('Error loading profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const RoleIcon = memberInfo?.system_role ? ROLE_ICONS[memberInfo.system_role] : User;
    const roleColor = memberInfo?.system_role ? ROLE_COLORS[memberInfo.system_role] : ROLE_COLORS.member;

    // Open edit modal
    const openEditModal = (field: 'email' | 'phone' | 'whatsapp' | 'telegram') => {
        setEditField(field);
        setEditStep('input');
        // Set initial value based on field
        let initialValue = '';
        switch (field) {
            case 'email': initialValue = memberInfo?.email || ''; break;
            case 'phone': initialValue = memberInfo?.phone || ''; break;
            case 'whatsapp': 
                initialValue = memberInfo?.whatsapp?.replace('wa.me/', '') || ''; 
                break;
            case 'telegram': 
                initialValue = memberInfo?.telegram_username || ''; 
                break;
        }
        setNewValue(initialValue);
        setOtpCode('');
        setEditError('');
    };

    // Close edit modal
    const closeEditModal = () => {
        setEditField(null);
        setEditStep('input');
        setNewValue('');
        setOtpCode('');
        setEditError('');
    };

    // Request OTP (for email/phone) or direct update (for whatsapp/telegram)
    const requestOTP = async () => {
        if (!editField) return;
        setEditLoading(true);
        setEditError('');

        try {
            // WhatsApp and Telegram don't need OTP - direct update
            if (editField === 'whatsapp' || editField === 'telegram') {
                await directUpdate();
                return;
            }
            
            const res = await fetch('/api/profile/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    step: 'request_otp',
                    field: editField,
                    value: newValue
                })
            });

            const data = await res.json();

            if (data.success) {
                setEditStep('otp_sent');
                setCountdown(data.expires_in || 300);
            } else {
                setEditError(data.error || data.message || 'Erro ao enviar código');
            }
        } catch (e) {
            setEditError('Erro de conexão');
        } finally {
            setEditLoading(false);
        }
    };
    
    // Direct update for WhatsApp/Telegram (no OTP needed)
    const directUpdate = async () => {
        if (!editField || !memberInfo?.id) return;
        
        try {
            const updateData: Record<string, string> = {};
            if (editField === 'whatsapp') {
                updateData.whatsapp = newValue;
            } else if (editField === 'telegram') {
                updateData.telegram_username = newValue.replace('@', '');
            }
            
            const res = await fetch('/api/members/me', {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-member-id': memberInfo.id
                },
                body: JSON.stringify(updateData)
            });

            const data = await res.json();

            if (data.success) {
                setEditStep('success');
                // Update local state
                if (editField === 'whatsapp') {
                    setMemberInfo(prev => prev ? { ...prev, whatsapp: `wa.me/${newValue.replace(/\D/g, '')}` } : null);
                } else if (editField === 'telegram') {
                    setMemberInfo(prev => prev ? { ...prev, telegram_username: newValue.replace('@', '') } : null);
                }
                setTimeout(() => closeEditModal(), 2000);
            } else {
                setEditError(data.error || 'Erro ao atualizar');
            }
        } catch (e) {
            setEditError('Erro de conexão');
        } finally {
            setEditLoading(false);
        }
    };

    // Verify OTP and update
    const verifyAndUpdate = async () => {
        if (!editField || !otpCode) return;
        setEditLoading(true);
        setEditError('');

        try {
            const res = await fetch('/api/profile/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    step: 'verify_and_update',
                    field: editField,
                    value: newValue,
                    otp: otpCode
                })
            });

            const data = await res.json();

            if (data.success) {
                setEditStep('success');
                // Update local state
                setMemberInfo(prev => prev ? { ...prev, [editField]: newValue } : null);
                // Close modal after 2 seconds
                setTimeout(() => {
                    closeEditModal();
                }, 2000);
            } else {
                setEditError(data.error || 'Código inválido');
            }
        } catch (e) {
            setEditError('Erro de conexão');
        } finally {
            setEditLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800">
                <div className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link 
                            href="/"
                            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-slate-400" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-white">Meu Perfil</h1>
                            <p className="text-sm text-slate-400">Informações da sua conta e permissões</p>
                        </div>
                    </div>
                    
                    {/* Admin link if has permission */}
                    {permissions.canManagePermissions && (
                        <Link
                            href="/central/permissoes"
                            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg transition-colors text-sm"
                        >
                            <Settings className="w-4 h-4" />
                            <span>Gerenciar Permissões</span>
                        </Link>
                    )}
                </div>
            </header>

            {/* Content */}
            <main className="px-6 py-8">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : memberInfo ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Profile Card - Left Column */}
                        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
                            <div className="flex items-start gap-6">
                                <div className={`w-20 h-20 ${roleColor} rounded-2xl flex items-center justify-center border`}>
                                    <RoleIcon className="w-10 h-10" />
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-2xl font-bold text-white">{memberInfo.name}</h2>
                                    <p className="text-slate-400">{memberInfo.role}</p>
                                    <div className="flex items-center gap-3 mt-3">
                                        <span className={`px-3 py-1 rounded-full text-sm border ${roleColor}`}>
                                            {ROLE_LABELS[memberInfo.system_role].label}
                                        </span>
                                        {memberInfo.unit && (
                                            <span className="flex items-center gap-1.5 text-sm text-slate-400">
                                                <Building2 className="w-4 h-4" />
                                                {memberInfo.unit.name}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Contact Info - Editable */}
                            <div className="grid md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-700">
                                {/* Phone */}
                                <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg min-w-0">
                                    <div className="flex items-center gap-3 text-slate-300 min-w-0 flex-1">
                                        <Phone className="w-5 h-5 text-slate-500 flex-shrink-0" />
                                        <span className="truncate text-sm">{memberInfo.phone || 'Não informado'}</span>
                                    </div>
                                    <button
                                        onClick={() => openEditModal('phone')}
                                        className="p-2 hover:bg-slate-600 rounded-lg transition-colors text-slate-400 hover:text-white"
                                        title="Editar telefone"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                </div>
                                
                                {/* Email */}
                                <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg min-w-0">
                                    <div className="flex items-center gap-3 text-slate-300 min-w-0 flex-1">
                                        <Mail className="w-5 h-5 text-slate-500 flex-shrink-0" />
                                        <span className="truncate text-sm" title={memberInfo.email || undefined}>{memberInfo.email || 'Não informado'}</span>
                                    </div>
                                    <button
                                        onClick={() => openEditModal('email')}
                                        className="p-2 hover:bg-slate-600 rounded-lg transition-colors text-slate-400 hover:text-white"
                                        title="Editar email"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                </div>
                                
                                {/* WhatsApp */}
                                <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg min-w-0">
                                    <div className="flex items-center gap-3 text-slate-300 min-w-0 flex-1">
                                        <MessageCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                        <span className="truncate text-sm">
                                            {memberInfo.whatsapp ? memberInfo.whatsapp.replace('wa.me/', '') : 'Não informado'}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => openEditModal('whatsapp')}
                                        className="p-2 hover:bg-slate-600 rounded-lg transition-colors text-slate-400 hover:text-white"
                                        title="Editar WhatsApp"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                </div>
                                
                                {/* Telegram */}
                                <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg min-w-0">
                                    <div className="flex items-center gap-3 text-slate-300 min-w-0 flex-1">
                                        <Send className="w-5 h-5 text-blue-400 flex-shrink-0" />
                                        <span className="truncate text-sm">
                                            {memberInfo.telegram_username ? `@${memberInfo.telegram_username}` : 'Não informado'}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => openEditModal('telegram')}
                                        className="p-2 hover:bg-slate-600 rounded-lg transition-colors text-slate-400 hover:text-white"
                                        title="Editar Telegram"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            
                            {/* Security Note */}
                            <div className="mt-4 flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                <ShieldCheck className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-blue-300">
                                    Alterações de email e telefone requerem verificação via Telegram para sua segurança.
                                </p>
                            </div>
                        </div>

                        {/* Permissions Card */}
                        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <Shield className="w-5 h-5 text-blue-400" />
                                Suas Permissões
                            </h3>
                            
                            <div className="grid md:grid-cols-2 gap-3">
                                <PermissionItem label="Ver operações" value={permissions.canViewInvestigations} />
                                <PermissionItem label="Editar operações" value={permissions.canEditInvestigations} />
                                <PermissionItem label="Gerenciar membros" value={permissions.canManageMembers} />
                                <PermissionItem label="Gerenciar unidades" value={permissions.canManageUnits} />
                                <PermissionItem label="Gerenciar sistema" value={permissions.canManageSystem} highlight />
                                <PermissionItem label="Gerenciar permissões" value={permissions.canManagePermissions} highlight />
                                <PermissionItem label="Acessar configurações" value={permissions.canAccessConfig} highlight />
                            </div>
                            
                            {/* Request Access */}
                            {!permissions.canManagePermissions && (
                                <div className="mt-6 pt-6 border-t border-slate-700">
                                    <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                                        <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm text-blue-300 font-medium">Precisa de mais permissões?</p>
                                            <p className="text-xs text-blue-400/70 mt-1">
                                                Entre em contato com seu administrador ou delegado para solicitar acesso adicional.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-12 text-center">
                        <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-white mb-2">Perfil não encontrado</h2>
                        <p className="text-slate-400">
                            Não foi possível carregar suas informações. Por favor, faça login novamente.
                        </p>
                    </div>
                )}
            </main>
            
            {/* Edit Modal */}
            {editField && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                {editField === 'email' && <><Mail className="w-5 h-5 text-blue-400" /> Alterar Email</>}
                                {editField === 'phone' && <><Phone className="w-5 h-5 text-blue-400" /> Alterar Telefone</>}
                                {editField === 'whatsapp' && <><MessageCircle className="w-5 h-5 text-green-400" /> Alterar WhatsApp</>}
                                {editField === 'telegram' && <><Send className="w-5 h-5 text-blue-400" /> Alterar Telegram</>}
                            </h3>
                            <button
                                onClick={closeEditModal}
                                className="p-2 hover:bg-slate-700 rounded-lg text-slate-400"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        {/* Success State */}
                        {editStep === 'success' ? (
                            <div className="text-center py-8">
                                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Check className="w-8 h-8 text-emerald-400" />
                                </div>
                                <h4 className="text-lg font-medium text-white">Atualizado com sucesso!</h4>
                                <p className="text-sm text-slate-400 mt-2">
                                    {editField === 'email' && `Email alterado para ${newValue}`}
                                    {editField === 'phone' && `Telefone alterado para ${newValue}`}
                                    {editField === 'whatsapp' && `WhatsApp alterado para ${newValue}`}
                                    {editField === 'telegram' && `Telegram alterado para @${newValue.replace('@', '')}`}
                                </p>
                            </div>
                        ) : editStep === 'otp_sent' ? (
                            /* OTP Input State */
                            <div className="space-y-4">
                                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                                    <p className="text-sm text-blue-300">
                                        📱 Enviamos um código de 6 dígitos para seu Telegram.
                                    </p>
                                    {countdown > 0 && (
                                        <p className="text-xs text-blue-400/70 mt-2">
                                            Expira em {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
                                        </p>
                                    )}
                                </div>
                                
                                <div>
                                    <label className="block text-sm text-slate-400 mb-2">Novo {editField === 'email' ? 'Email' : 'Telefone'}</label>
                                    <input
                                        type={editField === 'email' ? 'email' : 'tel'}
                                        value={newValue}
                                        onChange={(e) => setNewValue(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                                        placeholder={editField === 'email' ? 'novo@email.com' : '(31) 99999-9999'}
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm text-slate-400 mb-2">Código de Verificação</label>
                                    <input
                                        type="text"
                                        value={otpCode}
                                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-center text-2xl tracking-widest font-mono focus:border-blue-500 focus:outline-none"
                                        placeholder="000000"
                                        maxLength={6}
                                    />
                                </div>
                                
                                {editError && (
                                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                                        <p className="text-sm text-red-400">{editError}</p>
                                    </div>
                                )}
                                
                                <button
                                    onClick={verifyAndUpdate}
                                    disabled={editLoading || otpCode.length !== 6}
                                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                                >
                                    {editLoading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            <ShieldCheck className="w-5 h-5" />
                                            Verificar e Salvar
                                        </>
                                    )}
                                </button>
                            </div>
                        ) : (
                            /* Input State */
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-2">
                                        {editField === 'email' && 'Novo Email'}
                                        {editField === 'phone' && 'Novo Telefone'}
                                        {editField === 'whatsapp' && 'Novo WhatsApp'}
                                        {editField === 'telegram' && 'Username do Telegram'}
                                    </label>
                                    <input
                                        type={editField === 'email' ? 'email' : 'text'}
                                        value={newValue}
                                        onChange={(e) => setNewValue(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                                        placeholder={
                                            editField === 'email' ? 'novo@email.com' :
                                            editField === 'phone' ? '(31) 99999-9999' :
                                            editField === 'whatsapp' ? '+55 31 99999-9999' :
                                            '@username'
                                        }
                                    />
                                </div>
                                
                                {/* Security note - only for email/phone */}
                                {(editField === 'email' || editField === 'phone') && (
                                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                                        <p className="text-sm text-amber-300 flex items-start gap-2">
                                            <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                            Um código de verificação será enviado ao seu Telegram.
                                        </p>
                                    </div>
                                )}
                                
                                {/* Simple note for whatsapp/telegram */}
                                {(editField === 'whatsapp' || editField === 'telegram') && (
                                    <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                                        <p className="text-sm text-green-300 flex items-start gap-2">
                                            <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                            Atualização imediata, sem necessidade de verificação.
                                        </p>
                                    </div>
                                )}
                                
                                {editError && (
                                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                                        <p className="text-sm text-red-400">{editError}</p>
                                    </div>
                                )}
                                
                                <button
                                    onClick={requestOTP}
                                    disabled={editLoading || !newValue}
                                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                                >
                                    {editLoading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (editField === 'whatsapp' || editField === 'telegram') ? (
                                        <>
                                            <Check className="w-5 h-5" />
                                            Salvar
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-5 h-5" />
                                            Enviar Código de Verificação
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function PermissionItem({ label, value, highlight }: { label: string; value: boolean; highlight?: boolean }) {
    return (
        <div className={`flex items-center justify-between p-3 rounded-lg ${
            highlight ? 'bg-slate-700/50' : 'bg-slate-800/50'
        }`}>
            <span className="text-sm text-slate-300">{label}</span>
            {value ? (
                <span className="flex items-center gap-1 text-emerald-400 text-xs">
                    <Check className="w-4 h-4" />
                    Sim
                </span>
            ) : (
                <span className="flex items-center gap-1 text-slate-500 text-xs">
                    <X className="w-4 h-4" />
                    Não
                </span>
            )}
        </div>
    );
}
