/**
 * INTELINK Audio Service
 * Audio transcription with Groq Whisper API
 * 
 * Architecture: Audio -> Whisper -> Text -> DB -> Trigger -> Link Detection
 * Latency Target: < 5s for transcription (Groq is fast)
 * 
 * @version 2.0.0
 * @updated 2025-12-05
 */

import { createClient } from '@supabase/supabase-js';
import Groq from 'groq-sdk';

// Supabase client for storage
let supabase: ReturnType<typeof createClient> | null = null;

function getSupabase() {
    if (!supabase) {
        supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
    }
    return supabase;
}

// Groq client for Whisper
let groq: Groq | null = null;

function getGroq(): Groq | null {
    if (!process.env.GROQ_API_KEY) {
        console.warn('[AudioService] GROQ_API_KEY not configured');
        return null;
    }
    if (!groq) {
        groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    }
    return groq;
}

export interface TranscriptionResult {
    success: boolean;
    text?: string;
    duration_ms: number;
    language?: string;
    model: string;
    error?: string;
}

export interface AudioMetadata {
    file_id?: string;
    source: 'telegram' | 'upload' | 'url';
    original_filename?: string;
    mime_type?: string;
    size_bytes?: number;
    duration_seconds?: number;
}

/**
 * Transcribe audio from a Blob using Groq Whisper
 * 
 * Supported formats: mp3, mp4, mpeg, mpga, m4a, wav, webm, ogg
 * Max file size: 25MB
 * 
 * @param audioBlob - Audio file as Blob
 * @param options - Transcription options
 */
export async function transcribeAudioBlob(
    audioBlob: Blob,
    options: {
        language?: string;
        filename?: string;
        model?: string;
    } = {}
): Promise<TranscriptionResult> {
    const start = Date.now();
    const model = options.model || "whisper-large-v3-turbo";
    
    const client = getGroq();
    if (!client) {
        return {
            success: false,
            duration_ms: Date.now() - start,
            model: model,
            error: "GROQ_API_KEY não configurada. Transcrição indisponível."
        };
    }
    
    try {
        // Convert Blob to File for Groq API
        const filename = options.filename || `audio_${Date.now()}.ogg`;
        const file = new File([audioBlob], filename, { type: audioBlob.type || 'audio/ogg' });
        
        console.log(`[AudioService] Transcribing ${filename} (${(audioBlob.size / 1024).toFixed(1)}KB) with ${model}`);
        
        const transcription = await client.audio.transcriptions.create({
            file: file,
            model: model,
            language: options.language || 'pt', // Default: Portuguese
            response_format: 'verbose_json',
        });
        
        const duration_ms = Date.now() - start;
        console.log(`[AudioService] Transcription completed in ${duration_ms}ms`);
        
        return {
            success: true,
            text: transcription.text,
            duration_ms,
            language: options.language || 'pt',
            model: model,
        };
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[AudioService] Transcription error:', errorMessage);
        
        return {
            success: false,
            duration_ms: Date.now() - start,
            model: model,
            error: errorMessage
        };
    }
}

/**
 * Transcribe audio from a URL
 */
export async function transcribeAudioUrl(
    url: string,
    options: {
        language?: string;
        model?: string;
    } = {}
): Promise<TranscriptionResult> {
    const start = Date.now();
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch audio: ${response.status}`);
        }
        
        const blob = await response.blob();
        return transcribeAudioBlob(blob, options);
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
            success: false,
            duration_ms: Date.now() - start,
            model: options.model || "whisper-large-v3",
            error: errorMessage
        };
    }
}

/**
 * Download audio from Telegram and upload to Supabase
 */
export async function downloadAndStoreTelegramAudio(
    fileId: string,
    botToken: string,
    bucket: string = 'intelink-evidence'
): Promise<{ url: string; blob: Blob } | { error: string }> {
    try {
        // 1. Get file path from Telegram
        const fileRes = await fetch(
            `https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`
        );
        const fileData = await fileRes.json();

        if (!fileData.ok) {
            return { error: `Telegram getFile failed: ${fileData.description}` };
        }

        const filePath = fileData.result.file_path;
        const downloadUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;

        // 2. Download file
        const audioRes = await fetch(downloadUrl);
        const audioBlob = await audioRes.blob();

        // 3. Upload to Supabase Storage
        const fileName = `audio/${Date.now()}_${fileId}.ogg`;
        const { error } = await getSupabase().storage
            .from(bucket)
            .upload(fileName, audioBlob, {
                contentType: 'audio/ogg',
                upsert: false
            });

        if (error) {
            return { error: `Supabase upload failed: ${error.message}` };
        }

        // 4. Get public URL
        const { data: publicData } = getSupabase().storage
            .from(bucket)
            .getPublicUrl(fileName);

        return { url: publicData.publicUrl, blob: audioBlob };
    } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : 'Unknown error';
        return { error: `Exception: ${errorMessage}` };
    }
}

/**
 * Full pipeline: Download from Telegram -> Store -> Transcribe -> Return
 */
export async function processIntelinkAudio(
    fileId: string,
    botToken: string,
    investigationId?: string
): Promise<{
    success: boolean;
    url?: string;
    transcription?: TranscriptionResult;
    error?: string;
}> {
    // 1. Download and store
    const audioResult = await downloadAndStoreTelegramAudio(fileId, botToken);
    
    if ('error' in audioResult) {
        return { success: false, error: audioResult.error };
    }

    // 2. Transcribe
    const transcription = await transcribeAudioBlob(audioResult.blob);

    // 3. If we have an investigation, store as evidence
    if (investigationId && transcription.success) {
        await (getSupabase().from('intelink_evidence') as any).insert({
            investigation_id: investigationId,
            type: 'audio',
            url: audioResult.url,
            metadata: {
                transcription: transcription.text,
                transcription_model: transcription.model,
                transcription_duration_ms: transcription.duration_ms
            }
        });
    }

    return {
        success: transcription.success,
        url: audioResult.url,
        transcription
    };
}

/**
 * Extract entities from transcription using pattern matching
 * Returns potential names, phones, addresses mentioned in audio
 */
export function extractEntitiesFromTranscription(text: string): {
    names: string[];
    phones: string[];
    addresses: string[];
    dates: string[];
} {
    const result = {
        names: [] as string[],
        phones: [] as string[],
        addresses: [] as string[],
        dates: [] as string[]
    };

    // Phone patterns (Brazilian format)
    const phonePattern = /\b(?:\d{2}[-.\s]?)?\d{4,5}[-.\s]?\d{4}\b/g;
    result.phones = text.match(phonePattern) || [];

    // Date patterns
    const datePattern = /\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b/g;
    result.dates = text.match(datePattern) || [];

    // Address patterns (rua, avenida, etc)
    const addressPattern = /(?:rua|avenida|av\.|travessa|praça|alameda)\s+[^,\.\n]+(?:\s*,?\s*\d+)?/gi;
    result.addresses = text.match(addressPattern) || [];

    // Name patterns (capitalized words in sequence)
    const namePattern = /\b[A-ZÁÉÍÓÚÀÂÊÔÃÕ][a-záéíóúàâêôãõ]+(?:\s+(?:de|da|do|dos|das|e)?\s*[A-ZÁÉÍÓÚÀÂÊÔÃÕ][a-záéíóúàâêôãõ]+)+\b/g;
    result.names = text.match(namePattern) || [];

    return result;
}
