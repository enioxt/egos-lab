/**
 * 🛡️ INTELINK SECURITY MODULE - State of the Art
 * 
 * Módulo centralizado de segurança. TODO sistema deve usar estas funções.
 * 
 * ARQUITETURA:
 * ┌─────────────────────────────────────────────────────────────┐
 * │                    SECURITY MODULE                          │
 * ├─────────────────────────────────────────────────────────────┤
 * │  auth.ts         → Autenticação e sessões                   │
 * │  rate-limit.ts   → Controle de taxa de requisições          │
 * │  validation.ts   → Validação de inputs (Zod)                │
 * │  headers.ts      → Headers de segurança                     │
 * │  audit.ts        → Auditoria de ações                       │
 * │  middleware.ts   → Wrappers para API routes                 │
 * └─────────────────────────────────────────────────────────────┘
 * 
 * USO:
 * ```typescript
 * import { withSecurity, SecurityConfig } from '@/lib/security';
 * 
 * export const POST = withSecurity(handler, {
 *   auth: true,
 *   rateLimit: { requests: 10, window: '1m' },
 *   validation: myZodSchema,
 * });
 * ```
 * 
 * @module security
 * @version 1.0.0
 * @author Intelink Team
 */

// Re-export all security modules
export * from './auth';
export * from './rate-limit';
export * from './validation';
export * from './headers';
export * from './audit';
export * from './middleware';

// Export types
export type { SecurityConfig, SecureHandler } from './middleware';
export type { SessionUser, SessionValidationResult } from './auth';
export type { RateLimitConfig, RateLimitResult } from './rate-limit';
export type { AuditEvent, AuditAction } from './audit';
