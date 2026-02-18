/**
 * INTELINK - CRIT Judging System (MACI Framework)
 * 
 * Implements Socratic validation for arguments.
 * Based on Stanford MACI paper: Multi-Agent Communication & Integration.
 * 
 * CRIT = Critical Reasoning and Inquiry Tool
 * 
 * @version 1.0.0
 * @updated 2025-12-09
 */

// ============================================================================
// TYPES
// ============================================================================

export interface Argument {
    id: string;
    claim: string;
    evidence: string[];
    source?: string;
    confidence?: number;
}

export interface CritEvaluation {
    argument_id: string;
    is_valid: boolean;
    score: number; // 0-100
    issues: CritIssue[];
    socratic_questions: string[];
    recommendation: string;
}

export interface CritIssue {
    type: 'LOGICAL' | 'EVIDENTIAL' | 'STRUCTURAL' | 'BIAS';
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    description: string;
    fix_suggestion?: string;
}

// ============================================================================
// FALLACY PATTERNS
// ============================================================================

const FALLACY_PATTERNS: { pattern: RegExp; type: string; description: string }[] = [
    // Ad Hominem
    {
        pattern: /\b(porque (ele|ela) é|sendo (ele|ela)|como (ele|ela) é)\b/i,
        type: 'AD_HOMINEM',
        description: 'Ataque à pessoa em vez do argumento'
    },
    // Apelo à autoridade sem evidência
    {
        pattern: /\b(todo mundo sabe|é sabido que|sempre foi assim)\b/i,
        type: 'APPEAL_TO_AUTHORITY',
        description: 'Apelo à autoridade sem evidência concreta'
    },
    // Generalização apressada
    {
        pattern: /\b(sempre|nunca|todos|ninguém|obviamente)\b/i,
        type: 'HASTY_GENERALIZATION',
        description: 'Generalização sem base estatística'
    },
    // Falso dilema
    {
        pattern: /\b(ou .+ ou|só pode ser|não há outra opção)\b/i,
        type: 'FALSE_DILEMMA',
        description: 'Apresentação de apenas duas opções quando há mais'
    },
    // Post hoc
    {
        pattern: /\b(depois de .+ então|por causa disso|logo após)\b/i,
        type: 'POST_HOC',
        description: 'Correlação não implica causalidade'
    },
    // Apelo emocional
    {
        pattern: /\b(horrível|absurdo|inaceitável|monstruoso)\b/i,
        type: 'EMOTIONAL_APPEAL',
        description: 'Uso de linguagem emocional em vez de evidências'
    }
];

// ============================================================================
// EVIDENCE QUALITY CHECKS
// ============================================================================

const WEAK_EVIDENCE_PATTERNS = [
    /\b(dizem que|parece que|acho que|talvez)\b/i,
    /\b(fonte anônima|informante|relatos)\b/i,
    /\b(não confirmado|alegadamente|supostamente)\b/i
];

const STRONG_EVIDENCE_PATTERNS = [
    /\b(laudo pericial|exame|perícia)\b/i,
    /\b(documento|certidão|registro)\b/i,
    /\b(testemunho .+ corroborado|prova material)\b/i,
    /\b(confissão|admissão)\b/i,
    /\b(câmera|vídeo|áudio|gravação)\b/i
];

// ============================================================================
// MAIN EVALUATION FUNCTION
// ============================================================================

export function evaluateArgument(argument: Argument): CritEvaluation {
    const issues: CritIssue[] = [];
    let score = 100;
    
    // 1. Check for logical fallacies
    for (const fallacy of FALLACY_PATTERNS) {
        if (fallacy.pattern.test(argument.claim)) {
            issues.push({
                type: 'LOGICAL',
                severity: 'MEDIUM',
                description: `Possível falácia: ${fallacy.type} - ${fallacy.description}`,
                fix_suggestion: 'Reformule o argumento focando em evidências objetivas'
            });
            score -= 15;
        }
    }
    
    // 2. Check evidence quality
    const evidenceScore = evaluateEvidence(argument.evidence);
    if (evidenceScore < 50) {
        issues.push({
            type: 'EVIDENTIAL',
            severity: 'HIGH',
            description: 'Evidências fracas ou insuficientes',
            fix_suggestion: 'Adicione provas documentais ou periciais'
        });
        score -= 25;
    }
    
    // 3. Check structure
    if (argument.evidence.length === 0) {
        issues.push({
            type: 'STRUCTURAL',
            severity: 'HIGH',
            description: 'Argumento sem evidências de suporte',
            fix_suggestion: 'Todo argumento precisa de pelo menos uma evidência'
        });
        score -= 30;
    }
    
    // 4. Check for bias indicators
    const biasCheck = checkForBias(argument.claim);
    if (biasCheck.hasBias) {
        issues.push({
            type: 'BIAS',
            severity: biasCheck.severity,
            description: biasCheck.description,
            fix_suggestion: 'Mantenha linguagem neutra e objetiva'
        });
        score -= biasCheck.severity === 'HIGH' ? 20 : 10;
    }
    
    // Generate Socratic questions
    const questions = generateSocraticQuestions(argument, issues);
    
    // Generate recommendation
    const recommendation = generateRecommendation(score, issues);
    
    return {
        argument_id: argument.id,
        is_valid: score >= 60,
        score: Math.max(0, score),
        issues,
        socratic_questions: questions,
        recommendation
    };
}

function evaluateEvidence(evidence: string[]): number {
    if (evidence.length === 0) return 0;
    
    let totalScore = 0;
    
    for (const e of evidence) {
        let eScore = 50; // Base score
        
        // Check for strong evidence patterns
        for (const pattern of STRONG_EVIDENCE_PATTERNS) {
            if (pattern.test(e)) {
                eScore += 20;
            }
        }
        
        // Check for weak evidence patterns
        for (const pattern of WEAK_EVIDENCE_PATTERNS) {
            if (pattern.test(e)) {
                eScore -= 15;
            }
        }
        
        totalScore += Math.max(0, Math.min(100, eScore));
    }
    
    return totalScore / evidence.length;
}

function checkForBias(claim: string): { hasBias: boolean; severity: 'LOW' | 'MEDIUM' | 'HIGH'; description: string } {
    const biasPatterns = [
        { pattern: /\b(certamente|com certeza|sem dúvida)\b/i, severity: 'LOW' as const },
        { pattern: /\b(criminoso nato|marginal|vagabundo)\b/i, severity: 'HIGH' as const },
        { pattern: /\b(típico de|sempre fazem|essa gente)\b/i, severity: 'HIGH' as const },
        { pattern: /\b(óbvio que|claro que|evidente)\b/i, severity: 'MEDIUM' as const }
    ];
    
    for (const { pattern, severity } of biasPatterns) {
        if (pattern.test(claim)) {
            return {
                hasBias: true,
                severity,
                description: 'Linguagem tendenciosa ou estereotipada detectada'
            };
        }
    }
    
    return { hasBias: false, severity: 'LOW', description: '' };
}

function generateSocraticQuestions(argument: Argument, issues: CritIssue[]): string[] {
    const questions: string[] = [];
    
    // Generic investigative questions
    questions.push('Quais são as fontes primárias dessa informação?');
    
    if (issues.some(i => i.type === 'EVIDENTIAL')) {
        questions.push('Existem provas materiais que corroboram essa afirmação?');
        questions.push('Há testemunhas independentes que confirmam os fatos?');
    }
    
    if (issues.some(i => i.type === 'LOGICAL')) {
        questions.push('Existe uma explicação alternativa para os fatos?');
        questions.push('A conclusão segue necessariamente das premissas?');
    }
    
    if (issues.some(i => i.type === 'BIAS')) {
        questions.push('Essa conclusão se baseia em fatos ou em preconceitos?');
    }
    
    // Add context-specific questions
    if (argument.claim.toLowerCase().includes('álibi')) {
        questions.push('O álibi foi verificado por fontes independentes?');
    }
    
    if (argument.claim.toLowerCase().includes('testemunha')) {
        questions.push('A testemunha tem interesse no resultado do caso?');
    }
    
    return questions.slice(0, 5); // Limit to 5 questions
}

function generateRecommendation(score: number, issues: CritIssue[]): string {
    if (score >= 80) {
        return 'Argumento bem fundamentado. Pode ser utilizado na investigação.';
    }
    
    if (score >= 60) {
        return 'Argumento aceitável, mas necessita reforço de evidências antes de uso decisivo.';
    }
    
    if (score >= 40) {
        const highIssues = issues.filter(i => i.severity === 'HIGH');
        return `Argumento fraco. Corrija ${highIssues.length} problema(s) crítico(s) antes de prosseguir.`;
    }
    
    return 'Argumento inválido. Reformule completamente com base em evidências concretas.';
}

// ============================================================================
// BATCH EVALUATION
// ============================================================================

export function evaluateMultipleArguments(arguments_: Argument[]): {
    evaluations: CritEvaluation[];
    summary: {
        total: number;
        valid: number;
        invalid: number;
        average_score: number;
        common_issues: string[];
    };
} {
    const evaluations = arguments_.map(evaluateArgument);
    
    const valid = evaluations.filter(e => e.is_valid).length;
    const avgScore = evaluations.reduce((sum, e) => sum + e.score, 0) / evaluations.length;
    
    // Find common issues
    const issueCounts: Record<string, number> = {};
    for (const e of evaluations) {
        for (const issue of e.issues) {
            issueCounts[issue.type] = (issueCounts[issue.type] || 0) + 1;
        }
    }
    
    const commonIssues = Object.entries(issueCounts)
        .filter(([_, count]) => count >= evaluations.length * 0.3)
        .map(([type, _]) => type);
    
    return {
        evaluations,
        summary: {
            total: arguments_.length,
            valid,
            invalid: arguments_.length - valid,
            average_score: Math.round(avgScore),
            common_issues: commonIssues
        }
    };
}

// ============================================================================
// FORMAT FOR DISPLAY
// ============================================================================

export function formatCritEvaluation(evaluation: CritEvaluation): string {
    let output = 'AVALIAÇÃO CRÍTICA (CRIT)\n';
    output += '═'.repeat(50) + '\n\n';
    
    output += `Status: ${evaluation.is_valid ? '✅ VÁLIDO' : '❌ INVÁLIDO'}\n`;
    output += `Score: ${evaluation.score}/100\n\n`;
    
    if (evaluation.issues.length > 0) {
        output += 'PROBLEMAS IDENTIFICADOS\n';
        output += '─'.repeat(40) + '\n';
        for (const issue of evaluation.issues) {
            const icon = issue.severity === 'HIGH' ? '🔴' : issue.severity === 'MEDIUM' ? '🟡' : '⚪';
            output += `${icon} [${issue.type}] ${issue.description}\n`;
            if (issue.fix_suggestion) {
                output += `   → ${issue.fix_suggestion}\n`;
            }
        }
        output += '\n';
    }
    
    output += 'PERGUNTAS SOCRÁTICAS\n';
    output += '─'.repeat(40) + '\n';
    for (const q of evaluation.socratic_questions) {
        output += `• ${q}\n`;
    }
    output += '\n';
    
    output += 'RECOMENDAÇÃO\n';
    output += '─'.repeat(40) + '\n';
    output += evaluation.recommendation + '\n';
    
    return output;
}

export default {
    evaluateArgument,
    evaluateMultipleArguments,
    formatCritEvaluation
};
