'use client';

/**
 * ShareJourneyDialog - Share investigation journeys with team members
 * 
 * Features:
 * - Select team members to share with
 * - Choose share type (view/collaborate/edit)
 * - See current shares and remove them
 * 
 * @see /api/journeys/share for backend
 */

import React, { useState, useEffect } from 'react';
import { 
    Share2, 
    X, 
    Users, 
    Eye, 
    Edit3, 
    UserPlus,
    Check,
    Loader2,
    Trash2,
    AlertCircle,
} from 'lucide-react';
import { getSupabase } from '@/lib/supabase-client';

interface TeamMember {
    id: string;
    name: string;
    role?: string;
}

interface JourneyShare {
    id: string;
    shared_with: TeamMember;
    share_type: 'view' | 'collaborate' | 'edit';
    created_at: string;
}

interface ShareJourneyDialogProps {
    isOpen: boolean;
    onClose: () => void;
    journeyId: string;
    journeyTitle: string;
}

const SHARE_TYPES = [
    { value: 'view', label: 'Visualizar', icon: Eye, description: 'Pode ver a jornada' },
    { value: 'collaborate', label: 'Colaborar', icon: Users, description: 'Pode ver e comentar' },
    { value: 'edit', label: 'Editar', icon: Edit3, description: 'Acesso completo' },
] as const;

export function ShareJourneyDialog({ 
    isOpen, 
    onClose, 
    journeyId,
    journeyTitle 
}: ShareJourneyDialogProps) {
    const supabase = getSupabase();
    
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
    const [shareType, setShareType] = useState<'view' | 'collaborate' | 'edit'>('view');
    const [currentShares, setCurrentShares] = useState<JourneyShare[]>([]);
    const [loading, setLoading] = useState(true);
    const [sharing, setSharing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    
    // Load team members and current shares
    useEffect(() => {
        if (!isOpen) return;
        loadData();
    }, [isOpen, journeyId]);
    
    const loadData = async () => {
        setLoading(true);
        setError(null);
        
        try {
            // Load team members
            if (!supabase) {
                throw new Error('Supabase client not available');
            }
            
            const { data: membersData, error: membersError } = await supabase
                .from('intelink_unit_members')
                .select('id, name, role')
                .order('name');
            
            if (membersError) throw membersError;
            setMembers(membersData || []);
            
            // Load current shares
            const shareResponse = await fetch(`/api/journeys/share?journeyId=${journeyId}`);
            if (shareResponse.ok) {
                const shareData = await shareResponse.json();
                setCurrentShares(shareData.shares || []);
            }
        } catch (err) {
            console.error('Error loading share data:', err);
            setError('Erro ao carregar dados');
        } finally {
            setLoading(false);
        }
    };
    
    const handleShare = async () => {
        if (selectedMembers.length === 0) {
            setError('Selecione pelo menos um membro');
            return;
        }
        
        setSharing(true);
        setError(null);
        
        try {
            const response = await fetch('/api/journeys/share', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    journeyId,
                    memberIds: selectedMembers,
                    shareType,
                }),
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Erro ao compartilhar');
            }
            
            setSuccess(`Jornada compartilhada com ${selectedMembers.length} membro(s)`);
            setSelectedMembers([]);
            loadData(); // Reload shares
            
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao compartilhar');
        } finally {
            setSharing(false);
        }
    };
    
    const handleRemoveShare = async (shareId: string) => {
        try {
            const response = await fetch(`/api/journeys/share?shareId=${shareId}`, {
                method: 'DELETE',
            });
            
            if (!response.ok) {
                throw new Error('Erro ao remover compartilhamento');
            }
            
            setCurrentShares(prev => prev.filter(s => s.id !== shareId));
            setSuccess('Compartilhamento removido');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao remover');
        }
    };
    
    const toggleMember = (memberId: string) => {
        setSelectedMembers(prev => 
            prev.includes(memberId)
                ? prev.filter(id => id !== memberId)
                : [...prev, memberId]
        );
    };
    
    // Filter out members who already have access
    const sharedMemberIds = currentShares.map(s => s.shared_with?.id);
    const availableMembers = members.filter(m => !sharedMemberIds.includes(m.id));
    
    if (!isOpen) return null;
    
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                            <Share2 className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Compartilhar Jornada</h2>
                            <p className="text-sm text-slate-400 truncate max-w-[200px]">
                                {journeyTitle}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>
                
                <div className="p-4 max-h-[60vh] overflow-y-auto">
                    {/* Error/Success Messages */}
                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg mb-4">
                            <AlertCircle className="w-4 h-4 text-red-400" />
                            <span className="text-sm text-red-400">{error}</span>
                        </div>
                    )}
                    
                    {success && (
                        <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg mb-4">
                            <Check className="w-4 h-4 text-emerald-400" />
                            <span className="text-sm text-emerald-400">{success}</span>
                        </div>
                    )}
                    
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 text-cyan-500 animate-spin" />
                        </div>
                    ) : (
                        <>
                            {/* Current Shares */}
                            {currentShares.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="text-xs font-semibold text-slate-400 uppercase mb-3">
                                        Compartilhado com
                                    </h3>
                                    <div className="space-y-2">
                                        {currentShares.map((share) => (
                                            <div 
                                                key={share.id}
                                                className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
                                                        <Users className="w-4 h-4 text-slate-400" />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-white">
                                                            {share.shared_with?.name || 'Membro'}
                                                        </div>
                                                        <div className="text-xs text-slate-400">
                                                            {share.share_type === 'view' && 'Visualização'}
                                                            {share.share_type === 'collaborate' && 'Colaboração'}
                                                            {share.share_type === 'edit' && 'Edição'}
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveShare(share.id)}
                                                    className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors group"
                                                >
                                                    <Trash2 className="w-4 h-4 text-slate-500 group-hover:text-red-400" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            {/* Share Type Selector */}
                            <div className="mb-4">
                                <h3 className="text-xs font-semibold text-slate-400 uppercase mb-3">
                                    Tipo de Acesso
                                </h3>
                                <div className="grid grid-cols-3 gap-2">
                                    {SHARE_TYPES.map(({ value, label, icon: Icon }) => (
                                        <button
                                            key={value}
                                            onClick={() => setShareType(value)}
                                            className={`flex flex-col items-center p-3 rounded-lg border transition-all ${
                                                shareType === value
                                                    ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400'
                                                    : 'bg-slate-800/50 border-transparent text-slate-400 hover:bg-slate-800'
                                            }`}
                                        >
                                            <Icon className="w-5 h-5 mb-1" />
                                            <span className="text-xs font-medium">{label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            {/* Member Selector */}
                            <div>
                                <h3 className="text-xs font-semibold text-slate-400 uppercase mb-3">
                                    Selecionar Membros ({selectedMembers.length})
                                </h3>
                                {availableMembers.length === 0 ? (
                                    <p className="text-sm text-slate-500 text-center py-4">
                                        Todos os membros já têm acesso
                                    </p>
                                ) : (
                                    <div className="space-y-2 max-h-40 overflow-y-auto">
                                        {availableMembers.map((member) => (
                                            <button
                                                key={member.id}
                                                onClick={() => toggleMember(member.id)}
                                                className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                                                    selectedMembers.includes(member.id)
                                                        ? 'bg-cyan-500/20 border-cyan-500/40'
                                                        : 'bg-slate-800/50 border-transparent hover:bg-slate-800'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
                                                        <UserPlus className="w-4 h-4 text-slate-400" />
                                                    </div>
                                                    <div className="text-left">
                                                        <div className="text-sm font-medium text-white">
                                                            {member.name}
                                                        </div>
                                                        {member.role && (
                                                            <div className="text-xs text-slate-400">
                                                                {member.role}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                {selectedMembers.includes(member.id) && (
                                                    <Check className="w-5 h-5 text-cyan-400" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
                
                {/* Footer */}
                <div className="flex justify-end gap-3 p-4 border-t border-slate-700">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleShare}
                        disabled={selectedMembers.length === 0 || sharing}
                        className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                        {sharing ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Share2 className="w-4 h-4" />
                        )}
                        Compartilhar
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ShareJourneyDialog;
