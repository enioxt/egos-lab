/**
 * POST /api/documents/check-duplicate
 * 
 * Verifica se um documento já foi processado no sistema.
 * Usa hash SHA-256 como critério primário, fallback para nome+tamanho.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/api-utils';
import crypto from 'crypto';
import { withSecurity, AuthContext } from '@/lib/api-security';

async function handlePost(request: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const investigationId = formData.get('investigation_id') as string | null;

        if (!file) {
            return NextResponse.json(
                { error: 'Arquivo não enviado' },
                { status: 400 }
            );
        }

        // Compute SHA-256 hash
        const buffer = Buffer.from(await file.arrayBuffer());
        const hash = crypto.createHash('sha256').update(buffer).digest('hex');
        
        // Check for duplicates using RPC function
        const supabase = getSupabaseAdmin();
        const { data: duplicates, error } = await supabase.rpc(
            'check_document_duplicate',
            {
                p_file_hash: hash,
                p_file_size: file.size,
                p_file_name: file.name
            }
        );

        if (error) {
            console.error('Duplicate check error:', error);
            // If function doesn't exist yet, fallback to direct query
            if (error.message.includes('does not exist')) {
                // Fallback: check by hash first, then by filename+size
                let fallbackDuplicates: any[] = [];
                
                // Try by hash first
                const { data: hashMatches } = await supabase
                    .from('intelink_documents')
                    .select(`
                        id,
                        investigation_id,
                        document_type,
                        title,
                        numero_ocorrencia,
                        summary,
                        created_at,
                        investigation:intelink_investigations(title)
                    `)
                    .eq('file_hash', hash)
                    .limit(5);
                
                if (hashMatches && hashMatches.length > 0) {
                    fallbackDuplicates = hashMatches;
                } else {
                    // Try by filename + size
                    const { data: nameMatches } = await supabase
                        .from('intelink_documents')
                        .select(`
                            id,
                            investigation_id,
                            document_type,
                            title,
                            numero_ocorrencia,
                            summary,
                            created_at,
                            investigation:intelink_investigations(title)
                        `)
                        .eq('original_filename', file.name)
                        .eq('original_size_bytes', file.size)
                        .limit(5);
                    
                    if (nameMatches) fallbackDuplicates = nameMatches;
                }

                if (fallbackDuplicates && fallbackDuplicates.length > 0) {
                    return NextResponse.json({
                        isDuplicate: true,
                        hash,
                        matches: fallbackDuplicates.map((d: any) => ({
                            document_id: d.id,
                            investigation_id: d.investigation_id,
                            investigation_title: d.investigation?.title || 'Operação',
                            unit_name: d.investigation?.unit?.name || null,
                            document_type: d.document_type,
                            uploaded_at: d.created_at,
                            match_type: 'fallback',
                            is_same_investigation: d.investigation_id === investigationId
                        }))
                    });
                }

                return NextResponse.json({
                    isDuplicate: false,
                    hash,
                    matches: []
                });
            }
            
            return NextResponse.json(
                { error: 'Erro ao verificar duplicidade' },
                { status: 500 }
            );
        }

        const matches = duplicates || [];
        const isDuplicate = matches.length > 0;

        // Add flag if duplicate is in same investigation
        const matchesWithContext = matches.map((m: any) => ({
            ...m,
            is_same_investigation: m.investigation_id === investigationId
        }));

        return NextResponse.json({
            isDuplicate,
            hash,
            matches: matchesWithContext,
            message: isDuplicate 
                ? `Documento encontrado em ${matches.length} operação(ões)` 
                : 'Documento novo'
        });

    } catch (error) {
        console.error('Check duplicate error:', error);
        return NextResponse.json(
            { error: 'Erro ao verificar duplicata', details: String(error) },
            { status: 500 }
        );
    }
}

// Protected: Only member+ can check duplicates
export const POST = withSecurity(handlePost, { requiredRole: 'member' });
