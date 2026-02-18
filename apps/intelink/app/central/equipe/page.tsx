'use client';

export const dynamic = 'force-dynamic';

/**
 * /central/equipe - Página UNIFICADA de Gestão de Pessoas
 * 
 * Substitui:
 * - /central/membros (cadastro de membros)
 * - /central/permissoes (gestão de visitantes + permissões)
 * 
 * Fluxo simplificado:
 * 1. Admin cadastra pessoa (Nome + Telefone)
 * 2. Sistema gera código ABC123
 * 3. Admin envia via WhatsApp
 * 4. Pessoa acessa → código → cria senha → logado!
 */

import React, { useEffect, useState } from 'react';
import { 
    Users, Plus, Phone, Shield, Search, X, Loader2, 
    Crown, UserCog, User, GraduationCap, Eye,
    KeyRound, Copy, ExternalLink, MessageCircle, Check
} from 'lucide-react';
import { useRole, AccessDenied, RoleLoading, SystemRole, ROLE_LABELS } from '@/hooks/useRole';
import { useToast } from '@/components/intelink/Toast';

// ============================================================================
// TYPES
// ============================================================================

interface Member {
    id: string;
    name: string;
    phone: string | null;
    role: string; // Função policial (delegado, investigador, etc)
    system_role: SystemRole; // Permissão no sistema
    unit_id: string;
    unit?: { code: string; name: string };
    access_code?: string;
    access_code_expires_at?: string;
    password_hash?: boolean; // Has password set
    telegram_chat_id?: string;
}

interface PoliceUnit {
    id: string;
    code: string;
    name: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const ROLE_ICONS: Record<SystemRole, typeof Crown> = {
    super_admin: Crown,
    unit_admin: UserCog,
    member: User,
    intern: GraduationCap,
    visitor: Eye,
};

const ROLE_COLORS: Record<SystemRole, string> = {
    super_admin: 'bg-red-500/20 text-red-400 border-red-500/50',
    unit_admin: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
    member: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
    intern: 'bg-purple-500/20 text-purple-400 border-purple-500/50',
    visitor: 'bg-slate-500/20 text-slate-400 border-slate-500/50',
};

// Funções policiais
const POLICE_ROLES = [
    { id: 'delegado', label: 'Delegado(a)' },
    { id: 'escrivao', label: 'Escrivão(ã)' },
    { id: 'investigador', label: 'Investigador(a)' },
    { id: 'perito', label: 'Perito(a)' },
    { id: 'estagiario', label: 'Estagiário(a)' },
];

// ============================================================================
// COMPONENT
// ============================================================================

export default function EquipePage() {
    const permissions = useRole();
    const { showToast } = useToast();
    
    // Data
    const [members, setMembers] = useState<Member[]>([]);
    const [units, setUnits] = useState<PoliceUnit[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [showCodeModal, setShowCodeModal] = useState<{ member: Member; code: string; whatsappLink: string } | null>(null);
    const [generatingCode, setGeneratingCode] = useState<string | null>(null);
    
    // Form state
    const [formType, setFormType] = useState<'member' | 'visitor'>('member');
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        role: 'investigador',
        unit_id: '',
    });
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');

    // ========================================================================
    // LOAD DATA
    // ========================================================================
    
    useEffect(() => {
        if (!permissions.isLoading && permissions.canManagePermissions) {
            loadData();
        }
    }, [permissions.isLoading, permissions.canManagePermissions]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [membersRes, unitsRes] = await Promise.all([
                fetch('/api/members'),
                fetch('/api/units')
            ]);
            
            if (membersRes.ok) {
                const data = await membersRes.json();
                setMembers(data.members || []);
            }
            
            if (unitsRes.ok) {
                const data = await unitsRes.json();
                setUnits(data.units || []);
            }
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    // ========================================================================
    // ACTIONS
    // ========================================================================
    
    const generateAccessCode = async (memberId: string) => {
        setGeneratingCode(memberId);
        try {
            const res = await fetch('/api/members/access-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ member_id: memberId })
            });
            
            const data = await res.json();
            
            if (res.ok && data.code) {
                const member = members.find(m => m.id === memberId);
                setShowCodeModal({
                    member: member!,
                    code: data.code,
                    whatsappLink: data.whatsappLink,
                });
            } else {
                showToast('error', 'Erro ao gerar código', data.error || 'Tente novamente');
            }
        } catch (error) {
            console.error('Error generating code:', error);
            showToast('error', 'Erro ao gerar código', 'Verifique sua conexão');
        } finally {
            setGeneratingCode(null);
        }
    };

    const saveMember = async () => {
        if (!formData.name.trim() || !formData.phone.trim()) {
            setFormError('Nome e telefone são obrigatórios');
            return;
        }
        
        setSaving(true);
        setFormError('');
        
        try {
            // Get unit_id from localStorage or form
            let unitId = formData.unit_id;
            if (!unitId) {
                unitId = localStorage.getItem('intelink_unit_id') || '';
            }
            
            const res = await fetch('/api/members', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name.trim().toUpperCase(),
                    phone: formData.phone.replace(/\D/g, ''),
                    role: formType === 'visitor' ? 'Visitante' : formData.role,
                    system_role: formType === 'visitor' ? 'visitor' : 'member',
                    unit_id: unitId,
                })
            });
            
            const data = await res.json();
            
            if (res.ok) {
                setShowAddModal(false);
                setFormData({ name: '', phone: '', role: 'investigador', unit_id: '' });
                loadData();
                
                // Auto-generate access code for new member
                if (data.member?.id) {
                    setTimeout(() => generateAccessCode(data.member.id), 500);
                }
            } else {
                setFormError(data.error || 'Erro ao cadastrar');
            }
        } catch (error) {
            setFormError('Erro de conexão');
        } finally {
            setSaving(false);
        }
    };

    // ========================================================================
    // RENDER
    // ========================================================================
    
    if (permissions.isLoading) return <RoleLoading />;
    if (!permissions.canManagePermissions) return <AccessDenied />;

    const filteredMembers = members.filter(m => 
        m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.phone?.includes(searchTerm) ||
        m.unit?.code?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Group by type
    const teamMembers = filteredMembers.filter(m => m.system_role !== 'visitor');
    const visitors = filteredMembers.filter(m => m.system_role === 'visitor');

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Users className="w-7 h-7 text-blue-400" />
                        Equipe
                    </h2>
                    <p className="text-slate-400 mt-1">Gerencie membros e visitantes</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Adicionar
                </button>
            </div>

            {/* Search */}
            <div className="relative mb-6">
                <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                    type="text"
                    placeholder="Buscar por nome, telefone ou delegacia..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Team Members */}
                    {teamMembers.length > 0 && (
                        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                            <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-3 bg-blue-500/10">
                                <Users className="w-5 h-5 text-blue-400" />
                                <span className="font-semibold text-blue-400">Equipe</span>
                                <span className="text-sm text-slate-500">({teamMembers.length})</span>
                            </div>
                            
                            <div className="divide-y divide-slate-800">
                                {teamMembers.map(member => (
                                    <MemberRow 
                                        key={member.id} 
                                        member={member} 
                                        onGenerateCode={() => generateAccessCode(member.id)}
                                        isGenerating={generatingCode === member.id}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Visitors */}
                    {visitors.length > 0 && (
                        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                            <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-3 bg-slate-500/10">
                                <Eye className="w-5 h-5 text-slate-400" />
                                <span className="font-semibold text-slate-400">Visitantes</span>
                                <span className="text-sm text-slate-500">({visitors.length})</span>
                            </div>
                            
                            <div className="divide-y divide-slate-800">
                                {visitors.map(member => (
                                    <MemberRow 
                                        key={member.id} 
                                        member={member} 
                                        onGenerateCode={() => generateAccessCode(member.id)}
                                        isGenerating={generatingCode === member.id}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {filteredMembers.length === 0 && (
                        <div className="text-center py-12 bg-slate-900/50 rounded-xl border border-slate-800">
                            <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                            <p className="text-slate-400">Nenhuma pessoa encontrada</p>
                        </div>
                    )}
                </div>
            )}

            {/* Add Member Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-white">Adicionar Pessoa</h3>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>
                        
                        {/* Type Selector */}
                        <div className="flex gap-2 mb-6">
                            <button
                                onClick={() => setFormType('member')}
                                className={`flex-1 py-2.5 rounded-lg font-medium transition-colors ${
                                    formType === 'member' 
                                        ? 'bg-blue-600 text-white' 
                                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                }`}
                            >
                                <User className="w-4 h-4 inline mr-2" />
                                Membro
                            </button>
                            <button
                                onClick={() => setFormType('visitor')}
                                className={`flex-1 py-2.5 rounded-lg font-medium transition-colors ${
                                    formType === 'visitor' 
                                        ? 'bg-slate-600 text-white' 
                                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                }`}
                            >
                                <Eye className="w-4 h-4 inline mr-2" />
                                Visitante
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">
                                    Nome Completo *
                                </label>
                                <input
                                    type="text"
                                    placeholder="Nome da pessoa"
                                    value={formData.name}
                                    onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))}
                                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                                />
                            </div>
                            
                            {/* Phone */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">
                                    Telefone *
                                </label>
                                <input
                                    type="tel"
                                    placeholder="(00) 00000-0000"
                                    value={formData.phone}
                                    onChange={(e) => setFormData(f => ({ ...f, phone: e.target.value }))}
                                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                                />
                            </div>
                            
                            {/* Role - Only for members */}
                            {formType === 'member' && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">
                                        Função
                                    </label>
                                    <select
                                        value={formData.role}
                                        onChange={(e) => setFormData(f => ({ ...f, role: e.target.value }))}
                                        className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                                    >
                                        {POLICE_ROLES.map(r => (
                                            <option key={r.id} value={r.id}>{r.label}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            
                            {formError && (
                                <p className="text-red-400 text-sm">{formError}</p>
                            )}
                            
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={saveMember}
                                    disabled={saving}
                                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {saving ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            <Plus className="w-4 h-4" />
                                            Cadastrar
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Access Code Modal */}
            {showCodeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center">
                                    <KeyRound className="w-5 h-5 text-emerald-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">Código Gerado!</h3>
                                    <p className="text-sm text-slate-400">{showCodeModal.member.name}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowCodeModal(null)}
                                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>
                        
                        {/* Code Display */}
                        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-5 text-center mb-4">
                            <p className="text-slate-400 text-sm mb-2">Código de Acesso:</p>
                            <div className="flex items-center justify-center gap-3">
                                <p className="text-4xl font-mono font-bold text-white tracking-widest">
                                    {showCodeModal.code}
                                </p>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(showCodeModal.code);
                                    }}
                                    className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                                    title="Copiar código"
                                >
                                    <Copy className="w-5 h-5 text-slate-400" />
                                </button>
                            </div>
                            <p className="text-slate-500 text-xs mt-2">Válido por 7 dias</p>
                        </div>
                        
                        {/* WhatsApp Button */}
                        <a
                            href={showCodeModal.whatsappLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white font-medium transition-colors mb-4"
                        >
                            <MessageCircle className="w-5 h-5" />
                            Enviar via WhatsApp
                            <ExternalLink className="w-4 h-4" />
                        </a>
                        
                        {/* Instructions */}
                        <div className="bg-slate-700/50 rounded-lg p-3 text-sm text-slate-300 mb-4">
                            <p className="font-medium mb-2">O que a pessoa vai fazer:</p>
                            <ol className="list-decimal list-inside space-y-1 text-slate-400">
                                <li>Acessar <span className="text-blue-400">intelink.ia.br</span></li>
                                <li>Digitar o telefone</li>
                                <li>Digitar o código <span className="text-white font-mono">{showCodeModal.code}</span></li>
                                <li>Criar uma senha pessoal</li>
                            </ol>
                        </div>
                        
                        <button
                            onClick={() => setShowCodeModal(null)}
                            className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors"
                        >
                            Fechar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ============================================================================
// MEMBER ROW COMPONENT
// ============================================================================

interface MemberRowProps {
    member: Member;
    onGenerateCode: () => void;
    isGenerating: boolean;
}

function MemberRow({ member, onGenerateCode, isGenerating }: MemberRowProps) {
    const RoleIcon = ROLE_ICONS[member.system_role] || User;
    const roleColor = ROLE_COLORS[member.system_role] || ROLE_COLORS.member;
    
    const hasAccess = !!member.password_hash || !!member.access_code;
    const hasValidCode = member.access_code && member.access_code_expires_at && 
        new Date(member.access_code_expires_at) > new Date();

    return (
        <div className="px-4 py-3 flex items-center justify-between hover:bg-slate-800/50">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold">
                    {member.name?.charAt(0) || '?'}
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <p className="font-medium text-white">{member.name}</p>
                        <span className={`px-2 py-0.5 rounded text-xs border ${roleColor}`}>
                            {ROLE_LABELS[member.system_role]?.label || 'Membro'}
                        </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-400">
                        {member.phone && (
                            <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {member.phone}
                            </span>
                        )}
                        {member.unit?.code && (
                            <span>{member.unit.code}</span>
                        )}
                        {member.role && member.role !== 'Visitante' && (
                            <span className="capitalize">{member.role}</span>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2">
                {/* Status indicator */}
                {hasAccess ? (
                    <span className="flex items-center gap-1 text-xs text-emerald-400">
                        <Check className="w-3 h-3" />
                        Acesso
                    </span>
                ) : hasValidCode ? (
                    <span className="flex items-center gap-1 text-xs text-amber-400">
                        <KeyRound className="w-3 h-3" />
                        Código pendente
                    </span>
                ) : (
                    <span className="text-xs text-slate-500">Sem acesso</span>
                )}
                
                {/* Generate Code Button */}
                {member.phone && (
                    <button
                        onClick={onGenerateCode}
                        disabled={isGenerating}
                        className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-white transition-colors disabled:opacity-50"
                        title="Gerar código de acesso"
                    >
                        {isGenerating ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <>
                                <KeyRound className="w-4 h-4" />
                                Código
                            </>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
}
