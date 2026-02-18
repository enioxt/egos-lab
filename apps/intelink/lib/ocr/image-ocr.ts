/**
 * INTELINK OCR Service
 * 
 * Extracts text from images using Tesseract.js.
 * Supports: PNG, JPG, JPEG, BMP, TIFF, GIF, WEBP
 * 
 * @version 1.0.0
 * @updated 2025-12-09
 */

import Tesseract from 'tesseract.js';

// ============================================================================
// TYPES
// ============================================================================

export interface OCRResult {
    success: boolean;
    text: string;
    confidence: number;
    lines: Array<{
        text: string;
        confidence: number;
        bbox: { x0: number; y0: number; x1: number; y1: number };
    }>;
    words: number;
    processingTime: number;
    language: string;
}

export interface OCROptions {
    language?: string; // 'por' for Portuguese, 'eng' for English
    logger?: (info: { status: string; progress: number }) => void;
}

// ============================================================================
// SUPPORTED FORMATS
// ============================================================================

export const SUPPORTED_IMAGE_FORMATS = [
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/bmp',
    'image/tiff',
    'image/gif',
    'image/webp'
];

export function isImageSupported(mimeType: string): boolean {
    return SUPPORTED_IMAGE_FORMATS.includes(mimeType.toLowerCase());
}

// ============================================================================
// OCR EXTRACTION
// ============================================================================

/**
 * Extract text from an image buffer
 */
export async function extractTextFromImage(
    imageBuffer: ArrayBuffer | Buffer,
    options: OCROptions = {}
): Promise<OCRResult> {
    const startTime = Date.now();
    const language = options.language || 'por+eng'; // Portuguese + English

    try {
        const result = await Tesseract.recognize(
            Buffer.from(imageBuffer as ArrayBuffer),
            language,
            {
                logger: options.logger || ((m) => {
                    if (m.status === 'recognizing text') {
                        console.log(`[OCR] Progress: ${(m.progress * 100).toFixed(0)}%`);
                    }
                })
            }
        );

        const data = result.data as any;
        const lines = data.lines?.map((line: any) => ({
            text: line.text.trim(),
            confidence: line.confidence,
            bbox: line.bbox
        })) || [];

        const words = data.words?.length || 0;

        return {
            success: true,
            text: result.data.text.trim(),
            confidence: result.data.confidence,
            lines,
            words,
            processingTime: Date.now() - startTime,
            language
        };

    } catch (error: any) {
        console.error('[OCR] Extraction error:', error);
        return {
            success: false,
            text: '',
            confidence: 0,
            lines: [],
            words: 0,
            processingTime: Date.now() - startTime,
            language
        };
    }
}

/**
 * Extract text from an image URL
 */
export async function extractTextFromURL(
    imageUrl: string,
    options: OCROptions = {}
): Promise<OCRResult> {
    const startTime = Date.now();
    const language = options.language || 'por+eng';

    try {
        const result = await Tesseract.recognize(
            imageUrl,
            language,
            {
                logger: options.logger || ((m) => {
                    if (m.status === 'recognizing text') {
                        console.log(`[OCR] Progress: ${(m.progress * 100).toFixed(0)}%`);
                    }
                })
            }
        );

        const data = result.data as any;
        const lines = data.lines?.map((line: any) => ({
            text: line.text.trim(),
            confidence: line.confidence,
            bbox: line.bbox
        })) || [];

        return {
            success: true,
            text: data.text.trim(),
            confidence: data.confidence,
            lines,
            words: data.words?.length || 0,
            processingTime: Date.now() - startTime,
            language
        };

    } catch (error: any) {
        console.error('[OCR] URL extraction error:', error);
        return {
            success: false,
            text: '',
            confidence: 0,
            lines: [],
            words: 0,
            processingTime: Date.now() - startTime,
            language
        };
    }
}

/**
 * Extract text from a base64 encoded image
 */
export async function extractTextFromBase64(
    base64Data: string,
    options: OCROptions = {}
): Promise<OCRResult> {
    // Remove data URL prefix if present
    const base64Clean = base64Data.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Clean, 'base64');
    
    return extractTextFromImage(buffer, options);
}

// ============================================================================
// POST-PROCESSING
// ============================================================================

/**
 * Clean and normalize OCR output
 */
export function cleanOCRText(text: string): string {
    return text
        // Remove multiple spaces
        .replace(/\s+/g, ' ')
        // Remove multiple newlines
        .replace(/\n{3,}/g, '\n\n')
        // Fix common OCR errors in Portuguese
        .replace(/\bl\b/g, 'I') // lowercase L often confused with I
        .replace(/\b0\b(?=\s+[a-zA-Z])/g, 'O') // 0 often confused with O before words
        // Clean up
        .trim();
}

/**
 * Extract structured data from OCR text (e.g., CPF, phone numbers)
 */
export function extractStructuredData(text: string): {
    cpfs: string[];
    phones: string[];
    plates: string[];
    dates: string[];
} {
    const cpfRegex = /\d{3}\.?\d{3}\.?\d{3}-?\d{2}/g;
    const phoneRegex = /\(?\d{2}\)?\s*9?\d{4}[-.\s]?\d{4}/g;
    const plateRegex = /[A-Z]{3}[-\s]?\d[A-Z0-9]\d{2}/gi;
    const dateRegex = /\d{2}\/\d{2}\/\d{4}/g;

    return {
        cpfs: text.match(cpfRegex) || [],
        phones: text.match(phoneRegex) || [],
        plates: text.match(plateRegex) || [],
        dates: text.match(dateRegex) || []
    };
}

export default {
    extractTextFromImage,
    extractTextFromURL,
    extractTextFromBase64,
    cleanOCRText,
    extractStructuredData,
    isImageSupported,
    SUPPORTED_IMAGE_FORMATS
};
