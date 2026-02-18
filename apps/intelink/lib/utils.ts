import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to merge Tailwind CSS classes
 * Standard shadcn/ui pattern
 * 
 * @example
 * cn('px-4 py-2', 'bg-blue-500', conditional && 'text-white')
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
