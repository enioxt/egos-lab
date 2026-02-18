'use client';

/**
 * useGuardianAnalysis - Hook para análise jurídica via Guardian AI
 * 
 * Extrai a lógica de análise jurídica do DocumentUploadModal para uso reutilizável.
 * Pode ser usado em qualquer lugar do sistema onde precisamos analisar textos juridicamente.
 * 
 * @example
 * const { analyze, result, isLoading, error } = useGuardianAnalysis();
 * 
 * // Analisar um texto
 * await analyze({ text: 'Texto do BO...', entities: [...] });
 * 
 * // Usar o resultado
 * if (result) {
 *   console.log(result.crimes, result.articles, result.flagrancy);
 * }
 */

import { useState, useCallback } from 'react';

export interface GuardianEntity {
    name: string;
    type: string;
    role?: string;
}

export interface GuardianCrime {
    name: string;
    article: string;
    description?: string;
    confidence: number;
}

export interface GuardianResult {
    crimes: GuardianCrime[];
    articles: string[];
    flagrancy: {
        detected: boolean;
        type?: 'proprio' | 'improprio' | 'presumido';
        reason?: string;
    };
    providences: string[];
    risk_level: 'low' | 'medium' | 'high' | 'critical';
    summary: string;
    raw_analysis?: string;
}

interface GuardianInput {
    text: string;
    entities?: GuardianEntity[];
}

interface UseGuardianAnalysisReturn {
    analyze: (input: GuardianInput) => Promise<GuardianResult | null>;
    result: GuardianResult | null;
    isLoading: boolean;
    error: string | null;
    reset: () => void;
}

export function useGuardianAnalysis(): UseGuardianAnalysisReturn {
    const [result, setResult] = useState<GuardianResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const analyze = useCallback(async (input: GuardianInput): Promise<GuardianResult | null> => {
        if (!input.text || input.text.trim().length < 50) {
            setError('Texto muito curto para análise (mínimo 50 caracteres)');
            return null;
        }

        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await fetch('/api/documents/guardian', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: input.text,
                    entities: input.entities || []
                })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || 'Erro na análise Guardian');
            }

            const data = await response.json();
            
            // Normalize the result
            const normalizedResult: GuardianResult = {
                crimes: data.crimes || [],
                articles: data.articles || [],
                flagrancy: data.flagrancy || { detected: false },
                providences: data.providences || data.suggested_actions || [],
                risk_level: data.risk_level || 'medium',
                summary: data.summary || data.analysis_summary || '',
                raw_analysis: data.raw_analysis
            };

            setResult(normalizedResult);
            return normalizedResult;
        } catch (err: any) {
            const errorMessage = err.message || 'Erro desconhecido na análise';
            setError(errorMessage);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const reset = useCallback(() => {
        setResult(null);
        setError(null);
        setIsLoading(false);
    }, []);

    return {
        analyze,
        result,
        isLoading,
        error,
        reset
    };
}

// Re-export types for convenience
export type { GuardianInput };
