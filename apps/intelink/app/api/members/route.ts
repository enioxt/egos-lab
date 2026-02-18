import { NextRequest, NextResponse } from 'next/server';
import { 
    getSupabaseAdmin, 
    successResponse, 
    errorResponse, 
    validationError,
    createdResponse
} from '@/lib/api-utils';
import { withSecurity, AuthContext, forbiddenResponse } from '@/lib/api-security';
import { normalizePhone, cleanPhoneForStorage, phonesMatch } from '@/lib/utils/phone-normalizer';

// GET: List all members (unit_admin+ can see all, others see own unit only)
async function handleGet(req: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        const supabase = getSupabaseAdmin();
        
        let query = supabase
            .from('intelink_unit_members')
            .select(`
                *,
                unit:intelink_police_units (
                    id,
                    code,
                    name
                )
            `)
            .order('name');

        // Non-admins can only see members from their own unit
        if (auth.systemRole !== 'super_admin' && auth.systemRole !== 'unit_admin') {
            if (auth.unitId) {
                query = query.eq('unit_id', auth.unitId);
            }
        }

        const { data: members, error } = await query;

        if (error) throw error;

        return successResponse({ members });
    } catch (e: any) {
        console.error('[Members API] Error:', e);
        return errorResponse(e.message || 'Erro ao buscar membros');
    }
}

// POST: Create new member (unit_admin+ only)
async function handlePost(req: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        const supabase = getSupabaseAdmin();
        const body = await req.json();
        
        if (!body.name || !body.unit_id || !body.role) {
            return validationError('name, unit_id e role são obrigatórios');
        }

        // DUPLICATE PHONE CHECK: Prevent duplicate registrations
        if (body.phone) {
            // Normalize phone using smart normalizer
            const phoneInfo = normalizePhone(body.phone);
            const cleanedPhone = cleanPhoneForStorage(body.phone);
            
            // Get all members with phones to check for matches
            const { data: allMembers } = await supabase
                .from('intelink_unit_members')
                .select('id, name, phone')
                .not('phone', 'is', null);
            
            // Find any phone that matches (handles all format variations)
            const existingMember = (allMembers || []).find(m => 
                phonesMatch(m.phone, body.phone)
            );
            
            if (existingMember) {
                // Send notification to admin via Telegram
                try {
                    const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
                    const botToken = process.env.TELEGRAM_BOT_TOKEN;
                    if (adminChatId && botToken) {
                        const message = `⚠️ *Tentativa de cadastro com telefone duplicado*\n\n` +
                            `📱 Telefone: ${body.phone}\n` +
                            `👤 Nome tentado: ${body.name}\n` +
                            `🔄 Já existe: ${existingMember.name}\n\n` +
                            `_Alguém tentou se cadastrar com um número já registrado._`;
                        
                        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                chat_id: adminChatId,
                                text: message,
                                parse_mode: 'Markdown'
                            })
                        });
                    }
                } catch (notifyError) {
                    console.error('[Members API] Failed to notify admin:', notifyError);
                }
                
                return NextResponse.json({
                    error: 'Este telefone já está cadastrado no sistema.',
                    duplicate: true,
                    adminContact: {
                        whatsapp: process.env.ADMIN_WHATSAPP || '5531999999999',
                        telegram: '@IntelinkAdmin',
                        message: 'Entre em contato com o administrador para recuperar seu acesso.'
                    }
                }, { status: 409 }); // 409 Conflict
            }
        }

        // New members default to 'member' system_role
        // 'visitor' is for external observers, not team members
        // Normalize phone for consistent storage
        const memberData = {
            ...body,
            phone: body.phone ? cleanPhoneForStorage(body.phone) : null,
            system_role: body.system_role || 'member'
        };

        const { data, error } = await supabase
            .from('intelink_unit_members')
            .insert([memberData])
            .select()
            .single();

        if (error) throw error;

        return createdResponse({ member: data });
    } catch (e: any) {
        console.error('[Members API] Error:', e);
        return errorResponse(e.message || 'Erro ao criar membro');
    }
}

// PATCH: Update member (unit_admin+ only, can't edit higher roles)
async function handlePatch(req: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        const supabase = getSupabaseAdmin();
        const body = await req.json();
        const { id, ...updates } = body;

        if (!id) {
            return validationError('ID é obrigatório');
        }

        // Check if trying to edit someone with higher role
        const { data: target } = await supabase
            .from('intelink_unit_members')
            .select('system_role')
            .eq('id', id)
            .single();

        const roleHierarchy: Record<string, number> = {
            super_admin: 100, unit_admin: 60, member: 40, intern: 20, visitor: 10
        };

        const actorLevel = roleHierarchy[auth.systemRole] || 0;
        const targetLevel = roleHierarchy[target?.system_role || 'visitor'] || 0;

        // Can't edit someone at same or higher level (unless super_admin)
        if (auth.systemRole !== 'super_admin' && targetLevel >= actorLevel) {
            return forbiddenResponse('Você não pode editar este usuário');
        }

        // Remove system_role from updates if not super_admin
        if (auth.systemRole !== 'super_admin' && updates.system_role) {
            delete updates.system_role;
        }
        
        // Normalize phone if being updated
        if (updates.phone) {
            updates.phone = cleanPhoneForStorage(updates.phone);
        }

        const { data, error } = await supabase
            .from('intelink_unit_members')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return successResponse({ member: data });
    } catch (e: any) {
        console.error('[Members API] Error:', e);
        return errorResponse(e.message || 'Erro ao atualizar membro');
    }
}

// DELETE: Remove member (super_admin only)
async function handleDelete(req: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        const supabase = getSupabaseAdmin();
        
        // Accept ID from query param OR body
        const { searchParams } = new URL(req.url);
        let id = searchParams.get('id');
        
        if (!id) {
            try {
                const body = await req.json();
                id = body.id;
            } catch {
                // No body, that's ok
            }
        }

        if (!id) {
            return validationError('ID é obrigatório');
        }

        // Can't delete yourself
        if (id === auth.memberId) {
            return forbiddenResponse('Você não pode remover a si mesmo');
        }

        const { error } = await supabase
            .from('intelink_unit_members')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return successResponse({ deleted: true });
    } catch (e: any) {
        console.error('[Members API] Error:', e);
        return errorResponse(e.message || 'Erro ao remover membro');
    }
}

// Protected endpoints with role requirements
export const GET = withSecurity(handleGet, { requiredRole: 'member' });
export const POST = withSecurity(handlePost, { requiredRole: 'unit_admin' });
export const PATCH = withSecurity(handlePatch, { requiredRole: 'unit_admin' });
export const DELETE = withSecurity(handleDelete, { requiredRole: 'super_admin' });
