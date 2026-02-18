'use client';

/**
 * DeleteButton - Universal delete button with quorum support
 * 
 * - Super Admin (< 24h): Instant delete
 * - Super Admin (> 24h): Requires force confirmation
 * - Regular Users: Initiates quorum vote
 * 
 * Shows visual indicator if item is flagged for deletion
 */

import React, { useState, useEffect } from 'react';
import { Trash2, AlertTriangle, Loader2, Users, Check, X } from 'lucide-react';

type ItemType = 'entity' | 'document' | 'evidence' | 'relationship' | 'investigation';

interface DeleteButtonProps {
    itemType: ItemType;
    itemId: string;
    itemName?: string;
    createdAt?: string;
    onDeleted?: () => void;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'icon' | 'button' | 'text';
    className?: string;
}

interface DeletionStatus {
    pending: boolean;
    currentVotes: number;
    requiredVotes: number;
    userVoted: boolean;
    progress: number;
}

export default function DeleteButton({
    itemType,
    itemId,
    itemName,
    createdAt,
    onDeleted,
    size = 'md',
    variant = 'icon',
    className = ''
}: DeleteButtonProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [deletionStatus, setDeletionStatus] = useState<DeletionStatus | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [reason, setReason] = useState('');
    const [cascade, setCascade] = useState(false);
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);
    const [isRecent, setIsRecent] = useState(false);

    // Check user role and item age
    useEffect(() => {
        const role = localStorage.getItem('intelink_system_role');
        setIsSuperAdmin(role === 'super_admin');

        if (createdAt) {
            const hours = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
            setIsRecent(hours < 24);
        }

        // Check if there's a pending deletion request
        checkDeletionStatus();
    }, [itemId, createdAt]);

    const checkDeletionStatus = async () => {
        try {
            const token = localStorage.getItem('intelink_member_id') || localStorage.getItem('intelink_token');
            const res = await fetch(`/api/admin/delete?item_type=${itemType}&item_id=${itemId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.ok) {
                const data = await res.json();
                if (data.requests && data.requests.length > 0) {
                    const req = data.requests[0];
                    setDeletionStatus({
                        pending: true,
                        currentVotes: req.current_votes,
                        requiredVotes: req.required_votes,
                        userVoted: req.user_voted,
                        progress: req.progress
                    });
                }
            }
        } catch (e) {
            console.error('Error checking deletion status:', e);
        }
    };

    const handleDelete = async (force = false) => {
        setIsLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('intelink_member_id') || localStorage.getItem('intelink_token');
            const res = await fetch('/api/admin/delete', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    item_type: itemType,
                    item_id: itemId,
                    reason: reason || undefined,
                    force,
                    cascade
                })
            });

            const data = await res.json();

            if (!res.ok) {
                if (data.requires_force) {
                    setError(`Item tem ${data.hours_since_creation}h. Clique novamente para forçar exclusão.`);
                    setShowConfirm(true);
                } else if (data.already_voted) {
                    setError('Você já votou para excluir este item.');
                } else {
                    // Ensure error is always a string (API may return {code, message} object)
                    const errorMsg = typeof data.error === 'object' 
                        ? (data.error?.message || JSON.stringify(data.error))
                        : (data.error || 'Erro ao excluir');
                    setError(errorMsg);
                }
                return;
            }

            if (data.deleted) {
                onDeleted?.();
                setShowConfirm(false);
            } else {
                // Vote registered, update status
                setDeletionStatus({
                    pending: true,
                    currentVotes: data.current_votes,
                    requiredVotes: data.required_votes,
                    userVoted: true,
                    progress: Math.round((data.current_votes / data.required_votes) * 100)
                });
                setShowConfirm(false);
            }
        } catch (e: any) {
            setError(e.message || 'Erro ao excluir');
        } finally {
            setIsLoading(false);
        }
    };

    // Size classes
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6'
    };

    const buttonSizeClasses = {
        sm: 'p-1.5',
        md: 'p-2',
        lg: 'p-3'
    };

    // If item is flagged for deletion, show indicator
    if (deletionStatus?.pending && !showConfirm) {
        return (
            <div className={`relative ${className}`}>
                <button
                    onClick={() => setShowConfirm(true)}
                    className={`${buttonSizeClasses[size]} rounded-lg transition-colors ${
                        deletionStatus.userVoted
                            ? 'bg-amber-500/20 text-amber-400 cursor-not-allowed'
                            : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                    }`}
                    title={deletionStatus.userVoted 
                        ? `Você já votou (${deletionStatus.currentVotes}/${deletionStatus.requiredVotes})` 
                        : `Flagged para exclusão (${deletionStatus.currentVotes}/${deletionStatus.requiredVotes})`}
                >
                    <div className="relative">
                        <Trash2 className={sizeClasses[size]} />
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full flex items-center justify-center">
                            <span className="text-[8px] font-bold text-black">{deletionStatus.currentVotes}</span>
                        </div>
                    </div>
                </button>
                
                {/* Progress bar */}
                <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-amber-500 transition-all"
                        style={{ width: `${deletionStatus.progress}%` }}
                    />
                </div>
            </div>
        );
    }

    // Confirmation dialog
    if (showConfirm) {
        return (
            <div className={`bg-slate-800 border border-red-500/30 rounded-lg p-3 ${className}`}>
                <div className="flex items-start gap-2 mb-3">
                    <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-white">
                            {isSuperAdmin && isRecent 
                                ? 'Excluir permanentemente?' 
                                : isSuperAdmin 
                                    ? 'Forçar exclusão?' 
                                    : 'Solicitar exclusão'}
                        </p>
                        <p className="text-xs text-slate-400">
                            {itemName || itemType}
                        </p>
                    </div>
                </div>

                {/* Cascade option for documents/evidence (super admin only) */}
                {isSuperAdmin && (itemType === 'document' || itemType === 'evidence') && (
                    <label className="flex items-center gap-2 mb-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={cascade}
                            onChange={(e) => setCascade(e.target.checked)}
                            className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-red-500 focus:ring-red-500"
                        />
                        <span className="text-xs text-slate-300">
                            Excluir também entidades e conexões
                        </span>
                    </label>
                )}

                {/* Reason input for quorum requests */}
                {!isSuperAdmin && (
                    <input
                        type="text"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Motivo (opcional)"
                        className="w-full mb-2 px-2 py-1 text-xs bg-slate-900 border border-slate-600 rounded text-white"
                    />
                )}

                {error && (
                    <p className="text-xs text-red-400 mb-2">{error}</p>
                )}

                <div className="flex gap-2">
                    <button
                        onClick={() => handleDelete(isSuperAdmin && !isRecent)}
                        disabled={isLoading}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-medium rounded transition-colors disabled:opacity-50"
                    >
                        {isLoading ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                            <>
                                {isSuperAdmin ? <Trash2 className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                                {isSuperAdmin ? 'Excluir' : 'Votar'}
                            </>
                        )}
                    </button>
                    <button
                        onClick={() => { setShowConfirm(false); setError(null); }}
                        className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded transition-colors"
                    >
                        <X className="w-3 h-3" />
                    </button>
                </div>
            </div>
        );
    }

    // Default button
    return (
        <button
            onClick={() => setShowConfirm(true)}
            disabled={isLoading}
            className={`${buttonSizeClasses[size]} rounded-lg transition-colors ${
                isSuperAdmin && isRecent
                    ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                    : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-red-400'
            } ${className}`}
            title={isSuperAdmin && isRecent ? 'Excluir (Admin)' : 'Solicitar exclusão'}
        >
            {isLoading ? (
                <Loader2 className={`${sizeClasses[size]} animate-spin`} />
            ) : (
                <Trash2 className={sizeClasses[size]} />
            )}
        </button>
    );
}
