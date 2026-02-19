/**
 * Auth System v2.0 - Type Definitions
 * 
 * Enterprise-grade authentication types for INTELINK
 * Single Source of Truth: member_id (UUID) is the only identifier
 */

// ============================================================================
// ROLES
// ============================================================================

/** Functional role within the unit (job title) */
export type MemberRole =
    | 'delegado'      // Head of unit
    | 'escrivao'      // Administrative staff
    | 'investigador'  // Field investigator
    | 'analista'      // Intelligence analyst
    | 'estagiario';   // Intern

/** System-wide permission level */
export type SystemRole =
    | 'super_admin'   // Full system access
    | 'unit_admin'    // Unit-level admin
    | 'member'        // Regular member
    | 'visitor'       // Read-only access
    | 'intern';       // Limited access (estagiário)

// ============================================================================
// MEMBER
// ============================================================================

export interface Member {
    /** UUID - PRIMARY IDENTIFIER (no more fake chat_ids!) */
    id: string;

    /** Display name */
    name: string;

    /** Brazilian phone (11 digits, normalized) */
    phone: string;

    /** Email for notifications */
    email?: string;

    /** Functional role */
    role: MemberRole;

    /** System permission level */
    systemRole: SystemRole;

    /** Unit UUID */
    unitId: string;

    /** Unit name (for display) */
    unitName?: string;

    /** Telegram chat ID (optional, for 2FA) */
    telegramChatId?: number;

    /** Telegram username */
    telegramUsername?: string;

    /** Account creation date */
    createdAt?: Date;
}

// ============================================================================
// SESSION
// ============================================================================

export interface Session {
    /** Session UUID */
    id: string;

    /** Member UUID (foreign key) */
    memberId: string;

    /** JWT access token (short-lived, 15-60 min) */
    accessToken: string;

    /** Refresh token (long-lived, 7-30 days) */
    refreshToken?: string;

    /** Access token expiration */
    expiresAt: Date;

    /** Member data (populated from join) */
    member: Member;

    /** Device/browser info */
    deviceInfo?: SessionDeviceInfo;

    /** Last activity timestamp */
    lastActivityAt?: Date;
}

export interface SessionDeviceInfo {
    userAgent: string;
    ip?: string;
    location?: string;
}

// ============================================================================
// AUTH STATE (Frontend)
// ============================================================================

export interface AuthState {
    /** Is user authenticated? */
    isAuthenticated: boolean;

    /** Is auth check in progress? */
    isLoading: boolean;

    /** Current session (if authenticated) */
    session: Session | null;

    /** Error message (if any) */
    error: string | null;
}

// ============================================================================
// API REQUEST/RESPONSE
// ============================================================================

export interface LoginRequest {
    /** Brazilian phone (will be normalized) */
    phone: string;

    /** Password */
    password: string;

    /** Keep session for 30 days */
    rememberMe?: boolean;
}

export interface LoginResponse {
    success: boolean;

    /** Session data (if login successful) */
    session?: Session;

    /** Requires 2FA OTP? */
    requiresOtp?: boolean;

    /** OTP sent to (masked) */
    otpSentTo?: string;

    /** Error message */
    error?: string;

    /** Remaining login attempts */
    remainingAttempts?: number;

    /** Account locked until */
    lockedUntil?: Date;
}

export interface OtpRequest {
    /** Member phone */
    phone: string;

    /** 6-digit OTP code */
    otp: string;

    /** Original password (for session creation) */
    password: string;

    /** Keep session for 30 days */
    rememberMe?: boolean;
}

export interface OtpResponse {
    success: boolean;
    session?: Session;
    error?: string;
}

export interface RefreshRequest {
    /** Refresh token (from cookie or body) */
    refreshToken: string;
}

export interface RefreshResponse {
    success: boolean;

    /** New access token */
    accessToken?: string;

    /** New refresh token (rotation) */
    refreshToken?: string;

    /** New expiration */
    expiresAt?: Date;

    error?: string;
}

export interface VerifyResponse {
    /** Is session valid? */
    valid: boolean;

    /** Session data (if valid) */
    session?: Session;

    /** Should refresh? (token expiring soon) */
    shouldRefresh?: boolean;
}

// ============================================================================
// PASSWORD
// ============================================================================

export interface ForgotPasswordRequest {
    /** Phone or email */
    identifier: string;
}

export interface ForgotPasswordResponse {
    success: boolean;

    /** Code sent to (masked) */
    sentTo?: string;

    /** Delivery method */
    method?: 'email' | 'telegram' | 'whatsapp_manual';

    error?: string;
}

export interface ResetPasswordRequest {
    /** Reset code (ABC123 format) */
    code: string;

    /** New password */
    newPassword: string;

    /** Confirm new password */
    confirmPassword: string;
}

export interface ResetPasswordResponse {
    success: boolean;
    error?: string;
}

// ============================================================================
// AUDIT
// ============================================================================

export type AuditAction =
    | 'login'
    | 'logout'
    | 'login_failed'
    | 'password_reset_requested'
    | 'password_reset_completed'
    | 'otp_sent'
    | 'otp_verified'
    | 'otp_failed'
    | 'session_refreshed'
    | 'session_revoked'
    | 'account_locked'
    | 'account_unlocked';

export interface AuditLogEntry {
    id: string;
    memberId?: string;
    action: AuditAction;
    success: boolean;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
    createdAt: Date;
}

// ============================================================================
// PERMISSIONS
// ============================================================================

export type Permission =
    | 'admin:manage_users'
    | 'admin:manage_units'
    | 'admin:view_audit'
    | 'admin:manage_settings'
    | 'investigation:create'
    | 'investigation:edit'
    | 'investigation:delete'
    | 'investigation:view'
    | 'entity:create'
    | 'entity:edit'
    | 'entity:delete'
    | 'entity:merge'
    | 'report:create'
    | 'report:export'
    | 'chat:access'
    | 'graph:view'
    | 'graph:edit';

/** Permission matrix by system role */
export const ROLE_PERMISSIONS: Record<SystemRole, Permission[]> = {
    super_admin: [
        'admin:manage_users',
        'admin:manage_units',
        'admin:view_audit',
        'admin:manage_settings',
        'investigation:create',
        'investigation:edit',
        'investigation:delete',
        'investigation:view',
        'entity:create',
        'entity:edit',
        'entity:delete',
        'entity:merge',
        'report:create',
        'report:export',
        'chat:access',
        'graph:view',
        'graph:edit',
    ],
    unit_admin: [
        'admin:manage_users',
        'admin:view_audit',
        'investigation:create',
        'investigation:edit',
        'investigation:delete',
        'investigation:view',
        'entity:create',
        'entity:edit',
        'entity:delete',
        'entity:merge',
        'report:create',
        'report:export',
        'chat:access',
        'graph:view',
        'graph:edit',
    ],
    member: [
        'investigation:create',
        'investigation:edit',
        'investigation:view',
        'entity:create',
        'entity:edit',
        'report:create',
        'report:export',
        'chat:access',
        'graph:view',
        'graph:edit',
    ],
    visitor: [
        'investigation:create',
        'investigation:edit',
        'investigation:view',
        'entity:create',
        'entity:edit',
        'report:create',
        'report:export',
        'chat:access',
        'graph:view',
        'graph:edit',
    ],
    intern: [
        'investigation:view',
        'entity:create',
        'graph:view',
    ],
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: SystemRole, permission: Permission): boolean {
    return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Check if a role can access admin pages
 */
export function canAccessAdmin(role: SystemRole): boolean {
    return ['super_admin', 'unit_admin'].includes(role);
}

/**
 * Get display name for role
 */
export function getRoleDisplayName(role: MemberRole | SystemRole): string {
    const names: Record<string, string> = {
        // Member roles
        delegado: 'Delegado(a)',
        escrivao: 'Escrivão(ã)',
        investigador: 'Investigador(a)',
        analista: 'Analista',
        estagiario: 'Estagiário(a)',
        // System roles
        super_admin: 'Super Admin',
        unit_admin: 'Admin da Unidade',
        member: 'Membro',
        visitor: 'Visitante',
        intern: 'Estagiário',
    };
    return names[role] || role;
}
