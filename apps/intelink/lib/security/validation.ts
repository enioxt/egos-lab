/**
 * 🔍 Validation Module
 * 
 * Re-exporta schemas Zod do validations.ts e adiciona helpers.
 * 
 * USO:
 * ```typescript
 * import { validateBody, schemas } from '@/lib/security';
 * 
 * const result = await validateBody(request, schemas.createInvestigation);
 * if (!result.success) return validationError(result.error);
 * ```
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';

// Re-export all schemas from central validations file
export * from '../validations';

// ============================================
// ENHANCED HELPERS
// ============================================

/**
 * Valida body da requisição com schema Zod
 * Retorna tipagem correta
 */
export async function validateRequestBody<T extends z.ZodType>(
    request: NextRequest,
    schema: T
): Promise<
    | { success: true; data: z.infer<T> }
    | { success: false; error: string; details?: z.ZodIssue[] }
> {
    try {
        const body = await request.json();
        const result = schema.safeParse(body);

        if (!result.success) {
            return {
                success: false,
                error: result.error.issues[0]?.message || 'Dados inválidos',
                details: result.error.issues,
            };
        }

        return { success: true, data: result.data };
    } catch {
        return { success: false, error: 'JSON inválido no corpo da requisição' };
    }
}

/**
 * Valida query params com schema Zod
 */
export function validateRequestQuery<T extends z.ZodType>(
    request: NextRequest,
    schema: T
): { success: true; data: z.infer<T> } | { success: false; error: string } {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    const result = schema.safeParse(params);

    if (!result.success) {
        return {
            success: false,
            error: result.error.issues[0]?.message || 'Parâmetros inválidos',
        };
    }

    return { success: true, data: result.data };
}

/**
 * Valida path params (ex: /api/investigation/[id])
 */
export function validatePathParams<T extends z.ZodType>(
    params: Record<string, string>,
    schema: T
): { success: true; data: z.infer<T> } | { success: false; error: string } {
    const result = schema.safeParse(params);

    if (!result.success) {
        return {
            success: false,
            error: result.error.issues[0]?.message || 'Parâmetros de rota inválidos',
        };
    }

    return { success: true, data: result.data };
}

// ============================================
// COMMON PARAM SCHEMAS
// ============================================

export const idParamSchema = z.object({
    id: z.string().uuid({ message: 'ID inválido' }),
});

export const sessionIdParamSchema = z.object({
    sessionId: z.string().uuid({ message: 'ID de sessão inválido' }),
});

// ============================================
// SANITIZATION HELPERS
// ============================================

/**
 * Remove tags HTML perigosas
 */
export function sanitizeHtml(input: string): string {
    return input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        .replace(/on\w+="[^"]*"/gi, '')
        .replace(/on\w+='[^']*'/gi, '');
}

/**
 * Escapa caracteres especiais para SQL (defense in depth)
 */
export function escapeSqlString(input: string): string {
    return input.replace(/'/g, "''");
}

/**
 * Remove caracteres de controle
 */
export function sanitizeInput(input: string): string {
    // Remove caracteres de controle exceto newlines e tabs
    return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}
