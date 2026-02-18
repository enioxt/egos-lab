/**
 * POST /api/links/verify
 * 
 * Verifies a match using LLM analysis
 * For uncertain matches (70-89% confidence)
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyMatch, MatchVerificationRequest } from '@/lib/intelink/llm-verifier';
import { getSupabaseAdmin } from '@/lib/api-utils';
import { withSecurity, AuthContext } from '@/lib/api-security';

async function handlePost(request: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        const body = await request.json();
        const { entity1, entity2, matchCriteria, currentConfidence, linkId } = body;
        
        // Validate required fields
        if (!entity1 || !entity2) {
            return NextResponse.json({ error: 'entity1 and entity2 required' }, { status: 400 });
        }
        
        // Build verification request
        const verificationRequest: MatchVerificationRequest = {
            entity1: {
                name: entity1.name,
                type: entity1.type,
                metadata: entity1.metadata,
                investigationTitle: entity1.investigationTitle,
            },
            entity2: {
                name: entity2.name,
                type: entity2.type,
                metadata: entity2.metadata,
                investigationTitle: entity2.investigationTitle,
            },
            matchCriteria: matchCriteria || {},
            currentConfidence: currentConfidence || 75,
        };
        
        // Run LLM verification
        const result = await verifyMatch(verificationRequest);
        
        // Update link if provided
        if (linkId && result.verified !== null) {
            const supabase = getSupabaseAdmin();
            
            await supabase
                .from('intelink_entity_links')
                .update({
                    llm_verification: {
                        verified: result.verified,
                        confidence: result.confidence,
                        reasoning: result.reasoning,
                        suggestedAction: result.suggestedAction,
                        model: result.model,
                        verifiedAt: new Date().toISOString(),
                    },
                    confidence_score: result.confidence, // Update confidence
                    updated_at: new Date().toISOString(),
                })
                .eq('id', linkId);
        }
        
        return NextResponse.json({
            success: true,
            verification: result,
        });
        
    } catch (error: any) {
        console.error('[Links/Verify] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Protected: Only member+ can verify links
export const POST = withSecurity(handlePost, { requiredRole: 'member' });
