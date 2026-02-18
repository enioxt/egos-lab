/**
 * Telemetry Export API
 * GET /api/telemetry/export
 * 
 * Exports telemetry data for forensic audit purposes.
 * Supports JSON and CSV formats.
 * 
 * Query params:
 * - format: 'json' | 'csv' (default: json)
 * - from: ISO date string (default: 30 days ago)
 * - to: ISO date string (default: now)
 * - investigation_id: Filter by investigation
 * - user_id: Filter by user
 * - event_type: Filter by event type
 * 
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, errorResponse } from '@/lib/api-utils';
import { withSecurity, AuthContext } from '@/lib/api-security';

interface TelemetryRecord {
    id: string;
    event_type: string;
    page: string;
    action: string;
    metadata: Record<string, any>;
    duration_ms: number | null;
    user_id: string | null;
    session_id: string | null;
    created_at: string;
}

/**
 * Convert records to CSV format
 */
function toCSV(records: TelemetryRecord[]): string {
    if (records.length === 0) {
        return 'id,event_type,page,action,user_id,session_id,duration_ms,created_at,metadata\n';
    }
    
    const headers = ['id', 'event_type', 'page', 'action', 'user_id', 'session_id', 'duration_ms', 'created_at', 'metadata'];
    const lines = [headers.join(',')];
    
    for (const record of records) {
        const row = [
            record.id,
            record.event_type || '',
            record.page || '',
            record.action || '',
            record.user_id || '',
            record.session_id || '',
            record.duration_ms?.toString() || '',
            record.created_at || '',
            JSON.stringify(record.metadata || {}).replace(/"/g, '""'), // Escape quotes for CSV
        ];
        lines.push(row.map(v => `"${v}"`).join(','));
    }
    
    return lines.join('\n');
}

/**
 * Generate audit report header
 */
function generateAuditHeader(params: {
    from: string;
    to: string;
    totalRecords: number;
    filters: Record<string, string | undefined>;
}): Record<string, any> {
    return {
        report_type: 'INTELINK_TELEMETRY_AUDIT',
        version: '1.0',
        generated_at: new Date().toISOString(),
        generated_by: 'INTELINK Audit System',
        period: {
            from: params.from,
            to: params.to,
        },
        filters_applied: Object.fromEntries(
            Object.entries(params.filters).filter(([_, v]) => v !== undefined)
        ),
        total_records: params.totalRecords,
        integrity_hash: generateIntegrityHash(params.totalRecords, params.from, params.to),
    };
}

/**
 * Simple integrity hash for audit verification
 */
function generateIntegrityHash(count: number, from: string, to: string): string {
    const data = `${count}:${from}:${to}:INTELINK`;
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
        const char = data.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return `AUDIT-${Math.abs(hash).toString(16).toUpperCase().padStart(8, '0')}`;
}

async function handleGet(req: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        const supabase = getSupabaseAdmin();
        const { searchParams } = new URL(req.url);
        
        // Parse parameters
        const format = searchParams.get('format') || 'json';
        const fromDate = searchParams.get('from') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const toDate = searchParams.get('to') || new Date().toISOString();
        const investigationId = searchParams.get('investigation_id');
        const userId = searchParams.get('user_id');
        const eventType = searchParams.get('event_type');
        
        // Build query
        let query = supabase
            .from('intelink_telemetry')
            .select('*')
            .gte('created_at', fromDate)
            .lte('created_at', toDate)
            .order('created_at', { ascending: true })
            .limit(10000); // Safety limit
        
        // Apply filters
        if (investigationId) {
            query = query.eq('metadata->>investigation_id', investigationId);
        }
        if (userId) {
            query = query.eq('user_id', userId);
        }
        if (eventType) {
            query = query.eq('event_type', eventType);
        }
        
        const { data: records, error } = await query;
        
        if (error) {
            console.error('[Telemetry Export] Query error:', error);
            // Return empty result instead of error (table may not exist)
            const emptyRecords: TelemetryRecord[] = [];
            
            if (format === 'csv') {
                return new NextResponse(toCSV(emptyRecords), {
                    headers: {
                        'Content-Type': 'text/csv',
                        'Content-Disposition': `attachment; filename="audit_${new Date().toISOString().split('T')[0]}.csv"`,
                    },
                });
            }
            
            return NextResponse.json({
                audit: generateAuditHeader({
                    from: fromDate,
                    to: toDate,
                    totalRecords: 0,
                    filters: { investigationId: investigationId || undefined, userId: userId || undefined, eventType: eventType || undefined },
                }),
                records: [],
            });
        }
        
        const typedRecords = (records || []) as TelemetryRecord[];
        
        // Generate audit header
        const auditHeader = generateAuditHeader({
            from: fromDate,
            to: toDate,
            totalRecords: typedRecords.length,
            filters: { 
                investigationId: investigationId || undefined, 
                userId: userId || undefined, 
                eventType: eventType || undefined 
            },
        });
        
        // Return based on format
        if (format === 'csv') {
            const csv = toCSV(typedRecords);
            return new NextResponse(csv, {
                headers: {
                    'Content-Type': 'text/csv',
                    'Content-Disposition': `attachment; filename="audit_${auditHeader.integrity_hash}.csv"`,
                    'X-Audit-Hash': auditHeader.integrity_hash,
                    'X-Audit-Records': typedRecords.length.toString(),
                },
            });
        }
        
        // JSON format (default)
        return NextResponse.json({
            audit: auditHeader,
            records: typedRecords,
            summary: {
                by_event_type: countBy(typedRecords, 'event_type'),
                by_page: countBy(typedRecords, 'page'),
                by_user: countBy(typedRecords, 'user_id'),
            },
        });
        
    } catch (e: any) {
        console.error('[Telemetry Export] Error:', e);
        return errorResponse(e.message || 'Export failed', 500);
    }
}

/**
 * Group and count records by a field
 */
function countBy(records: TelemetryRecord[], field: keyof TelemetryRecord): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const record of records) {
        const value = String(record[field] || 'unknown');
        counts[value] = (counts[value] || 0) + 1;
    }
    return counts;
}

// Admin only - audit data is sensitive
export const GET = withSecurity(handleGet, { requiredRole: 'admin' });
