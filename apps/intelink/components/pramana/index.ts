/**
 * Pramana Visual System
 * 
 * Tsun-cha Protocol: Visual distinction between Facts and Inferences
 */

// Visual components
export { PramanaBadge, PramanaCard, PramanaIndicator } from './PramanaBadge';

// Debate system
export { DebateButton, DebateIcon } from './DebateButton';

// Provenance Editor (Admiralty Scale)
export { 
  ProvenanceEditor, 
  ProvenanceBadge, 
  QuickProvenanceSelector,
  parseRating,
  getRatingColor,
  getRatingLabel,
  SOURCE_RELIABILITY,
  INFO_CREDIBILITY,
} from './ProvenanceEditor';
export type { 
  SourceReliability, 
  InfoCredibility, 
  ProvenanceRating, 
  ProvenanceData 
} from './ProvenanceEditor';

// Confidence system utilities
export { 
  type ConfidenceLevel, 
  type PramanaMetadata,
  PRAMANA_STYLES,
  getConfidenceLevel,
  getPramanaStyle,
  getPramanaBadgeProps,
} from '@/lib/pramana/confidence-system';
