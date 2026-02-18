/**
 * LLM Provider Interface
 * 
 * Abstrai diferentes provedores de LLM (OpenRouter, OpenAI, Groq, Llama local)
 * Permite trocar de provedor sem alterar o código da aplicação.
 * 
 * @example
 * const provider = createLLMProvider();
 * const response = await provider.chat([{ role: 'user', content: 'Olá!' }]);
 */

// ============================================================================
// TYPES
// ============================================================================

export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface ChatOptions {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
}

export interface ChatResponse {
    content: string;
    model: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    finishReason?: 'stop' | 'length' | 'content_filter' | 'error';
}

export interface LLMProvider {
    name: string;
    chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse>;
    streamChat?(messages: ChatMessage[], options?: ChatOptions): AsyncGenerator<string>;
    isAvailable(): Promise<boolean>;
}

// ============================================================================
// OPENROUTER PROVIDER (Default)
// ============================================================================

export class OpenRouterProvider implements LLMProvider {
    name = 'openrouter';
    private apiKey: string;
    private defaultModel: string;

    constructor(config?: { apiKey?: string; model?: string }) {
        this.apiKey = config?.apiKey || process.env.OPENROUTER_API_KEY || '';
        this.defaultModel = config?.model || process.env.LLM_MODEL || 'google/gemini-2.0-flash-001';
    }

    async isAvailable(): Promise<boolean> {
        return !!this.apiKey;
    }

    async chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse> {
        const model = options?.model || this.defaultModel;
        
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://intelink.ia.br',
                'X-Title': 'Intelink Police Intelligence'
            },
            body: JSON.stringify({
                model,
                messages,
                temperature: options?.temperature ?? 0.7,
                max_tokens: options?.maxTokens ?? 4096,
            })
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(`OpenRouter error: ${error.message || response.statusText}`);
        }

        const data = await response.json();
        
        return {
            content: data.choices?.[0]?.message?.content || '',
            model: data.model || model,
            usage: data.usage ? {
                promptTokens: data.usage.prompt_tokens,
                completionTokens: data.usage.completion_tokens,
                totalTokens: data.usage.total_tokens,
            } : undefined,
            finishReason: data.choices?.[0]?.finish_reason || 'stop',
        };
    }
}

// ============================================================================
// GROQ PROVIDER (Free tier for development)
// ============================================================================

export class GroqProvider implements LLMProvider {
    name = 'groq';
    private apiKey: string;
    private defaultModel: string;

    constructor(config?: { apiKey?: string; model?: string }) {
        this.apiKey = config?.apiKey || process.env.GROQ_API_KEY || '';
        this.defaultModel = config?.model || 'llama-3.3-70b-versatile';
    }

    async isAvailable(): Promise<boolean> {
        return !!this.apiKey;
    }

    async chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse> {
        const model = options?.model || this.defaultModel;
        
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model,
                messages,
                temperature: options?.temperature ?? 0.7,
                max_tokens: options?.maxTokens ?? 4096,
            })
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(`Groq error: ${error.message || response.statusText}`);
        }

        const data = await response.json();
        
        return {
            content: data.choices?.[0]?.message?.content || '',
            model: data.model || model,
            usage: data.usage ? {
                promptTokens: data.usage.prompt_tokens,
                completionTokens: data.usage.completion_tokens,
                totalTokens: data.usage.total_tokens,
            } : undefined,
            finishReason: data.choices?.[0]?.finish_reason || 'stop',
        };
    }
}

// ============================================================================
// LOCAL LLAMA PROVIDER (For on-premise deployment)
// ============================================================================

export class LocalLlamaProvider implements LLMProvider {
    name = 'local-llama';
    private baseUrl: string;
    private defaultModel: string;

    constructor(config?: { baseUrl?: string; model?: string }) {
        this.baseUrl = config?.baseUrl || process.env.LOCAL_LLAMA_URL || 'http://localhost:11434';
        this.defaultModel = config?.model || 'llama3.1:8b';
    }

    async isAvailable(): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`, { 
                method: 'GET',
                signal: AbortSignal.timeout(2000)
            });
            return response.ok;
        } catch {
            return false;
        }
    }

    async chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse> {
        const model = options?.model || this.defaultModel;
        
        // Convert to Ollama format
        const prompt = messages.map(m => {
            if (m.role === 'system') return `[SYSTEM]: ${m.content}`;
            if (m.role === 'user') return `[USER]: ${m.content}`;
            return `[ASSISTANT]: ${m.content}`;
        }).join('\n');

        const response = await fetch(`${this.baseUrl}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model,
                prompt,
                stream: false,
                options: {
                    temperature: options?.temperature ?? 0.7,
                    num_predict: options?.maxTokens ?? 4096,
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Local Llama error: ${response.statusText}`);
        }

        const data = await response.json();
        
        return {
            content: data.response || '',
            model: data.model || model,
            finishReason: 'stop',
        };
    }
}

// ============================================================================
// FACTORY
// ============================================================================

export type ProviderType = 'openrouter' | 'groq' | 'local-llama' | 'auto';

/**
 * Cria um provider de LLM baseado no tipo ou detecta automaticamente
 */
export function createLLMProvider(type: ProviderType = 'auto'): LLMProvider {
    // Auto-detect based on available API keys
    if (type === 'auto') {
        if (process.env.OPENROUTER_API_KEY) return new OpenRouterProvider();
        if (process.env.GROQ_API_KEY) return new GroqProvider();
        if (process.env.LOCAL_LLAMA_URL) return new LocalLlamaProvider();
        // Fallback to OpenRouter (may fail if no key)
        return new OpenRouterProvider();
    }

    switch (type) {
        case 'openrouter': return new OpenRouterProvider();
        case 'groq': return new GroqProvider();
        case 'local-llama': return new LocalLlamaProvider();
        default: return new OpenRouterProvider();
    }
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

// Singleton instance for convenience
let defaultProvider: LLMProvider | null = null;

export function getLLMProvider(): LLMProvider {
    if (!defaultProvider) {
        defaultProvider = createLLMProvider('auto');
    }
    return defaultProvider;
}

export default getLLMProvider;
