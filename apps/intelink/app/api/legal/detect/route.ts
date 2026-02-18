/**
 * Criminal Article Detection API
 * 
 * POST /api/legal/detect
 * - Detects criminal articles in text
 * - Returns matched articles with confidence scores
 * 
 * GET /api/legal/detect?article=cp-121
 * - Get specific article details
 * 
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
    detectCriminalArticles, 
    formatDetectionResults,
    getArticleById,
    searchArticles,
    CRIMINAL_ARTICLES
} from '@/lib/legal/criminal-articles';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { text, minConfidence = 0.3, format = 'json' } = body;

        if (!text || typeof text !== 'string') {
            return NextResponse.json(
                { error: 'Campo "text" é obrigatório' },
                { status: 400 }
            );
        }

        if (text.length > 50000) {
            return NextResponse.json(
                { error: 'Texto muito longo. Máximo: 50.000 caracteres' },
                { status: 400 }
            );
        }

        const results = detectCriminalArticles(text, minConfidence);

        console.log(`[Legal API] Detected ${results.length} articles in ${text.length} chars`);

        if (format === 'text') {
            return NextResponse.json({
                success: true,
                count: results.length,
                formatted: formatDetectionResults(results)
            });
        }

        return NextResponse.json({
            success: true,
            count: results.length,
            results: results.map(r => ({
                articleId: r.article.id,
                law: r.article.law,
                lawName: r.article.lawName,
                article: r.article.article,
                title: r.article.title,
                description: r.article.description,
                penalty: r.article.penalty,
                severity: r.article.severity,
                category: r.article.category,
                confidence: r.confidence,
                confidencePercent: Math.round(r.confidence * 100),
                matchedKeywords: r.matchedKeywords,
                excerpt: r.excerpt
            }))
        });

    } catch (error: any) {
        console.error('[Legal API] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Erro ao processar texto' },
            { status: 500 }
        );
    }
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const articleId = searchParams.get('article');
        const query = searchParams.get('q');
        const category = searchParams.get('category');

        // Get specific article
        if (articleId) {
            const article = getArticleById(articleId);
            if (!article) {
                return NextResponse.json(
                    { error: 'Artigo não encontrado' },
                    { status: 404 }
                );
            }
            return NextResponse.json({ success: true, article });
        }

        // Search articles
        if (query) {
            const results = searchArticles(query);
            return NextResponse.json({
                success: true,
                count: results.length,
                articles: results
            });
        }

        // Filter by category
        if (category) {
            const results = CRIMINAL_ARTICLES.filter(a => a.category === category);
            return NextResponse.json({
                success: true,
                count: results.length,
                articles: results
            });
        }

        // Return all categories
        const categories = [...new Set(CRIMINAL_ARTICLES.map(a => a.category))];
        return NextResponse.json({
            success: true,
            totalArticles: CRIMINAL_ARTICLES.length,
            categories: categories.map(cat => ({
                name: cat,
                count: CRIMINAL_ARTICLES.filter(a => a.category === cat).length
            }))
        });

    } catch (error: any) {
        console.error('[Legal API] GET Error:', error);
        return NextResponse.json(
            { error: error.message || 'Erro ao buscar artigos' },
            { status: 500 }
        );
    }
}
