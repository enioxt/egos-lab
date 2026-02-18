import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin, notFoundError } from '@/lib/api-utils';
import { withSecurity, SecureContext } from '@/lib/security/middleware';

const sessionSchema = z.object({
    chat_id: z.union([z.string(), z.number()]).optional().transform(val => 
        val ? (typeof val === 'string' ? parseInt(val, 10) : val) : null
    ),
    phone: z.string().optional(), // Allow login by phone number
});

async function handler(req: NextRequest, context: SecureContext<z.infer<typeof sessionSchema>>) {
    const { body } = context;
    const supabase = getSupabaseAdmin();

    let member = null;
    let session = null;

    // Option 1: Login by phone number (for visitors/members without Telegram)
    if (body.phone) {
        const normalizedPhone = body.phone.replace(/\D/g, ''); // Remove non-digits
        
        const { data: memberByPhone } = await supabase
            .from('intelink_unit_members')
            .select('id, name, role, phone, telegram_username, system_role, unit_id')
            .or(`phone.eq.${normalizedPhone},phone.ilike.%${normalizedPhone}%`)
            .single();
        
        if (!memberByPhone) {
            return NextResponse.json({ 
                success: false, 
                error: 'Telefone não encontrado. Verifique o número ou contate o administrador.' 
            }, { status: 404 });
        }
        
        member = memberByPhone;
        // Create a virtual session for phone-based auth
        session = {
            chat_id: null,
            user_id: memberByPhone.id,
            investigation_id: null,
            username: memberByPhone.name
        };
    }
    // Option 2: Login by Telegram Chat ID (original flow)
    else if (body.chat_id) {
        const { data: sessionData, error } = await supabase
            .from('intelink_sessions')
            .select('chat_id, user_id, investigation_id, username')
            .eq('chat_id', body.chat_id)
            .single();

        if (error || !sessionData) {
            return notFoundError('Sessão');
        }
        
        session = sessionData;

        // Get member info by telegram_chat_id
        const { data: memberByTelegram } = await supabase
            .from('intelink_unit_members')
            .select('id, name, role, phone, telegram_username, system_role, unit_id')
            .or(`telegram_chat_id.eq.${session.user_id},telegram_chat_id.eq.${body.chat_id}`)
            .single();
        
        member = memberByTelegram;
    } else {
        return NextResponse.json({ 
            success: false, 
            error: 'Forneça chat_id ou phone para autenticação.' 
        }, { status: 400 });
    }

    // Build response with member data
    const responseData = {
        success: true,
        session,
        member: member ? {
            id: member.id,
            name: member.name,
            role: member.role,
            system_role: member.system_role || 'member', // For permission checks
            phone: member.phone,
            telegram_username: member.telegram_username,
            displayName: member.telegram_username || session.username || member.name,
            unit_id: member.unit_id
        } : null
    };
    
    // Create response and set HTTP-only cookie for API authentication
    const response = NextResponse.json(responseData);
    
    if (member?.id) {
        // Set HTTP-only cookie with member_id (7 days expiry)
        response.cookies.set('intelink_member_id', member.id, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/'
        });
    }
    
    return response;
}

// NOTE: This endpoint is called BY the auth middleware to validate sessions
// It must NOT require auth itself or it creates an infinite loop
export const POST = withSecurity(handler, {
    auth: false, // Public endpoint - validates tokens internally
    rateLimit: 'auth', // Use auth rate limit (stricter)
    validation: sessionSchema,
});
