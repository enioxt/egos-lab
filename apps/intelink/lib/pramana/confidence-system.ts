/**
 * PRAMANA CONFIDENCE SYSTEM
 * Visual Pramana: Differentiates Facts from Inferences
 * 
 * Based on the Tsun-cha Protocol (Tibetan Monastic Debate)
 * - FACT: Verified data (CPF validated, official document, confirmed by user)
 * - INFERENCE: AI-derived data (NLP extraction, pattern matching, suggestions)
 * 
 * @version 1.0.0
 * @see .guarani/philosophy/TSUN_CHA_PROTOCOL.md
 */

export type ConfidenceLevel = 'fact' | 'inference' | 'disputed' | 'unknown';

export interface PramanaMetadata {
  level: ConfidenceLevel;
  source: string;
  verifiedAt?: Date;
  verifiedBy?: string;
  reasoning?: string;
}

/**
 * Visual styles for each confidence level (Tailwind classes)
 */
export const PRAMANA_STYLES: Record<ConfidenceLevel, {
  border: string;
  bg: string;
  badge: string;
  icon: string;
  label: string;
}> = {
  fact: {
    border: 'border-emerald-500 border-solid',
    bg: 'bg-emerald-500/10',
    badge: 'bg-emerald-500 text-white',
    icon: '✓',
    label: 'Fato Verificado',
  },
  inference: {
    border: 'border-purple-500 border-dashed',
    bg: 'bg-purple-500/10',
    badge: 'bg-purple-500 text-white',
    icon: '◎',
    label: 'Inferência IA',
  },
  disputed: {
    border: 'border-amber-500 border-dotted',
    bg: 'bg-amber-500/10',
    badge: 'bg-amber-500 text-black',
    icon: '⚡',
    label: 'Em Debate',
  },
  unknown: {
    border: 'border-gray-500 border-dashed',
    bg: 'bg-gray-500/10',
    badge: 'bg-gray-500 text-white',
    icon: '?',
    label: 'Não Classificado',
  },
};

/**
 * Determines confidence level based on entity source
 */
export function getConfidenceLevel(entity: {
  source?: string;
  verified?: boolean;
  ai_generated?: boolean;
  disputed?: boolean;
}): ConfidenceLevel {
  if (entity.disputed) return 'disputed';
  if (entity.verified) return 'fact';
  if (entity.ai_generated) return 'inference';
  
  // Heuristics based on source
  const source = entity.source?.toLowerCase() || '';
  
  if (source.includes('cpf') || source.includes('cnpj') || source.includes('sinarm')) {
    return 'fact'; // Official database validation
  }
  if (source.includes('reds') || source.includes('oficial') || source.includes('manual')) {
    return 'fact'; // Official document or manual entry
  }
  if (source.includes('nlp') || source.includes('ocr') || source.includes('ai')) {
    return 'inference'; // AI-derived
  }
  
  return 'unknown';
}

/**
 * Get visual style classes for an entity
 */
export function getPramanaStyle(entity: {
  source?: string;
  verified?: boolean;
  ai_generated?: boolean;
  disputed?: boolean;
}) {
  const level = getConfidenceLevel(entity);
  return PRAMANA_STYLES[level];
}

/**
 * Badge component props generator
 */
export function getPramanaBadgeProps(level: ConfidenceLevel) {
  const style = PRAMANA_STYLES[level];
  return {
    className: `px-2 py-0.5 rounded-full text-xs font-medium ${style.badge}`,
    children: `${style.icon} ${style.label}`,
  };
}
