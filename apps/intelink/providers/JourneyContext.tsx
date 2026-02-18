'use client';

/**
 * JourneyContext - Global state for Investigation Journey
 * 
 * Solves the problem of each useJourney hook having independent state.
 * All components now share the same journey state.
 */

import React, { createContext, useContext, useCallback, useEffect, useRef, useState } from 'react';
import { getSupabase } from '@/lib/supabase-client';
import type { JourneyStep, InvestigationJourney } from '@/lib/types/journey';

// ============================================================================
// TYPES
// ============================================================================

interface JourneyContextType {
    journey: InvestigationJourney | null;
    isRecording: boolean;
    stepCount: number;
    startJourney: (title?: string) => Promise<void>;
    endJourney: () => Promise<void>;
    addStep: (step: Omit<JourneyStep, 'stepNumber' | 'timestamp'>) => void;
    clearJourney: () => void;
    requestAnalysis: (context: string) => Promise<string | null>;
    getLastSteps: (count: number) => JourneyStep[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

const JOURNEY_STORAGE_KEY = 'intelink_current_journey';
const BATCH_SAVE_INTERVAL = 30000;

// ============================================================================
// CONTEXT
// ============================================================================

const JourneyContext = createContext<JourneyContextType | null>(null);

export function useJourneyContext() {
    const ctx = useContext(JourneyContext);
    if (!ctx) {
        throw new Error('useJourneyContext must be used within JourneyProvider');
    }
    return ctx;
}

// Safe hook that doesn't throw if outside provider
export function useJourneySafe() {
    const ctx = useContext(JourneyContext);
    return ctx || {
        journey: null,
        isRecording: false,
        stepCount: 0,
        startJourney: async () => {},
        endJourney: async () => {},
        addStep: () => {},
        clearJourney: () => {},
        requestAnalysis: async () => null,
        getLastSteps: () => [],
    };
}

// ============================================================================
// PROVIDER
// ============================================================================

export function JourneyProvider({ children }: { children: React.ReactNode }) {
    const supabase = getSupabase();
    
    const [journey, setJourney] = useState<InvestigationJourney | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const stepsRef = useRef<JourneyStep[]>([]);
    const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
    
    const stepCount = stepsRef.current.length;
    
    // ========================================================================
    // PERSISTENCE
    // ========================================================================
    
    // Load journey from localStorage on mount
    useEffect(() => {
        if (typeof window === 'undefined') return;
        
        const stored = localStorage.getItem(JOURNEY_STORAGE_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored) as InvestigationJourney;
                setJourney(parsed);
                stepsRef.current = parsed.steps;
                setIsRecording(parsed.status === 'active');
                console.log('[Journey] Restored from storage:', parsed.steps.length, 'steps');
            } catch (e) {
                console.error('[Journey] Failed to parse stored journey:', e);
                localStorage.removeItem(JOURNEY_STORAGE_KEY);
                // Auto-start new journey
                startJourney();
            }
        } else {
            // Auto-start new journey
            startJourney();
        }
    }, []);
    
    // Save to localStorage on changes
    useEffect(() => {
        if (!journey) return;
        localStorage.setItem(JOURNEY_STORAGE_KEY, JSON.stringify({
            ...journey,
            steps: stepsRef.current,
        }));
    }, [journey, stepCount]);
    
    // Batch save to Supabase
    useEffect(() => {
        if (!isRecording) return;
        
        saveTimerRef.current = setInterval(async () => {
            if (journey && stepsRef.current.length > 0) {
                await saveToSupabase();
            }
        }, BATCH_SAVE_INTERVAL);
        
        return () => {
            if (saveTimerRef.current) clearInterval(saveTimerRef.current);
        };
    }, [isRecording, journey?.id]);
    
    // ========================================================================
    // SUPABASE OPERATIONS
    // ========================================================================
    
    const saveToSupabase = useCallback(async () => {
        if (!journey || !supabase) return;
        
        // Don't try to save if user_id is anonymous or not a valid UUID (FK constraint)
        const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!journey.userId || journey.userId === 'anonymous' || !isValidUUID.test(journey.userId)) {
            // Silent skip - don't log to avoid console spam
            return;
        }
        
        try {
            const { error } = await supabase
                .from('intelink_journeys')
                .upsert({
                    id: journey.id,
                    user_id: journey.userId,
                    investigation_id: journey.investigationId || null,
                    title: journey.title,
                    context: journey.context,
                    steps: stepsRef.current,
                    status: journey.status,
                });
            
            if (error) {
                // Only log if it's not a permission error (RLS)
                if (!error.message?.includes('permission') && !error.message?.includes('RLS')) {
                    console.warn('[Journey] Save warning:', error.message);
                }
                return;
            }
            console.log('[Journey] Saved to Supabase:', stepsRef.current.length, 'steps');
        } catch (e) {
            // Silent catch - journey is still saved in localStorage
        }
    }, [journey, supabase]);
    
    // ========================================================================
    // JOURNEY ACTIONS
    // ========================================================================
    
    const startJourney = useCallback(async (title?: string) => {
        const userId = typeof window !== 'undefined' 
            ? localStorage.getItem('intelink_member_id') || 'anonymous'
            : 'anonymous';
        
        const newJourney: InvestigationJourney = {
            id: crypto.randomUUID(),
            userId,
            investigationId: undefined,
            title: title || `Jornada ${new Date().toLocaleDateString('pt-BR')}`,
            context: '',
            steps: [],
            stepCount: 0,
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        
        setJourney(newJourney);
        stepsRef.current = [];
        setIsRecording(true);
        
        console.log('[Journey] Started new journey:', newJourney.id);
    }, []);
    
    const endJourney = useCallback(async () => {
        if (!journey) return;
        
        setIsRecording(false);
        setJourney(prev => prev ? { ...prev, status: 'completed', updatedAt: new Date() } : null);
        await saveToSupabase();
        
        console.log('[Journey] Ended journey:', journey.id);
    }, [journey, saveToSupabase]);
    
    const addStep = useCallback((step: Omit<JourneyStep, 'stepNumber' | 'timestamp'>) => {
        if (!isRecording) {
            console.log('[Journey] Not recording, ignoring step');
            return;
        }
        
        const newStep: JourneyStep = {
            ...step,
            stepNumber: stepsRef.current.length + 1,
            timestamp: Date.now(),
        };
        
        stepsRef.current = [...stepsRef.current, newStep];
        
        // Force re-render by updating journey
        setJourney(prev => prev ? { 
            ...prev, 
            steps: stepsRef.current,
            updatedAt: new Date() 
        } : null);
        
        console.log('[Journey] Added step:', newStep.stepNumber, newStep.entityName, '| Total:', stepsRef.current.length);
    }, [isRecording]);
    
    const clearJourney = useCallback(() => {
        localStorage.removeItem(JOURNEY_STORAGE_KEY);
        stepsRef.current = [];
        setJourney(null);
        setIsRecording(false);
        // Start a fresh journey
        startJourney();
        console.log('[Journey] Cleared and started fresh');
    }, [startJourney]);
    
    // ========================================================================
    // AI ANALYSIS
    // ========================================================================
    
    const requestAnalysis = useCallback(async (context: string): Promise<string | null> => {
        if (!journey || stepsRef.current.length < 2) {
            return null;
        }
        
        try {
            const response = await fetch('/api/intelligence/journey', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    journeyId: journey.id,
                    context,
                    steps: stepsRef.current,
                }),
            });
            
            if (!response.ok) throw new Error('Analysis failed');
            
            const data = await response.json();
            
            // Update journey with analysis
            setJourney(prev => prev ? {
                ...prev,
                context,
                aiAnalysis: data.analysis,
                aiModel: data.model,
                aiAnalyzedAt: new Date(),
            } : null);
            
            // Save to Supabase
            if (supabase) {
                await supabase
                    .from('intelink_journeys')
                    .update({
                        context,
                        ai_analysis: data.analysis,
                        ai_model: data.model,
                        ai_analyzed_at: new Date().toISOString(),
                    })
                    .eq('id', journey.id);
            }
            
            return data.analysis;
        } catch (e) {
            console.error('[Journey] Analysis failed:', e);
            return null;
        }
    }, [journey, supabase]);
    
    const getLastSteps = useCallback((count: number): JourneyStep[] => {
        return stepsRef.current.slice(-count);
    }, []);
    
    // ========================================================================
    // RENDER
    // ========================================================================
    
    return (
        <JourneyContext.Provider value={{
            journey,
            isRecording,
            stepCount: stepsRef.current.length,
            startJourney,
            endJourney,
            addStep,
            clearJourney,
            requestAnalysis,
            getLastSteps,
        }}>
            {children}
        </JourneyContext.Provider>
    );
}

export default JourneyProvider;
