'use client';

/**
 * PramanaBadge - Visual indicator for Fact vs Inference
 * 
 * Tsun-cha Protocol: The visual "snap" of truth
 * - Green solid = Verified Fact
 * - Purple dashed = AI Inference
 * - Amber dotted = Disputed/Under Debate
 * 
 * @see lib/pramana/confidence-system.ts
 */

import { ConfidenceLevel, PRAMANA_STYLES } from '@/lib/pramana/confidence-system';

interface PramanaBadgeProps {
  level: ConfidenceLevel;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_CLASSES = {
  sm: 'px-1.5 py-0.5 text-[10px]',
  md: 'px-2 py-0.5 text-xs',
  lg: 'px-3 py-1 text-sm',
};

export function PramanaBadge({ 
  level, 
  showLabel = true, 
  size = 'md',
  className = '' 
}: PramanaBadgeProps) {
  const style = PRAMANA_STYLES[level];
  
  return (
    <span 
      className={`
        inline-flex items-center gap-1 rounded-full font-medium
        ${style.badge} ${SIZE_CLASSES[size]} ${className}
      `}
      title={style.label}
    >
      <span>{style.icon}</span>
      {showLabel && <span>{style.label}</span>}
    </span>
  );
}

/**
 * Entity card wrapper with Pramana visual styling
 */
interface PramanaCardProps {
  level: ConfidenceLevel;
  children: React.ReactNode;
  className?: string;
}

export function PramanaCard({ level, children, className = '' }: PramanaCardProps) {
  const style = PRAMANA_STYLES[level];
  
  return (
    <div 
      className={`
        rounded-lg border-2 p-4 transition-all
        ${style.border} ${style.bg} ${className}
      `}
    >
      {children}
    </div>
  );
}

/**
 * Inline confidence indicator (minimal)
 */
export function PramanaIndicator({ level }: { level: ConfidenceLevel }) {
  const style = PRAMANA_STYLES[level];
  
  return (
    <span 
      className={`inline-block w-2 h-2 rounded-full ${style.badge.split(' ')[0]}`}
      title={style.label}
    />
  );
}
