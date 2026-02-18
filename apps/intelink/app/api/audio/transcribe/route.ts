/**
 * Audio Transcription API
 * POST /api/audio/transcribe
 * 
 * Accepts audio file upload and returns transcription using Groq Whisper
 */

import { NextRequest, NextResponse } from 'next/server';
import { transcribeAudioBlob, extractEntitiesFromTranscription } from '@/lib/audio-service';
import { successResponse, errorResponse, validationError } from '@/lib/api-utils';
import { withSecurity, AuthContext } from '@/lib/api-security';

export const runtime = 'nodejs';
export const maxDuration = 60; // Allow up to 60s for large files

// Max file size: 25MB (Groq limit)
const MAX_FILE_SIZE = 25 * 1024 * 1024;

async function handlePost(req: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File | null;
        const language = formData.get('language') as string || 'pt';
        const extractEntities = formData.get('extract_entities') === 'true';
        
        if (!file) {
            return validationError('Nenhum arquivo de áudio enviado');
        }
        
        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return validationError(`Arquivo muito grande. Máximo: 25MB (atual: ${(file.size / 1024 / 1024).toFixed(1)}MB)`);
        }
        
        // Validate file type
        const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/wav', 'audio/webm', 'audio/ogg', 'audio/m4a'];
        const isValidType = validTypes.some(t => file.type.includes(t.split('/')[1]));
        
        if (!isValidType && !file.name.match(/\.(mp3|mp4|wav|webm|ogg|m4a|mpeg)$/i)) {
            return validationError(`Tipo de arquivo não suportado: ${file.type}. Use: mp3, mp4, wav, webm, ogg, m4a`);
        }
        
        console.log(`[API Transcribe] Processing ${file.name} (${(file.size / 1024).toFixed(1)}KB)`);
        
        // Transcribe
        const result = await transcribeAudioBlob(file, {
            language,
            filename: file.name,
        });
        
        if (!result.success) {
            return errorResponse(result.error || 'Erro na transcrição', 500);
        }
        
        // Extract entities if requested
        let entities = null;
        if (extractEntities && result.text) {
            entities = extractEntitiesFromTranscription(result.text);
        }
        
        return successResponse({
            success: true,
            text: result.text,
            language: result.language,
            model: result.model,
            duration_ms: result.duration_ms,
            entities: entities,
            file_info: {
                name: file.name,
                size_bytes: file.size,
                type: file.type,
            }
        });
        
    } catch (error: unknown) {
        console.error('[API Transcribe] Error:', error);
        const message = error instanceof Error ? error.message : 'Erro interno';
        return errorResponse(message, 500);
    }
}

// Protected: Only member+ can transcribe audio
export const POST = withSecurity(handlePost, { requiredRole: 'member' });
