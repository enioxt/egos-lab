/**
 * Nano Banana — AI Image Generator (Adapted from Carteira Livre)
 * Generates product images via OpenRouter (Gemini) when web search fails.
 * 
 * Cost model: generation cost is tracked and can be passed to merchant.
 */

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const BASE_URL = 'https://openrouter.ai/api/v1/chat/completions';

/**
 * System prompt for product image generation.
 * Prevents hallucination of text, logos, and brand elements.
 */
const PRODUCT_IMAGE_PROMPT = `You are a professional product photographer AI.

## STRICT RULES:
1. Generate a CLEAN product photograph on a white/light background.
2. The product must be the ONLY element in the image.
3. NO text, NO labels, NO brand logos, NO price tags.
4. NO hands, NO people, NO faces.
5. Professional studio lighting, soft shadows.
6. Style: Amazon/Mercado Livre product listing quality.

## PRODUCT CATEGORIES (visual reference):
- Grocery: Show packaging clearly, label facing camera
- Produce: Fresh, vibrant colors, slight water droplets
- Bakery: Warm tones, artisanal feel
- Cleaning: Clean bottle/box on white surface
- Dairy: Cold feel, condensation effect
`;

export interface GeneratedImage {
    url: string;          // data:image/png;base64,... or hosted URL
    base64?: string;
    prompt: string;
    estimatedCostUsd: number;
}

/**
 * Generate a product image using Gemini via OpenRouter.
 */
export async function generateProductImage(
    productName: string,
    category?: string
): Promise<GeneratedImage | null> {
    if (!OPENROUTER_API_KEY) {
        console.debug('[NanoBanana] No OPENROUTER_API_KEY, skipping generation.');
        return null;
    }

    const userPrompt = `Generate a professional product photo of: "${productName}".
Category: ${category || 'grocery'}.
White background, studio lighting, no text, no logos, no people.
The product should fill 70% of the frame.`;

    try {
        const response = await fetch(BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': 'https://nexusmarket.app',
                'X-Title': 'Nexus Market - Product Image Gen',
            },
            body: JSON.stringify({
                model: 'google/gemini-3-pro-image-preview',
                messages: [
                    { role: 'system', content: PRODUCT_IMAGE_PROMPT },
                    { role: 'user', content: userPrompt },
                ],
                modalities: ['image', 'text'],
                image_config: { aspect_ratio: '1:1' },
            }),
        });

        if (!response.ok) {
            const err = await response.text();
            console.error('[NanoBanana] Generation failed:', err);
            return null;
        }

        const data = await response.json();
        const message = data.choices?.[0]?.message;

        // Extract image from OpenRouter response formats
        let imageUrl: string | null = null;
        let base64: string | undefined;

        // Format 1: message.images array
        if (message?.images?.length > 0) {
            const img = message.images[0];
            imageUrl = img.image_url?.url || img.imageUrl?.url;
            if (imageUrl?.startsWith('data:')) {
                base64 = imageUrl.split(',')[1];
            }
        }

        // Format 2: inline_data (Gemini native)
        if (!imageUrl && message?.content) {
            const parts = Array.isArray(message.content) ? message.content : [message.content];
            for (const part of parts) {
                if (typeof part === 'object' && part.inlineData?.data) {
                    base64 = part.inlineData.data;
                    imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${base64}`;
                    break;
                }
            }
        }

        if (!imageUrl) {
            console.warn('[NanoBanana] No image in response');
            return null;
        }

        // Estimate cost: ~$0.04 per generation (Gemini image preview pricing)
        const estimatedCostUsd = 0.04;

        return {
            url: imageUrl,
            base64,
            prompt: userPrompt,
            estimatedCostUsd,
        };
    } catch (error: any) {
        console.error('[NanoBanana] Error:', error.message);
        return null;
    }
}
