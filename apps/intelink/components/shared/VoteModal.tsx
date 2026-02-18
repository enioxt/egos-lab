'use client';

import React, { useState, useRef } from 'react';
import { 
    X, CheckCircle, XCircle, Upload, FileText, Image,
    Users, AlertTriangle, Clock, ThumbsUp, ThumbsDown,
    Loader2, Trash2, Eye
} from 'lucide-react';

// Types
interface VoteInfo {
    memberId: string;
    memberName: string;
    action: 'confirm' | 'reject';
    timestamp: string;
    evidence?: {
        type: 'text' | 'file';
        content: string;
        fileName?: string;
    };
}

interface VoteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onVote: (action: 'confirm' | 'reject', evidence?: { type: 'text' | 'file'; content: string; fileName?: string }) => Promise<void>;
    entityName: string;
    entityType: string;
    matchConfidence: number;
    matchCriteria: Record<string, any>;
    targetInvestigation: string;
    previousVotes?: VoteInfo[];
    requiredQuorum?: number;
    isLoading?: boolean;
}

const CRITERIA_LABELS: Record<string, string> = {
    cpf: 'CPF idêntico',
    rg: 'RG idêntico',
    cnpj: 'CNPJ idêntico',
    nomeDataNascimento: 'Nome + Data de Nascimento',
    nomeFiliacao: 'Nome + Filiação',
    telefone: 'Telefone idêntico',
    endereco: 'Endereço similar',
    nomeSimilar: 'Nome similar',
};

const ENTITY_LABELS: Record<string, { singular: string; article: string }> = {
    PERSON: { singular: 'pessoa', article: 'a mesma' },
    VEHICLE: { singular: 'veículo', article: 'o mesmo' },
    LOCATION: { singular: 'local', article: 'o mesmo' },
    COMPANY: { singular: 'empresa', article: 'a mesma' },
    ORGANIZATION: { singular: 'organização', article: 'a mesma' },
    FIREARM: { singular: 'arma', article: 'a mesma' },
    WEAPON: { singular: 'arma', article: 'a mesma' },
};

export default function VoteModal({
    isOpen,
    onClose,
    onVote,
    entityName,
    entityType,
    matchConfidence,
    matchCriteria,
    targetInvestigation,
    previousVotes = [],
    requiredQuorum = 2,
    isLoading = false,
}: VoteModalProps) {
    const [evidenceType, setEvidenceType] = useState<'text' | 'file'>('text');
    const [textEvidence, setTextEvidence] = useState('');
    const [fileEvidence, setFileEvidence] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const entityLabel = ENTITY_LABELS[entityType] || { singular: 'entidade', article: 'a mesma' };
    const confirmVotes = previousVotes.filter(v => v.action === 'confirm');
    const rejectVotes = previousVotes.filter(v => v.action === 'reject');
    const currentVoteCount = confirmVotes.length;
    const votesNeeded = requiredQuorum - currentVoteCount;
    
    // Evidence is required for 2nd+ vote on high confidence matches (≥90%)
    const isEvidenceRequired = matchConfidence >= 90 && previousVotes.length >= 1;
    const hasEvidence = (evidenceType === 'text' && textEvidence.trim()) || 
                        (evidenceType === 'file' && fileEvidence);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Check file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                alert('Arquivo muito grande. Máximo 10MB.');
                return;
            }
            setFileEvidence(file);
        }
    };

    const handleVote = async (action: 'confirm' | 'reject') => {
        setIsSubmitting(true);
        try {
            let evidence: { type: 'text' | 'file'; content: string; fileName?: string } | undefined;
            
            if (evidenceType === 'text' && textEvidence.trim()) {
                evidence = { type: 'text', content: textEvidence.trim() };
            } else if (evidenceType === 'file' && fileEvidence) {
                // Convert file to base64
                const base64 = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result as string);
                    reader.readAsDataURL(fileEvidence);
                });
                evidence = { type: 'file', content: base64, fileName: fileEvidence.name };
            }
            
            await onVote(action, evidence);
            onClose();
        } catch (error) {
            console.error('Vote error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" 
            onClick={onClose}
        >
            <div 
                className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-orange-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white">Verificar Correspondência</h3>
                            <p className="text-xs text-slate-400">Confiança: {matchConfidence}%</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="p-6 space-y-5 overflow-y-auto flex-1">
                    {/* Question */}
                    <p className="text-slate-300">
                        Confirme se <strong className="text-white">{entityName}</strong> é{' '}
                        <strong className="text-blue-400">{entityLabel.article} {entityLabel.singular}</strong>{' '}
                        que aparece na operação <strong className="text-emerald-400">{targetInvestigation}</strong>.
                    </p>

                    {/* Match Criteria */}
                    <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
                        <p className="text-sm font-semibold text-orange-300 mb-3 flex items-center gap-2">
                            <Eye className="w-4 h-4" />
                            Critérios de Correspondência
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            {Object.entries(matchCriteria).filter(([,v]) => v).map(([key, value]) => (
                                <div key={key} className="flex items-center gap-2 text-sm">
                                    <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                                    <span className="text-white">{CRITERIA_LABELS[key] || key}</span>
                                    {typeof value === 'number' && value < 100 && (
                                        <span className="text-slate-500 text-xs">({value}%)</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Previous Votes Timeline */}
                    {previousVotes.length > 0 && (
                        <div className="bg-slate-800/50 rounded-xl p-4">
                            <p className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                Timeline de Votos ({previousVotes.length})
                            </p>
                            <div className="relative pl-4 border-l-2 border-slate-700 space-y-3">
                                {previousVotes.map((vote, idx) => (
                                    <div key={idx} className="relative">
                                        {/* Timeline dot */}
                                        <div className={`absolute -left-[21px] w-3 h-3 rounded-full ${
                                            vote.action === 'confirm' ? 'bg-emerald-500' : 'bg-red-500'
                                        }`} />
                                        
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                {vote.action === 'confirm' ? (
                                                    <ThumbsUp className="w-4 h-4 text-emerald-400" />
                                                ) : (
                                                    <ThumbsDown className="w-4 h-4 text-red-400" />
                                                )}
                                                <span className="text-white font-medium">{vote.memberName}</span>
                                                <span className={`text-xs px-1.5 py-0.5 rounded ${
                                                    vote.action === 'confirm' 
                                                        ? 'bg-emerald-500/20 text-emerald-400' 
                                                        : 'bg-red-500/20 text-red-400'
                                                }`}>
                                                    {vote.action === 'confirm' ? 'Confirmou' : 'Rejeitou'}
                                                </span>
                                            </div>
                                            <span className="text-slate-500 text-xs whitespace-nowrap">
                                                {new Date(vote.timestamp).toLocaleDateString('pt-BR', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </span>
                                        </div>
                                        
                                        {/* Evidence indicator */}
                                        {vote.evidence && (
                                            <div className="mt-1 ml-6 text-xs text-slate-500 flex items-center gap-1">
                                                <FileText className="w-3 h-3" />
                                                <span>{vote.evidence.type === 'file' ? vote.evidence.fileName : 'Texto anexado'}</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Quorum Info */}
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                        <p className="text-sm text-amber-300 flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            <span>
                                <strong>Quorum:</strong> {votesNeeded > 0 
                                    ? `Falta${votesNeeded > 1 ? 'm' : ''} ${votesNeeded} voto${votesNeeded > 1 ? 's' : ''} para confirmar`
                                    : 'Quorum atingido!'
                                }
                            </span>
                        </p>
                    </div>

                    {/* Evidence Section */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-slate-300 flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                Anexar Evidência {isEvidenceRequired ? '' : '(opcional)'}
                            </p>
                            {isEvidenceRequired && (
                                <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs font-semibold rounded-full flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" />
                                    OBRIGATÓRIO
                                </span>
                            )}
                        </div>
                        
                        {isEvidenceRequired && (
                            <p className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
                                ⚠️ O 2º voto em matches de alta confiança (≥90%) requer evidência para validação.
                            </p>
                        )}
                        
                        {/* Toggle */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => setEvidenceType('text')}
                                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                                    evidenceType === 'text' 
                                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                }`}
                            >
                                <FileText className="w-4 h-4 inline mr-2" />
                                Texto
                            </button>
                            <button
                                onClick={() => setEvidenceType('file')}
                                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                                    evidenceType === 'file' 
                                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                }`}
                            >
                                <Upload className="w-4 h-4 inline mr-2" />
                                Arquivo
                            </button>
                        </div>

                        {/* Evidence Input */}
                        {evidenceType === 'text' ? (
                            <textarea
                                value={textEvidence}
                                onChange={(e) => setTextEvidence(e.target.value)}
                                placeholder="Descreva a evidência que confirma sua decisão..."
                                className="w-full h-24 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
                            />
                        ) : (
                            <div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*,.pdf,.doc,.docx"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                {fileEvidence ? (
                                    <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Image className="w-5 h-5 text-blue-400" />
                                            <span className="text-sm text-white truncate max-w-[200px]">
                                                {fileEvidence.name}
                                            </span>
                                            <span className="text-xs text-slate-500">
                                                ({(fileEvidence.size / 1024).toFixed(1)} KB)
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => setFileEvidence(null)}
                                            className="p-1 hover:bg-slate-700 rounded"
                                        >
                                            <Trash2 className="w-4 h-4 text-red-400" />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full py-4 border-2 border-dashed border-slate-700 rounded-lg text-slate-400 hover:border-slate-600 hover:text-slate-300 transition-colors"
                                    >
                                        <Upload className="w-5 h-5 mx-auto mb-1" />
                                        <span className="text-sm">Clique para selecionar arquivo</span>
                                        <span className="text-xs block text-slate-500 mt-1">
                                            Imagens, PDF, DOC (máx. 10MB)
                                        </span>
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer - Actions (Fixed) */}
                <div className="px-6 py-4 border-t border-slate-800 space-y-3 flex-shrink-0">
                    {/* Warning if evidence required but not provided */}
                    {isEvidenceRequired && !hasEvidence && (
                        <p className="text-xs text-red-400 text-center">
                            Forneça uma evidência (texto ou arquivo) para votar
                        </p>
                    )}
                    
                    <div className="flex gap-3">
                        <button
                            onClick={() => handleVote('reject')}
                            disabled={isSubmitting || isLoading || (isEvidenceRequired && !hasEvidence)}
                            className="flex-1 py-3 bg-red-500/20 hover:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed text-red-400 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <XCircle className="w-5 h-5" />
                            )}
                            Não é {entityLabel.article}
                        </button>
                        <button
                            onClick={() => handleVote('confirm')}
                            disabled={isSubmitting || isLoading || (isEvidenceRequired && !hasEvidence)}
                            className="flex-1 py-3 bg-emerald-500/20 hover:bg-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed text-emerald-400 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <CheckCircle className="w-5 h-5" />
                            )}
                            Confirmar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
