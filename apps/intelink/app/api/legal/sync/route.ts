/**
 * Law Synchronization API
 * 
 * GET /api/legal/sync - Get sync status
 * POST /api/legal/sync - Trigger sync check
 * 
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { syncLaws, getSyncStatus, getTrackedLaws } from '@/lib/legal/law-sync-service';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const detailed = searchParams.get('detailed') === 'true';

        const status = getSyncStatus();

        if (detailed) {
            const trackedLaws = getTrackedLaws();
            return NextResponse.json({
                success: true,
                ...status,
                laws: trackedLaws
            });
        }

        return NextResponse.json({
            success: true,
            ...status
        });

    } catch (error: any) {
        console.error('[Sync API] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Erro ao verificar status' },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        console.log('[Sync API] Starting law synchronization...');

        const result = await syncLaws();

        // Log updates found
        if (result.updatesFound > 0) {
            console.log('[Sync API] Updates found:', result.updates.filter(u => u.hasUpdates));
        }

        return NextResponse.json({
            message: result.updatesFound > 0 
                ? `${result.updatesFound} lei(s) com atualizações detectadas` 
                : 'Todas as leis estão atualizadas',
            success: result.success,
            checkedAt: result.checkedAt,
            lawsChecked: result.lawsChecked,
            updatesFound: result.updatesFound,
            updates: result.updates,
            errors: result.errors
        });

    } catch (error: any) {
        console.error('[Sync API] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Erro ao sincronizar leis' },
            { status: 500 }
        );
    }
}
