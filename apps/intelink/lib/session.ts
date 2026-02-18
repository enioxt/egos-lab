/**
 * Session Management Utilities
 * 
 * Provides session validation for API routes
 */

import { NextRequest } from 'next/server';
import { getSupabaseAdmin, unauthorizedError } from './api-utils';

export interface SessionUser {
    memberId: string;
    name: string;
    phone: string;
    role: string;
    unitId: string;
    unitName: string;
    telegramChatId?: string;
    telegramUsername?: string;
}

export interface SessionValidationResult {
    valid: boolean;
    user?: SessionUser;
    error?: string;
}

/**
 * Validate session from request
 * 
 * Checks for session token in:
 * 1. x-session-token header (set by middleware)
 * 2. Authorization: Bearer header
 * 3. intelink_session cookie
 * 
 * @returns SessionValidationResult with user data if valid
 */
export async function validateSession(
    request: NextRequest
): Promise<SessionValidationResult> {
    try {
        // Get token from various sources
        const headerToken = request.headers.get('x-session-token');
        const authHeader = request.headers.get('Authorization');
        const bearerToken = authHeader?.startsWith('Bearer ')
            ? authHeader.slice(7)
            : null;
        const cookieToken = request.cookies.get('intelink_session')?.value;

        const token = headerToken || bearerToken || cookieToken;

        if (!token) {
            return { valid: false, error: 'Token não fornecido' };
        }

        const supabase = getSupabaseAdmin();

        // Parse token - could be JWT or session ID
        let sessionData: any = null;

        // Try to parse as JSON (localStorage format)
        try {
            sessionData = JSON.parse(token);
        } catch {
            // Not JSON, treat as session ID
            sessionData = { sessionId: token };
        }

        // If we have a member_id directly (from phone auth)
        if (sessionData.member_id) {
            const { data: member, error } = await supabase
                .from('intelink_unit_members')
                .select(`
                    id, name, phone, role, unit_id, telegram_chat_id, telegram_username,
                    unit:intelink_police_units(id, name)
                `)
                .eq('id', sessionData.member_id)
                .eq('active', true)
                .single();

            if (error || !member) {
                return { valid: false, error: 'Membro não encontrado ou inativo' };
            }

            return {
                valid: true,
                user: {
                    memberId: member.id,
                    name: member.name,
                    phone: member.phone,
                    role: member.role,
                    unitId: member.unit_id,
                    unitName: (member.unit as any)?.name || '',
                    telegramChatId: member.telegram_chat_id,
                    telegramUsername: member.telegram_username,
                }
            };
        }

        // If we have a telegram chat_id (from Telegram auth)
        if (sessionData.chat_id) {
            const { data: session, error } = await supabase
                .from('intelink_sessions')
                .select('*')
                .eq('chat_id', sessionData.chat_id)
                .single();

            if (error || !session) {
                return { valid: false, error: 'Sessão não encontrada' };
            }

            // Get member by telegram chat_id
            const { data: member, error: memberError } = await supabase
                .from('intelink_unit_members')
                .select(`
                    id, name, phone, role, unit_id, telegram_chat_id, telegram_username,
                    unit:intelink_police_units(id, name)
                `)
                .eq('telegram_chat_id', sessionData.chat_id)
                .eq('active', true)
                .single();

            if (memberError || !member) {
                return { valid: false, error: 'Membro não encontrado para esta sessão' };
            }

            return {
                valid: true,
                user: {
                    memberId: member.id,
                    name: member.name,
                    phone: member.phone,
                    role: member.role,
                    unitId: member.unit_id,
                    unitName: (member.unit as any)?.name || '',
                    telegramChatId: member.telegram_chat_id,
                    telegramUsername: member.telegram_username,
                }
            };
        }

        return { valid: false, error: 'Formato de token inválido' };

    } catch (error) {
        console.error('[Session] Validation error:', error);
        return { valid: false, error: 'Erro ao validar sessão' };
    }
}

/**
 * Require authenticated session or return 401 error
 */
export async function requireAuth(request: NextRequest) {
    const result = await validateSession(request);
    
    if (!result.valid) {
        return {
            authorized: false,
            response: unauthorizedError(result.error || 'Não autorizado'),
            user: null,
        };
    }

    return {
        authorized: true,
        response: null,
        user: result.user!,
    };
}

/**
 * Check if user has specific role
 */
export function hasRole(user: SessionUser, roles: string[]): boolean {
    return roles.includes(user.role);
}

/**
 * Check if user is admin
 */
export function isAdmin(user: SessionUser): boolean {
    return hasRole(user, ['admin', 'superadmin']);
}

/**
 * Check if user belongs to specific unit
 */
export function belongsToUnit(user: SessionUser, unitId: string): boolean {
    return user.unitId === unitId;
}
