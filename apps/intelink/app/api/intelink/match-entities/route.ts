import { NextRequest, NextResponse } from 'next/server';
import { extractCandidatesRegex, findMatchesInDB } from '@/lib/intelink/entity-matcher';
import { withSecurity, AuthContext } from '@/lib/api-security';

/**
 * POST /api/intelink/match-entities
 * Extract and match entities from text
 */
async function handlePost(request: NextRequest, auth: AuthContext) {
    try {
        const body = await request.json();
        const { text } = body;

        if (!text || text.length < 10) {
            return NextResponse.json({ error: 'Texto muito curto para análise' }, { status: 400 });
        }

        // 1. Extração rápida (Regex)
        const candidates = extractCandidatesRegex(text);

        // 2. Busca no Banco (Matches Exatos) - TENANT ISOLATED
        const matches = await findMatchesInDB(candidates, auth.unitId);

        // 3. (Futuro) Extração LLM para nomes sem identificador
        // Isso seria mais lento, ideal fazer em background ou on-demand

        return NextResponse.json({
            success: true,
            matches: matches,
            stats: {
                candidates: candidates.length,
                matches: matches.filter(m => m.dbEntity).length
            }
        });

    } catch (error) {
        console.error('[Entity Matcher] Error:', error);
        return NextResponse.json(
            { error: 'Erro ao processar texto' },
            { status: 500 }
        );
    }
}

// Protegido com autenticação (member+)
export const POST = withSecurity(handlePost, { requiredRole: 'member' });
