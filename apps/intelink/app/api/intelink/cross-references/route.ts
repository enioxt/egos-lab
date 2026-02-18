import { NextRequest, NextResponse } from 'next/server';
import { 
    findCrossReferences, 
    findAllCrossReferences,
    getConfidenceLevel 
} from '@/lib/intelink/cross-reference-service';
import { withSecurity, AuthContext } from '@/lib/api-security';

/**
 * GET /api/intelink/cross-references?investigation_id=xxx
 * Get all cross-references for an investigation
 */
async function handleGet(req: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        const investigationId = req.nextUrl.searchParams.get('investigation_id');
        
        if (!investigationId) {
            return NextResponse.json({ error: 'investigation_id required' }, { status: 400 });
        }

        const matches = await findAllCrossReferences(investigationId);
        
        // Add confidence level info
        const enrichedMatches = matches.map(match => ({
            ...match,
            confidenceLevel: getConfidenceLevel(match.matchConfidence)
        }));

        return NextResponse.json({ 
            matches: enrichedMatches,
            count: enrichedMatches.length
        });

    } catch (error) {
        console.error('[Cross-References GET] Error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

/**
 * POST /api/intelink/cross-references/check
 * Check cross-references for a specific entity before inserting
 */
async function handlePost(req: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        const body = await req.json();
        const { type, name, metadata, exclude_investigation_id } = body;

        if (!type || !name) {
            return NextResponse.json({ error: 'type and name required' }, { status: 400 });
        }

        const matches = await findCrossReferences(
            { type, name, metadata },
            exclude_investigation_id
        );

        // Add confidence level info
        const enrichedMatches = matches.map(match => ({
            ...match,
            confidenceLevel: getConfidenceLevel(match.matchConfidence)
        }));

        return NextResponse.json({ 
            matches: enrichedMatches,
            count: enrichedMatches.length,
            hasHighConfidence: enrichedMatches.some(m => m.matchConfidence >= 90)
        });

    } catch (error) {
        console.error('[Cross-References POST] Error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

// Protected: Only member+ can access cross-references
export const GET = withSecurity(handleGet, { requiredRole: 'member' });
export const POST = withSecurity(handlePost, { requiredRole: 'member' });
