/**
 * POST /api/documents/embeddings
 * 
 * Generates embeddings for a document and stores in Supabase
 * Also finds similar documents in other investigations
 * 
 * IMPORTANT: Uses OpenRouter API (NOT OpenAI directly)
 * Model: openai/text-embedding-3-small via OpenRouter
 * 
 * @see https://openrouter.ai/docs/api/reference/embeddings
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/api-utils';
import crypto from 'crypto';
import { withSecurity, AuthContext } from '@/lib/api-security';

// Initialize Supabase with service role for background operations
const supabase = getSupabaseAdmin();

// OpenRouter embeddings configuration
// Uses OpenAI's embedding model via OpenRouter proxy
const EMBEDDING_MODEL = 'openai/text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;

interface EmbeddingRequest {
    document_id: string;
    investigation_id: string;
    content: string;
    find_similar?: boolean;
}

/**
 * Generate embedding using OpenRouter API
 * @see https://openrouter.ai/docs/api/reference/embeddings
 */
async function generateEmbedding(text: string): Promise<number[]> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    
    if (!apiKey) {
        throw new Error('OPENROUTER_API_KEY not configured');
    }
    
    const response = await fetch('https://openrouter.ai/api/v1/embeddings', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://intelink.app',
            'X-Title': 'Intelink Document Embeddings'
        },
        body: JSON.stringify({
            model: EMBEDDING_MODEL,
            input: text.slice(0, 8000), // Limit input length
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenRouter Embedding API error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
}

async function handlePost(request: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        const body: EmbeddingRequest = await request.json();
        const { document_id, investigation_id, content, find_similar = true } = body;

        if (!document_id || !investigation_id || !content) {
            return NextResponse.json(
                { error: 'Missing required fields: document_id, investigation_id, content' },
                { status: 400 }
            );
        }

        // Check if OPENROUTER_API_KEY is configured
        if (!process.env.OPENROUTER_API_KEY) {
            console.warn('OPENROUTER_API_KEY not configured, skipping embedding generation');
            return NextResponse.json({
                success: false,
                warning: 'Embeddings not configured (OPENROUTER_API_KEY missing)',
                similar_documents: []
            });
        }

        // Calculate content hash
        const contentHash = crypto.createHash('sha256').update(content).digest('hex');

        // Check if embedding already exists for this content
        const { data: existing } = await supabase
            .from('document_embeddings')
            .select('id')
            .eq('document_id', document_id)
            .eq('content_hash', contentHash)
            .single();

        if (existing) {
            return NextResponse.json({
                success: true,
                message: 'Embedding already exists',
                embedding_id: existing.id
            });
        }

        // Generate embedding
        console.log(`Generating embedding for document ${document_id}...`);
        const embedding = await generateEmbedding(content);

        // Store embedding in Supabase
        const { data: embeddingRecord, error: insertError } = await supabase
            .from('document_embeddings')
            .insert({
                document_id,
                investigation_id,
                content_hash: contentHash,
                content_preview: content.slice(0, 500),
                embedding: embedding,
            })
            .select('id')
            .single();

        if (insertError) {
            console.error('Error storing embedding:', insertError);
            throw new Error(`Failed to store embedding: ${insertError.message}`);
        }

        // Find similar documents in other investigations
        let similarDocuments: any[] = [];
        if (find_similar) {
            const { data: matches, error: matchError } = await supabase
                .rpc('match_documents', {
                    query_embedding: embedding,
                    similarity_threshold: 0.7,
                    match_count: 10,
                    exclude_investigation_id: investigation_id
                });

            if (matchError) {
                console.error('Error finding similar documents:', matchError);
            } else if (matches && matches.length > 0) {
                // Enrich with investigation details
                const invIds = [...new Set(matches.map((m: any) => m.investigation_id))];
                const { data: investigations } = await supabase
                    .from('intelink_investigations')
                    .select('id, title')
                    .in('id', invIds);

                const invMap = new Map(investigations?.map(i => [i.id, i.title]) || []);

                similarDocuments = matches.map((m: any) => ({
                    document_id: m.document_id,
                    investigation_id: m.investigation_id,
                    investigation_title: invMap.get(m.investigation_id) || 'Unknown',
                    similarity: Math.round(m.similarity * 100) / 100,
                    content_preview: m.content_preview
                }));

                // Create cross-investigation links for high-similarity matches
                for (const match of matches.filter((m: any) => m.similarity >= 0.8)) {
                    await supabase
                        .from('cross_investigation_links')
                        .upsert({
                            source_investigation_id: investigation_id,
                            target_investigation_id: match.investigation_id,
                            source_document_id: document_id,
                            target_document_id: match.document_id,
                            link_type: 'semantic_similarity',
                            confidence: match.similarity,
                            description: `Documentos com ${Math.round(match.similarity * 100)}% de similaridade semântica`
                        }, {
                            onConflict: 'source_investigation_id,target_investigation_id,link_type'
                        });
                }
            }
        }

        return NextResponse.json({
            success: true,
            embedding_id: embeddingRecord.id,
            similar_documents: similarDocuments,
            connections_found: similarDocuments.filter(d => d.similarity >= 0.8).length
        });

    } catch (error: any) {
        console.error('Embeddings error:', error);
        return NextResponse.json(
            { error: 'Erro ao gerar embeddings', details: error.message },
            { status: 500 }
        );
    }
}

// Protected: Only member+ can generate embeddings
export const POST = withSecurity(handlePost, { requiredRole: 'member' });

/**
 * GET /api/documents/embeddings?investigation_id=xxx
 * 
 * Get cross-investigation connections for an investigation
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const investigationId = searchParams.get('investigation_id');

        if (!investigationId) {
            return NextResponse.json(
                { error: 'Missing investigation_id' },
                { status: 400 }
            );
        }

        // Get cross-investigation links
        const { data: links, error } = await supabase
            .from('cross_investigation_links')
            .select(`
                *,
                target_investigation:intelink_investigations!target_investigation_id(id, title),
                source_document:intelink_documents!source_document_id(id, title, document_type),
                target_document:intelink_documents!target_document_id(id, title, document_type)
            `)
            .or(`source_investigation_id.eq.${investigationId},target_investigation_id.eq.${investigationId}`)
            .order('confidence', { ascending: false });

        if (error) {
            throw new Error(`Failed to fetch links: ${error.message}`);
        }

        return NextResponse.json({
            investigation_id: investigationId,
            connections: links || [],
            total: links?.length || 0
        });

    } catch (error) {
        console.error('Error fetching connections:', error);
        return NextResponse.json(
            { error: 'Failed to fetch connections', details: String(error) },
            { status: 500 }
        );
    }
}
