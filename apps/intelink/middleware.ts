/**
 * Authentication Middleware for Intelink (Next.js 16)
 * 
 * Auth v2.0 - Uses JWT tokens in HTTP-only cookies
 * Fixed: 2025-12-16 - Function renamed from proxy() to middleware()
 * 
 * Protects all routes except:
 * - /login (new login page)
 * - /auth (legacy - redirects to /login)
 * - /api/auth/* (authentication endpoints)
 * - /api/v2/auth/* (new auth endpoints)
 * - /api/health (health check)
 * - /api/telegram/* (telegram webhooks)
 * - /_next/* (Next.js assets)
 * - /favicon.ico, /manifest.json
 */

import { NextResponse, type NextRequest } from 'next/server';

// Cookie names for Auth v2.0
const ACCESS_TOKEN_COOKIE = 'intelink_access';
const LEGACY_SESSION_COOKIE = 'intelink_session';

// Routes that don't require authentication
const PUBLIC_ROUTES = [
    '/login',  // New login page (v2)
    '/auth',   // Legacy login (will redirect)
    '/api/auth',
    '/api/v2/auth', // New auth endpoints
    '/api/health',
    '/api/telegram',
    '/api/predictions', // Widget panels (auth handled by route)
    '/_next',
    '/favicon.ico',
    '/manifest.json',
    '/sw.js',    // Service worker
    '/offline',  // Offline page
    '/icons',
];

// API routes that require authentication
const PROTECTED_API_ROUTES = [
    '/api/admin',       // Admin endpoints (roles verified in route)
    '/api/documents',
    '/api/investigation',
    '/api/investigations',
    '/api/chat',
    '/api/entities',
    '/api/entity',
    '/api/central',
    '/api/stats',
    '/api/findings',
    '/api/members',
    '/api/units',
    '/api/report',
    '/api/activities',
    '/api/notifications',
    '/api/jobs',
    '/api/intelink',
    '/api/analysis',
    '/api/analytics',
    '/api/audio',
    '/api/audit',
    '/api/compliance',
    '/api/debate',
    '/api/gamification',
];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    
    // Allow public routes
    for (const route of PUBLIC_ROUTES) {
        if (pathname.startsWith(route)) {
            return NextResponse.next();
        }
    }

    // Redirect legacy /intelink/* routes to correct paths
    if (pathname.startsWith('/intelink/')) {
        const newPath = pathname.replace('/intelink', '');
        const redirectUrl = new URL(newPath || '/', request.url);
        console.log(`[Middleware] Legacy route redirect: ${pathname} -> ${newPath || '/'}`);
        return NextResponse.redirect(redirectUrl, 301);
    }

    // Redirect /auth to /login (migration to v2)
    if (pathname === '/auth' || pathname.startsWith('/auth/')) {
        const loginUrl = new URL('/login', request.url);
        // Preserve return URL if present
        const returnUrl = request.nextUrl.searchParams.get('returnUrl');
        if (returnUrl) {
            loginUrl.searchParams.set('returnUrl', returnUrl);
        }
        return NextResponse.redirect(loginUrl);
    }

    // Check for session token (v2 JWT or legacy)
    const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
    const legacyToken = request.cookies.get(LEGACY_SESSION_COOKIE)?.value;
    const authHeader = request.headers.get('Authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') 
        ? authHeader.slice(7) 
        : null;

    // Accept any valid token (v2 takes priority)
    const token = accessToken || legacyToken || bearerToken;

    // Special routes within protected paths that handle their own auth
    const SELF_AUTH_ROUTES = [
        '/predictions', // Widget panels handle own auth
    ];
    
    // Check if this is a self-auth route (let route handler decide)
    const isSelfAuthRoute = SELF_AUTH_ROUTES.some(r => pathname.includes(r));
    if (isSelfAuthRoute) {
        return NextResponse.next();
    }

    // For API routes, require authentication
    for (const route of PROTECTED_API_ROUTES) {
        if (pathname.startsWith(route)) {
            if (!token) {
                return NextResponse.json(
                    { error: 'Não autorizado. Faça login para continuar.' },
                    { status: 401 }
                );
            }
            // Token exists, add it to request headers for downstream validation
            const requestHeaders = new Headers(request.headers);
            requestHeaders.set('x-session-token', token);
            
            return NextResponse.next({
                request: {
                    headers: requestHeaders,
                },
            });
        }
    }

    // For page routes (not API), check session and redirect to login if needed
    if (!token && !pathname.startsWith('/api/')) {
        // Allow access to login page
        if (pathname === '/login' || pathname.startsWith('/login')) {
            return NextResponse.next();
        }
        
        // Redirect to login with return URL
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('returnUrl', pathname);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
