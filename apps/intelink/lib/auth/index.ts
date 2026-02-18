/**
 * Auth System v2.0 - Public Exports
 * 
 * Import from '@/lib/auth' for all auth-related functionality
 * 
 * @example
 * import { verifySession, hashPassword, logLogin } from '@/lib/auth';
 */

// Types
export * from './types';

// Constants
export * from './constants';

// JWT Module
export {
    generateAccessToken,
    generateRefreshToken,
    generateTokenPair,
    verifyAccessToken,
    verifyRefreshToken,
    rotateTokens,
    decodeToken,
    isTokenExpired,
    getTokenExpiration,
    shouldRefreshToken,
} from './jwt';

// Session Module
export {
    createSession,
    verifySession,
    refreshSession,
    revokeSession,
    revokeAllSessions,
    setAuthCookies,
    clearAuthCookies,
    getAccessTokenFromRequest,
    getRefreshTokenFromRequest,
    getCurrentSession,
    requireAuth,
    requireRole,
} from './session';

// Password Module
export {
    hashPassword,
    verifyPassword,
    validatePassword,
    generateOTP,
    getOTPExpiry,
    isOTPExpired,
    generateAccessCode,
    getAccessCodeExpiry,
    isAccessCodeExpired,
    isValidAccessCodeFormat,
    shouldLockAccount,
    getLockoutExpiry,
    isAccountLocked,
    getRemainingLockoutMinutes,
    generateRememberToken,
    getRememberTokenExpiry,
    isRememberTokenExpired,
} from './password';

// Audit Module
export {
    logAuditEvent,
    logLogin,
    logLoginFailed,
    logLogout,
    logPasswordResetRequested,
    logPasswordResetCompleted,
    logOtpSent,
    logOtpVerified,
    logSessionRefreshed,
    logSessionRevoked,
    logAccountLocked,
    getMemberAuditLogs,
    getRecentFailedLogins,
    getClientIP,
    getUserAgent,
    getAuditContext,
} from './audit';

// Frontend Hooks
export {
    useAuth,
    useRequireAuth,
    useRequireAdmin,
} from './hooks';
