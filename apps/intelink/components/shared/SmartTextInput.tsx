'use client';

/**
 * SmartTextInput - Componente modular de entrada de texto com detecção de entidades
 * 
 * Features:
 * - Auto-detecção de entidades enquanto digita (CPF, placa, telefone, nomes)
 * - Match com banco de dados em tempo real
 * - Auto-save para localStorage
 * - Reutilizável em qualquer parte do sistema
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, Loader2, Users, Car, Phone, FileText } from 'lucide-react';

interface EntityMatch {
    candidate: {
        type: string;
        value: string;
        normalizedValue: string;
        confidence: number;
    };
    dbEntity?: {
        id: string;
        name: string;
        confidence: number;
        cpfPartial?: string;
        investigationTitle?: string;
        matchReason?: string;
    };
}

interface SmartTextInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    minLength?: number;
    investigationId?: string;
    showEntityMatches?: boolean;
    autoSaveKey?: string;
    className?: string;
    height?: string;
    onEntitiesFound?: (matches: EntityMatch[]) => void;
    disabled?: boolean;
}

const ENTITY_ICONS: Record<string, typeof Users> = {
    'PERSON': Users,
    'VEHICLE': Car,
    'PHONE': Phone,
    'OTHER': FileText,
};

export default function SmartTextInput({
    value,
    onChange,
    placeholder = 'Digite ou cole o texto...',
    minLength = 50,
    investigationId,
    showEntityMatches = true,
    autoSaveKey,
    className = '',
    height = 'h-64',
    onEntitiesFound,
    disabled = false
}: SmartTextInputProps) {
    const [entityMatches, setEntityMatches] = useState<EntityMatch[]>([]);
    const [isMatching, setIsMatching] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    
    const debounceRef = useRef<NodeJS.Timeout | null>(null);
    const autoSaveRef = useRef<NodeJS.Timeout | null>(null);

    // Auto-save to localStorage with debounce
    useEffect(() => {
        if (!autoSaveKey || !value || value.length < 10) return;
        
        if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
        
        autoSaveRef.current = setTimeout(() => {
            try {
                localStorage.setItem(autoSaveKey, JSON.stringify({
                    text: value,
                    timestamp: new Date().toISOString()
                }));
                setLastSaved(new Date());
            } catch (e) {
                console.warn('Auto-save failed:', e);
            }
        }, 3000);
        
        return () => {
            if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
        };
    }, [value, autoSaveKey]);

    // Entity matching with debounce
    useEffect(() => {
        if (!showEntityMatches || !value || value.length < 20) {
            setEntityMatches([]);
            return;
        }

        if (debounceRef.current) clearTimeout(debounceRef.current);

        debounceRef.current = setTimeout(async () => {
            setIsMatching(true);
            try {
                const response = await fetch('/api/entities/match-text', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        text: value,
                        investigation_id: investigationId
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    const matches = data.matches || [];
                    setEntityMatches(matches);
                    onEntitiesFound?.(matches);
                }
            } catch (error) {
                console.error('Entity match error:', error);
            } finally {
                setIsMatching(false);
            }
        }, 800);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [value, investigationId, showEntityMatches, onEntitiesFound]);

    const getEntityIcon = (type: string) => {
        const Icon = ENTITY_ICONS[type] || FileText;
        return <Icon className="w-4 h-4" />;
    };

    return (
        <div className={`space-y-3 ${className}`}>
            {/* Text Area */}
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                disabled={disabled}
                className={`w-full ${height} p-4 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50`}
            />
            
            {/* Footer: Character count + Auto-save indicator */}
            <div className="flex items-center justify-between text-xs">
                <p className={value.length >= minLength ? 'text-slate-500' : 'text-amber-400'}>
                    {value.length < minLength 
                        ? `Mínimo ${minLength} caracteres. Atual: ${value.length}`
                        : `${value.length} caracteres`
                    }
                </p>
                {lastSaved && (
                    <p className="text-emerald-500 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Salvo às {lastSaved.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                )}
            </div>

            {/* Entity Matches Preview */}
            {showEntityMatches && (isMatching || entityMatches.length > 0) && (
                <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-white flex items-center gap-2">
                            {getEntityIcon('PERSON')}
                            Entidades Detectadas
                        </h4>
                        {isMatching && <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />}
                    </div>

                    {entityMatches.length > 0 ? (
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                            {entityMatches.map((match, idx) => (
                                <div 
                                    key={idx} 
                                    className={`p-3 rounded-lg border ${
                                        match.dbEntity 
                                            ? 'bg-emerald-500/5 border-emerald-500/30' 
                                            : 'bg-amber-500/5 border-amber-500/30'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                            match.dbEntity 
                                                ? 'bg-emerald-500/20 text-emerald-400' 
                                                : 'bg-amber-500/20 text-amber-400'
                                        }`}>
                                            {getEntityIcon(match.candidate.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-white truncate">
                                                    {match.candidate.normalizedValue}
                                                </span>
                                                <span className={`px-1.5 py-0.5 text-[10px] rounded ${
                                                    match.dbEntity 
                                                        ? 'bg-emerald-500/20 text-emerald-400' 
                                                        : 'bg-amber-500/20 text-amber-400'
                                                }`}>
                                                    {match.dbEntity ? 'ENCONTRADO' : 'NOVO'}
                                                </span>
                                            </div>
                                            {match.dbEntity && (
                                                <p className="text-xs text-slate-400">
                                                    ✓ {match.dbEntity.name}
                                                    {match.dbEntity.investigationTitle && (
                                                        <span className="text-slate-500"> • {match.dbEntity.investigationTitle}</span>
                                                    )}
                                                </p>
                                            )}
                                        </div>
                                        <span className={`text-sm font-bold ${
                                            match.dbEntity ? 'text-emerald-400' : 'text-amber-400'
                                        }`}>
                                            {match.dbEntity ? match.dbEntity.confidence : match.candidate.confidence}%
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : !isMatching && value.length > 20 ? (
                        <p className="text-xs text-slate-500 italic">Nenhuma entidade identificada ainda...</p>
                    ) : null}
                </div>
            )}
        </div>
    );
}

// Export utility to restore draft
export function restoreDraft(key: string): string | null {
    try {
        const saved = localStorage.getItem(key);
        if (saved) {
            const draft = JSON.parse(saved);
            const savedTime = new Date(draft.timestamp);
            const hoursSinceSave = (Date.now() - savedTime.getTime()) / (1000 * 60 * 60);
            
            if (hoursSinceSave < 24 && draft.text) {
                return draft.text;
            }
            localStorage.removeItem(key);
        }
    } catch (e) {
        console.warn('Failed to restore draft:', e);
    }
    return null;
}

// Export utility to clear draft
export function clearDraft(key: string): void {
    try {
        localStorage.removeItem(key);
    } catch (e) {
        console.warn('Failed to clear draft:', e);
    }
}
