/**
 * 🦅 Eagle Eye — Idea Patterns Bank
 * 
 * 17 patterns across 3 detection strategies:
 * - Strategy A (12): Keyword search via /gazettes?querystring=
 * - Strategy B (2):  Themed search via /gazettes/by_theme/{theme}
 * - Strategy C (3):  AI semantic analysis (post-fetch)
 * 
 * Sources: 13 idea files from docs/plans/
 */

import type { OpportunityPattern } from '@egos-lab/shared';

// ═══════════════════════════════════════════════════════════
// STRATEGY A — Keyword Search (querystring parameter)
// ═══════════════════════════════════════════════════════════

export const KEYWORD_PATTERNS: OpportunityPattern[] = [
    // ── Tier 1: High Relevance (Direct Legislative Match) ──
    {
        id: 'PROC-001',
        name: 'Public Procurement',
        name_pt: 'Licitações e Compras Públicas',
        tier: 1,
        strategy: 'keyword',
        keywords: ['licitação', 'pregão', 'tomada de preços', 'aquisição', 'contratação de empresa', 'edital de licitação', 'sessão pública'],
        urgency_indicators: ['prazo', 'abertura', 'sessão pública', 'data limite'],
        ai_context: 'Detectar novos editais de licitação, pregões eletrônicos, tomadas de preço. Foco em contratações de TI, sistemas, consultorias. Identificar valores, prazos e órgão contratante.',
        source_file: 'ChatGPT-Plataformas de Compras Patos MG.md',
        confidence_boost: 20,
    },
    {
        id: 'ZONE-001',
        name: 'Real Estate & Zoning',
        name_pt: 'Imóveis e Zoneamento',
        tier: 1,
        strategy: 'keyword',
        keywords: ['parcelamento de solo', 'zoneamento', 'plano diretor', 'loteamento', 'expansão urbana', 'uso e ocupação do solo', 'remembramento'],
        urgency_indicators: ['vigência', 'prazo de adequação', 'audiência pública'],
        ai_context: 'Detectar mudanças em zoneamento urbano, novos loteamentos aprovados, alterações no plano diretor que criam oportunidades imobiliárias. Identificar áreas afetadas e prazos de transição.',
        source_file: 'ChatGPT-Chacreamento.md',
        confidence_boost: 20,
    },
    {
        id: 'CAREER-001',
        name: 'Public Security Careers',
        name_pt: 'Carreiras de Segurança Pública',
        tier: 1,
        strategy: 'keyword',
        keywords: ['carreira policial', 'reestruturação', 'subsídio', 'concurso público', 'nomeação', 'investigador', 'delegado', 'perito'],
        urgency_indicators: ['nomeação', 'prazo para posse', 'convocação', 'publicação do resultado'],
        ai_context: 'Detectar projetos de lei sobre reestruturação de carreiras policiais, concursos, nomeações, reajustes salariais. Foco em investigadores, delegados, peritos.',
        source_file: 'ChatGPT-Valorização do Investigador de Polícia.md',
        confidence_boost: 20,
    },
    {
        id: 'FISCAL-001',
        name: 'Fiscal Oversight',
        name_pt: 'Controle Fiscal e Orçamentário',
        tier: 1,
        strategy: 'keyword',
        keywords: ['crédito suplementar', 'LOA', 'LDO', 'homologação', 'aditivo contratual', 'dotação orçamentária', 'empenho'],
        urgency_indicators: ['exercício financeiro', 'prazo legal', 'publicação obrigatória'],
        ai_context: 'Detectar anomalias orçamentárias: créditos suplementares excessivos, aditivos contratuais suspeitos, novos empenhos relevantes. Comparar com dotação original.',
        source_file: 'ChatGPT-Ferramenta de Análise de Gastos.md',
        confidence_boost: 20,
    },
    {
        id: 'LEGAL-001',
        name: 'Legal Compliance / LGPD',
        name_pt: 'Compliance Legal e LGPD',
        tier: 1,
        strategy: 'keyword',
        keywords: ['LGPD', 'regulamentação', 'proteção de dados', 'obrigação legal', 'prazo de adequação', 'sanção', 'ANPD'],
        urgency_indicators: ['prazo de adequação', 'multa', 'sanção', 'vigência imediata'],
        ai_context: 'Detectar novas obrigações legais, regulamentações de proteção de dados, prazos de adequação LGPD. Identificar setores afetados e penalidades.',
        source_file: 'ChatGPT-Protótipo Cloud Legal.md',
        confidence_boost: 20,
    },

    // ── Tier 2: Medium Relevance (Indirect/Niche) ──
    {
        id: 'NFE-001',
        name: 'Electronic Invoicing',
        name_pt: 'Nota Fiscal Eletrônica',
        tier: 2,
        strategy: 'keyword',
        keywords: ['nota fiscal eletrônica', 'NFC-e', 'SEFAZ', 'obrigatoriedade fiscal', 'EFD', 'SPED', 'ERP'],
        urgency_indicators: ['obrigatoriedade', 'prazo', 'a partir de', 'vedação'],
        ai_context: 'Detectar mudanças em obrigações fiscais eletrônicas: novos prazos NFC-e, alterações SEFAZ, EFD Reinf. Impacto em sistemas de gestão (ERP).',
        source_file: 'ChatGPT-Soluções de estoque baratas.md',
        confidence_boost: 10,
    },
    {
        id: 'PRESS-001',
        name: 'Press & Official Media',
        name_pt: 'Imprensa e Mídia Oficial',
        tier: 2,
        strategy: 'keyword',
        keywords: ['publicação oficial', 'comunicação social', 'nota oficial', 'decreto', 'portaria', 'resolução'],
        urgency_indicators: ['efeito imediato', 'revogação', 'caráter urgente'],
        ai_context: 'Detectar decretos de alto impacto, portarias que alteram funcionamento de órgãos, resoluções com efeito imediato. Foco em atos normativos relevantes para jornalismo investigativo.',
        source_file: 'ChatGPT-Revisor Jornalístico HTML.md',
        confidence_boost: 10,
    },
    {
        id: 'INNOV-001',
        name: 'Innovation & Startups',
        name_pt: 'Inovação e Startups',
        tier: 2,
        strategy: 'keyword',
        keywords: ['startup', 'incubadora', 'edital de inovação', 'hub tecnológico', 'aceleração', 'FINEP', 'FAPEMIG'],
        urgency_indicators: ['inscrições', 'prazo', 'seleção', 'resultado'],
        ai_context: 'Detectar editais de inovação, programas de aceleração, chamadas FINEP/FAPEMIG, criação de hubs tecnológicos. Oportunidades para startups de tech.',
        source_file: 'ChatGPT-Plataforma SaaS com IA (2).md',
        confidence_boost: 10,
    },
    {
        id: 'CYBER-001',
        name: 'Cybersecurity Mandates',
        name_pt: 'Mandatos de Cibersegurança',
        tier: 2,
        strategy: 'keyword',
        keywords: ['segurança cibernética', 'proteção de dados', 'auditoria de segurança', 'certificação', 'ISO 27001', 'política de segurança da informação'],
        urgency_indicators: ['obrigatoriedade', 'adequação', 'prazo', 'penalidade'],
        ai_context: 'Detectar novas obrigações de cibersegurança para órgãos públicos, mandatos de certificação, políticas de segurança da informação obrigatórias.',
        source_file: 'ChatGPT-Análise GitHub e otimização (2).md',
        confidence_boost: 10,
    },
    {
        id: 'TAX-001',
        name: 'Tax Regime Changes',
        name_pt: 'Mudanças de Regime Tributário',
        tier: 2,
        strategy: 'keyword',
        keywords: ['ICMS', 'substituição tributária', 'alíquota', 'regime especial', 'reforma tributária', 'IBS', 'CBS'],
        urgency_indicators: ['vigência', 'a partir de', 'exercício seguinte', 'revogação'],
        ai_context: 'Detectar alterações em alíquotas ICMS, regimes especiais de tributação, reforma tributária. Impacto direto em comércio varejista e atacadista.',
        source_file: 'ChatGPT-Soluções de estoque baratas.md',
        confidence_boost: 10,
    },

    // ── Tier 3: Monitoring (Informational) ──
    {
        id: 'HEALTH-001',
        name: 'Public Health & Sanitary',
        name_pt: 'Saúde Pública e Vigilância Sanitária',
        tier: 3,
        strategy: 'keyword',
        keywords: ['vigilância sanitária', 'ANVISA', 'regulamento sanitário', 'licença sanitária', 'alvará', 'farmácia'],
        urgency_indicators: ['interdição', 'prazo', 'suspensão', 'recall'],
        ai_context: 'Monitorar regulamentações sanitárias, interdições, alvarás de funcionamento, normas ANVISA que afetam comércio.',
        source_file: 'internal',
        confidence_boost: 0,
    },
    {
        id: 'EDU-001',
        name: 'Education & Grants',
        name_pt: 'Educação e Bolsas',
        tier: 3,
        strategy: 'keyword',
        keywords: ['edital educação', 'bolsa', 'capacitação', 'universitário', 'PROUNI', 'FIES', 'vestibular'],
        urgency_indicators: ['inscrições até', 'prazo', 'resultado', 'convocação'],
        ai_context: 'Monitorar editais de bolsa, programas de capacitação, concursos educacionais. Foco em oportunidades de formação tecnológica.',
        source_file: 'internal',
        confidence_boost: 0,
    },
];

// ═══════════════════════════════════════════════════════════
// STRATEGY B — Themed Search (by_theme endpoint)
// ═══════════════════════════════════════════════════════════

export const THEME_PATTERNS: OpportunityPattern[] = [
    {
        id: 'THEME-BID',
        name: 'Themed Procurement',
        name_pt: 'Licitações por Tema',
        tier: 2,
        strategy: 'theme',
        keywords: [],
        urgency_indicators: ['abertura', 'sessão'],
        ai_context: 'Buscar licitações categorizadas por tema na API Querido Diário. Cross-reference com PNCP API e Compras.gov.br para dados complementares.',
        source_file: 'internal',
        confidence_boost: 10,
    },
    {
        id: 'THEME-PUB',
        name: 'Public Notices',
        name_pt: 'Editais e Avisos Públicos',
        tier: 2,
        strategy: 'theme',
        keywords: [],
        urgency_indicators: ['prazo', 'publicação', 'edital'],
        ai_context: 'Extrair entidades nomeadas (empresas, CNPJs) de editais e avisos públicos categorizados. Identificar oportunidades de negócio.',
        source_file: 'internal',
        confidence_boost: 10,
    },
];

// ═══════════════════════════════════════════════════════════
// STRATEGY C — AI Semantic Analysis (post-fetch)
// ═══════════════════════════════════════════════════════════

export const AI_PATTERNS: OpportunityPattern[] = [
    {
        id: 'AI-INNOV',
        name: 'Innovation & Tech Programs',
        name_pt: 'Programas de Inovação e Tecnologia',
        tier: 2,
        strategy: 'ai_semantic',
        keywords: ['incubadora', 'hub tecnológico', 'edital de inovação', 'polo tecnológico'],
        urgency_indicators: ['inscrições', 'prazo', 'lançamento'],
        ai_context: 'Detectar menções a programas de inovação, hubs tecnológicos, editais de startups, parcerias público-privadas em tecnologia. Mesmo sem keywords exatas, use contexto semântico.',
        source_file: 'ChatGPT-Plataforma SaaS com IA (2).md',
        confidence_boost: 15,
    },
    {
        id: 'AI-GROCERY',
        name: 'Local Commerce & Food Regulation',
        name_pt: 'Comércio Local e Regulação Alimentar',
        tier: 2,
        strategy: 'ai_semantic',
        keywords: ['supermercado', 'varejo alimentar', 'delivery', 'fiscalização de alimentos'],
        urgency_indicators: ['proibição', 'obrigatoriedade', 'adequação'],
        ai_context: 'Detectar regulações que afetam supermercados locais, delivery de alimentos, fiscalização sanitária de comércio alimentar. Relevante para plataforma MercadoMind.',
        source_file: 'MercadoMind (ideia do usuário)',
        confidence_boost: 15,
    },
    {
        id: 'AI-AGENT',
        name: 'Digital Government & API Mandates',
        name_pt: 'Governo Digital e Mandatos de APIs',
        tier: 2,
        strategy: 'ai_semantic',
        keywords: ['governo digital', 'APIs públicas', 'interoperabilidade', 'transformação digital'],
        urgency_indicators: ['implantação', 'obrigatoriedade', 'prazo de adequação'],
        ai_context: 'Detectar mandatos de transformação digital, obrigações de APIs públicas, padrões de interoperabilidade governamental. Oportunidade para SaaS agent-centric.',
        source_file: 'Gemini-Transformação para Arquitetura Agent-Centric.md',
        confidence_boost: 15,
    },
];

// ═══════════════════════════════════════════════════════════
// ALL PATTERNS — Combined export
// ═══════════════════════════════════════════════════════════

export const ALL_PATTERNS: OpportunityPattern[] = [
    ...KEYWORD_PATTERNS,
    ...THEME_PATTERNS,
    ...AI_PATTERNS,
];

/**
 * Build OpenSearch querystring from keyword patterns
 * Uses OR operator for combining keywords
 */
export function buildQuerystring(patterns: OpportunityPattern[]): string {
    const keywordPatterns = patterns.filter(p => p.strategy === 'keyword');
    const allKeywords = keywordPatterns.flatMap(p => p.keywords);
    const uniqueKeywords = [...new Set(allKeywords)];
    return uniqueKeywords.join(' | ');
}

/**
 * Get patterns by tier
 */
export function getPatternsByTier(tier: 1 | 2 | 3): OpportunityPattern[] {
    return ALL_PATTERNS.filter(p => p.tier === tier);
}

// ── Self-test: print pattern stats ──
if (import.meta.url === `file://${process.argv[1]}`) {
    console.log('🦅 Eagle Eye — Idea Patterns Bank');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`📊 Total patterns: ${ALL_PATTERNS.length}`);
    console.log(`   Strategy A (keyword): ${KEYWORD_PATTERNS.length}`);
    console.log(`   Strategy B (theme):   ${THEME_PATTERNS.length}`);
    console.log(`   Strategy C (AI):      ${AI_PATTERNS.length}`);
    console.log(`   Tier 1 (high):        ${getPatternsByTier(1).length}`);
    console.log(`   Tier 2 (medium):      ${getPatternsByTier(2).length}`);
    console.log(`   Tier 3 (monitoring):  ${getPatternsByTier(3).length}`);
    console.log('');
    console.log('🔍 Sample querystring (Tier 1 only):');
    console.log(`   "${buildQuerystring(getPatternsByTier(1)).substring(0, 120)}..."`);
}
