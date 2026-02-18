'use client';

/**
 * ProvenanceEditor - Admiralty Scale Rating Matrix
 * 
 * Intelligence grading system (6x6 matrix):
 * - SOURCE RELIABILITY (A-F): How trustworthy is the source?
 * - INFORMATION CREDIBILITY (1-6): How credible is the specific information?
 * 
 * Used by intelligence agencies worldwide (NATO STANAG 2022)
 * 
 * @version 1.0.0
 * @see https://en.wikipedia.org/wiki/Intelligence_source_and_information_reliability
 */

import { useState, useCallback } from 'react';
import { Shield, Info, Check, X } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

export type SourceReliability = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
export type InfoCredibility = '1' | '2' | '3' | '4' | '5' | '6';
export type ProvenanceRating = `${SourceReliability}${InfoCredibility}`;

export interface ProvenanceData {
  rating: ProvenanceRating;
  sourceReliability: SourceReliability;
  infoCredibility: InfoCredibility;
  notes?: string;
  updatedAt?: Date;
  updatedBy?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const SOURCE_RELIABILITY: Record<SourceReliability, {
  label: string;
  description: string;
  color: string;
}> = {
  A: {
    label: 'Completamente Confiável',
    description: 'Não há dúvidas sobre autenticidade, confiabilidade ou competência',
    color: 'bg-emerald-500',
  },
  B: {
    label: 'Geralmente Confiável',
    description: 'Pequenas dúvidas sobre autenticidade, confiabilidade ou competência',
    color: 'bg-green-500',
  },
  C: {
    label: 'Razoavelmente Confiável',
    description: 'Dúvidas sobre autenticidade, confiabilidade ou competência',
    color: 'bg-yellow-500',
  },
  D: {
    label: 'Geralmente Não Confiável',
    description: 'Dúvidas significativas sobre autenticidade, confiabilidade ou competência',
    color: 'bg-orange-500',
  },
  E: {
    label: 'Não Confiável',
    description: 'Falta de autenticidade, confiabilidade ou competência',
    color: 'bg-red-500',
  },
  F: {
    label: 'Não Pode Ser Avaliado',
    description: 'Não há base para avaliar a confiabilidade',
    color: 'bg-gray-500',
  },
};

export const INFO_CREDIBILITY: Record<InfoCredibility, {
  label: string;
  description: string;
  color: string;
}> = {
  '1': {
    label: 'Confirmada',
    description: 'Confirmada por outras fontes independentes',
    color: 'bg-emerald-500',
  },
  '2': {
    label: 'Provavelmente Verdadeira',
    description: 'Provavelmente verdadeira com base em informações anteriores',
    color: 'bg-green-500',
  },
  '3': {
    label: 'Possivelmente Verdadeira',
    description: 'Possivelmente verdadeira, consistente com padrões conhecidos',
    color: 'bg-yellow-500',
  },
  '4': {
    label: 'Duvidosa',
    description: 'Duvidosa, não consistente com padrões conhecidos',
    color: 'bg-orange-500',
  },
  '5': {
    label: 'Improvável',
    description: 'Improvável, contradiz informações confirmadas',
    color: 'bg-red-500',
  },
  '6': {
    label: 'Não Pode Ser Avaliada',
    description: 'Verdade não pode ser avaliada',
    color: 'bg-gray-500',
  },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function parseRating(rating: ProvenanceRating): {
  source: SourceReliability;
  info: InfoCredibility;
} {
  return {
    source: rating[0] as SourceReliability,
    info: rating[1] as InfoCredibility,
  };
}

export function getRatingColor(rating: ProvenanceRating): string {
  const { source, info } = parseRating(rating);
  const sourceScore = 'ABCDEF'.indexOf(source);
  const infoScore = parseInt(info) - 1;
  const avgScore = (sourceScore + infoScore) / 2;
  
  if (avgScore <= 1) return 'bg-emerald-500';
  if (avgScore <= 2) return 'bg-green-500';
  if (avgScore <= 3) return 'bg-yellow-500';
  if (avgScore <= 4) return 'bg-orange-500';
  return 'bg-red-500';
}

export function getRatingLabel(rating: ProvenanceRating): string {
  const { source, info } = parseRating(rating);
  return `${SOURCE_RELIABILITY[source].label} / ${INFO_CREDIBILITY[info].label}`;
}

// ============================================================================
// COMPONENTS
// ============================================================================

interface ProvenanceEditorProps {
  value?: ProvenanceRating;
  onChange?: (rating: ProvenanceRating, notes?: string) => void;
  readOnly?: boolean;
  showNotes?: boolean;
  className?: string;
}

export function ProvenanceEditor({
  value = 'F6',
  onChange,
  readOnly = false,
  showNotes = true,
  className = '',
}: ProvenanceEditorProps) {
  const [source, setSource] = useState<SourceReliability>(value[0] as SourceReliability);
  const [info, setInfo] = useState<InfoCredibility>(value[1] as InfoCredibility);
  const [notes, setNotes] = useState('');
  const [showHelp, setShowHelp] = useState(false);

  const handleSourceClick = useCallback((s: SourceReliability) => {
    if (readOnly) return;
    setSource(s);
    const newRating = `${s}${info}` as ProvenanceRating;
    onChange?.(newRating, notes);
  }, [info, notes, onChange, readOnly]);

  const handleInfoClick = useCallback((i: InfoCredibility) => {
    if (readOnly) return;
    setInfo(i);
    const newRating = `${source}${i}` as ProvenanceRating;
    onChange?.(newRating, notes);
  }, [source, notes, onChange, readOnly]);

  const currentRating = `${source}${info}` as ProvenanceRating;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-400" />
          <span className="font-semibold text-white">Classificação de Proveniência</span>
        </div>
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="text-gray-400 hover:text-white transition"
        >
          <Info className="w-4 h-4" />
        </button>
      </div>

      {/* Help Panel */}
      {showHelp && (
        <div className="bg-gray-800/50 rounded-lg p-3 text-xs text-gray-300 space-y-2">
          <p className="font-medium text-blue-400">Sistema Admiralty Scale (NATO STANAG 2022)</p>
          <p>A matriz 6x6 avalia a <b>confiabilidade da fonte</b> (A-F) e a <b>credibilidade da informação</b> (1-6).</p>
          <p>Exemplo: <span className="font-mono bg-gray-700 px-1 rounded">A1</span> = Fonte completamente confiável + Informação confirmada</p>
        </div>
      )}

      {/* Current Rating Display */}
      <div className="flex items-center justify-center gap-4 py-3">
        <div className={`w-16 h-16 rounded-xl ${getRatingColor(currentRating)} flex items-center justify-center`}>
          <span className="text-2xl font-bold text-white">{currentRating}</span>
        </div>
        <div className="text-sm">
          <div className="text-white font-medium">{SOURCE_RELIABILITY[source].label}</div>
          <div className="text-gray-400">{INFO_CREDIBILITY[info].label}</div>
        </div>
      </div>

      {/* Source Reliability Row */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
          Confiabilidade da Fonte
        </label>
        <div className="grid grid-cols-6 gap-1">
          {(Object.keys(SOURCE_RELIABILITY) as SourceReliability[]).map((s) => (
            <button
              key={s}
              onClick={() => handleSourceClick(s)}
              disabled={readOnly}
              className={`
                p-2 rounded-lg text-center transition-all
                ${source === s
                  ? `${SOURCE_RELIABILITY[s].color} text-white ring-2 ring-white/50`
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }
                ${readOnly ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
              `}
              title={SOURCE_RELIABILITY[s].description}
            >
              <span className="text-lg font-bold">{s}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Info Credibility Row */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
          Credibilidade da Informação
        </label>
        <div className="grid grid-cols-6 gap-1">
          {(Object.keys(INFO_CREDIBILITY) as InfoCredibility[]).map((i) => (
            <button
              key={i}
              onClick={() => handleInfoClick(i)}
              disabled={readOnly}
              className={`
                p-2 rounded-lg text-center transition-all
                ${info === i
                  ? `${INFO_CREDIBILITY[i].color} text-white ring-2 ring-white/50`
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }
                ${readOnly ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
              `}
              title={INFO_CREDIBILITY[i].description}
            >
              <span className="text-lg font-bold">{i}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      {showNotes && !readOnly && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            Justificativa (opcional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Por que esta classificação foi escolhida..."
            className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-sm text-white placeholder-gray-500 resize-none"
            rows={2}
          />
        </div>
      )}
    </div>
  );
}

// ============================================================================
// COMPACT BADGE
// ============================================================================

interface ProvenanceBadgeProps {
  rating: ProvenanceRating;
  showTooltip?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ProvenanceBadge({
  rating,
  showTooltip = true,
  size = 'md',
  className = '',
}: ProvenanceBadgeProps) {
  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1 rounded font-mono font-bold
        ${getRatingColor(rating)} text-white
        ${sizeClasses[size]} ${className}
      `}
      title={showTooltip ? getRatingLabel(rating) : undefined}
    >
      <Shield className="w-3 h-3" />
      {rating}
    </span>
  );
}

// ============================================================================
// QUICK SELECTOR (Inline)
// ============================================================================

interface QuickProvenanceSelectorProps {
  value?: ProvenanceRating;
  onChange?: (rating: ProvenanceRating) => void;
  presets?: ProvenanceRating[];
  className?: string;
}

const DEFAULT_PRESETS: ProvenanceRating[] = ['A1', 'B2', 'C3', 'D4', 'E5', 'F6'];

export function QuickProvenanceSelector({
  value,
  onChange,
  presets = DEFAULT_PRESETS,
  className = '',
}: QuickProvenanceSelectorProps) {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {presets.map((preset) => (
        <button
          key={preset}
          onClick={() => onChange?.(preset)}
          className={`
            px-2 py-1 rounded text-xs font-mono font-bold transition-all
            ${value === preset
              ? `${getRatingColor(preset)} text-white ring-2 ring-white/30`
              : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }
          `}
          title={getRatingLabel(preset)}
        >
          {preset}
        </button>
      ))}
    </div>
  );
}
