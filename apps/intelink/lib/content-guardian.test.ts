import { describe, it, expect } from 'vitest';
import {
  ContentGuardian,
  validateContent,
  isContentSafe,
  guardian,
  validateAIResponse,
  validateUserInput,
  createGuardianMiddleware,
} from './content-guardian';

describe('ContentGuardian', () => {
  describe('validate()', () => {
    it('should pass clean text', () => {
      const result = guardian.validate('This is a factual statement about the investigation.');
      expect(result.passed).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should detect absolute security claims', () => {
      const result = guardian.validate('This system is 100% secure and unhackable.');
      expect(result.passed).toBe(false);
      expect(result.violations.some(v => v.category === 'security')).toBe(true);
    });

    it('should detect reliability claims', () => {
      const result = guardian.validate('This tool never fails and always works.');
      expect(result.passed).toBe(false);
      expect(result.violations.some(v => v.category === 'reliability')).toBe(true);
    });

    it('should detect forbidden certainty phrases', () => {
      const result = guardian.validate('We guarantee the suspect is guilty.');
      expect(result.violations.some(v => v.ruleId === 'forbidden-phrase')).toBe(true);
    });

    it('should detect legal language issues', () => {
      const result = guardian.validate('The criminal was seen at the location.');
      expect(result.passed).toBe(false);
      expect(result.violations.some(v => v.category === 'legal_language')).toBe(true);
    });

    it('should pass qualified legal language', () => {
      const result = guardian.validate('The suspect allegedly was seen at the location.');
      // "suspect allegedly" should be acceptable
      expect(result.violations.filter(v => v.category === 'legal_language')).toHaveLength(0);
    });

    it('should detect bias language', () => {
      const result = guardian.validate('Obviously, everyone knows this is true.');
      expect(result.warnings.some(v => v.category === 'bias')).toBe(true);
    });

    it('should detect generalizations', () => {
      const result = guardian.validate('All suspects always lie to investigators.');
      expect(result.passed).toBe(false);
      expect(result.violations.some(v => v.category === 'generalization')).toBe(true);
    });

    it('should detect forbidden phrases', () => {
      const result = guardian.validate('We guarantee 100% accuracy in identification.');
      expect(result.passed).toBe(false);
      expect(result.violations.some(v => v.ruleId === 'forbidden-phrase')).toBe(true);
    });

    it('should calculate score correctly', () => {
      const clean = guardian.validate('A factual observation.');
      expect(clean.score).toBe(100);

      const problematic = guardian.validate('This is 100% guaranteed to never fail!');
      expect(problematic.score).toBeLessThan(100);
    });
  });

  describe('isValid()', () => {
    it('should return true for clean text', () => {
      expect(guardian.isValid('A factual statement.')).toBe(true);
    });

    it('should return false for problematic text', () => {
      expect(guardian.isValid('100% guaranteed perfect!')).toBe(false);
    });
  });

  describe('getScore()', () => {
    it('should return 100 for clean text', () => {
      expect(guardian.getScore('A simple observation.')).toBe(100);
    });

    it('should return lower score for issues', () => {
      expect(guardian.getScore('Never fails, always works!')).toBeLessThan(100);
    });
  });
});

describe('Custom Guardian', () => {
  it('should work in strict mode', () => {
    const strict = new ContentGuardian({ strictMode: true });
    
    // Warnings also fail in strict mode
    const result = strict.validate('Obviously this is true.');
    expect(result.passed).toBe(false);
  });

  it('should filter by categories', () => {
    const securityOnly = new ContentGuardian({ categories: ['security'] });
    
    // This has reliability issues but not security
    const result = securityOnly.validate('Never fails!');
    expect(result.passed).toBe(true);
  });
});

describe('validateAIResponse', () => {
  it('should validate and return result', () => {
    const { isValid, response, report } = validateAIResponse('A clean response.');
    
    expect(isValid).toBe(true);
    expect(response).toBe('A clean response.');
    expect(report.passed).toBe(true);
  });

  it('should flag problematic responses', () => {
    const { isValid, report } = validateAIResponse('This is 100% accurate!');
    
    expect(isValid).toBe(false);
    expect(report.violations.length).toBeGreaterThan(0);
  });

  it('should return original response even when flagged', () => {
    const problematic = 'This guarantees 100% success!';
    const { response } = validateAIResponse(problematic);
    
    expect(response).toBe(problematic);
  });
});

describe('validateUserInput', () => {
  it('should validate user input', () => {
    const { isValid, input, report } = validateUserInput('A normal question.');
    
    expect(isValid).toBe(true);
    expect(input).toBe('A normal question.');
    expect(report.passed).toBe(true);
  });
});

describe('createGuardianMiddleware', () => {
  it('should create middleware', () => {
    const middleware = createGuardianMiddleware();
    
    expect(middleware.validateRequest).toBeDefined();
    expect(middleware.validateResponse).toBeDefined();
    expect(middleware.isValid).toBeDefined();
  });

  it('should validate request body with message', () => {
    const middleware = createGuardianMiddleware();
    
    const result = middleware.validateRequest({ message: 'A clean message.' });
    expect(result.passed).toBe(true);
  });

  it('should validate request body with content', () => {
    const middleware = createGuardianMiddleware();
    
    const result = middleware.validateRequest({ content: 'This is 100% guaranteed!' });
    expect(result.passed).toBe(false);
  });

  it('should validate request body with query', () => {
    const middleware = createGuardianMiddleware();
    
    const result = middleware.validateRequest({ query: 'A search query.' });
    expect(result.passed).toBe(true);
  });

  it('should validate response string', () => {
    const middleware = createGuardianMiddleware();
    
    const result = middleware.validateResponse('A safe response.');
    expect(result.passed).toBe(true);
  });

  it('should check isValid', () => {
    const middleware = createGuardianMiddleware();
    
    expect(middleware.isValid('A safe text.')).toBe(true);
    expect(middleware.isValid('Never fails!')).toBe(false);
  });
});

describe('Convenience Functions', () => {
  it('validateContent should work', () => {
    const result = validateContent('A simple statement.');
    expect(result.passed).toBe(true);
  });

  it('isContentSafe should work', () => {
    expect(isContentSafe('A simple statement.')).toBe(true);
    expect(isContentSafe('100% guaranteed!')).toBe(false);
  });
});

describe('Edge Cases', () => {
  it('should handle empty string', () => {
    const result = guardian.validate('');
    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
  });

  it('should handle very long text', () => {
    const longText = 'This is a factual statement. '.repeat(500);
    const result = guardian.validate(longText);
    expect(result.passed).toBe(true);
  });

  it('should handle special characters', () => {
    const result = guardian.validate('Test with émojis 🔍 and special chars ñ.');
    expect(result.passed).toBe(true);
  });

  it('should be case insensitive', () => {
    const lower = guardian.validate('never fails');
    const upper = guardian.validate('NEVER FAILS');
    const mixed = guardian.validate('Never FAILS');
    
    expect(lower.passed).toBe(false);
    expect(upper.passed).toBe(false);
    expect(mixed.passed).toBe(false);
  });
});

describe('Police Intelligence Context', () => {
  it('should pass proper intelligence language', () => {
    const proper = `Based on the evidence collected, this analysis suggests 
    a possible connection with moderate confidence. The intelligence 
    assessment indicates approximately 75% likelihood.`;
    
    expect(guardian.isValid(proper)).toBe(true);
  });

  it('should fail improper intelligence language', () => {
    const improper = `The suspect is definitely guilty based on 100% 
    accurate analysis. Our system never fails and guarantees conviction.`;
    
    expect(guardian.isValid(improper)).toBe(false);
  });

  it('should flag absolute certainty in legal context', () => {
    const result = guardian.validate('The criminal committed the crime.');
    expect(result.passed).toBe(false);
    
    const qualified = guardian.validate('The alleged perpetrator reportedly committed the crime.');
    expect(qualified.violations.filter(v => v.category === 'legal_language')).toHaveLength(0);
  });

  it('should allow provenance-qualified statements', () => {
    const result = guardian.validate('According to source (A1), the individual was present.');
    // Should pass - properly attributed
    expect(result.violations.filter(v => v.severity === 'error')).toHaveLength(0);
  });
});

describe('Real-world AI Responses', () => {
  it('should pass ethical analysis', () => {
    const ethical = `Análise da Investigação:
    
    Com base nos documentos analisados, identificamos possíveis conexões 
    entre as entidades mencionadas. A confiança desta análise é moderada 
    (aproximadamente 70%) e recomenda-se investigação adicional.
    
    Próximos passos sugeridos:
    - Verificar registros adicionais
    - Entrevistar testemunhas
    - Cruzar informações com outras fontes`;
    
    expect(guardian.isValid(ethical)).toBe(true);
  });

  it('should fail unethical analysis', () => {
    const unethical = `O suspeito é definitivamente culpado. Nossa análise 
    com 100% de precisão prova que ele sempre esteve envolvido. 
    O sistema nunca falha e garante a condenação.`;
    
    expect(guardian.isValid(unethical)).toBe(false);
  });
});
