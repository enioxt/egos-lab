import { ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: 'default' | 'interactive' | 'highlight';
}

export function Card({ 
  children, 
  className, 
  onClick,
  variant = 'default' 
}: CardProps) {
  const variants = {
    default: 'bg-gray-800 border-gray-700',
    interactive: 'bg-gray-800 border-gray-700 cursor-pointer hover:border-gray-600 hover:bg-gray-750 transition-all',
    highlight: 'bg-gray-800 border-amber-500/30 hover:border-amber-500/50',
  };

  return (
    <div 
      className={twMerge(
        'border rounded-xl p-4',
        variants[variant],
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

// Card Header
interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}

export function CardHeader({ title, subtitle, action, className }: CardHeaderProps) {
  return (
    <div className={twMerge('flex items-start justify-between mb-4', className)}>
      <div>
        <h3 className="text-lg font-semibold text-gray-100">{title}</h3>
        {subtitle && <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// Card Content
interface CardContentProps {
  children: ReactNode;
  className?: string;
}

export function CardContent({ children, className }: CardContentProps) {
  return (
    <div className={twMerge('', className)}>
      {children}
    </div>
  );
}

// Card Footer
interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

export function CardFooter({ children, className }: CardFooterProps) {
  return (
    <div className={twMerge('mt-4 pt-4 border-t border-gray-700', className)}>
      {children}
    </div>
  );
}

export default Card;
