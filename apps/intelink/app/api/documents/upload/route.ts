/**
 * POST /api/documents/upload
 * 
 * Recebe arquivo PDF/DOCX, extrai texto e retorna
 * Não salva o arquivo original (Google Drive futuro)
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { withSecurity, AuthContext } from '@/lib/api-security';

async function handlePost(request: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const investigationId = formData.get('investigation_id') as string | null;
        const documentType = formData.get('document_type') as string | null;
        const forceProcess = formData.get('force') === 'true'; // Skip duplicate check

        if (!file) {
            return NextResponse.json(
                { error: 'Nenhum arquivo enviado' },
                { status: 400 }
            );
        }

        // Validar tipo de arquivo
        const validDocTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
            'application/msword', // doc
            'text/plain'
        ];
        
        const validAudioTypes = [
            'audio/mpeg', // mp3
            'audio/wav',
            'audio/mp4', // m4a
            'audio/x-m4a',
            'audio/ogg',
            'audio/webm'
        ];

        const isDocument = validDocTypes.includes(file.type);
        const isAudio = validAudioTypes.includes(file.type) || file.name.match(/\.(mp3|wav|m4a|ogg|webm)$/i);

        if (!isDocument && !isAudio) {
            return NextResponse.json(
                { error: `Tipo de arquivo não suportado: ${file.type || 'desconhecido'}. Use PDF, DOCX, DOC, TXT ou áudio (MP3, WAV, M4A).` },
                { status: 400 }
            );
        }
        
        // Áudio: redirecionar para API de transcrição dedicada
        if (isAudio) {
            // Import and use audio service
            const { transcribeAudioBlob, extractEntitiesFromTranscription } = await import('@/lib/audio-service');
            
            const audioBlob = new Blob([await file.arrayBuffer()], { type: file.type });
            const transcription = await transcribeAudioBlob(audioBlob, {
                language: 'pt',
                filename: file.name,
            });
            
            if (!transcription.success) {
                return NextResponse.json(
                    { error: transcription.error || 'Erro ao transcrever áudio' },
                    { status: 500 }
                );
            }
            
            // Extract entities from transcription
            const entities = transcription.text ? extractEntitiesFromTranscription(transcription.text) : null;
            
            return NextResponse.json({
                success: true,
                text: transcription.text,
                type: 'audio',
                filename: file.name,
                transcription: {
                    text: transcription.text,
                    model: transcription.model,
                    duration_ms: transcription.duration_ms,
                    language: transcription.language,
                },
                entities,
                metadata: {
                    source: 'document_upload',
                    original_filename: file.name,
                }
            });
        }

        // Limite de tamanho: 10MB
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            return NextResponse.json(
                { error: 'Arquivo muito grande. Máximo 10MB.' },
                { status: 400 }
            );
        }

        // Extrair texto baseado no tipo
        const buffer = Buffer.from(await file.arrayBuffer());
        
        // Compute file hash for duplicate detection
        const fileHash = crypto.createHash('sha256').update(buffer).digest('hex');
        
        let extractedText = '';
        let pageCount = 0;

        if (file.type === 'application/pdf') {
            // PDF extraction with fallback strategy:
            // 1. Try unpdf (serverless-compatible)
            // 2. Fallback to pdf-parse (works locally)
            
            console.log(`[PDF Upload] Processing ${file.name}, size: ${buffer.length} bytes`);
            
            // Verify PDF magic bytes
            const pdfHeader = buffer.slice(0, 5).toString('ascii');
            if (!pdfHeader.startsWith('%PDF-')) {
                console.error(`[PDF Upload] Invalid PDF header: ${pdfHeader}`);
                return NextResponse.json(
                    { error: 'Arquivo não é um PDF válido. Verifique se o arquivo não está corrompido.' },
                    { status: 422 }
                );
            }
            
            let extractionMethod = '';
            
            // Try unpdf first (serverless-compatible)
            try {
                const { extractText } = await import('unpdf');
                // unpdf requires Uint8Array, not Buffer
                const uint8Array = new Uint8Array(buffer);
                const result = await extractText(uint8Array);
                // unpdf returns text as string[] (one per page) or string
                extractedText = Array.isArray(result.text) ? result.text.join('\n\n') : (result.text || '');
                pageCount = result.totalPages || 1;
                extractionMethod = 'unpdf';
                console.log(`[PDF Upload] unpdf extracted ${extractedText.length} chars from ${pageCount} pages`);
            } catch (unpdfError) {
                console.warn('[PDF Upload] unpdf failed, trying pdf-parse:', unpdfError);
                
                // Fallback to pdf-parse
                try {
                    // eslint-disable-next-line @typescript-eslint/no-require-imports
                    const pdfParse = require('pdf-parse');
                    const pdfData = await pdfParse(buffer, { max: 0 });
                    extractedText = pdfData.text || '';
                    pageCount = pdfData.numpages || 1;
                    extractionMethod = 'pdf-parse';
                    console.log(`[PDF Upload] pdf-parse extracted ${extractedText.length} chars from ${pageCount} pages`);
                } catch (pdfParseError: any) {
                    console.error('[PDF Upload] Both extractors failed:', pdfParseError);
                    
                    const errorMsg = pdfParseError.message || String(pdfParseError);
                    
                    if (errorMsg.includes('password') || errorMsg.includes('encrypted')) {
                        return NextResponse.json({
                            error: 'PDF protegido por senha. Remova a proteção antes de enviar.',
                            isPasswordProtected: true
                        }, { status: 422 });
                    }
                    
                    if (errorMsg.includes('corrupt') || errorMsg.includes('invalid')) {
                        return NextResponse.json({
                            error: 'PDF corrompido ou inválido. Tente abrir e salvar novamente.',
                            isCorrupted: true
                        }, { status: 422 });
                    }
                    
                    return NextResponse.json({ 
                        error: 'Erro ao processar PDF. Verifique se o arquivo está válido.',
                        details: errorMsg,
                        filename: file.name 
                    }, { status: 422 });
                }
            }
            
            // If no text extracted, PDF might be scanned/image-based - try Vision OCR
            if (!extractedText || extractedText.trim().length < 10) {
                console.log('[PDF Upload] No text found, attempting Vision OCR...');
                
                try {
                    // Use Gemini Vision for OCR via OpenRouter
                    const base64PDF = buffer.toString('base64');
                    const ocrResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                        },
                        body: JSON.stringify({
                            model: 'google/gemini-2.0-flash-001',
                            messages: [{
                                role: 'user',
                                content: [
                                    {
                                        type: 'text',
                                        text: 'Extract ALL text from this scanned document. Return ONLY the extracted text, preserving the original structure and formatting. Do not add any commentary.'
                                    },
                                    {
                                        type: 'image_url',
                                        image_url: {
                                            url: `data:application/pdf;base64,${base64PDF}`
                                        }
                                    }
                                ]
                            }],
                            max_tokens: 8000,
                        })
                    });
                    
                    if (ocrResponse.ok) {
                        const ocrData = await ocrResponse.json();
                        const ocrText = ocrData.choices?.[0]?.message?.content || '';
                        
                        if (ocrText && ocrText.trim().length > 10) {
                            extractedText = ocrText;
                            extractionMethod = 'gemini-vision-ocr';
                            console.log(`[PDF Upload] Vision OCR extracted ${extractedText.length} chars`);
                        }
                    }
                } catch (ocrError) {
                    console.warn('[PDF Upload] Vision OCR failed:', ocrError);
                }
                
                // If still no text after OCR attempt
                if (!extractedText || extractedText.trim().length < 10) {
                    return NextResponse.json({
                        error: 'PDF parece ser digitalizado (imagem) e OCR falhou. Tente converter para PDF pesquisável.',
                        suggestion: 'Use Adobe Acrobat ou ferramentas online para converter.',
                        isProbablyScanned: true,
                        extractionMethod
                    }, { status: 422 });
                }
            }
        } else if (
            file.type.includes('wordprocessingml') || 
            file.type === 'application/msword' ||
            file.name.endsWith('.docx') ||
            file.name.endsWith('.doc')
        ) {
            // Verificar se é .doc antigo (não suportado pelo mammoth)
            const isOldDocFormat = file.name.endsWith('.doc') && !file.name.endsWith('.docx');
            const fileHeader = buffer.slice(0, 4).toString('hex');
            
            // .doc antigo começa com D0CF11E0 (OLE compound document)
            // .docx começa com 504B0304 (ZIP/PK header)
            const isOleFormat = fileHeader === 'd0cf11e0';
            const isZipFormat = fileHeader === '504b0304';
            
            console.log(`Document detection: name=${file.name}, type=${file.type}, header=${fileHeader}, isOle=${isOleFormat}, isZip=${isZipFormat}`);
            
            if (isOleFormat || (isOldDocFormat && !isZipFormat)) {
                // Suporte para .DOC antigo via word-extractor
                try {
                    console.log(`[DOC Upload] Processing OLE format: ${file.name}`);
                    // eslint-disable-next-line @typescript-eslint/no-require-imports
                    const WordExtractor = require('word-extractor');
                    const extractor = new WordExtractor();
                    const extracted = await extractor.extract(buffer);
                    extractedText = extracted.getBody();
                    pageCount = 1; // Word extractor doesn't provide accurate page count
                    console.log(`[DOC Upload] Extracted ${extractedText.length} chars from .doc`);
                } catch (docError: any) {
                    console.error('[DOC Upload] Error:', docError);
                    return NextResponse.json(
                        { 
                            error: 'Erro ao processar arquivo .DOC antigo. Tente salvar como .DOCX.',
                            details: docError.message
                        },
                        { status: 422 }
                    );
                }
            } else {
                // DOCX extraction usando mammoth (apenas para ZIP/XML format)
                try {
                    const mammoth = await import('mammoth');
                    const result = await mammoth.extractRawText({ buffer });
                    extractedText = result.value;
                    pageCount = 1; // DOCX doesn't have page concept in text extraction
                    
                    // Log para debug
                    console.log(`DOCX extracted: ${extractedText.length} chars from ${file.name}`);
                } catch (docxError: any) {
                    console.error('DOCX extraction error:', docxError);
                    
                    // Se parecer ser um arquivo corrompido ou não é realmente um DOCX
                    const errorMessage = docxError.message || String(docxError);
                    if (errorMessage.includes('Could not find') || errorMessage.includes('corrupted')) {
                        return NextResponse.json(
                            { 
                                error: 'Arquivo DOCX corrompido ou formato inválido.',
                                suggestion: 'Abra o arquivo no Word, pressione Ctrl+S e tente novamente.'
                            },
                            { status: 422 }
                        );
                    }
                    
                    return NextResponse.json(
                        { error: 'Erro ao extrair texto do DOCX', details: errorMessage },
                        { status: 422 }
                    );
                }
            }
        } else if (file.type === 'text/plain') {
            extractedText = buffer.toString('utf-8');
            pageCount = 1;
        }

        if (!extractedText || extractedText.trim().length < 50) {
            return NextResponse.json(
                { error: 'Não foi possível extrair texto suficiente do documento.' },
                { status: 422 }
            );
        }

        return NextResponse.json({
            success: true,
            file: {
                name: file.name,
                type: file.type,
                size: file.size,
                pages: pageCount,
                hash: fileHash // For duplicate detection
            },
            extraction: {
                text: extractedText,
                characters: extractedText.length,
                words: extractedText.split(/\s+/).length
            },
            metadata: {
                investigation_id: investigationId,
                document_type: documentType
            }
        });

    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json(
            { error: 'Erro no upload do arquivo', details: String(error) },
            { status: 500 }
        );
    }
}

// Protected: Only member+ can upload documents
export const POST = withSecurity(handlePost, { requiredRole: 'member' });

// Note: No config needed for App Router - multipart/form-data handled automatically
