/**
 * OCR API - Extract text from images
 * 
 * POST /api/ocr
 * - Accepts: image file (multipart/form-data) or base64 string
 * - Returns: extracted text with confidence and structured data
 * 
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
    extractTextFromImage, 
    extractTextFromBase64,
    cleanOCRText,
    extractStructuredData,
    isImageSupported 
} from '@/lib/ocr/image-ocr';

export async function POST(req: NextRequest) {
    try {
        const contentType = req.headers.get('content-type') || '';
        
        let ocrResult;
        
        // Handle multipart form data (file upload)
        if (contentType.includes('multipart/form-data')) {
            const formData = await req.formData();
            const file = formData.get('file') as File | null;
            
            if (!file) {
                return NextResponse.json(
                    { error: 'Nenhum arquivo enviado' },
                    { status: 400 }
                );
            }

            // Validate file type
            if (!isImageSupported(file.type)) {
                return NextResponse.json(
                    { error: `Formato não suportado: ${file.type}. Use PNG, JPG, BMP, TIFF, GIF ou WEBP.` },
                    { status: 400 }
                );
            }

            // Validate file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                return NextResponse.json(
                    { error: 'Arquivo muito grande. Máximo: 10MB.' },
                    { status: 400 }
                );
            }

            const buffer = await file.arrayBuffer();
            ocrResult = await extractTextFromImage(buffer);
            
        // Handle JSON with base64 image
        } else if (contentType.includes('application/json')) {
            const body = await req.json();
            const { image, url } = body;

            if (!image && !url) {
                return NextResponse.json(
                    { error: 'Envie "image" (base64) ou "url" da imagem' },
                    { status: 400 }
                );
            }

            if (image) {
                ocrResult = await extractTextFromBase64(image);
            } else {
                // URL handling would require different import
                return NextResponse.json(
                    { error: 'URL não suportado nesta versão. Use base64.' },
                    { status: 400 }
                );
            }
        } else {
            return NextResponse.json(
                { error: 'Content-Type não suportado. Use multipart/form-data ou application/json' },
                { status: 400 }
            );
        }

        if (!ocrResult.success) {
            return NextResponse.json(
                { error: 'Falha ao extrair texto da imagem' },
                { status: 500 }
            );
        }

        // Clean and extract structured data
        const cleanedText = cleanOCRText(ocrResult.text);
        const structured = extractStructuredData(cleanedText);

        console.log(`[OCR API] Extracted ${ocrResult.words} words in ${ocrResult.processingTime}ms (confidence: ${ocrResult.confidence.toFixed(1)}%)`);

        return NextResponse.json({
            success: true,
            text: cleanedText,
            rawText: ocrResult.text,
            confidence: ocrResult.confidence,
            words: ocrResult.words,
            lines: ocrResult.lines.length,
            processingTime: ocrResult.processingTime,
            structured: {
                cpfs: structured.cpfs,
                phones: structured.phones,
                plates: structured.plates,
                dates: structured.dates
            }
        });

    } catch (error: any) {
        console.error('[OCR API] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Erro ao processar imagem' },
            { status: 500 }
        );
    }
}
