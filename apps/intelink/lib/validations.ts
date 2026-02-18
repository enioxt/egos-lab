/**
 * Zod Validation Schemas para APIs Intelink
 * 
 * Schemas centralizados para validação de requests
 * Mensagens em PT-BR para consistência
 */

import { z } from 'zod';

// ============================================
// PRIMITIVOS REUTILIZÁVEIS
// ============================================

export const uuidSchema = z.string().uuid({ message: 'ID inválido' });

export const phoneSchema = z.string()
    .min(10, 'Telefone deve ter no mínimo 10 dígitos')
    .max(15, 'Telefone deve ter no máximo 15 dígitos')
    .regex(/^\d+$/, 'Telefone deve conter apenas números');

export const paginationSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ============================================
// AUTH SCHEMAS
// ============================================

export const authPhoneSchema = z.object({
    phone: phoneSchema,
    password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres').optional(),
    otp: z.string().length(6, 'OTP deve ter 6 dígitos').optional(),
    step: z.enum(['check', 'password', 'otp'], {}).optional(),
    rememberMe: z.boolean().optional().default(false),
});

export const authRememberSchema = z.object({
    remember_token: z.string().min(1, 'Token é obrigatório'),
});

// ============================================
// INVESTIGATION SCHEMAS
// ============================================

export const createInvestigationSchema = z.object({
    title: z.string().min(3, 'Título deve ter no mínimo 3 caracteres'),
    description: z.string().optional(),
    status: z.enum(['active', 'closed', 'archived'], {}).default('active'),
    unit_id: uuidSchema.optional(),
});

export const updateInvestigationSchema = createInvestigationSchema.partial();

// ============================================
// ENTITY SCHEMAS
// ============================================

export const entityTypeSchema = z.enum(
    ['PERSON', 'VEHICLE', 'LOCATION', 'PHONE', 'COMPANY', 'ORGANIZATION', 'FIREARM'], {}
);

export const createEntitySchema = z.object({
    name: z.string().min(1, 'Nome é obrigatório'),
    type: entityTypeSchema,
    investigation_id: uuidSchema,
    metadata: z.record(z.string(), z.unknown()).optional(),
});

// ============================================
// DOCUMENT SCHEMAS
// ============================================

export const fileTypeSchema = z.enum(['pdf', 'docx', 'txt', 'image'], {});

export const uploadDocumentSchema = z.object({
    investigation_id: uuidSchema,
    file_name: z.string().min(1, 'Nome do arquivo é obrigatório'),
    file_type: fileTypeSchema,
    content: z.string().optional(),
});

export const batchDocumentSchema = z.object({
    investigation_id: uuidSchema,
    documents: z.array(z.object({
        file_name: z.string(),
        content: z.string(),
    })).min(1, 'Pelo menos 1 documento é necessário').max(5, 'Máximo 5 documentos por vez'),
});

// ============================================
// CHAT SCHEMAS
// ============================================

export const createSessionSchema = z.object({
    title: z.string().min(1, 'Título é obrigatório').optional(),
    mode: z.enum(['investigation', 'central', 'general'], {}).default('general'),
    investigation_id: uuidSchema.optional(),
});

export const sendMessageSchema = z.object({
    session_id: uuidSchema,
    content: z.string().min(1, 'Mensagem não pode ser vazia'),
    role: z.enum(['user', 'assistant'], {}).default('user'),
});

export const shareSessionSchema = z.object({
    session_id: uuidSchema,
    member_ids: z.array(uuidSchema).min(1, 'Selecione pelo menos 1 membro'),
    can_interact: z.boolean().default(false),
});

// ============================================
// REPORT SCHEMAS
// ============================================

export const generateReportSchema = z.object({
    content: z.string().min(1, 'Conteúdo é obrigatório'),
    title: z.string().optional(),
    investigationId: uuidSchema.optional(),
    format: z.enum(['markdown', 'html'], {}).default('markdown'),
});

// ============================================
// MEMBER/UNIT SCHEMAS
// ============================================

export const createMemberSchema = z.object({
    name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
    phone: phoneSchema,
    role: z.enum(['admin', 'analyst', 'viewer'], {}).default('analyst'),
    unit_id: uuidSchema,
});

export const updateMemberRoleSchema = z.object({
    member_id: uuidSchema,
    role: z.enum(['admin', 'analyst', 'viewer'], {}),
});

// ============================================
// GRAPH ANALYSIS SCHEMAS
// ============================================

export const graphActionSchema = z.enum(['shortest-path', 'centrality', 'stats', 'neighborhood', 'all-paths'], {});

export const graphAnalysisSchema = z.object({
    action: graphActionSchema,
    investigation_ids: z.array(uuidSchema).optional(),
    params: z.record(z.string(), z.unknown()).optional(),
});

// ============================================
// CROSS-CASE SCHEMAS
// ============================================

export const crossCaseQuerySchema = z.object({
    min_appearances: z.coerce.number().int().min(2).default(2),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ============================================
// HELPER: Validate Request Body
// ============================================

export async function validateBody<T extends z.ZodType>(
    request: Request,
    schema: T
): Promise<{ success: true; data: z.infer<T> } | { success: false; error: string }> {
    try {
        const body = await request.json();
        const result = schema.safeParse(body);
        
        if (!result.success) {
            const firstError = result.error.issues[0];
            return {
                success: false,
                error: firstError?.message || 'Dados inválidos',
            };
        }
        
        return { success: true, data: result.data };
    } catch {
        return { success: false, error: 'JSON inválido no corpo da requisição' };
    }
}

// ============================================
// HELPER: Validate Query Params
// ============================================

export function validateQuery<T extends z.ZodType>(
    searchParams: URLSearchParams,
    schema: T
): { success: true; data: z.infer<T> } | { success: false; error: string } {
    const params = Object.fromEntries(searchParams.entries());
    const result = schema.safeParse(params);
    
    if (!result.success) {
        const firstError = result.error.issues[0];
        return {
            success: false,
            error: firstError?.message || 'Parâmetros inválidos',
        };
    }
    
    return { success: true, data: result.data };
}

// ============================================
// TYPES EXPORT
// ============================================

export type AuthPhoneInput = z.infer<typeof authPhoneSchema>;
export type CreateInvestigationInput = z.infer<typeof createInvestigationSchema>;
export type CreateEntityInput = z.infer<typeof createEntitySchema>;
export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type ShareSessionInput = z.infer<typeof shareSessionSchema>;
export type GenerateReportInput = z.infer<typeof generateReportSchema>;
export type GraphAnalysisInput = z.infer<typeof graphAnalysisSchema>;
