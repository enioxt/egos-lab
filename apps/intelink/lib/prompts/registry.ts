/**
 * INTELINK Prompt Registry
 * 
 * Registro programático de todos os system prompts.
 * Permite descoberta, versionamento e monitoramento.
 * 
 * @version 1.0.0
 * @updated 2025-12-14
 */

export interface PromptConfig {
    id: string;
    name: string;
    description: string;
    version: string;
    category: 'chat' | 'extraction' | 'analysis' | 'journey' | 'reports' | 'documents';
    model: string;
    temperature: number;
    maxTokens: number;
    status: 'active' | 'pending' | 'deprecated';
    filePath: string;
    apiRoutes: string[];
}

/**
 * Central registry of all system prompts
 */
export const PROMPT_REGISTRY: PromptConfig[] = [
    // ============================================
    // CHAT PROMPTS
    // ============================================
    {
        id: 'chat.main',
        name: 'INTELINK System Prompt',
        description: 'Prompt principal do assistente de inteligência policial',
        version: '5.0.0',
        category: 'chat',
        model: 'google/gemini-2.0-flash-001',
        temperature: 0.4,
        maxTokens: 8000,
        status: 'active',
        filePath: 'lib/prompts/chat/intelink-system.ts',
        apiRoutes: ['/api/chat'],
    },
    {
        id: 'chat.vision',
        name: 'Vision Analysis',
        description: 'Análise de imagens para investigações',
        version: '1.0.0',
        category: 'chat',
        model: 'google/gemini-2.0-flash-001',
        temperature: 0.3,
        maxTokens: 2000,
        status: 'active',
        filePath: 'lib/prompts/chat/vision.ts',
        apiRoutes: ['/api/chat/vision'],
    },
    {
        id: 'chat.debate',
        name: 'Tsun-Cha Debate',
        description: 'Modo debate dialético para questionar hipóteses',
        version: '1.0.0',
        category: 'chat',
        model: 'google/gemini-2.0-flash-001',
        temperature: 0.6,
        maxTokens: 4000,
        status: 'active',
        filePath: 'lib/prompts/chat/debate.ts',
        apiRoutes: ['/api/debate'],
    },
    
    // ============================================
    // DOCUMENTS PROMPTS
    // ============================================
    {
        id: 'documents.guardian',
        name: 'Guardian AI',
        description: 'Verificação de entidades perdidas e correções antes de salvar',
        version: '1.0.0',
        category: 'extraction',
        model: 'google/gemini-2.0-flash-001',
        temperature: 0,
        maxTokens: 1000,
        status: 'active',
        filePath: 'lib/prompts/documents/guardian.ts',
        apiRoutes: ['/api/documents/guardian'],
    },
    
    // ============================================
    // EXTRACTION PROMPTS
    // ============================================
    {
        id: 'extraction.reds',
        name: 'REDS Extraction',
        description: 'Extração de entidades de Boletins de Ocorrência',
        version: '3.0.0',
        category: 'extraction',
        model: 'google/gemini-2.0-flash-001',
        temperature: 0.1,
        maxTokens: 4000,
        status: 'active',
        filePath: 'lib/prompts/extraction/reds.ts',
        apiRoutes: ['/api/documents/extract', '/api/documents/batch'],
    },
    {
        id: 'extraction.cs',
        name: 'Comunicação de Serviço',
        description: 'Extração de entidades de Comunicações de Serviço',
        version: '2.0.0',
        category: 'extraction',
        model: 'google/gemini-2.0-flash-001',
        temperature: 0.1,
        maxTokens: 4000,
        status: 'active',
        filePath: 'lib/prompts/extraction/comunicacao.ts',
        apiRoutes: ['/api/documents/extract'],
    },
    
    // ============================================
    // ANALYSIS PROMPTS
    // ============================================
    {
        id: 'analysis.operation',
        name: 'Análise de Operação',
        description: 'Análise completa de uma operação com artigos criminais, riscos e diligências',
        version: '1.1.0',
        category: 'analysis',
        model: 'google/gemini-2.0-flash-001',
        temperature: 0.3,
        maxTokens: 6000,
        status: 'active',
        filePath: 'lib/prompts/analysis/operation.ts',
        apiRoutes: ['/api/investigation/analyze', '/api/jobs/analyze'],
    },
    {
        id: 'analysis.entity',
        name: 'Síntese de Entidade',
        description: 'Geração de narrativa sobre uma entidade e suas conexões',
        version: '1.0.0',
        category: 'analysis',
        model: 'google/gemini-2.0-flash-001',
        temperature: 0.4,
        maxTokens: 3000,
        status: 'active',
        filePath: 'lib/prompts/analysis/entity-synthesis.ts',
        apiRoutes: ['/api/intelligence/dossier'],
    },
    
    // ============================================
    // JOURNEY PROMPTS
    // ============================================
    {
        id: 'journey.analyst',
        name: 'Journey Analyst',
        description: 'Análise do trajeto investigativo para encontrar conexões perdidas',
        version: '1.0.0',
        category: 'journey',
        model: 'google/gemini-2.0-flash-001',
        temperature: 0.3,
        maxTokens: 4000,
        status: 'active',
        filePath: 'lib/prompts/journey/analyst.ts',
        apiRoutes: ['/api/intelligence/journey'],
    },
    
    // ============================================
    // REPORT PROMPTS
    // ============================================
    {
        id: 'report.intelligence',
        name: 'Relatório de Inteligência',
        description: 'Geração de relatório completo de inteligência policial',
        version: '1.0.0',
        category: 'reports',
        model: 'google/gemini-2.0-flash-001',
        temperature: 0.2,
        maxTokens: 8000,
        status: 'active',
        filePath: 'lib/prompts/reports/intelligence.ts',
        apiRoutes: ['/api/report', '/api/investigation/[id]/report'],
    },
    {
        id: 'report.dossier',
        name: 'Dossiê de Alvo',
        description: 'Geração de dossiê detalhado sobre um alvo específico',
        version: '1.0.0',
        category: 'reports',
        model: 'google/gemini-2.0-flash-001',
        temperature: 0.2,
        maxTokens: 6000,
        status: 'active',
        filePath: 'lib/prompts/reports/dossier.ts',
        apiRoutes: ['/api/intelligence/dossier'],
    },
    
    // ============================================
    // DOCUMENT EXTRACTION PROMPTS
    // ============================================
    {
        id: 'documents.extraction',
        name: 'Document Extraction',
        description: 'Extrai entidades, evidências e relacionamentos de documentos policiais (REDS, CS, etc)',
        version: '2.0.0',
        category: 'documents',
        model: 'google/gemini-2.5-flash',
        temperature: 0.0,
        maxTokens: 16000,
        status: 'active',
        filePath: 'lib/prompts/documents/extraction.ts',
        apiRoutes: ['/api/documents/extract', '/api/documents/batch'],
    },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get a prompt config by ID
 */
export function getPromptConfig(id: string): PromptConfig | undefined {
    return PROMPT_REGISTRY.find(p => p.id === id);
}

/**
 * Get all prompts in a category
 */
export function getPromptsByCategory(category: PromptConfig['category']): PromptConfig[] {
    return PROMPT_REGISTRY.filter(p => p.category === category);
}

/**
 * Get all active prompts
 */
export function getActivePrompts(): PromptConfig[] {
    return PROMPT_REGISTRY.filter(p => p.status === 'active');
}

/**
 * Get prompts used by an API route
 */
export function getPromptsForRoute(route: string): PromptConfig[] {
    return PROMPT_REGISTRY.filter(p => p.apiRoutes.includes(route));
}

/**
 * Generate a summary of all prompts
 */
export function getPromptSummary(): Record<string, number> {
    const summary: Record<string, number> = {
        total: PROMPT_REGISTRY.length,
        active: 0,
        pending: 0,
        deprecated: 0,
    };
    
    PROMPT_REGISTRY.forEach(p => {
        summary[p.status]++;
    });
    
    return summary;
}
