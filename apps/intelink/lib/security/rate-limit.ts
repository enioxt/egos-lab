/**
 * 🚦 Rate Limiting Module
 * 
 * Controla taxa de requisições por IP/usuário.
 * Usa memória em dev e pode ser expandido para Redis em produção.
 * 
 * USO:
 * ```typescript
 * import { checkRateLimit, RATE_LIMITS } from '@/lib/security';
 * 
 * const result = checkRateLimit(request, RATE_LIMITS.llm);
 * if (!result.allowed) return tooManyRequestsError(result.retryAfter);
 * ```
 */

import { NextRequest, NextResponse } from 'next/server';

// ============================================
// TYPES
// ============================================

export interface RateLimitConfig {
    /** Máximo de requisições permitidas */
    requests: number;
    /** Janela de tempo em segundos */
    windowSeconds: number;
    /** Identificador único para este limite */
    name: string;
}

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetAt: Date;
    retryAfter?: number;
}

// ============================================
// PRESETS
// ============================================

export const RATE_LIMITS = {
    /** Endpoints de autenticação: 5 req/min */
    auth: {
        name: 'auth',
        requests: 5,
        windowSeconds: 60,
    },
    /** Endpoints de chat/LLM: 10 req/min */
    llm: {
        name: 'llm',
        requests: 10,
        windowSeconds: 60,
    },
    /** Upload de documentos: 20 req/min */
    upload: {
        name: 'upload',
        requests: 20,
        windowSeconds: 60,
    },
    /** Webhooks (Telegram): 100 req/min */
    webhook: {
        name: 'webhook',
        requests: 100,
        windowSeconds: 60,
    },
    /** Default: 60 req/min */
    default: {
        name: 'default',
        requests: 60,
        windowSeconds: 60,
    },
} as const satisfies Record<string, RateLimitConfig>;

// ============================================
// IN-MEMORY STORE
// ============================================

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

// Map: `${ip}:${limitName}` -> entry
const store = new Map<string, RateLimitEntry>();

// Limpar entradas expiradas a cada 5 minutos
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
        if (entry.resetAt < now) {
            store.delete(key);
        }
    }
}, 5 * 60 * 1000);

// ============================================
// MAIN FUNCTION
// ============================================

/**
 * Verifica rate limit para uma requisição
 */
export function checkRateLimit(
    request: NextRequest,
    config: RateLimitConfig = RATE_LIMITS.default
): RateLimitResult {
    const ip = getClientIP(request);
    const key = `${ip}:${config.name}`;
    const now = Date.now();
    
    let entry = store.get(key);
    
    // Se não existe ou expirou, criar nova entrada
    if (!entry || entry.resetAt < now) {
        entry = {
            count: 0,
            resetAt: now + (config.windowSeconds * 1000),
        };
    }
    
    // Incrementar contador
    entry.count++;
    store.set(key, entry);
    
    const remaining = Math.max(0, config.requests - entry.count);
    const resetAt = new Date(entry.resetAt);
    
    if (entry.count > config.requests) {
        return {
            allowed: false,
            remaining: 0,
            resetAt,
            retryAfter: Math.ceil((entry.resetAt - now) / 1000),
        };
    }
    
    return {
        allowed: true,
        remaining,
        resetAt,
    };
}

/**
 * Resposta 429 Too Many Requests
 */
export function tooManyRequestsResponse(retryAfter: number = 60): NextResponse {
    return NextResponse.json(
        {
            error: 'Muitas requisições. Tente novamente em alguns segundos.',
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter,
        },
        {
            status: 429,
            headers: {
                'Retry-After': String(retryAfter),
            },
        }
    );
}

// ============================================
// HELPERS
// ============================================

function getClientIP(request: NextRequest): string {
    // Vercel/Cloudflare headers
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }
    
    const realIP = request.headers.get('x-real-ip');
    if (realIP) {
        return realIP;
    }
    
    // Fallback
    return 'unknown';
}

/**
 * Adiciona headers de rate limit na resposta
 */
export function addRateLimitHeaders(
    response: NextResponse,
    result: RateLimitResult,
    config: RateLimitConfig
): NextResponse {
    response.headers.set('X-RateLimit-Limit', String(config.requests));
    response.headers.set('X-RateLimit-Remaining', String(result.remaining));
    response.headers.set('X-RateLimit-Reset', String(Math.floor(result.resetAt.getTime() / 1000)));
    
    return response;
}
