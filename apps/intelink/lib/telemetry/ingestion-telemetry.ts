/**
 * 📊 Ingestion Telemetry Service
 * 
 * Registra toda entrada de dados no sistema para:
 * - Auditoria
 * - Análise de performance
 * - Detecção de anomalias
 * - Métricas de uso
 */

import { getSupabaseAdmin } from '../api-utils';
import crypto from 'crypto';

// Tipos
export type IngestionSource = 'upload' | 'text_livre' | 'telegram' | 'api' | 'batch';
export type IngestionStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface IngestionEvent {
    traceId: string;
    source: IngestionSource;
    sourceDetail?: Record<string, any>;
    documentType?: string;
    documentHash?: string;
    documentSizeBytes?: number;
    investigationId?: string;
    memberId?: string;
    unitId?: string;
}

export interface IngestionMetrics {
    entitiesExtracted?: number;
    matchesFound?: number;
    newEntities?: number;
    processingTimeMs?: number;
    extractionTimeMs?: number;
    matchingTimeMs?: number;
}

export interface IngestionResult {
    status: IngestionStatus;
    errorMessage?: string;
}

// Gerar trace ID único
export function generateTraceId(): string {
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(8).toString('hex');
    return `ing_${timestamp}_${random}`;
}

// Gerar hash do documento
export function generateDocumentHash(content: string | Buffer): string {
    return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Inicia o tracking de uma ingestão
 */
export async function startIngestion(event: IngestionEvent): Promise<string> {
    const supabase = getSupabaseAdmin();
    
    const { error } = await supabase
        .from('intelink_data_ingestion_log')
        .insert({
            trace_id: event.traceId,
            source: event.source,
            source_detail: event.sourceDetail || {},
            document_type: event.documentType,
            document_hash: event.documentHash,
            document_size_bytes: event.documentSizeBytes,
            investigation_id: event.investigationId,
            member_id: event.memberId,
            unit_id: event.unitId,
            status: 'processing'
        });
    
    if (error) {
        console.error('[Telemetry] Error starting ingestion:', error);
    }
    
    return event.traceId;
}

/**
 * Atualiza métricas de uma ingestão em andamento
 */
export async function updateIngestionMetrics(
    traceId: string, 
    metrics: IngestionMetrics
): Promise<void> {
    const supabase = getSupabaseAdmin();
    
    const { error } = await supabase
        .from('intelink_data_ingestion_log')
        .update({
            entities_extracted: metrics.entitiesExtracted,
            matches_found: metrics.matchesFound,
            new_entities: metrics.newEntities,
            processing_time_ms: metrics.processingTimeMs,
            extraction_time_ms: metrics.extractionTimeMs,
            matching_time_ms: metrics.matchingTimeMs,
        })
        .eq('trace_id', traceId);
    
    if (error) {
        console.error('[Telemetry] Error updating metrics:', error);
    }
}

/**
 * Finaliza uma ingestão (sucesso ou erro)
 */
export async function completeIngestion(
    traceId: string, 
    result: IngestionResult,
    metrics?: IngestionMetrics
): Promise<void> {
    const supabase = getSupabaseAdmin();
    
    const updateData: Record<string, any> = {
        status: result.status,
        completed_at: new Date().toISOString(),
    };
    
    if (result.errorMessage) {
        updateData.error_message = result.errorMessage;
    }
    
    if (metrics) {
        updateData.entities_extracted = metrics.entitiesExtracted;
        updateData.matches_found = metrics.matchesFound;
        updateData.new_entities = metrics.newEntities;
        updateData.processing_time_ms = metrics.processingTimeMs;
        updateData.extraction_time_ms = metrics.extractionTimeMs;
        updateData.matching_time_ms = metrics.matchingTimeMs;
    }
    
    const { error } = await supabase
        .from('intelink_data_ingestion_log')
        .update(updateData)
        .eq('trace_id', traceId);
    
    if (error) {
        console.error('[Telemetry] Error completing ingestion:', error);
    }
}

/**
 * Helper: Tracked function wrapper
 * Envolve uma função e registra automaticamente métricas
 */
export function withTelemetry<T>(
    source: IngestionSource,
    fn: (traceId: string) => Promise<T>
): (options?: Partial<IngestionEvent>) => Promise<{ result: T; traceId: string }> {
    return async (options = {}) => {
        const traceId = generateTraceId();
        const startTime = Date.now();
        
        await startIngestion({
            traceId,
            source,
            ...options
        });
        
        try {
            const result = await fn(traceId);
            
            await completeIngestion(traceId, { status: 'completed' }, {
                processingTimeMs: Date.now() - startTime
            });
            
            return { result, traceId };
        } catch (error: any) {
            await completeIngestion(traceId, { 
                status: 'failed',
                errorMessage: error.message || 'Unknown error'
            }, {
                processingTimeMs: Date.now() - startTime
            });
            throw error;
        }
    };
}

/**
 * Busca logs de ingestão (para dashboard)
 */
export async function getIngestionLogs(options: {
    limit?: number;
    source?: IngestionSource;
    status?: IngestionStatus;
    investigationId?: string;
    since?: Date;
}): Promise<any[]> {
    const supabase = getSupabaseAdmin();
    
    let query = supabase
        .from('intelink_data_ingestion_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(options.limit || 50);
    
    if (options.source) {
        query = query.eq('source', options.source);
    }
    
    if (options.status) {
        query = query.eq('status', options.status);
    }
    
    if (options.investigationId) {
        query = query.eq('investigation_id', options.investigationId);
    }
    
    if (options.since) {
        query = query.gte('created_at', options.since.toISOString());
    }
    
    const { data, error } = await query;
    
    if (error) {
        console.error('[Telemetry] Error fetching logs:', error);
        return [];
    }
    
    return data || [];
}

/**
 * Estatísticas agregadas
 */
export async function getIngestionStats(since?: Date): Promise<{
    total: number;
    bySource: Record<string, number>;
    byStatus: Record<string, number>;
    avgProcessingTime: number;
    totalEntities: number;
    totalMatches: number;
}> {
    const supabase = getSupabaseAdmin();
    
    let query = supabase
        .from('intelink_data_ingestion_log')
        .select('source, status, processing_time_ms, entities_extracted, matches_found');
    
    if (since) {
        query = query.gte('created_at', since.toISOString());
    }
    
    const { data, error } = await query;
    
    if (error || !data) {
        return {
            total: 0,
            bySource: {},
            byStatus: {},
            avgProcessingTime: 0,
            totalEntities: 0,
            totalMatches: 0
        };
    }
    
    const bySource: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    let totalTime = 0;
    let timeCount = 0;
    let totalEntities = 0;
    let totalMatches = 0;
    
    for (const row of data) {
        bySource[row.source] = (bySource[row.source] || 0) + 1;
        byStatus[row.status] = (byStatus[row.status] || 0) + 1;
        
        if (row.processing_time_ms) {
            totalTime += row.processing_time_ms;
            timeCount++;
        }
        
        totalEntities += row.entities_extracted || 0;
        totalMatches += row.matches_found || 0;
    }
    
    return {
        total: data.length,
        bySource,
        byStatus,
        avgProcessingTime: timeCount > 0 ? Math.round(totalTime / timeCount) : 0,
        totalEntities,
        totalMatches
    };
}
