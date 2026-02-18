'use client';

/**
 * useProcessingCheckpoint - Hook para persistência de progresso
 * 
 * Salva estado de processamento em localStorage para que o usuário
 * possa continuar de onde parou se a internet cair ou a página travar.
 * 
 * @example
 * const { 
 *   checkpoint, 
 *   saveCheckpoint, 
 *   clearCheckpoint, 
 *   hasUnfinishedWork 
 * } = useProcessingCheckpoint('document-upload', investigationId);
 */

import { useState, useEffect, useCallback } from 'react';

export interface ProcessingCheckpoint<T = any> {
    id: string;
    type: string;
    contextId: string;
    step: string;
    data: T;
    totalItems: number;
    processedItems: number;
    createdAt: string;
    updatedAt: string;
    expiresAt: string;
}

interface UseProcessingCheckpointOptions {
    /** TTL em horas (default: 24) */
    ttlHours?: number;
    /** Auto-save a cada N segundos (0 = disabled) */
    autoSaveInterval?: number;
}

const STORAGE_KEY_PREFIX = 'intelink_checkpoint_';
const DEFAULT_TTL_HOURS = 24;

export function useProcessingCheckpoint<T = any>(
    type: string,
    contextId: string,
    options: UseProcessingCheckpointOptions = {}
) {
    const { ttlHours = DEFAULT_TTL_HOURS, autoSaveInterval = 0 } = options;
    
    const storageKey = `${STORAGE_KEY_PREFIX}${type}_${contextId}`;
    
    const [checkpoint, setCheckpoint] = useState<ProcessingCheckpoint<T> | null>(null);
    const [hasUnfinishedWork, setHasUnfinishedWork] = useState(false);
    
    // Load checkpoint on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(storageKey);
            if (stored) {
                const parsed: ProcessingCheckpoint<T> = JSON.parse(stored);
                
                // Check if expired
                if (new Date(parsed.expiresAt) < new Date()) {
                    localStorage.removeItem(storageKey);
                    return;
                }
                
                // Check if completed
                if (parsed.processedItems >= parsed.totalItems && parsed.totalItems > 0) {
                    // Completed, clear it
                    localStorage.removeItem(storageKey);
                    return;
                }
                
                setCheckpoint(parsed);
                setHasUnfinishedWork(parsed.processedItems < parsed.totalItems);
            }
        } catch (e) {
            console.error('[Checkpoint] Error loading:', e);
        }
    }, [storageKey]);
    
    // Auto-save interval
    useEffect(() => {
        if (autoSaveInterval > 0 && checkpoint) {
            const interval = setInterval(() => {
                saveToStorage(checkpoint);
            }, autoSaveInterval * 1000);
            return () => clearInterval(interval);
        }
    }, [autoSaveInterval, checkpoint]);
    
    // Cleanup old checkpoints on mount
    useEffect(() => {
        cleanupOldCheckpoints();
    }, []);
    
    const saveToStorage = (cp: ProcessingCheckpoint<T>) => {
        try {
            localStorage.setItem(storageKey, JSON.stringify(cp));
        } catch (e) {
            console.error('[Checkpoint] Error saving:', e);
        }
    };
    
    const saveCheckpoint = useCallback((
        step: string,
        data: T,
        processedItems: number,
        totalItems: number
    ) => {
        const now = new Date();
        const expiresAt = new Date(now.getTime() + ttlHours * 60 * 60 * 1000);
        
        const newCheckpoint: ProcessingCheckpoint<T> = {
            id: checkpoint?.id || crypto.randomUUID(),
            type,
            contextId,
            step,
            data,
            totalItems,
            processedItems,
            createdAt: checkpoint?.createdAt || now.toISOString(),
            updatedAt: now.toISOString(),
            expiresAt: expiresAt.toISOString()
        };
        
        setCheckpoint(newCheckpoint);
        setHasUnfinishedWork(processedItems < totalItems);
        saveToStorage(newCheckpoint);
        
        return newCheckpoint;
    }, [checkpoint, contextId, ttlHours, type, storageKey]);
    
    const clearCheckpoint = useCallback(() => {
        try {
            localStorage.removeItem(storageKey);
            setCheckpoint(null);
            setHasUnfinishedWork(false);
        } catch (e) {
            console.error('[Checkpoint] Error clearing:', e);
        }
    }, [storageKey]);
    
    const updateProgress = useCallback((processedItems: number, data?: Partial<T>) => {
        if (!checkpoint) return;
        
        const updated = {
            ...checkpoint,
            processedItems,
            data: data ? { ...checkpoint.data, ...data } : checkpoint.data,
            updatedAt: new Date().toISOString()
        };
        
        setCheckpoint(updated);
        setHasUnfinishedWork(processedItems < checkpoint.totalItems);
        saveToStorage(updated);
    }, [checkpoint, storageKey]);
    
    const getProgress = useCallback(() => {
        if (!checkpoint || checkpoint.totalItems === 0) return 0;
        return Math.round((checkpoint.processedItems / checkpoint.totalItems) * 100);
    }, [checkpoint]);
    
    return {
        checkpoint,
        hasUnfinishedWork,
        saveCheckpoint,
        clearCheckpoint,
        updateProgress,
        getProgress
    };
}

/**
 * Cleanup checkpoints older than 24h
 */
function cleanupOldCheckpoints() {
    try {
        const now = new Date();
        const keys = Object.keys(localStorage).filter(k => k.startsWith(STORAGE_KEY_PREFIX));
        
        for (const key of keys) {
            try {
                const stored = localStorage.getItem(key);
                if (!stored) continue;
                
                const parsed = JSON.parse(stored);
                if (new Date(parsed.expiresAt) < now) {
                    localStorage.removeItem(key);
                    console.log(`[Checkpoint] Cleaned up expired: ${key}`);
                }
            } catch {
                // Invalid JSON, remove it
                localStorage.removeItem(key);
            }
        }
    } catch (e) {
        console.error('[Checkpoint] Error cleaning up:', e);
    }
}

/**
 * Get all active checkpoints (for Resume UI)
 */
export function getAllCheckpoints(): ProcessingCheckpoint[] {
    try {
        const now = new Date();
        const keys = Object.keys(localStorage).filter(k => k.startsWith(STORAGE_KEY_PREFIX));
        const checkpoints: ProcessingCheckpoint[] = [];
        
        for (const key of keys) {
            try {
                const stored = localStorage.getItem(key);
                if (!stored) continue;
                
                const parsed = JSON.parse(stored);
                
                // Skip expired or completed
                if (new Date(parsed.expiresAt) < now) continue;
                if (parsed.processedItems >= parsed.totalItems && parsed.totalItems > 0) continue;
                
                checkpoints.push(parsed);
            } catch {
                // Invalid JSON, skip
            }
        }
        
        return checkpoints.sort((a, b) => 
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
    } catch {
        return [];
    }
}

export default useProcessingCheckpoint;
