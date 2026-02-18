/**
 * 🛡️ Security Middleware Module
 * 
 * Wrapper unificado para proteger API routes.
 * Combina: autenticação, rate limiting, validação, headers.
 * 
 * USO:
 * ```typescript
 * import { withSecurity } from '@/lib/security';
 * import { createInvestigationSchema } from '@/lib/validations';
 * 
 * async function handler(request: NextRequest, context: SecureContext) {
 *   const { user, body } = context;
 *   // user já está autenticado
 *   // body já foi validado com Zod
 * }
 * 
 * export const POST = withSecurity(handler, {
 *   auth: true,
 *   rateLimit: 'llm',
 *   validation: createInvestigationSchema,
 * });
 * ```
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, SessionUser } from './auth';
import { checkRateLimit, tooManyRequestsResponse, RATE_LIMITS, RateLimitConfig } from './rate-limit';
import { validateRequestBody } from './validation';
import { addSecurityHeaders } from './headers';
import { logAuditEventAsync, extractRequestInfo, AuditAction } from './audit';
import { validationError } from '../api-utils';

// ============================================
// TYPES
// ============================================

export interface SecurityConfig<T extends z.ZodType = z.ZodType> {
    /** Requer autenticação (default: true) */
    auth?: boolean;
    /** Roles permitidas (se auth=true) */
    roles?: string[];
    /** Rate limit preset ou config customizada */
    rateLimit?: keyof typeof RATE_LIMITS | RateLimitConfig | false;
    /** Schema Zod para validar body (se presente) */
    validation?: T;
    /** Ação para auditoria (se presente, loga automaticamente) */
    audit?: AuditAction;
}

export interface SecureContext<T = unknown> {
    /** Usuário autenticado (se auth=true) */
    user: SessionUser | null;
    /** Body validado (se validation presente) */
    body: T;
    /** Request info extraído */
    requestInfo: {
        ipAddress: string;
        userAgent: string;
    };
}

export type SecureHandler<T = unknown> = (
    request: NextRequest,
    context: SecureContext<T>
) => Promise<NextResponse> | NextResponse;

// ============================================
// MAIN WRAPPER
// ============================================

/**
 * Wrapper de segurança para API routes
 * 
 * Aplica automaticamente:
 * 1. Rate limiting (se configurado)
 * 2. Autenticação (se auth=true)
 * 3. Validação de body (se schema presente)
 * 4. Headers de segurança
 * 5. Auditoria (se action presente)
 */
export function withSecurity<T extends z.ZodType>(
    handler: SecureHandler<z.infer<T>>,
    config: SecurityConfig<T> = {}
) {
    return async (request: NextRequest): Promise<NextResponse> => {
        const {
            auth = true,
            roles,
            rateLimit = 'default',
            validation,
            audit,
        } = config;

        const requestInfo = extractRequestInfo(request);
        let user: SessionUser | null = null;
        let body: z.infer<T> | null = null;

        try {
            // 1. Rate Limiting
            if (rateLimit !== false) {
                const limitConfig = typeof rateLimit === 'string'
                    ? RATE_LIMITS[rateLimit]
                    : rateLimit;
                    
                const limitResult = checkRateLimit(request, limitConfig);
                if (!limitResult.allowed) {
                    return tooManyRequestsResponse(limitResult.retryAfter);
                }
            }

            // 2. Authentication
            if (auth) {
                const authResult = await requireAuth(request);
                if (!authResult.authorized) {
                    return authResult.response!;
                }
                user = authResult.user;

                // Check roles if specified
                if (roles && roles.length > 0 && user) {
                    if (!roles.includes(user.role)) {
                        return NextResponse.json(
                            { error: 'Acesso negado. Permissão insuficiente.' },
                            { status: 403 }
                        );
                    }
                }
            }

            // 3. Validation
            if (validation) {
                const validationResult = await validateRequestBody(request, validation);
                if (!validationResult.success) {
                    return validationError(validationResult.error);
                }
                body = validationResult.data;
            }

            // 4. Execute handler
            const context: SecureContext<z.infer<T>> = {
                user,
                body: body as z.infer<T>,
                requestInfo,
            };

            const response = await handler(request, context);

            // 5. Audit logging (async, non-blocking)
            if (audit && user) {
                logAuditEventAsync({
                    action: audit,
                    userId: user.memberId,
                    ipAddress: requestInfo.ipAddress,
                    userAgent: requestInfo.userAgent,
                });
            }

            // 6. Add security headers
            return addSecurityHeaders(response);

        } catch (error) {
            console.error('[Security Middleware] Error:', error);
            return addSecurityHeaders(
                NextResponse.json(
                    { error: 'Erro interno do servidor' },
                    { status: 500 }
                )
            );
        }
    };
}

// ============================================
// PRESET WRAPPERS
// ============================================

/**
 * Wrapper para endpoints públicos (sem auth, com rate limit)
 */
export function withPublic<T extends z.ZodType>(
    handler: SecureHandler<z.infer<T>>,
    validation?: T
) {
    return withSecurity(handler, {
        auth: false,
        rateLimit: 'default',
        validation,
    });
}

/**
 * Wrapper para endpoints de autenticação
 */
export function withAuth<T extends z.ZodType>(
    handler: SecureHandler<z.infer<T>>,
    validation?: T
) {
    return withSecurity(handler, {
        auth: false, // Auth endpoints don't require prior auth
        rateLimit: 'auth',
        validation,
    });
}

/**
 * Wrapper para endpoints de LLM/Chat
 */
export function withLLM<T extends z.ZodType>(
    handler: SecureHandler<z.infer<T>>,
    validation?: T
) {
    return withSecurity(handler, {
        auth: true,
        rateLimit: 'llm',
        validation,
    });
}

/**
 * Wrapper para endpoints de upload
 */
export function withUpload<T extends z.ZodType>(
    handler: SecureHandler<z.infer<T>>,
    validation?: T
) {
    return withSecurity(handler, {
        auth: true,
        rateLimit: 'upload',
        validation,
    });
}

/**
 * Wrapper para endpoints admin-only
 */
export function withAdmin<T extends z.ZodType>(
    handler: SecureHandler<z.infer<T>>,
    validation?: T
) {
    return withSecurity(handler, {
        auth: true,
        roles: ['admin', 'superadmin'],
        rateLimit: 'default',
        validation,
    });
}
