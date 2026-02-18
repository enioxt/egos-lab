/**
 * 🔒 Security Headers Module
 * 
 * Headers de segurança padrão para todas as respostas.
 * 
 * USO:
 * ```typescript
 * import { addSecurityHeaders } from '@/lib/security';
 * 
 * return addSecurityHeaders(NextResponse.json(data));
 * ```
 */

import { NextResponse } from 'next/server';

// ============================================
// SECURITY HEADERS
// ============================================

export const SECURITY_HEADERS = {
    /** Previne clickjacking */
    'X-Frame-Options': 'DENY',
    
    /** Previne MIME sniffing */
    'X-Content-Type-Options': 'nosniff',
    
    /** Controla informações do referrer */
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    /** Previne XSS em navegadores antigos */
    'X-XSS-Protection': '1; mode=block',
    
    /** Força HTTPS */
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    
    /** Controla recursos que podem ser carregados */
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
} as const;

// ============================================
// CSP (Content Security Policy)
// ============================================

export const CSP_DIRECTIVES = {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Next.js requires these
    'style-src': ["'self'", "'unsafe-inline'"], // Tailwind requires inline styles
    'img-src': ["'self'", 'data:', 'https:'],
    'font-src': ["'self'"],
    'connect-src': [
        "'self'",
        'https://openrouter.ai',
        'https://*.supabase.co',
        'wss://*.supabase.co',
    ],
    'frame-ancestors': ["'none'"],
    'form-action': ["'self'"],
    'base-uri': ["'self'"],
} as const;

/**
 * Gera string CSP a partir das diretivas
 */
export function buildCSP(): string {
    return Object.entries(CSP_DIRECTIVES)
        .map(([key, values]) => `${key} ${values.join(' ')}`)
        .join('; ');
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Adiciona headers de segurança a uma resposta
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
    Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
        response.headers.set(key, value);
    });
    
    return response;
}

/**
 * Adiciona CSP header
 */
export function addCSPHeader(response: NextResponse): NextResponse {
    response.headers.set('Content-Security-Policy', buildCSP());
    return response;
}

/**
 * Adiciona todos os headers de segurança (recomendado)
 */
export function addAllSecurityHeaders(response: NextResponse): NextResponse {
    addSecurityHeaders(response);
    // CSP pode quebrar funcionalidades, usar com cuidado
    // addCSPHeader(response);
    return response;
}

// ============================================
// CORS HELPERS
// ============================================

const ALLOWED_ORIGINS = [
    'https://intelink.app',
    'https://www.intelink.app',
    process.env.NEXT_PUBLIC_APP_URL,
].filter(Boolean) as string[];

/**
 * Verifica se origin é permitido
 */
export function isOriginAllowed(origin: string | null): boolean {
    if (!origin) return false;
    
    // Em desenvolvimento, permitir localhost
    if (process.env.NODE_ENV === 'development') {
        if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
            return true;
        }
    }
    
    return ALLOWED_ORIGINS.includes(origin);
}

/**
 * Adiciona headers CORS
 */
export function addCorsHeaders(
    response: NextResponse,
    origin: string | null
): NextResponse {
    if (origin && isOriginAllowed(origin)) {
        response.headers.set('Access-Control-Allow-Origin', origin);
        response.headers.set('Access-Control-Allow-Credentials', 'true');
        response.headers.set(
            'Access-Control-Allow-Methods',
            'GET, POST, PUT, DELETE, PATCH, OPTIONS'
        );
        response.headers.set(
            'Access-Control-Allow-Headers',
            'Content-Type, Authorization, X-Session-Token'
        );
    }
    
    return response;
}
