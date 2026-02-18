/**
 * Cron Job: Daily Law Sync
 * 
 * GET /api/cron/sync-laws
 * - Triggered daily by Vercel Cron
 * - Syncs criminal law database with official sources
 * 
 * Vercel Cron Config (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/sync-laws",
 *     "schedule": "0 6 * * *"  // 6 AM UTC daily (3 AM BRT)
 *   }]
 * }
 * 
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { syncLaws, getSyncStatus } from '@/lib/legal/law-sync-service';

// Verify cron secret to prevent unauthorized access
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(req: NextRequest) {
    try {
        // Verify authorization
        const authHeader = req.headers.get('authorization');
        
        // Allow Vercel cron (no auth needed from Vercel)
        const isVercelCron = req.headers.get('x-vercel-cron') === '1';
        
        // Or verify with secret
        const isAuthorized = isVercelCron || 
            (CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`);

        if (!isAuthorized && CRON_SECRET) {
            console.warn('[Cron] Unauthorized sync attempt');
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        console.log('[Cron] Starting daily law sync...');
        const startTime = Date.now();

        // Get current status before sync
        const statusBefore = getSyncStatus();
        
        // Perform sync
        const result = await syncLaws();
        
        const duration = Date.now() - startTime;

        // Log results
        const summary = {
            success: result.success,
            synced_at: new Date().toISOString(),
            duration_ms: duration,
            laws_checked: result.lawsChecked,
            updates_found: result.updatesFound,
            errors_count: result.errors.length,
            updates: result.updates.map((u) => ({
                law: u.lawName,
                hasUpdate: u.hasUpdates,
                lastChecked: u.lastChecked
            }))
        };

        console.log(`[Cron] Sync complete in ${duration}ms:`, summary);

        // Return summary
        return NextResponse.json({
            success: true,
            message: 'Law sync completed',
            summary
        });

    } catch (error: any) {
        console.error('[Cron] Sync error:', error);
        
        return NextResponse.json({
            success: false,
            error: error.message || 'Sync failed',
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}

// Also allow POST for manual triggering
export async function POST(req: NextRequest) {
    return GET(req);
}
