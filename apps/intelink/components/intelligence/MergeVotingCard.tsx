'use client';

import React, { useState } from 'react';
import { 
    ThumbsUp, ThumbsDown, Merge, AlertTriangle,
    User, Car, MapPin, Building2, Crosshair,
    ChevronDown, ChevronUp, Loader2, Check
} from 'lucide-react';

interface EntityInfo {
    id: string;
    name: string;
    type: string;
    investigation_id: string;
    investigation_title?: string;
    metadata?: Record<string, any>;
}

interface MergeCandidate {
    entity1: EntityInfo;
    entity2: EntityInfo;
    score: number;
    matchType: string;
    matchedFields: string[];
    confidence: 'high' | 'medium' | 'low';
    votes?: {
        approve: number;
        reject: number;
        total: number;
    };
    userVote?: 'approve' | 'reject' | null;
}

interface MergeVotingCardProps {
    candidate: MergeCandidate;
    onVote: (candidateId: string, vote: 'approve' | 'reject') => Promise<void>;
    onMerge: (candidate: MergeCandidate) => Promise<void>;
    canMerge?: boolean;
}

const ENTITY_ICONS: Record<string, any> = {
    'PERSON': User,
    'VEHICLE': Car,
    'LOCATION': MapPin,
    'ORGANIZATION': Building2,
    'FIREARM': Crosshair,
};

export default function MergeVotingCard({ 
    candidate, 
    onVote, 
    onMerge,
    canMerge = true 
}: MergeVotingCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isVoting, setIsVoting] = useState(false);
    const [isMerging, setIsMerging] = useState(false);
    const [localVote, setLocalVote] = useState<'approve' | 'reject' | null>(candidate.userVote || null);

    const Icon = ENTITY_ICONS[candidate.entity1.type] || User;

    const handleVote = async (vote: 'approve' | 'reject') => {
        if (isVoting || localVote === vote) return;
        
        setIsVoting(true);
        try {
            await onVote(`${candidate.entity1.id}-${candidate.entity2.id}`, vote);
            setLocalVote(vote);
        } finally {
            setIsVoting(false);
        }
    };

    const handleMerge = async () => {
        if (isMerging) return;
        
        setIsMerging(true);
        try {
            await onMerge(candidate);
        } finally {
            setIsMerging(false);
        }
    };

    const getConfidenceColor = (confidence: string) => {
        switch (confidence) {
            case 'high': return 'text-green-400 bg-green-500/10 border-green-500/30';
            case 'medium': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
            default: return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
        }
    };

    const votes = candidate.votes || { approve: 0, reject: 0, total: 0 };
    const approvalRate = votes.total > 0 ? (votes.approve / votes.total) * 100 : 50;

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-colors">
            {/* Header */}
            <div 
                className="p-4 cursor-pointer hover:bg-slate-800/30 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {/* Confidence Badge */}
                        <div className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${getConfidenceColor(candidate.confidence)}`}>
                            {Math.round(candidate.score * 100)}%
                        </div>
                        
                        {/* Entities */}
                        <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4 text-slate-400" />
                            <span className="font-medium text-white">{candidate.entity1.name}</span>
                            <span className="text-slate-600">≈</span>
                            <span className="font-medium text-white">{candidate.entity2.name}</span>
                        </div>
                        
                        {/* Type Badge */}
                        <span className="text-xs px-2 py-0.5 bg-slate-800 rounded text-slate-400">
                            {candidate.entity1.type}
                        </span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        {/* Voting Summary */}
                        <div className="flex items-center gap-2 text-xs">
                            <span className="text-green-400">👍 {votes.approve}</span>
                            <span className="text-red-400">👎 {votes.reject}</span>
                        </div>
                        
                        {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                    </div>
                </div>
                
                {/* Match Reason */}
                <div className="mt-2 text-xs text-slate-500">
                    Match: {candidate.matchedFields.join(', ')}
                </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
                <div className="border-t border-slate-800 p-4">
                    {/* Entity Comparison */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        {/* Entity 1 */}
                        <div className="bg-slate-800/50 rounded-lg p-3">
                            <h4 className="text-sm font-medium text-green-400 mb-2 flex items-center gap-2">
                                <Check className="w-4 h-4" />
                                Manter (Principal)
                            </h4>
                            <div className="text-xs text-slate-400 space-y-1">
                                <p><strong>Nome:</strong> {candidate.entity1.name}</p>
                                {candidate.entity1.metadata?.cpf && (
                                    <p><strong>CPF:</strong> {candidate.entity1.metadata.cpf}</p>
                                )}
                                {candidate.entity1.metadata?.placa && (
                                    <p><strong>Placa:</strong> {candidate.entity1.metadata.placa}</p>
                                )}
                                <p className="text-slate-600">
                                    Op. {candidate.entity1.investigation_title || candidate.entity1.investigation_id.slice(0, 8)}
                                </p>
                            </div>
                        </div>
                        
                        {/* Entity 2 */}
                        <div className="bg-slate-800/50 rounded-lg p-3">
                            <h4 className="text-sm font-medium text-red-400 mb-2 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" />
                                Remover (Duplicata)
                            </h4>
                            <div className="text-xs text-slate-400 space-y-1">
                                <p><strong>Nome:</strong> {candidate.entity2.name}</p>
                                {candidate.entity2.metadata?.cpf && (
                                    <p><strong>CPF:</strong> {candidate.entity2.metadata.cpf}</p>
                                )}
                                {candidate.entity2.metadata?.placa && (
                                    <p><strong>Placa:</strong> {candidate.entity2.metadata.placa}</p>
                                )}
                                <p className="text-slate-600">
                                    Op. {candidate.entity2.investigation_title || candidate.entity2.investigation_id.slice(0, 8)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Approval Bar */}
                    <div className="mb-4">
                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                            <span>Aprovação da Equipe</span>
                            <span>{Math.round(approvalRate)}%</span>
                        </div>
                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all"
                                style={{ width: `${approvalRate}%` }}
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between">
                        {/* Voting Buttons */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={(e) => { e.stopPropagation(); handleVote('approve'); }}
                                disabled={isVoting}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                    localVote === 'approve' 
                                        ? 'bg-green-500/20 text-green-400 border border-green-500/50' 
                                        : 'bg-slate-800 text-slate-400 hover:text-green-400 hover:bg-green-500/10'
                                }`}
                            >
                                {isVoting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ThumbsUp className="w-4 h-4" />}
                                Aprovar
                            </button>
                            
                            <button
                                onClick={(e) => { e.stopPropagation(); handleVote('reject'); }}
                                disabled={isVoting}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                    localVote === 'reject' 
                                        ? 'bg-red-500/20 text-red-400 border border-red-500/50' 
                                        : 'bg-slate-800 text-slate-400 hover:text-red-400 hover:bg-red-500/10'
                                }`}
                            >
                                {isVoting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ThumbsDown className="w-4 h-4" />}
                                Rejeitar
                            </button>
                        </div>

                        {/* Merge Button */}
                        {canMerge && (
                            <button
                                onClick={(e) => { e.stopPropagation(); handleMerge(); }}
                                disabled={isMerging || approvalRate < 50}
                                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                    approvalRate >= 50
                                        ? 'bg-purple-600 hover:bg-purple-500 text-white'
                                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                }`}
                                title={approvalRate < 50 ? 'Precisa de pelo menos 50% de aprovação' : 'Fundir entidades'}
                            >
                                {isMerging ? <Loader2 className="w-4 h-4 animate-spin" /> : <Merge className="w-4 h-4" />}
                                Fundir
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
