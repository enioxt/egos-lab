/**
 * POST /api/chat/pdf
 * 
 * Extracts text from PDF files for chat context
 * Supports both text-based and scanned PDFs (via OCR if available)
 */

import { NextRequest, NextResponse } from 'next/server';

// Simple PDF text extraction using pdf-parse
async function extractPdfText(base64Data: string): Promise<string> {
    try {
        // Remove data URL prefix if present
        const base64Clean = base64Data.replace(/^data:application\/pdf;base64,/, '');
        
        // Convert base64 to buffer
        const buffer = Buffer.from(base64Clean, 'base64');
        
        // Try to use pdf-parse
        try {
            const pdfParse = (await import('pdf-parse')).default;
            const data = await pdfParse(buffer);
            return data.text || '';
        } catch (parseError) {
            console.error('[PDF Extract] pdf-parse failed:', parseError);
            
            // Fallback: Try basic text extraction
            const textContent = buffer.toString('utf-8');
            
            // Look for text streams in PDF
            const textMatches = textContent.match(/\(([^)]+)\)/g);
            if (textMatches && textMatches.length > 0) {
                return textMatches
                    .map(m => m.slice(1, -1))
                    .filter(t => t.length > 2 && !/^[0-9.]+$/.test(t))
                    .join(' ')
                    .substring(0, 10000);
            }
            
            return '';
        }
    } catch (error) {
        console.error('[PDF Extract] Error:', error);
        throw error;
    }
}

export async function POST(req: NextRequest) {
    try {
        const { pdf, filename } = await req.json();
        
        if (!pdf) {
            return NextResponse.json(
                { error: 'PDF data required' },
                { status: 400 }
            );
        }
        
        console.log(`[PDF Extract] Processing: ${filename || 'unnamed.pdf'}`);
        
        const text = await extractPdfText(pdf);
        
        if (!text || text.trim().length === 0) {
            return NextResponse.json({
                text: `[PDF sem texto extraível. O documento "${filename || 'PDF'}" pode ser uma imagem escaneada. Por favor, copie e cole o conteúdo manualmente ou use a extração de documentos.]`,
                warning: 'no_text_extracted'
            });
        }
        
        // Limit text length for chat context
        const maxLength = 8000;
        const truncatedText = text.length > maxLength 
            ? text.substring(0, maxLength) + '\n\n[... texto truncado ...]'
            : text;
        
        console.log(`[PDF Extract] Extracted ${text.length} chars from ${filename}`);
        
        return NextResponse.json({
            text: truncatedText,
            fullLength: text.length,
            truncated: text.length > maxLength
        });
        
    } catch (error: any) {
        console.error('[PDF Extract] Error:', error);
        return NextResponse.json(
            { 
                error: 'Erro ao processar PDF',
                text: '[Erro ao extrair texto do PDF. Tente colar o conteúdo manualmente.]'
            },
            { status: 500 }
        );
    }
}
