import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, successResponse, errorResponse } from '@/lib/api-utils';
import { withSecurity, AuthContext } from '@/lib/api-security';

interface TimelineEvent {
    id: string;
    type: 'entity_added' | 'relationship_created' | 'evidence_uploaded' | 'status_changed' | 'analysis_run';
    title: string;
    description?: string;
    timestamp: string;
    actor?: string;
    entityType?: string;
    metadata?: Record<string, any>;
}

async function handleGet(
    req: NextRequest,
    auth: AuthContext
): Promise<NextResponse> {
    try {
        // Extract ID from URL since Next.js App Router params handling is tricky with withSecurity wrapper
        const url = new URL(req.url);
        // pattern: /api/investigation/[id]/timeline
        const pathParts = url.pathname.split('/');
        const investigationId = pathParts[pathParts.length - 2]; // .../ID/timeline

        if (!investigationId) {
            return successResponse({ events: [], stats: { total: 0 } });
        }

        const supabase = getSupabaseAdmin();
        
        // Fetch entities
        const { data: entities } = await supabase
            .from('intelink_entities')
            .select('id, name, type, metadata, created_at')
            .eq('investigation_id', investigationId)
            .order('created_at', { ascending: false });

        // Fetch relationships
        const { data: relationships } = await supabase
            .from('intelink_relationships')
            .select('id, type, description, created_at, source:source_id(name), target:target_id(name)')
            .eq('investigation_id', investigationId)
            .order('created_at', { ascending: false });

        // Fetch evidence from storage
        const { data: evidence } = await supabase
            .from('intelink_evidence')
            .select('id, file_name, file_type, created_at, metadata')
            .eq('investigation_id', investigationId)
            .order('created_at', { ascending: false });

        // Build timeline events
        const events: TimelineEvent[] = [];

        // Entity events
        entities?.forEach(entity => {
            events.push({
                id: `entity-${entity.id}`,
                type: 'entity_added',
                title: `${entity.name} adicionado`,
                description: `Entidade do tipo ${entity.type}`,
                timestamp: entity.created_at,
                entityType: entity.type,
                metadata: entity.metadata
            });
        });

        // Relationship events
        relationships?.forEach(rel => {
            const sourceName = (rel.source as any)?.name || '?';
            const targetName = (rel.target as any)?.name || '?';
            events.push({
                id: `rel-${rel.id}`,
                type: 'relationship_created',
                title: `Vínculo: ${rel.type}`,
                description: `${sourceName} → ${targetName}${rel.description ? ` (${rel.description})` : ''}`,
                timestamp: rel.created_at
            });
        });

        // Evidence events
        evidence?.forEach(ev => {
            events.push({
                id: `ev-${ev.id}`,
                type: 'evidence_uploaded',
                title: ev.file_name || 'Evidência anexada',
                description: `Arquivo ${ev.file_type}`,
                timestamp: ev.created_at,
                metadata: ev.metadata
            });
        });

        // Sort by timestamp (newest first)
        events.sort((a, b) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        return NextResponse.json({
            events,
            stats: {
                entities: entities?.length || 0,
                relationships: relationships?.length || 0,
                evidence: evidence?.length || 0,
                total: events.length
            }
        });

    } catch (error) {
        console.error('[Timeline API] Error:', error);
        return NextResponse.json({ error: 'Failed to load timeline' }, { status: 500 });
    }
}

// Protected: Only member+ can view timeline
export const GET = withSecurity(handleGet, { requiredRole: 'member' });
