/**
 * API Utilities - Centralized helpers for API routes
 * 
 * Provides:
 * - Shared Supabase client (service role)
 * - Error handling utilities
 * - Response helpers
 * - Input validation helpers
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// ============================================
// SUPABASE CLIENT (SINGLETON)
// ============================================

let supabaseAdmin: SupabaseClient | null = null;

/**
 * Get Supabase client with service role (for API routes)
 * Uses singleton pattern to avoid multiple connections
 */
export function getSupabaseAdmin(): SupabaseClient {
    if (!supabaseAdmin) {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!url || !key) {
            throw new Error('Supabase environment variables not configured');
        }

        supabaseAdmin = createClient(url, key, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });
    }
    return supabaseAdmin;
}

// ============================================
// ERROR HANDLING
// ============================================

export interface ApiError {
    code: string;
    message: string;
    details?: any;
}

/**
 * Standard API error response
 */
export function errorResponse(
    message: string,
    status: number = 500,
    code: string = 'INTERNAL_ERROR',
    details?: any
): NextResponse {
    const error: ApiError = { code, message };
    if (details) error.details = details;

    console.error(`[API Error] ${code}: ${message}`, details || '');

    return NextResponse.json({ error }, { status });
}

/**
 * Validation error response (400)
 */
export function validationError(message: string, details?: any): NextResponse {
    return errorResponse(message, 400, 'VALIDATION_ERROR', details);
}

/**
 * Not found error response (404)
 */
export function notFoundError(resource: string): NextResponse {
    return errorResponse(`${resource} não encontrado`, 404, 'NOT_FOUND');
}

/**
 * Unauthorized error response (401)
 */
export function unauthorizedError(message: string = 'Não autorizado'): NextResponse {
    return errorResponse(message, 401, 'UNAUTHORIZED');
}

/**
 * Forbidden error response (403)
 */
export function forbiddenError(message: string = 'Acesso negado'): NextResponse {
    return errorResponse(message, 403, 'FORBIDDEN');
}

// ============================================
// SUCCESS RESPONSES
// ============================================

/**
 * Standard success response
 */
export function successResponse<T>(data: T, status: number = 200): NextResponse {
    return NextResponse.json({ success: true, ...data }, { status });
}

/**
 * Created response (201)
 */
export function createdResponse<T>(data: T): NextResponse {
    return NextResponse.json({ success: true, ...data }, { status: 201 });
}

// ============================================
// INPUT VALIDATION HELPERS
// ============================================

/**
 * Check if a value is a valid UUID
 */
export function isValidUUID(value: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
}

/**
 * Parse and validate integer from string
 */
export function parseIntSafe(value: string | null, defaultValue: number): number {
    if (!value) return defaultValue;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Parse boolean from string
 */
export function parseBoolSafe(value: string | null, defaultValue: boolean): boolean {
    if (!value) return defaultValue;
    return value.toLowerCase() === 'true';
}

/**
 * Validate required fields in request body
 */
export function validateRequired(
    body: Record<string, any>,
    requiredFields: string[]
): { valid: boolean; missing: string[] } {
    const missing = requiredFields.filter(field => {
        const value = body[field];
        return value === undefined || value === null || value === '';
    });

    return {
        valid: missing.length === 0,
        missing
    };
}

// ============================================
// LOGGING
// ============================================

/**
 * Log API request with context
 */
export function logRequest(
    method: string,
    path: string,
    context?: Record<string, any>
): void {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${method} ${path}`, context || '');
}

/**
 * Log API error with context
 */
export function logError(
    method: string,
    path: string,
    error: any
): void {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] ERROR ${method} ${path}:`, error);
}

// ============================================
// CONSTANTS
// ============================================

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export const API_VERSION = '1.0.0';
