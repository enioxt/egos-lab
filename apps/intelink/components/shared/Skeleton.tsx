'use client';

/**
 * Skeleton Loaders - For loading states
 * 
 * Usage:
 * <Skeleton className="h-4 w-32" />
 * <SkeletonCard />
 * <SkeletonTable rows={5} />
 */

import { cn } from '@/lib/utils';

interface SkeletonProps {
    className?: string;
}

/**
 * Basic skeleton element with pulse animation
 */
export function Skeleton({ className }: SkeletonProps) {
    return (
        <div
            className={cn(
                'animate-pulse rounded-md bg-slate-700/50',
                className
            )}
        />
    );
}

/**
 * Skeleton for card layouts
 */
export function SkeletonCard() {
    return (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 space-y-3">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
            <div className="flex gap-2 pt-2">
                <Skeleton className="h-8 w-20 rounded-lg" />
                <Skeleton className="h-8 w-20 rounded-lg" />
            </div>
        </div>
    );
}

/**
 * Skeleton for list items
 */
export function SkeletonListItem() {
    return (
        <div className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-2/3" />
            </div>
            <Skeleton className="h-6 w-16 rounded" />
        </div>
    );
}

/**
 * Skeleton for table
 */
export function SkeletonTable({ rows = 5 }: { rows?: number }) {
    return (
        <div className="space-y-2">
            {/* Header */}
            <div className="grid grid-cols-4 gap-4 p-3 bg-slate-800/50 rounded-lg">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-12" />
            </div>
            {/* Rows */}
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="grid grid-cols-4 gap-4 p-3 bg-slate-800/30 rounded-lg">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                </div>
            ))}
        </div>
    );
}

/**
 * Skeleton for investigation page
 */
export function SkeletonInvestigation() {
    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-40" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-24 rounded-lg" />
                    <Skeleton className="h-10 w-24 rounded-lg" />
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-slate-800/50 rounded-xl p-4">
                        <Skeleton className="h-4 w-20 mb-2" />
                        <Skeleton className="h-8 w-16" />
                    </div>
                ))}
            </div>

            {/* Content */}
            <div className="grid grid-cols-2 gap-6">
                <SkeletonCard />
                <SkeletonCard />
            </div>
        </div>
    );
}

/**
 * Skeleton for chat messages
 */
export function SkeletonChat() {
    return (
        <div className="space-y-4 p-4">
            {/* User message */}
            <div className="flex justify-end">
                <Skeleton className="h-12 w-2/3 rounded-2xl" />
            </div>
            {/* AI message */}
            <div className="flex justify-start">
                <div className="space-y-2 w-3/4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-4/6" />
                </div>
            </div>
            {/* User message */}
            <div className="flex justify-end">
                <Skeleton className="h-10 w-1/2 rounded-2xl" />
            </div>
            {/* AI typing */}
            <div className="flex justify-start">
                <Skeleton className="h-8 w-24 rounded-2xl" />
            </div>
        </div>
    );
}

/**
 * Full page loading skeleton
 */
export function SkeletonPage() {
    return (
        <div className="min-h-screen bg-slate-950 p-6">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="space-y-2">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-3 w-32" />
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2 space-y-4">
                    <SkeletonCard />
                    <SkeletonCard />
                </div>
                <div className="space-y-4">
                    <SkeletonCard />
                    <SkeletonListItem />
                    <SkeletonListItem />
                    <SkeletonListItem />
                </div>
            </div>
        </div>
    );
}

/**
 * Skeleton for operations list (Central de Vínculos)
 */
export function SkeletonOperationsList({ count = 3 }: { count?: number }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                    {/* Header with confidence + status */}
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-7 w-14 rounded-lg" />
                            <Skeleton className="h-5 w-20 rounded" />
                            <Skeleton className="h-4 w-16" />
                        </div>
                        <div className="flex gap-2">
                            <Skeleton className="h-10 w-10 rounded-lg" />
                            <Skeleton className="h-10 w-10 rounded-lg" />
                        </div>
                    </div>
                    {/* Narrative content */}
                    <div className="bg-slate-800/50 rounded-lg p-3 space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-4/5" />
                    </div>
                    {/* Badges */}
                    <div className="flex gap-2 mt-3">
                        <Skeleton className="h-5 w-16 rounded" />
                        <Skeleton className="h-5 w-20 rounded" />
                        <Skeleton className="h-5 w-14 rounded" />
                    </div>
                </div>
            ))}
        </div>
    );
}

/**
 * Skeleton for select dropdown loading
 */
export function SkeletonSelect() {
    return (
        <div className="relative">
            <Skeleton className="h-10 w-full rounded-lg" />
        </div>
    );
}

export default Skeleton;
