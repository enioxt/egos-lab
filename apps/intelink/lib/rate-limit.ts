/**
 * Rate Limiter - INTELINK
 * 
 * Proteção contra abuse de APIs
 * Implementação in-memory (para MVP)
 * 
 * Para produção, considere Upstash Redis ou similar
 */

import { NextResponse } from 'next/server';
import { logger } from './logger';

// ============================================
// TYPES
// ============================================

export interface RateLimitConfig {
    /** Número máximo de requests */
    limit: number;
    /** Janela de tempo em segundos */
    windowSeconds: number;
    /** Identificador customizado (default: IP) */
    keyPrefix?: string;
}

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

// ============================================
// IN-MEMORY STORE
// ============================================

const store = new Map<string, RateLimitEntry>();

// Cleanup de entradas expiradas a cada 5 minutos
if (typeof setInterval !== 'undefined') {
    setInterval(() => {
        const now = Date.now();
        for (const [key, entry] of store.entries()) {
            if (entry.resetAt < now) {
                store.delete(key);
            }
        }
    }, 5 * 60 * 1000);
}

// ============================================
// RATE LIMIT FUNCTION
// ============================================

export interface RateLimitResult {
    success: boolean;
    limit: number;
    remaining: number;
    resetAt: number;
}

/**
 * Verifica rate limit para uma chave
 */
export function checkRateLimit(
    key: string,
    config: RateLimitConfig
): RateLimitResult {
    const now = Date.now();
    const windowMs = config.windowSeconds * 1000;
    const fullKey = config.keyPrefix ? `${config.keyPrefix}:${key}` : key;

    let entry = store.get(fullKey);

    // Nova entrada ou expirada
    if (!entry || entry.resetAt < now) {
        entry = {
            count: 1,
            resetAt: now + windowMs,
        };
        store.set(fullKey, entry);
        
        return {
            success: true,
            limit: config.limit,
            remaining: config.limit - 1,
            resetAt: entry.resetAt,
        };
    }

    // Incrementar contador
    entry.count++;
    store.set(fullKey, entry);

    const remaining = Math.max(0, config.limit - entry.count);
    const success = entry.count <= config.limit;

    if (!success) {
        logger.warn('Rate limit exceeded', {
            key: fullKey,
            count: entry.count,
            limit: config.limit,
        });
    }

    return {
        success,
        limit: config.limit,
        remaining,
        resetAt: entry.resetAt,
    };
}

// ============================================
// PRESET CONFIGURATIONS
// ============================================

export const RATE_LIMITS = {
    /** APIs públicas: 60 req/min */
    public: { limit: 60, windowSeconds: 60 },
    
    /** APIs autenticadas: 120 req/min */
    authenticated: { limit: 120, windowSeconds: 60 },
    
    /** APIs de chat/LLM: 30 req/min */
    chat: { limit: 30, windowSeconds: 60 },
    
    /** Análises pesadas (Cross-case, Relatórios): 5 req/min */
    llm_analysis: { limit: 5, windowSeconds: 60 },
    
    /** Upload de documentos: 10 req/min */
    upload: { limit: 10, windowSeconds: 60 },
    
    /** Auth endpoints: 5 req/min (prevenção brute force) */
    auth: { limit: 5, windowSeconds: 60 },
    
    /** Webhook do Telegram: 200 req/min */
    webhook: { limit: 200, windowSeconds: 60 },
} as const;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Extrai IP do request
 */
export function getClientIP(request: Request): string {
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }
    
    const realIP = request.headers.get('x-real-ip');
    if (realIP) {
        return realIP;
    }
    
    return 'unknown';
}

/**
 * Cria headers de rate limit para response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
    return {
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': Math.ceil(result.resetAt / 1000).toString(),
    };
}

// ============================================
// RESPONSE HELPER
// ============================================

/**
 * Retorna response 429 Too Many Requests
 */
export function rateLimitExceeded(result: RateLimitResult): NextResponse {
    const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
    
    return NextResponse.json(
        {
            success: false,
            error: 'Muitas requisições. Tente novamente em alguns segundos.',
            retryAfter,
        },
        {
            status: 429,
            headers: {
                ...getRateLimitHeaders(result),
                'Retry-After': retryAfter.toString(),
            },
        }
    );
}

// ============================================
// MIDDLEWARE WRAPPER
// ============================================

/**
 * Wrapper para aplicar rate limit em API routes
 * 
 * @example
 * export const GET = withRateLimit(
 *     async (req) => { ... },
 *     RATE_LIMITS.public
 * );
 */
export function withRateLimit<T extends Response>(
    handler: (request: Request) => Promise<T>,
    config: RateLimitConfig = RATE_LIMITS.public
): (request: Request) => Promise<T | NextResponse> {
    return async (request: Request): Promise<T | NextResponse> => {
        const ip = getClientIP(request);
        const url = new URL(request.url);
        const key = `${ip}:${url.pathname}`;
        
        const result = checkRateLimit(key, config);
        
        if (!result.success) {
            return rateLimitExceeded(result);
        }
        
        // Executar handler e adicionar headers
        const response = await handler(request);
        
        // Adicionar headers de rate limit
        const headers = getRateLimitHeaders(result);
        for (const [name, value] of Object.entries(headers)) {
            response.headers.set(name, value);
        }
        
        return response;
    };
}

// ============================================
// STATISTICS
// ============================================

/**
 * Retorna estatísticas do rate limiter (para debugging)
 */
export function getRateLimitStats(): {
    totalKeys: number;
    activeKeys: number;
    memoryUsage: number;
} {
    const now = Date.now();
    let activeKeys = 0;
    
    for (const entry of store.values()) {
        if (entry.resetAt > now) {
            activeKeys++;
        }
    }
    
    return {
        totalKeys: store.size,
        activeKeys,
        memoryUsage: store.size * 100, // Estimativa em bytes
    };
}

export default { checkRateLimit, withRateLimit, RATE_LIMITS };
