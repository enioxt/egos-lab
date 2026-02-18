'use client';

import React from 'react';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'circular' | 'rectangular';
    width?: string | number;
    height?: string | number;
    animation?: 'pulse' | 'wave' | 'none';
}

export function Skeleton({ 
    className = '', 
    variant = 'rectangular',
    width,
    height,
    animation = 'pulse'
}: SkeletonProps) {
    const baseClasses = 'bg-slate-700/50';
    const animationClasses = {
        pulse: 'animate-pulse',
        wave: 'animate-shimmer',
        none: ''
    };
    const variantClasses = {
        text: 'rounded',
        circular: 'rounded-full',
        rectangular: 'rounded-lg'
    };

    const style: React.CSSProperties = {
        width: width,
        height: height
    };

    return (
        <div 
            className={`${baseClasses} ${animationClasses[animation]} ${variantClasses[variant]} ${className}`}
            style={style}
        />
    );
}

// Pre-built skeleton components for common patterns
export function SkeletonCard() {
    return (
        <div className="bg-slate-800/50 rounded-xl p-4 space-y-3 border border-slate-700/50">
            <div className="flex items-center gap-3">
                <Skeleton variant="circular" width={40} height={40} />
                <div className="flex-1 space-y-2">
                    <Skeleton height={16} width="60%" />
                    <Skeleton height={12} width="40%" />
                </div>
            </div>
            <Skeleton height={12} width="100%" />
            <Skeleton height={12} width="80%" />
        </div>
    );
}

export function SkeletonStats() {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                    <Skeleton height={12} width="50%" className="mb-2" />
                    <Skeleton height={28} width="70%" />
                </div>
            ))}
        </div>
    );
}

export function SkeletonInvestigationList({ count = 3 }: { count?: number }) {
    return (
        <div className="space-y-3">
            {[...Array(count)].map((_, i) => (
                <div key={i} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                            <Skeleton variant="circular" width={36} height={36} />
                            <div className="flex-1 space-y-2">
                                <Skeleton height={16} width="40%" />
                                <div className="flex gap-2">
                                    <Skeleton height={12} width={60} />
                                    <Skeleton height={12} width={80} />
                                </div>
                            </div>
                        </div>
                        <Skeleton width={24} height={24} variant="circular" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function SkeletonHero() {
    return (
        <div className="bg-slate-800/30 rounded-3xl p-8 border border-slate-700/50">
            <div className="flex items-center gap-5">
                <Skeleton variant="rectangular" width={72} height={72} className="rounded-2xl" />
                <div className="space-y-2 flex-1">
                    <Skeleton height={32} width="40%" />
                    <Skeleton height={16} width="60%" />
                    <div className="flex gap-2 mt-3">
                        <Skeleton height={24} width={80} className="rounded-full" />
                        <Skeleton height={24} width={80} className="rounded-full" />
                        <Skeleton height={24} width={80} className="rounded-full" />
                    </div>
                </div>
            </div>
        </div>
    );
}

export function SkeletonQuickActions() {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                    <div className="flex items-center gap-3">
                        <Skeleton variant="rectangular" width={40} height={40} className="rounded-lg" />
                        <div className="flex-1 space-y-2">
                            <Skeleton height={14} width="70%" />
                            <Skeleton height={10} width="90%" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default Skeleton;
