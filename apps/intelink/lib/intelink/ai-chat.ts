/**
 * AI Chat para INTELINK Bot
 * 
 * Processamento de mensagens com LLM para análise investigativa
 * Extraído de intelink-service.ts para modularização
 */

import { SupabaseClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// ============================================
// TYPES
// ============================================

export interface AIChatDeps {
    supabase: SupabaseClient;
    openai: OpenAI;
    sendMessage: (chatId: number, text: string) => Promise<void>;
    visual: {
        separator: string;
        separatorShort: string;
        getType: (type: string) => { icon: string; label: string };
    };
}

export interface InvestigationContext {
    title: string;
    status: string;
    entities: Array<{ name: string; type: string; metadata?: any }>;
    relationships: Array<{ type: string; sourceName: string; targetName: string }>;
}

// ============================================
// BUILD CONTEXT
// ============================================

/**
 * Constrói contexto da operação para o prompt do LLM
 */
export async function buildInvestigationContext(
    supabase: SupabaseClient,
    investigationId: string,
    visual: AIChatDeps['visual']
): Promise<string> {
    let context = '';
    
    // Get investigation details
    const { data: inv } = await supabase
        .from('intelink_investigations')
        .select('title, description, status')
        .eq('id', investigationId)
        .single();
    
    if (inv) {
        context += `Operação ativa: ${inv.title}\nStatus: ${inv.status}\n\n`;
    }
    
    // Get entities summary
    const { data: entities } = await supabase
        .from('intelink_entities')
        .select('name, type, metadata')
        .eq('investigation_id', investigationId)
        .limit(20);
    
    if (entities && entities.length > 0) {
        context += `Entidades no caso (${entities.length}):\n`;
        for (const e of entities.slice(0, 10)) {
            const typeInfo = visual.getType(e.type);
            context += `- ${typeInfo.icon} ${e.name} (${typeInfo.label})\n`;
        }
        if (entities.length > 10) {
            context += `... e mais ${entities.length - 10} entidades\n`;
        }
    }
    
    // Get relationships summary
    const { data: rels } = await supabase
        .from('intelink_relationships')
        .select('type, source:source_id(name), target:target_id(name)')
        .eq('investigation_id', investigationId)
        .limit(10);
    
    if (rels && rels.length > 0) {
        context += `\nVínculos:\n`;
        for (const r of rels.slice(0, 5)) {
            const src = (r.source as any)?.name || '?';
            const tgt = (r.target as any)?.name || '?';
            context += `- ${src} → ${r.type} → ${tgt}\n`;
        }
    }
    
    return context;
}

// ============================================
// SYSTEM PROMPT
// ============================================

/**
 * Gera system prompt para o agente INTELINK
 */
export function buildSystemPrompt(context: string, username: string): string {
    return `Você é o Agente de Inteligência INTELINK, especializado em operações policiais.

CONTEXTO DO CASO:
${context || 'Nenhuma operação selecionada. Use /investigacoes para selecionar um caso.'}

CAPACIDADES:
- Analisar vínculos entre pessoas, veículos e locais
- Identificar padrões criminosos
- Sugerir linhas investigativas
- Responder sobre dados do caso atual

REGRAS:
1. Sempre responda em português brasileiro
2. Seja objetivo e direto
3. Se não souber, sugira comandos relevantes (/buscar, /grafo, /analisar)
4. Mantenha confidencialidade - não revele dados sensíveis fora de contexto

Usuário: ${username}`;
}

// ============================================
// HANDLE AI CHAT
// ============================================

/**
 * Processa mensagem do usuário com LLM
 */
export async function handleAIChat(
    chatId: number, 
    userMessage: string, 
    investigationId: string | null, 
    username: string,
    deps: AIChatDeps
): Promise<void> {
    const { supabase, sendMessage, visual } = deps;
    
    try {
        await sendMessage(chatId, '⏳ _Analisando..._');
        
        // Build context from investigation data if available
        let context = '';
        if (investigationId) {
            context = await buildInvestigationContext(supabase, investigationId, visual);
        }
        
        // Build system prompt
        const systemPrompt = buildSystemPrompt(context, username);

        // Call LLM via OpenRouter
        const completion = await deps.openai.chat.completions.create({
            model: process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-001",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userMessage }
            ],
            max_tokens: 1000,
            temperature: 0.7
        });

        const response = completion.choices[0]?.message?.content || 'Desculpe, não consegui processar sua mensagem.';
        
        // Format response with visual pattern
        const formattedResponse = `🤖 **Resposta do Agente**
${visual.separator}

${response}

${visual.separatorShort}
💡 _Comandos: /buscar, /grafo, /analisar, /silencio_`;

        await sendMessage(chatId, formattedResponse);
        
    } catch (error) {
        console.error('[Intelink AI] Error:', error);
        await sendMessage(chatId, `❌ **Erro no processamento IA**

Tente novamente ou use comandos específicos:
• \`/buscar [termo]\`
• \`/quem [nome]\`
• \`/analisar\``);
    }
}

// ============================================
// EMBEDDINGS
// ============================================

/**
 * Gera embedding para texto usando OpenAI
 */
export async function generateEmbedding(
    openai: OpenAI,
    text: string
): Promise<number[]> {
    try {
        const response = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: text,
            encoding_format: "float",
        });
        return response.data[0].embedding;
    } catch (error) {
        console.error('[AI Chat] Embedding Error:', error);
        return [];
    }
}
