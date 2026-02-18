/**
 * API Security Middleware
 * 
 * Provides authentication and authorization for API routes
 * 
 * @version 1.1.0
 * @updated 2025-12-14
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from './api-utils';

// ===========================================
// TESTING MODE: Make all APIs permissive
// Uses NEXT_PUBLIC_TESTING_MODE env var (default: false in production)
// Set NEXT_PUBLIC_TESTING_MODE=true for local development
// ===========================================
const TESTING_MODE = process.env.NEXT_PUBLIC_TESTING_MODE === 'true';

// System roles hierarchy
const ROLE_HIERARCHY: Record<string, number> = {
    super_admin: 100,
    org_admin: 80,
    unit_admin: 60,
    member: 40,
    intern: 20,
    visitor: 10,
};

export interface AuthContext {
    memberId: string;
    memberName: string;
    systemRole: string;
    unitId: string;
    isAuthenticated: boolean;
}

/**
 * Extract auth context from request
 */
export async function getAuthContext(req: NextRequest): Promise<AuthContext | null> {
    const supabase = getSupabaseAdmin();
    let memberId: string | null = null;
    
    // Priority 1: HTTP-only cookie (most secure)
    const memberIdCookie = req.cookies.get('intelink_member_id')?.value;
    if (memberIdCookie && memberIdCookie.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        memberId = memberIdCookie;
    }
    
    // Priority 2: Session token cookie
    if (!memberId) {
        const sessionCookie = req.cookies.get('intelink_session')?.value;
        if (sessionCookie) {
            const { data: session } = await supabase
                .from('intelink_sessions')
                .select('member_id')
                .eq('access_token', sessionCookie)
                .single();
            
            if (session?.member_id) {
                memberId = session.member_id;
            }
        }
    }
    
    // Priority 3: Authorization header (for API clients)
    if (!memberId) {
        const authHeader = req.headers.get('Authorization');
        if (authHeader?.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            
            // Check if token is a UUID (member_id)
            if (token.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
                memberId = token;
            } else {
                // Try to find session by access_token
                const { data: session } = await supabase
                    .from('intelink_sessions')
                    .select('member_id')
                    .eq('access_token', token)
                    .single();
                
                if (session?.member_id) {
                    memberId = session.member_id;
                }
            }
        }
    }
    
    if (!memberId) {
        return null;
    }
    
    // Get member info
    const { data: member } = await supabase
        .from('intelink_unit_members')
        .select('id, name, system_role, unit_id')
        .eq('id', memberId)
        .single();
    
    if (!member) {
        return null;
    }
    
    return {
        memberId: member.id,
        memberName: member.name,
        systemRole: member.system_role || 'member',
        unitId: member.unit_id,
        isAuthenticated: true,
    };
}

/**
 * Check if user has minimum required role
 */
export function hasMinRole(userRole: string, requiredRole: string): boolean {
    const userLevel = ROLE_HIERARCHY[userRole] || 0;
    const requiredLevel = ROLE_HIERARCHY[requiredRole] || 100;
    return userLevel >= requiredLevel;
}

/**
 * Unauthorized response
 */
export function unauthorizedResponse(message: string = 'Não autorizado'): NextResponse {
    return NextResponse.json(
        { success: false, error: message, code: 'UNAUTHORIZED' },
        { status: 401 }
    );
}

/**
 * Forbidden response
 */
export function forbiddenResponse(message: string = 'Acesso negado'): NextResponse {
    return NextResponse.json(
        { success: false, error: message, code: 'FORBIDDEN' },
        { status: 403 }
    );
}

/**
 * Security wrapper for API routes
 * 
 * @param handler - The API route handler
 * @param options - Security options
 */
export function withSecurity(
    handler: (req: NextRequest, context: AuthContext) => Promise<NextResponse>,
    options: {
        requiredRole?: string;
        allowPublic?: boolean;
    } = {}
) {
    return async (req: NextRequest): Promise<NextResponse> => {
        const authContext = await getAuthContext(req);
        
        // TESTING MODE: Skip all auth checks
        if (TESTING_MODE) {
            return handler(req, authContext || {
                memberId: 'test-user',
                memberName: 'Test User',
                systemRole: 'member',
                unitId: '',
                isAuthenticated: true,
            });
        }
        
        // Check authentication
        if (!authContext && !options.allowPublic) {
            return unauthorizedResponse('Autenticação necessária');
        }
        
        // Check authorization (role)
        if (authContext && options.requiredRole) {
            if (!hasMinRole(authContext.systemRole, options.requiredRole)) {
                return forbiddenResponse(
                    `Nível de acesso insuficiente. Requerido: ${options.requiredRole}`
                );
            }
        }
        
        // Call handler with context
        return handler(req, authContext || {
            memberId: '',
            memberName: 'Anonymous',
            systemRole: 'visitor',
            unitId: '',
            isAuthenticated: false,
        });
    };
}

/**
 * Higher-order function for dynamic routes (with params)
 */
export function withSecurityParams<T extends { params: any }>(
    handler: (req: NextRequest, context: AuthContext, params: T['params']) => Promise<NextResponse>,
    options: {
        requiredRole?: string;
        allowPublic?: boolean;
    } = {}
) {
    return async (req: NextRequest, segmentData: T): Promise<NextResponse> => {
        const authContext = await getAuthContext(req);
        
        // TESTING MODE: Skip all auth checks
        if (TESTING_MODE) {
            return handler(req, authContext || {
                memberId: 'test-user',
                memberName: 'Test User',
                systemRole: 'member',
                unitId: '',
                isAuthenticated: true,
            }, segmentData.params);
        }
        
        if (!authContext && !options.allowPublic) {
            return unauthorizedResponse('Autenticação necessária');
        }
        
        if (authContext && options.requiredRole) {
            if (!hasMinRole(authContext.systemRole, options.requiredRole)) {
                return forbiddenResponse(
                    `Nível de acesso insuficiente. Requerido: ${options.requiredRole}`
                );
            }
        }
        
        return handler(req, authContext || {
            memberId: '',
            memberName: 'Anonymous',
            systemRole: 'visitor',
            unitId: '',
            isAuthenticated: false,
        }, segmentData.params);
    };
}
