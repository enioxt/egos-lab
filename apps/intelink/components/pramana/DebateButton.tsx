'use client';

/**
 * DebateButton - Challenge AI conclusions with Tsun-cha Protocol
 * 
 * When clicked, prompts the AI to justify its reasoning with evidence.
 * "The Challenger demands proof from the Defender."
 * 
 * @see .guarani/philosophy/TSUN_CHA_PROTOCOL.md
 */

import { useState } from 'react';
import { MessageSquareWarning, Loader2, CheckCircle, XCircle } from 'lucide-react';

interface DebateButtonProps {
  /** The AI conclusion/assertion to challenge */
  assertion: string;
  /** Context: entity ID, investigation ID, etc. */
  context?: {
    entityId?: string;
    investigationId?: string;
    source?: string;
  };
  /** Callback when debate result is received */
  onDebateResult?: (result: DebateResult) => void;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional className */
  className?: string;
}

interface DebateResult {
  valid: boolean;
  reasoning: string;
  evidence: string[];
  confidence: number;
}

const SIZE_CLASSES = {
  sm: 'px-2 py-1 text-xs gap-1',
  md: 'px-3 py-1.5 text-sm gap-1.5',
  lg: 'px-4 py-2 text-base gap-2',
};

export function DebateButton({
  assertion,
  context,
  onDebateResult,
  size = 'sm',
  className = '',
}: DebateButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DebateResult | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleDebate = async () => {
    setIsLoading(true);
    setShowResult(false);

    try {
      const response = await fetch('/api/debate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assertion,
          context,
          mode: 'challenge', // Tsun-cha mode
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to challenge assertion');
      }

      const data: DebateResult = await response.json();
      setResult(data);
      setShowResult(true);
      onDebateResult?.(data);
    } catch (error) {
      console.error('Debate error:', error);
      setResult({
        valid: false,
        reasoning: 'Não foi possível verificar esta afirmação no momento.',
        evidence: [],
        confidence: 0,
      });
      setShowResult(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={handleDebate}
        disabled={isLoading}
        className={`
          inline-flex items-center rounded-md font-medium
          bg-amber-500/20 text-amber-400 hover:bg-amber-500/30
          border border-amber-500/50 hover:border-amber-500
          transition-all disabled:opacity-50 disabled:cursor-not-allowed
          ${SIZE_CLASSES[size]} ${className}
        `}
        title="Tsun-cha: Desafiar esta conclusão"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <MessageSquareWarning className="w-4 h-4" />
        )}
        <span>Debater</span>
      </button>

      {/* Result Tooltip */}
      {showResult && result && (
        <div className="absolute z-50 mt-2 left-0 w-72 p-3 rounded-lg bg-gray-900 border border-gray-700 shadow-xl">
          <div className="flex items-start gap-2">
            {result.valid ? (
              <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <p className="text-sm font-medium text-white mb-1">
                {result.valid ? 'Afirmação Sustentada' : 'Afirmação Questionável'}
              </p>
              <p className="text-xs text-gray-400 mb-2">{result.reasoning}</p>
              
              {result.evidence.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-700">
                  <p className="text-xs text-gray-500 mb-1">Evidências:</p>
                  <ul className="text-xs text-gray-400 space-y-1">
                    {result.evidence.map((ev, i) => (
                      <li key={i}>• {ev}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-1 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${result.valid ? 'bg-emerald-500' : 'bg-red-500'}`}
                    style={{ width: `${result.confidence * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500">
                  {Math.round(result.confidence * 100)}%
                </span>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => setShowResult(false)}
            className="absolute top-1 right-1 p-1 text-gray-500 hover:text-gray-300"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Inline version for use in text/cards
 */
export function DebateIcon({
  assertion,
  context,
  onDebateResult,
}: Omit<DebateButtonProps, 'size' | 'className'>) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDebate = async () => {
    setIsLoading(true);
    // Same logic as DebateButton but simplified
    try {
      const response = await fetch('/api/debate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assertion, context, mode: 'challenge' }),
      });
      const data = await response.json();
      onDebateResult?.(data);
    } catch (error) {
      console.error('Debate error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleDebate}
      disabled={isLoading}
      className="inline-flex items-center justify-center w-5 h-5 rounded text-amber-400 hover:bg-amber-500/20 transition-colors"
      title="Desafiar esta afirmação"
    >
      {isLoading ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : (
        <MessageSquareWarning className="w-3 h-3" />
      )}
    </button>
  );
}
