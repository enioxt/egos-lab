/**
 * Audio Transcription API - Groq Whisper
 * 
 * Converts audio to text using Groq's Whisper API (free, fast)
 * 
 * @version 1.0.0
 * @updated 2025-12-09
 */

import { NextRequest, NextResponse } from 'next/server';

// Groq API configuration
const GROQ_API_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Fallback to OpenRouter if Groq not available
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/audio/transcriptions';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

export async function POST(request: NextRequest) {
    try {
        // Get audio file from form data
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json(
                { error: 'No audio file provided' },
                { status: 400 }
            );
        }

        // Check file size (max 25MB for Groq)
        if (file.size > 25 * 1024 * 1024) {
            return NextResponse.json(
                { error: 'Audio file too large. Max 25MB.' },
                { status: 400 }
            );
        }

        // Convert to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Create form data for API
        const apiFormData = new FormData();
        apiFormData.append('file', new Blob([buffer], { type: file.type }), file.name);
        apiFormData.append('model', 'whisper-large-v3');
        apiFormData.append('language', 'pt'); // Portuguese
        apiFormData.append('response_format', 'json');

        // Try Groq first (faster and free)
        if (GROQ_API_KEY) {
            try {
                const response = await fetch(GROQ_API_URL, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${GROQ_API_KEY}`,
                    },
                    body: apiFormData,
                });

                if (response.ok) {
                    const data = await response.json();
                    return NextResponse.json({
                        success: true,
                        text: data.text,
                        provider: 'groq',
                    });
                }

                // If Groq fails, try OpenRouter
                console.warn('[Transcribe] Groq failed, trying OpenRouter');
            } catch (error) {
                console.error('[Transcribe] Groq error:', error);
            }
        }

        // Fallback to OpenRouter
        if (OPENROUTER_API_KEY) {
            try {
                // Reset form data for OpenRouter
                const openRouterFormData = new FormData();
                openRouterFormData.append('file', new Blob([buffer], { type: file.type }), file.name);
                openRouterFormData.append('model', 'openai/whisper-1');

                const response = await fetch(OPENROUTER_API_URL, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                        'HTTP-Referer': 'https://intelink.ia.br',
                        'X-Title': 'Intelink',
                    },
                    body: openRouterFormData,
                });

                if (response.ok) {
                    const data = await response.json();
                    return NextResponse.json({
                        success: true,
                        text: data.text,
                        provider: 'openrouter',
                    });
                }
            } catch (error) {
                console.error('[Transcribe] OpenRouter error:', error);
            }
        }

        // No API keys configured
        if (!GROQ_API_KEY && !OPENROUTER_API_KEY) {
            return NextResponse.json(
                { error: 'Transcription service not configured. Add GROQ_API_KEY or OPENROUTER_API_KEY.' },
                { status: 503 }
            );
        }

        return NextResponse.json(
            { error: 'Transcription failed with all providers' },
            { status: 500 }
        );

    } catch (error: any) {
        console.error('[Transcribe] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

// Configuration for body parsing
export const config = {
    api: {
        bodyParser: false,
    },
};
