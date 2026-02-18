/**
 * Auth System v2.0 - Constants
 * 
 * All auth-related configuration in one place
 */

// ============================================================================
// TOKEN EXPIRATION
// ============================================================================

/** Access token lifetime in seconds (8 hours - better UX for investigators) */
export const ACCESS_TOKEN_EXPIRY_SECONDS = 8 * 60 * 60;

/** Refresh token lifetime in seconds (7 days) */
export const REFRESH_TOKEN_EXPIRY_SECONDS = 7 * 24 * 60 * 60;

/** Remember me session lifetime in seconds (30 days) */
export const REMEMBER_ME_EXPIRY_SECONDS = 30 * 24 * 60 * 60;

/** OTP code lifetime in seconds (5 minutes) */
export const OTP_EXPIRY_SECONDS = 5 * 60;

/** Password reset code lifetime in seconds (7 days) */
export const RESET_CODE_EXPIRY_SECONDS = 7 * 24 * 60 * 60;

// ============================================================================
// SECURITY
// ============================================================================

/** bcrypt salt rounds (higher = slower but more secure) */
export const BCRYPT_SALT_ROUNDS = 12;

/** Max failed login attempts before lockout */
export const MAX_FAILED_ATTEMPTS = 5;

/** Account lockout duration in minutes */
export const LOCKOUT_DURATION_MINUTES = 15;

/** JWT algorithm */
export const JWT_ALGORITHM = 'HS256' as const;

// ============================================================================
// RATE LIMITING
// ============================================================================

/** Max login attempts per IP per minute */
export const LOGIN_RATE_LIMIT = 5;

/** Max OTP requests per phone per hour */
export const OTP_RATE_LIMIT = 3;

/** Max password reset requests per email per hour */
export const RESET_RATE_LIMIT = 3;

// ============================================================================
// COOKIES
// ============================================================================

export const COOKIE_NAMES = {
    ACCESS_TOKEN: 'intelink_access',
    REFRESH_TOKEN: 'intelink_refresh',
    MEMBER_ID: 'intelink_member_id',
    SESSION: 'intelink_session',
} as const;

export const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
};

// ============================================================================
// VALIDATION
// ============================================================================

/** Minimum password length */
export const MIN_PASSWORD_LENGTH = 6;

/** Maximum password length */
export const MAX_PASSWORD_LENGTH = 128;

/** Phone regex (Brazilian format: 11 digits) */
export const PHONE_REGEX = /^\d{11}$/;

/** OTP regex (6 digits) */
export const OTP_REGEX = /^\d{6}$/;

/** Reset code regex (ABC123 format) */
export const RESET_CODE_REGEX = /^[A-Z]{3}[0-9]{3}$/;

// ============================================================================
// ERROR MESSAGES
// ============================================================================

export const AUTH_ERRORS = {
    INVALID_CREDENTIALS: 'Credenciais inválidas. Verifique telefone e senha.',
    ACCOUNT_LOCKED: 'Conta bloqueada temporariamente. Tente novamente em {minutes} minutos.',
    INVALID_OTP: 'Código OTP inválido ou expirado.',
    OTP_EXPIRED: 'Código OTP expirado. Solicite um novo.',
    SESSION_EXPIRED: 'Sessão expirada. Faça login novamente.',
    INVALID_TOKEN: 'Token inválido ou expirado.',
    PHONE_NOT_FOUND: 'Telefone não encontrado. Verifique o número.',
    PASSWORD_TOO_SHORT: `Senha deve ter no mínimo ${MIN_PASSWORD_LENGTH} caracteres.`,
    PASSWORD_TOO_LONG: `Senha deve ter no máximo ${MAX_PASSWORD_LENGTH} caracteres.`,
    PASSWORDS_DONT_MATCH: 'As senhas não coincidem.',
    INVALID_RESET_CODE: 'Código de recuperação inválido ou expirado.',
    TOO_MANY_ATTEMPTS: 'Muitas tentativas. Aguarde antes de tentar novamente.',
    NETWORK_ERROR: 'Erro de conexão. Verifique sua internet.',
    SERVER_ERROR: 'Erro interno. Tente novamente mais tarde.',
} as const;

// ============================================================================
// SUCCESS MESSAGES
// ============================================================================

export const AUTH_SUCCESS = {
    LOGIN: 'Login realizado com sucesso!',
    LOGOUT: 'Logout realizado com sucesso.',
    PASSWORD_RESET: 'Senha alterada com sucesso!',
    OTP_SENT: 'Código enviado para seu Telegram.',
    RESET_CODE_SENT: 'Código de recuperação enviado.',
} as const;
