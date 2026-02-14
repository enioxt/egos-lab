'use client';

/**
 * LazyComponent - Wrapper for dynamic imports with loading state
 * Reduces TBT by code-splitting heavy components
 */

import dynamic from 'next/dynamic';
import { ComponentType, ReactNode, useState, useEffect, useRef } from 'react';
import { Skeleton } from './skeleton';

interface LazyComponentOptions {
  loading?: ReactNode;
  ssr?: boolean;
}

/**
 * Creates a lazy-loaded component with automatic loading state
 * Usage: const HeavyChart = createLazyComponent(() => import('./HeavyChart'))
 */
export function createLazyComponent<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  options: LazyComponentOptions = {}
) {
  const { loading, ssr = false } = options;
  
  return dynamic(importFn, {
    loading: () => (loading as React.ReactElement) || <DefaultLoadingState />,
    ssr,
  });
}

function DefaultLoadingState() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="space-y-3 w-full max-w-md">
        <Skeleton className="h-4 w-3/4 mx-auto" />
        <Skeleton className="h-4 w-1/2 mx-auto" />
      </div>
    </div>
  );
}

/**
 * IntersectionObserver-based lazy loading for viewport visibility
 */
export function LazyOnVisible({ 
  children, 
  fallback,
  rootMargin = '100px',
}: { 
  children: ReactNode;
  fallback?: ReactNode;
  rootMargin?: string;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [rootMargin]);

  return (
    <div ref={ref}>
      {isVisible ? children : (fallback || <Skeleton className="h-32 w-full" />)}
    </div>
  );
}

/**
 * InfiniteScroll - Load more items when scrolling near the bottom
 * Usage:
 * <InfiniteScroll
 *   hasMore={hasMore}
 *   isLoading={isLoading}
 *   onLoadMore={() => fetchNextPage()}
 * >
 *   {items.map(item => <Card key={item.id} />)}
 * </InfiniteScroll>
 */
export function InfiniteScroll({
  children,
  hasMore,
  isLoading,
  onLoadMore,
  loader,
  endMessage,
  threshold = '200px',
  className,
}: {
  children: ReactNode;
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  loader?: ReactNode;
  endMessage?: ReactNode;
  threshold?: string;
  className?: string;
}) {
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasMore || isLoading) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onLoadMore();
        }
      },
      { rootMargin: threshold }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoading, onLoadMore, threshold]);

  return (
    <div className={className}>
      {children}
      
      <div ref={loadMoreRef} className="py-4">
        {isLoading && (
          loader || (
            <div className="flex justify-center">
              <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )
        )}
        
        {!hasMore && !isLoading && endMessage}
      </div>
    </div>
  );
}

