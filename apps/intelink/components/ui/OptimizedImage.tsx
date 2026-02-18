'use client';

/**
 * OptimizedImage Component
 * 
 * Wrapper around Next.js Image with:
 * - Lazy loading by default
 * - Blur placeholder
 * - Error handling
 * - Loading skeleton
 * 
 * @version 1.0.0
 */

import React, { useState } from 'react';
import Image, { ImageProps } from 'next/image';
import { Skeleton } from './Skeleton';
import { ImageOff } from 'lucide-react';

interface OptimizedImageProps extends Omit<ImageProps, 'onError' | 'onLoad'> {
    fallback?: React.ReactNode;
    showSkeleton?: boolean;
}

export function OptimizedImage({
    src,
    alt,
    fallback,
    showSkeleton = true,
    className = '',
    ...props
}: OptimizedImageProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    if (hasError) {
        return fallback || (
            <div 
                className={`flex items-center justify-center bg-slate-800 text-slate-500 ${className}`}
                style={{ width: props.width, height: props.height }}
            >
                <ImageOff className="w-6 h-6" />
            </div>
        );
    }

    return (
        <div className="relative" style={{ width: props.width, height: props.height }}>
            {isLoading && showSkeleton && (
                <Skeleton 
                    className="absolute inset-0" 
                    width="100%" 
                    height="100%" 
                />
            )}
            <Image
                src={src}
                alt={alt}
                className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
                onLoad={() => setIsLoading(false)}
                onError={() => setHasError(true)}
                loading="lazy"
                {...props}
            />
        </div>
    );
}

/**
 * Avatar component with optimizations
 */
export function OptimizedAvatar({
    src,
    alt,
    size = 40,
    fallbackInitials,
    className = '',
}: {
    src?: string;
    alt: string;
    size?: number;
    fallbackInitials?: string;
    className?: string;
}) {
    const [hasError, setHasError] = useState(false);

    // Generate initials from alt text
    const initials = fallbackInitials || alt
        .split(' ')
        .map(word => word[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    if (!src || hasError) {
        return (
            <div 
                className={`flex items-center justify-center bg-slate-700 text-slate-300 font-medium rounded-full ${className}`}
                style={{ width: size, height: size, fontSize: size * 0.4 }}
            >
                {initials}
            </div>
        );
    }

    return (
        <Image
            src={src}
            alt={alt}
            width={size}
            height={size}
            className={`rounded-full object-cover ${className}`}
            onError={() => setHasError(true)}
            loading="lazy"
        />
    );
}

export default OptimizedImage;
