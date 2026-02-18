/**
 * Health Check API Endpoint
 * 
 * Verifica o status dos serviços críticos do Intelink:
 * - Database (Supabase)
 * - Environment variables
 * - API availability
 * 
 * Usado para:
 * - Monitoramento (PM2, Uptime Robot, etc)
 * - Deploy verification
 * - Load balancer health probes
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

interface HealthStatus {
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    version: string;
    uptime: number;
    checks: {
        database: HealthCheck;
        environment: HealthCheck;
        telegram: HealthCheck;
        llm: HealthCheck;
    };
}

interface HealthCheck {
    status: 'ok' | 'warning' | 'error';
    message: string;
    latency?: number;
}

const startTime = Date.now();

export async function GET() {
    const timestamp = new Date().toISOString();
    const checks: HealthStatus['checks'] = {
        database: { status: 'error', message: 'Not checked' },
        environment: { status: 'error', message: 'Not checked' },
        telegram: { status: 'error', message: 'Not checked' },
        llm: { status: 'error', message: 'Not checked' }
    };

    // 1. Check Environment Variables
    const requiredEnvVars = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_ROLE_KEY',
        'OPENROUTER_API_KEY'
    ];

    const missingVars = requiredEnvVars.filter(v => !process.env[v]);
    
    if (missingVars.length === 0) {
        checks.environment = { status: 'ok', message: 'All required variables set' };
    } else if (missingVars.length <= 1) {
        checks.environment = { 
            status: 'warning', 
            message: `Missing: ${missingVars.join(', ')}` 
        };
    } else {
        checks.environment = { 
            status: 'error', 
            message: `Missing ${missingVars.length} variables` 
        };
    }

    // 2. Check Database Connection
    try {
        const dbStart = Date.now();
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { error } = await supabase
            .from('intelink_investigations')
            .select('id')
            .limit(1);

        const dbLatency = Date.now() - dbStart;

        if (error) {
            checks.database = { 
                status: 'error', 
                message: error.message,
                latency: dbLatency
            };
        } else {
            checks.database = { 
                status: dbLatency < 500 ? 'ok' : 'warning',
                message: dbLatency < 500 ? 'Connected' : 'Slow response',
                latency: dbLatency
            };
        }
    } catch (e: any) {
        checks.database = { 
            status: 'error', 
            message: e.message || 'Connection failed'
        };
    }

    // 3. Check Telegram Bot Token
    if (process.env.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN_INTELINK) {
        checks.telegram = { 
            status: 'ok', 
            message: 'Token configured'
        };
    } else {
        checks.telegram = { 
            status: 'warning', 
            message: 'Token not set (bot disabled)'
        };
    }

    // 4. Check LLM API Key
    if (process.env.OPENROUTER_API_KEY) {
        checks.llm = { 
            status: 'ok', 
            message: 'OpenRouter configured'
        };
    } else {
        checks.llm = { 
            status: 'warning', 
            message: 'LLM API not configured'
        };
    }

    // Calculate overall status
    const statuses = Object.values(checks).map(c => c.status);
    let overallStatus: HealthStatus['status'] = 'healthy';
    
    if (statuses.includes('error')) {
        overallStatus = 'unhealthy';
    } else if (statuses.includes('warning')) {
        overallStatus = 'degraded';
    }

    const healthStatus: HealthStatus = {
        status: overallStatus,
        timestamp,
        version: process.env.npm_package_version || '1.0.0',
        uptime: Math.floor((Date.now() - startTime) / 1000),
        checks
    };

    // Return appropriate HTTP status
    const httpStatus = overallStatus === 'healthy' ? 200 : 
                       overallStatus === 'degraded' ? 200 : 503;

    return NextResponse.json(healthStatus, { status: httpStatus });
}

// HEAD request for simple uptime checks
export async function HEAD() {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { error } = await supabase
            .from('intelink_investigations')
            .select('id')
            .limit(1);

        if (error) {
            return new NextResponse(null, { status: 503 });
        }

        return new NextResponse(null, { status: 200 });
    } catch {
        return new NextResponse(null, { status: 503 });
    }
}
