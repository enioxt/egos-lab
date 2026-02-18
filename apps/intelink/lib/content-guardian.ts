/**
 * Content Guardian
 * Ethical content validation for AI interactions
 * 
 * Naming: "Content Guardian" for Intelink (dry/technical)
 * Framework equivalent: "ATRiAN Guardian" (spiritual)
 * 
 * Purpose:
 * 1. Validate user input before sending to AI
 * 2. Validate AI output before sending to user
 * 3. Log violations for review
 */

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type Severity = 'info' | 'warning' | 'error' | 'critical';

export interface ValidationRule {
  id: string;
  pattern: RegExp;
  severity: Severity;
  message: string;
  category: string;
}

export interface Violation {
  ruleId: string;
  severity: Severity;
  message: string;
  category: string;
  match: string;
  position?: { start: number; end: number };
}

export interface ValidationReport {
  passed: boolean;
  score: number;
  violations: Violation[];
  warnings: Violation[];
}

// ═══════════════════════════════════════════════════════════════════════════
// RULES (Subset relevant for police intelligence context)
// ═══════════════════════════════════════════════════════════════════════════

const SECURITY_RULES: ValidationRule[] = [
  {
    id: 'sec-001',
    pattern: /\b(100%\s+secure|completely\s+safe|unhackable|bulletproof)\b/gi,
    severity: 'critical',
    message: 'Absolute security claims are dangerous and false',
    category: 'security'
  },
  {
    id: 'sec-002',
    pattern: /\b(never\s+fails|always\s+works|100%\s+uptime)\b/gi,
    severity: 'critical',
    message: 'Perfect reliability claims are unrealistic',
    category: 'reliability'
  }
];

const ACCURACY_RULES: ValidationRule[] = [
  {
    id: 'acc-001',
    pattern: /\b(confirmed|verified|proven)\b(?!\s+(by|through|via))/gi,
    severity: 'warning',
    message: 'Verification claims should cite sources',
    category: 'accuracy'
  },
  {
    id: 'acc-002',
    pattern: /\b(definitely|certainly|undoubtedly|absolutely)\s+(is|was|will)/gi,
    severity: 'warning',
    message: 'Absolute certainty should be avoided - use calibrated confidence',
    category: 'certainty'
  },
  {
    id: 'acc-003',
    pattern: /\b(suspect|criminal|guilty)\b(?!\s+(allegedly|reportedly|possibly))/gi,
    severity: 'error',
    message: 'Legal status claims require proper qualification (allegedly, reportedly)',
    category: 'legal_language'
  }
];

const BIAS_RULES: ValidationRule[] = [
  {
    id: 'bias-001',
    pattern: /\b(obviously|clearly|everyone knows)\b/gi,
    severity: 'warning',
    message: 'Presumptive language may indicate bias',
    category: 'bias'
  },
  {
    id: 'bias-002',
    pattern: /\b(always|never|all|none)\s+\b(people|individuals|suspects|criminals)\b/gi,
    severity: 'error',
    message: 'Generalizations about groups are problematic',
    category: 'generalization'
  }
];

const INTELLIGENCE_RULES: ValidationRule[] = [
  {
    id: 'intel-001',
    pattern: /\b(source\s+says|according\s+to\s+sources?)\b(?!\s*[\[\(])/gi,
    severity: 'info',
    message: 'Source claims should include provenance rating',
    category: 'provenance'
  },
  {
    id: 'intel-002',
    pattern: /\b(intelligence\s+suggests|analysis\s+indicates)\b/gi,
    severity: 'info',
    message: 'Intelligence assessments should include confidence level',
    category: 'confidence'
  }
];

/** All rules combined */
const ALL_RULES: ValidationRule[] = [
  ...SECURITY_RULES,
  ...ACCURACY_RULES,
  ...BIAS_RULES,
  ...INTELLIGENCE_RULES
];

/** Forbidden phrases - absolute certainty is prohibited */
const FORBIDDEN_PHRASES = [
  '100%', 'guarantee', 'guaranteed', 'perfect', 
  'always true', 'never wrong', 'definitely guilty'
];

// ═══════════════════════════════════════════════════════════════════════════
// GUARDIAN CLASS
// ═══════════════════════════════════════════════════════════════════════════

export class ContentGuardian {
  private rules: ValidationRule[];
  private strictMode: boolean;

  constructor(options: { strictMode?: boolean; categories?: string[] } = {}) {
    this.strictMode = options.strictMode ?? false;
    
    // Filter rules by category if specified
    if (options.categories?.length) {
      this.rules = ALL_RULES.filter(r => options.categories!.includes(r.category));
    } else {
      this.rules = ALL_RULES;
    }
  }

  /**
   * Validate text content
   */
  validate(text: string): ValidationReport {
    const violations: Violation[] = [];
    const warnings: Violation[] = [];

    // Check each rule
    for (const rule of this.rules) {
      const matches = text.matchAll(rule.pattern);
      
      for (const match of matches) {
        const violation: Violation = {
          ruleId: rule.id,
          severity: rule.severity,
          message: rule.message,
          category: rule.category,
          match: match[0],
          position: match.index !== undefined 
            ? { start: match.index, end: match.index + match[0].length }
            : undefined
        };

        if (rule.severity === 'error' || rule.severity === 'critical') {
          violations.push(violation);
        } else {
          warnings.push(violation);
        }
      }
    }

    // Check forbidden phrases
    for (const phrase of FORBIDDEN_PHRASES) {
      if (text.toLowerCase().includes(phrase.toLowerCase())) {
        violations.push({
          ruleId: 'forbidden-phrase',
          severity: 'error',
          message: `Absolute certainty phrase detected: "${phrase}"`,
          category: 'forbidden',
          match: phrase
        });
      }
    }

    // Calculate score
    const totalIssues = violations.length + warnings.length * 0.3;
    const score = Math.max(0, Math.round(100 - totalIssues * 15));

    const passed = this.strictMode 
      ? violations.length === 0 && warnings.length === 0
      : violations.length === 0;

    return { passed, score, violations, warnings };
  }

  /**
   * Quick check if content is valid
   */
  isValid(text: string): boolean {
    return this.validate(text).passed;
  }

  /**
   * Get validation score (0-100)
   */
  getScore(text: string): number {
    return this.validate(text).score;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// API MIDDLEWARE
// ═══════════════════════════════════════════════════════════════════════════

/** Default guardian instance */
const defaultGuardian = new ContentGuardian();

/**
 * Validate AI response before sending to user
 * Returns sanitized response or original if valid
 */
export function validateAIResponse(response: string): {
  isValid: boolean;
  response: string;
  report: ValidationReport;
} {
  const report = defaultGuardian.validate(response);
  
  if (!report.passed) {
    // Log for review but don't block (AI might have valid context)
    console.warn('[ContentGuardian] AI response flagged:', {
      violations: report.violations.length,
      score: report.score
    });
  }

  return {
    isValid: report.passed,
    response, // Return original - logging only, no sanitization
    report
  };
}

/**
 * Validate user input before processing
 */
export function validateUserInput(input: string): {
  isValid: boolean;
  input: string;
  report: ValidationReport;
} {
  const report = defaultGuardian.validate(input);
  
  return {
    isValid: report.passed,
    input,
    report
  };
}

/**
 * Create middleware for API routes
 */
export function createGuardianMiddleware(options?: { strictMode?: boolean }) {
  const guardian = new ContentGuardian(options);

  return {
    validateRequest: (body: { message?: string; content?: string; query?: string }) => {
      const text = body.message || body.content || body.query || '';
      return guardian.validate(text);
    },
    validateResponse: (response: string) => {
      return guardian.validate(response);
    },
    isValid: (text: string) => guardian.isValid(text)
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export const guardian = defaultGuardian;
export const validateContent = (text: string) => defaultGuardian.validate(text);
export const isContentSafe = (text: string) => defaultGuardian.isValid(text);
