/**
 * 🔐 Authentication Module
 * 
 * Gerencia autenticação e validação de sessões.
 * 
 * USO:
 * ```typescript
 * import { validateSession, requireAuth } from '@/lib/security';
 * 
 * const { authorized, user } = await requireAuth(request);
 * if (!authorized) return unauthorizedError();
 * ```
 */

import { NextRequest } from 'next/server';
import { getSupabaseAdmin, unauthorizedError } from '../api-utils';

// ============================================
// TYPES
// ============================================

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

// ============================================
// SESSION VALIDATION
// ============================================

/**
 * Valida sessão a partir do request
 * 
 * Busca token em:
 * 1. Header x-session-token (definido pelo middleware)
 * 2. Header Authorization: Bearer
 * 3. Cookie intelink_session
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

        // Parse token - could be JWT, JSON, or direct UUID
        let sessionData: any = null;

        // Try to parse as JSON (localStorage format)
        try {
            sessionData = JSON.parse(token);
        } catch {
            // Not JSON - check if it's a valid UUID (member_id directly)
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (uuidRegex.test(token)) {
                // Direct member_id passed as token
                sessionData = { member_id: token };
            } else {
                // Unknown format, treat as session ID
                sessionData = { sessionId: token };
            }
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
                user: mapMemberToUser(member)
            };
        }

        // If we have a telegram chat_id (from Telegram auth)
        if (sessionData.chat_id) {
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
                user: mapMemberToUser(member)
            };
        }

        return { valid: false, error: 'Formato de token inválido' };

    } catch (error) {
        console.error('[Security/Auth] Validation error:', error);
        return { valid: false, error: 'Erro ao validar sessão' };
    }
}

/**
 * Requer sessão autenticada ou retorna erro 401
 */
export async function requireAuth(request: NextRequest) {
    const result = await validateSession(request);
    
    if (!result.valid) {
        return {
            authorized: false,
            response: unauthorizedError(result.error || 'Não autorizado'),
            user: null as SessionUser | null,
        };
    }

    return {
        authorized: true,
        response: null,
        user: result.user!,
    };
}

// ============================================
// ROLE HELPERS
// ============================================

/**
 * Verifica se usuário tem uma das roles especificadas
 */
export function hasRole(user: SessionUser, roles: string[]): boolean {
    return roles.includes(user.role);
}

/**
 * Verifica se usuário é admin
 */
export function isAdmin(user: SessionUser): boolean {
    return hasRole(user, ['admin', 'superadmin']);
}

/**
 * Verifica se usuário pertence a uma unidade específica
 */
export function belongsToUnit(user: SessionUser, unitId: string): boolean {
    return user.unitId === unitId;
}

// ============================================
// INTERNAL HELPERS
// ============================================

function mapMemberToUser(member: any): SessionUser {
    return {
        memberId: member.id,
        name: member.name,
        phone: member.phone,
        role: member.role,
        unitId: member.unit_id,
        unitName: (member.unit as any)?.name || '',
        telegramChatId: member.telegram_chat_id,
        telegramUsername: member.telegram_username,
    };
}
