/**
 * Auth System v2.0 - Audit Module
 * 
 * Logs all authentication events for security monitoring
 * Stores in auth_audit_log table
 */

import { createClient } from '@supabase/supabase-js';
import type { AuditAction, AuditLogEntry } from './types';

// ============================================================================
// SUPABASE CLIENT
// ============================================================================

const getSupabase = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    return createClient(supabaseUrl, supabaseKey);
};

// ============================================================================
// AUDIT LOGGING
// ============================================================================

export interface AuditLogOptions {
    memberId?: string;
    action: AuditAction;
    success: boolean;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
}

/**
 * Log an authentication event
 */
export async function logAuditEvent(options: AuditLogOptions): Promise<void> {
    const supabase = getSupabase();

    try {
        await supabase.from('auth_audit_log').insert({
            member_id: options.memberId || null,
            action: options.action,
            success: options.success,
            ip_address: options.ipAddress || null,
            user_agent: options.userAgent || null,
            metadata: options.metadata || null,
        });
    } catch (error) {
        // Don't throw - audit logging should never break the main flow
        console.error('[Audit] Failed to log event:', error);
    }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Extract IP address from request
 */
export function getClientIP(request: Request): string | undefined {
    // Try various headers
    const forwardedFor = request.headers.get('x-forwarded-for');
    if (forwardedFor) {
        return forwardedFor.split(',')[0].trim();
    }

    const realIP = request.headers.get('x-real-ip');
    if (realIP) return realIP;

    const cfConnectingIP = request.headers.get('cf-connecting-ip');
    if (cfConnectingIP) return cfConnectingIP;

    return undefined;
}

/**
 * Extract user agent from request
 */
export function getUserAgent(request: Request): string | undefined {
    return request.headers.get('user-agent') || undefined;
}

/**
 * Create audit context from request
 */
export function getAuditContext(request: Request): { ipAddress?: string; userAgent?: string } {
    return {
        ipAddress: getClientIP(request),
        userAgent: getUserAgent(request),
    };
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Log successful login
 */
export async function logLogin(memberId: string, request: Request, metadata?: Record<string, unknown>): Promise<void> {
    const context = getAuditContext(request);
    await logAuditEvent({
        memberId,
        action: 'login',
        success: true,
        ...context,
        metadata,
    });
}

/**
 * Log failed login
 */
export async function logLoginFailed(
    identifier: string, 
    request: Request, 
    reason: string
): Promise<void> {
    const context = getAuditContext(request);
    await logAuditEvent({
        action: 'login_failed',
        success: false,
        ...context,
        metadata: { identifier, reason },
    });
}

/**
 * Log logout
 */
export async function logLogout(memberId: string, request: Request): Promise<void> {
    const context = getAuditContext(request);
    await logAuditEvent({
        memberId,
        action: 'logout',
        success: true,
        ...context,
    });
}

/**
 * Log password reset request
 */
export async function logPasswordResetRequested(
    memberId: string | undefined, 
    identifier: string,
    request: Request,
    method: 'email' | 'telegram'
): Promise<void> {
    const context = getAuditContext(request);
    await logAuditEvent({
        memberId,
        action: 'password_reset_requested',
        success: true,
        ...context,
        metadata: { identifier, method },
    });
}

/**
 * Log password reset completion
 */
export async function logPasswordResetCompleted(memberId: string, request: Request): Promise<void> {
    const context = getAuditContext(request);
    await logAuditEvent({
        memberId,
        action: 'password_reset_completed',
        success: true,
        ...context,
    });
}

/**
 * Log OTP sent
 */
export async function logOtpSent(memberId: string, request: Request, method: 'telegram' | 'email'): Promise<void> {
    const context = getAuditContext(request);
    await logAuditEvent({
        memberId,
        action: 'otp_sent',
        success: true,
        ...context,
        metadata: { method },
    });
}

/**
 * Log OTP verification
 */
export async function logOtpVerified(memberId: string, request: Request, success: boolean): Promise<void> {
    const context = getAuditContext(request);
    await logAuditEvent({
        memberId,
        action: success ? 'otp_verified' : 'otp_failed',
        success,
        ...context,
    });
}

/**
 * Log session refresh
 */
export async function logSessionRefreshed(memberId: string, sessionId: string): Promise<void> {
    await logAuditEvent({
        memberId,
        action: 'session_refreshed',
        success: true,
        metadata: { sessionId },
    });
}

/**
 * Log session revocation
 */
export async function logSessionRevoked(memberId: string, sessionId: string, reason: string): Promise<void> {
    await logAuditEvent({
        memberId,
        action: 'session_revoked',
        success: true,
        metadata: { sessionId, reason },
    });
}

/**
 * Log account lockout
 */
export async function logAccountLocked(memberId: string, request: Request, failedAttempts: number): Promise<void> {
    const context = getAuditContext(request);
    await logAuditEvent({
        memberId,
        action: 'account_locked',
        success: true,
        ...context,
        metadata: { failedAttempts },
    });
}

// ============================================================================
// QUERY FUNCTIONS
// ============================================================================

/**
 * Get recent audit logs for a member
 */
export async function getMemberAuditLogs(memberId: string, limit = 50): Promise<AuditLogEntry[]> {
    const supabase = getSupabase();

    const { data, error } = await supabase
        .from('auth_audit_log')
        .select('*')
        .eq('member_id', memberId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('[Audit] Query error:', error);
        return [];
    }

    return data.map(row => ({
        id: row.id,
        memberId: row.member_id,
        action: row.action as AuditAction,
        success: row.success,
        ipAddress: row.ip_address,
        userAgent: row.user_agent,
        metadata: row.metadata,
        createdAt: new Date(row.created_at),
    }));
}

/**
 * Get recent failed login attempts (for security monitoring)
 */
export async function getRecentFailedLogins(hours = 24, limit = 100): Promise<AuditLogEntry[]> {
    const supabase = getSupabase();
    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
        .from('auth_audit_log')
        .select('*')
        .eq('action', 'login_failed')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('[Audit] Query error:', error);
        return [];
    }

    return data.map(row => ({
        id: row.id,
        memberId: row.member_id,
        action: row.action as AuditAction,
        success: row.success,
        ipAddress: row.ip_address,
        userAgent: row.user_agent,
        metadata: row.metadata,
        createdAt: new Date(row.created_at),
    }));
}
