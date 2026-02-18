import { NextRequest, NextResponse } from 'next/server';
import { successResponse, errorResponse, validationError, getSupabaseAdmin } from '@/lib/api-utils';
import { withSecurity, AuthContext } from '@/lib/api-security';
import { getAuditLogs, AuditAction, logAudit } from '@/lib/audit-service';

async function handleGetAuditLogs(req: NextRequest, auth: AuthContext) {
    try {
        const { searchParams } = new URL(req.url);
        
        const filters = {
            actorId: searchParams.get('actor_id') || undefined,
            action: (searchParams.get('action') as AuditAction) || undefined,
            targetType: searchParams.get('target_type') || undefined,
            startDate: searchParams.get('start_date') || undefined,
            endDate: searchParams.get('end_date') || undefined,
            limit: parseInt(searchParams.get('limit') || '100')
        };
        
        const logs = await getAuditLogs(filters);
        
        return successResponse({ 
            logs,
            count: logs.length,
            filters
        });
        
    } catch (e: any) {
        console.error('[Audit API] Error:', e);
        return errorResponse(e.message || 'Erro ao buscar logs');
    }
}

// Protected: Only super_admin can view audit logs
export const GET = withSecurity(handleGetAuditLogs, { requiredRole: 'super_admin' });

/**
 * POST /api/audit - Log a new audit entry (from frontend)
 * Any authenticated user can log their own actions
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        
        const { 
            action, 
            resource_type, 
            resource_id, 
            metadata,
            user_chat_id,
            user_agent 
        } = body;

        if (!action || !resource_type) {
            return NextResponse.json({ error: 'action and resource_type required' }, { status: 400 });
        }

        // Get user info from chat_id
        const supabase = getSupabaseAdmin();
        let actorName = 'Anonymous';
        let actorRole = 'unknown';
        let actorId = 'anonymous';

        // Priority 1: Get member from cookie (most reliable)
        const memberIdCookie = req.cookies.get('intelink_member_id')?.value;
        if (memberIdCookie) {
            const { data: member } = await supabase
                .from('intelink_unit_members')
                .select('id, name, role, system_role, unit_id')
                .eq('id', memberIdCookie)
                .single();
            
            if (member) {
                actorId = member.id;
                actorName = member.name;
                actorRole = member.system_role || member.role;
            }
        }
        // Priority 2: Get member from telegram_chat_id
        else if (user_chat_id) {
            const { data: member } = await supabase
                .from('intelink_unit_members')
                .select('id, name, role, system_role')
                .eq('telegram_chat_id', user_chat_id)
                .single();
            
            if (member) {
                actorId = member.id;
                actorName = member.name;
                actorRole = member.system_role || member.role;
            }
        }

        // Map frontend action to audit action
        const auditAction = action.toLowerCase().replace('_', '_') as AuditAction;

        await logAudit({
            action: auditAction,
            actorId,
            actorName,
            actorRole,
            targetType: resource_type,
            targetId: resource_id,
            details: metadata,
            userAgent: user_agent
        });

        return NextResponse.json({ success: true });
        
    } catch (error: any) {
        console.error('[Audit POST] Error:', error);
        // Silently succeed - audit should not break UX
        return NextResponse.json({ success: true, warning: 'Audit may have failed' });
    }
}
