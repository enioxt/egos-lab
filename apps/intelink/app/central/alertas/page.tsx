'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SkeletonPage } from '@/components/shared/Skeleton';

/**
 * Redirect: /central/alertas → /central/vinculos
 * 
 * A página de alertas foi incorporada à página de vínculos,
 * que agora unifica alertas + jobs em uma única interface.
 */
export default function AlertasRedirect() {
    const router = useRouter();
    
    useEffect(() => {
        router.replace('/central/vinculos');
    }, [router]);
    
    return <SkeletonPage />;
}
