/**
 * Auth System v2.0 - Password Module
 * 
 * Secure password hashing and verification using bcrypt
 * Also handles OTP and access code generation
 */

import bcrypt from 'bcryptjs';
import { 
    BCRYPT_SALT_ROUNDS, 
    OTP_EXPIRY_SECONDS,
    RESET_CODE_EXPIRY_SECONDS,
    MAX_FAILED_ATTEMPTS,
    LOCKOUT_DURATION_MINUTES,
    MIN_PASSWORD_LENGTH,
    MAX_PASSWORD_LENGTH,
} from './constants';

// ============================================================================
// PASSWORD HASHING
// ============================================================================

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): { valid: boolean; error?: string } {
    if (!password || password.length < MIN_PASSWORD_LENGTH) {
        return { valid: false, error: `Senha deve ter no mínimo ${MIN_PASSWORD_LENGTH} caracteres` };
    }
    
    if (password.length > MAX_PASSWORD_LENGTH) {
        return { valid: false, error: `Senha deve ter no máximo ${MAX_PASSWORD_LENGTH} caracteres` };
    }

    // Optional: Add more rules (uppercase, numbers, symbols)
    // For now, just length check for usability

    return { valid: true };
}

// ============================================================================
// OTP (One-Time Password)
// ============================================================================

/**
 * Generate a 6-digit OTP code
 */
export function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Get OTP expiration timestamp
 */
export function getOTPExpiry(): Date {
    return new Date(Date.now() + OTP_EXPIRY_SECONDS * 1000);
}

/**
 * Check if OTP is expired
 */
export function isOTPExpired(expiresAt: Date | string): boolean {
    const expiry = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
    return new Date() > expiry;
}

// ============================================================================
// ACCESS CODE (ABC123 format)
// ============================================================================

/**
 * Generate an access code in ABC123 format
 * Used for: First login, password recovery via admin
 */
export function generateAccessCode(): string {
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Removed confusing I, O
    const numbers = '0123456789';
    
    let code = '';
    
    // 3 random letters
    for (let i = 0; i < 3; i++) {
        code += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    
    // 3 random numbers
    for (let i = 0; i < 3; i++) {
        code += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }
    
    return code;
}

/**
 * Get access code expiration timestamp (7 days)
 */
export function getAccessCodeExpiry(): Date {
    return new Date(Date.now() + RESET_CODE_EXPIRY_SECONDS * 1000);
}

/**
 * Check if access code is expired
 */
export function isAccessCodeExpired(expiresAt: Date | string): boolean {
    const expiry = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
    return new Date() > expiry;
}

/**
 * Validate access code format (ABC123)
 */
export function isValidAccessCodeFormat(code: string): boolean {
    return /^[A-Z]{3}[0-9]{3}$/.test(code.toUpperCase());
}

// ============================================================================
// ACCOUNT LOCKOUT
// ============================================================================

/**
 * Check if account should be locked
 */
export function shouldLockAccount(failedAttempts: number): boolean {
    return failedAttempts >= MAX_FAILED_ATTEMPTS;
}

/**
 * Get lockout expiration timestamp
 */
export function getLockoutExpiry(): Date {
    return new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000);
}

/**
 * Check if account is currently locked
 */
export function isAccountLocked(lockedUntil: Date | string | null): boolean {
    if (!lockedUntil) return false;
    const lockExpiry = typeof lockedUntil === 'string' ? new Date(lockedUntil) : lockedUntil;
    return new Date() < lockExpiry;
}

/**
 * Get remaining lockout time in minutes
 */
export function getRemainingLockoutMinutes(lockedUntil: Date | string): number {
    const lockExpiry = typeof lockedUntil === 'string' ? new Date(lockedUntil) : lockedUntil;
    const remaining = lockExpiry.getTime() - Date.now();
    return Math.max(0, Math.ceil(remaining / (60 * 1000)));
}

// ============================================================================
// REMEMBER TOKEN
// ============================================================================

/**
 * Generate a remember token (for "Remember me" functionality)
 */
export function generateRememberToken(): string {
    // Use crypto.randomUUID for better randomness
    return crypto.randomUUID();
}

/**
 * Get remember token expiration (30 days)
 */
export function getRememberTokenExpiry(): Date {
    return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
}

/**
 * Check if remember token is expired
 */
export function isRememberTokenExpired(expiresAt: Date | string | null): boolean {
    if (!expiresAt) return true;
    const expiry = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
    return new Date() > expiry;
}
