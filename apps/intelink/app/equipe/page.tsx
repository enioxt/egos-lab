'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SkeletonPage } from '@/components/shared/Skeleton';

export default function EquipeRedirect() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/central/membros');
    }, [router]);

    return <SkeletonPage />;
}
