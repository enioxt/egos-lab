/**
 * File Handling para INTELINK Bot
 * 
 * Funções para upload/download de arquivos via Telegram
 * Extraído de intelink-service.ts para modularização
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { SupabaseClient } from '@supabase/supabase-js';

// ============================================
// TYPES
// ============================================

export interface FileUploadDeps {
    supabase: SupabaseClient;
    botToken: string;
    sendMessage: (chatId: number, text: string) => Promise<void>;
}

export interface TelegramMessage {
    document?: {
        file_id: string;
        file_name?: string;
        mime_type?: string;
    };
    photo?: Array<{ file_id: string }>;
    voice?: {
        file_id: string;
        mime_type?: string;
    };
    audio?: {
        file_id: string;
        file_name?: string;
        mime_type?: string;
    };
}

// ============================================
// DOWNLOAD TELEGRAM FILE
// ============================================

/**
 * Baixa arquivo do Telegram via API
 */
export async function downloadTelegramFile(
    fileId: string, 
    botToken: string
): Promise<Buffer | null> {
    try {
        // 1. Get File Path
        const res = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`);
        const data = await res.json();
        if (!data.ok) return null;
        const filePath = data.result.file_path;

        // 2. Download File
        const fileRes = await fetch(`https://api.telegram.org/file/bot${botToken}/${filePath}`);
        const arrayBuffer = await fileRes.arrayBuffer();
        return Buffer.from(arrayBuffer);
    } catch (e) {
        console.error('[FileHandling] Download Error:', e);
        return null;
    }
}

// ============================================
// UPLOAD TO SUPABASE
// ============================================

/**
 * Faz upload de arquivo para Supabase Storage
 */
export async function uploadToSupabase(
    supabase: SupabaseClient,
    storagePath: string, 
    file: Buffer, 
    contentType: string
): Promise<string | null> {
    try {
        const { error } = await supabase.storage
            .from('intelink-evidence')
            .upload(storagePath, file, {
                contentType,
                upsert: false
            });

        if (error) {
            console.error('[FileHandling] Upload Error:', error);
            return null;
        }

        const { data: urlData } = supabase.storage.from('intelink-evidence').getPublicUrl(storagePath);
        return urlData.publicUrl;
    } catch (e) {
        console.error('[FileHandling] Supabase Upload Error:', e);
        return null;
    }
}

// ============================================
// TRANSCRIBE AUDIO
// ============================================

// NOTE: Audio transcription moved to lib/audio-service.ts
// Enable by adding GROQ_API_KEY or use OpenAI Whisper as alternative

// ============================================
// HANDLE FILE UPLOAD (MAIN)
// ============================================

/**
 * Processa upload de arquivo do Telegram
 * - Baixa arquivo
 * - Faz upload para Supabase
 * - Transcreve se for áudio
 * - Salva evidência no banco
 */
export async function handleFileUpload(
    message: TelegramMessage, 
    chatId: number,
    deps: FileUploadDeps
): Promise<void> {
    const { supabase, botToken, sendMessage } = deps;
    const { document, photo, voice, audio } = message;
    
    let fileId = '';
    let fileName = '';
    let mimeType = '';
    let type = '';

    if (document) {
        fileId = document.file_id;
        fileName = document.file_name || `doc_${Date.now()}`;
        mimeType = document.mime_type || 'application/octet-stream';
        type = 'DOCUMENT';
    } else if (photo) {
        // Photos are an array of sizes. Get the last one (largest).
        const p = photo[photo.length - 1];
        fileId = p.file_id;
        fileName = `photo_${fileId}.jpg`;
        mimeType = 'image/jpeg';
        type = 'IMAGE';
    } else if (voice) {
        fileId = voice.file_id;
        fileName = `voice_${Date.now()}.ogg`;
        mimeType = voice.mime_type || 'audio/ogg';
        type = 'AUDIO';
    } else if (audio) {
        fileId = audio.file_id;
        fileName = audio.file_name || `audio_${Date.now()}.mp3`;
        mimeType = audio.mime_type || 'audio/mpeg';
        type = 'AUDIO';
    }

    if (!fileId) {
        await sendMessage(chatId, '❌ Tipo de arquivo não suportado.');
        return;
    }

    await sendMessage(chatId, '⏳ **Recebendo arquivo...**');

    // Get Investigation
    const { data: session } = await supabase
        .from('intelink_sessions')
        .select('investigation_id')
        .eq('chat_id', chatId)
        .single();
        
    if (!session?.investigation_id) {
        await sendMessage(chatId, '⚠️ Selecione um caso primeiro para vincular a evidência.');
        return;
    }

    // Download
    const fileBuffer = await downloadTelegramFile(fileId, botToken);
    if (!fileBuffer) {
        await sendMessage(chatId, '❌ Erro ao baixar arquivo do Telegram.');
        return;
    }

    // Upload to Supabase
    const storagePath = `${session.investigation_id}/${Date.now()}_${fileName}`;
    const publicUrl = await uploadToSupabase(supabase, storagePath, fileBuffer, mimeType);

    if (!publicUrl) {
        await sendMessage(chatId, '❌ Erro ao salvar no Storage.');
        return;
    }

    let transcription = '';

    // Audio transcription using Groq Whisper
    if (type === 'AUDIO') {
        try {
            const { transcribeAudioBlob } = await import('@/lib/audio-service');
            // Convert Node Buffer to Uint8Array then Blob
            const uint8 = new Uint8Array(fileBuffer);
            const audioBlob = new Blob([uint8], { type: mimeType });
            
            await sendMessage(chatId, '🎙️ **Transcrevendo áudio...** Aguarde.');
            
            const result = await transcribeAudioBlob(audioBlob, {
                language: 'pt',
                filename: fileName,
            });
            
            if (result.success && result.text) {
                transcription = result.text;
                await sendMessage(chatId, `📝 **Transcrição concluída!**\n\n_"${result.text.substring(0, 200)}${result.text.length > 200 ? '...' : ''}"_\n\n⏱️ ${result.duration_ms}ms`);
            } else {
                await sendMessage(chatId, `⚠️ Transcrição falhou: ${result.error || 'erro desconhecido'}`);
            }
        } catch (e) {
            console.error('[FileHandling] Transcription error:', e);
            await sendMessage(chatId, '⚠️ **Áudio recebido** (transcrição não disponível).');
        }
    }

    // Insert into DB
    const { error } = await supabase.from('intelink_evidence').insert([{
        investigation_id: session.investigation_id,
        type,
        url: publicUrl,
        content_text: transcription, 
        metadata: { fileName, mimeType, telegramFileId: fileId }
    }]);

    if (error) {
        console.error('[FileHandling] DB Error:', error);
        await sendMessage(chatId, '❌ Erro ao registrar evidência.');
        return;
    }

    await sendMessage(chatId, `✅ **Evidência Salva!**\n\n📄 ${fileName}\n🔗 [Visualizar](${publicUrl})`);
}
