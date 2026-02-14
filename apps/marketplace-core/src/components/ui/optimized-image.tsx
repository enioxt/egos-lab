'use client';

/**
 * OptimizedImage Component
 * Wrapper around next/image with mobile-first defaults for better LCP
 */

import Image from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  fill?: boolean;
  sizes?: string;
  fallbackSrc?: string;
}

// Default avatar placeholder
const DEFAULT_AVATAR = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIGZpbGw9IiMzNzQxNTEiLz48Y2lyY2xlIGN4PSIyMCIgY3k9IjE1IiByPSI4IiBmaWxsPSIjNkI3MjgwIi8+PHBhdGggZD0iTTggMzVDOCAyOC4zNzI2IDEzLjM3MjYgMjMgMjAgMjNDMjYuNjI3NCAyMyAzMiAyOC4zNzI2IDMyIDM1SDgiIGZpbGw9IiM2QjcyODAiLz48L3N2Zz4=';

export function OptimizedImage({
  src,
  alt,
  width = 64,
  height = 64,
  className,
  priority = false,
  fill = false,
  sizes = '(max-width: 768px) 64px, 128px',
  fallbackSrc = DEFAULT_AVATAR,
}: OptimizedImageProps) {
  const [imgSrc, setImgSrc] = useState(src || fallbackSrc);
  const [isLoading, setIsLoading] = useState(true);

  const handleError = () => {
    setImgSrc(fallbackSrc);
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  // For external URLs, use regular img tag with lazy loading
  const isExternal = src?.startsWith('http') && !src.includes('supabase');

  if (isExternal) {
    return (
      <Image
        src={imgSrc}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        onError={handleError}
        className={cn(
          'object-cover transition-opacity duration-200',
          isLoading ? 'opacity-0' : 'opacity-100',
          className
        )}
        onLoad={handleLoad}
        unoptimized
      />
    );
  }

  // For internal/Supabase images, use next/image
  return (
    <Image
      src={imgSrc}
      alt={alt}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      fill={fill}
      sizes={sizes}
      priority={priority}
      loading={priority ? 'eager' : 'lazy'}
      onError={handleError}
      onLoad={handleLoad}
      className={cn(
        'object-cover transition-opacity duration-200',
        isLoading ? 'opacity-0' : 'opacity-100',
        className
      )}
    />
  );
}

// Avatar variant with circular shape
export function OptimizedAvatar({
  src,
  alt,
  size = 40,
  className,
  priority = false,
}: {
  src?: string | null;
  alt: string;
  size?: number;
  className?: string;
  priority?: boolean;
}) {
  const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(alt)}&background=f59e0b&color=111&size=${size}`;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-full bg-gray-700',
        className
      )}
      style={{ width: size, height: size }}
    >
      <OptimizedImage
        src={src || fallback}
        alt={alt}
        width={size}
        height={size}
        priority={priority}
        fallbackSrc={fallback}
        className="rounded-full"
      />
    </div>
  );
}
