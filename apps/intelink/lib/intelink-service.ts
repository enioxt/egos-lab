/**
 * INTELINK Service - Telegram Bot Handler
 * 
 * Refatorado em 16/12/2025 - Delegação total para Command Registry
 * 
 * @version 2.0.0
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import crypto from 'crypto';

// Módulos extraídos
import { sendMetaPrompt as sendMetaPromptModule } from './intelink/meta-prompts';
import {
    handleFileUpload as handleFileUploadModule,
    downloadTelegramFile as downloadTelegramFileModule,
    uploadToSupabase as uploadToSupabaseModule,
    FileUploadDeps
} from './intelink/file-handling';
import {
    handleAIChat as handleAIChatModule,
    generateEmbedding as generateEmbeddingModule,
    AIChatDeps
} from './intelink/ai-chat';
import {
    createTelegramClient,
    sendMessage as sendMessageModule,
    sendMessageHTML as sendMessageHTMLModule,
    answerCallbackQuery as answerCallbackQueryModule,
    TelegramClient
} from './intelink/telegram-utils';
import {
    listUserInvestigations as listUserInvestigationsModule,
    selectInvestigation as selectInvestigationModule,
    showEntityDetails as showEntityDetailsModule,
    InvestigationDeps
} from './intelink/investigations';
import {
    sendMainMenu as sendMainMenuModule,
    sendPromptMenu as sendPromptMenuModule,
    handleAnalyzeCommand as handleAnalyzeCommandModule,
    handleFindingsCommand as handleFindingsCommandModule,
    CommandDeps
} from './intelink/commands';
import { createMessages } from './intelink/messages';

// Command Pattern Registry
import { commandRegistry, parseCommand } from './intelink/commands/index';
import type { CommandContext, CommandDependencies } from './intelink/commands/types';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// INITIALIZATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const openai = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY || 'sk-placeholder',
    baseURL: "https://openrouter.ai/api/v1"
});

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'
);

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN_INTELINK || '';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// VISUAL CONSTANTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const VISUAL = {
    separator: '━━━━━━━━━━━━━━━━━━━',
    separatorShort: '───────────',
    formatName: (name: string) => name.toUpperCase()
};

const MENSAGENS = createMessages({ separator: VISUAL.separator, separatorShort: VISUAL.separatorShort });

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// UTILITY FUNCTIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function sendMessageWithButtons(chatId: number, text: string, buttons: Array<Array<{text: string, callback_data: string}>>) {
    try {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: text,
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: buttons }
            })
        });
    } catch (_e) {
        await sendMessage(chatId, text);
    }
}

async function deleteMessage(chatId: number, messageId: number) {
    try {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/deleteMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, message_id: messageId })
        });
    } catch (_e) {
        // Silently fail
    }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN HANDLER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function handleIntelinkUpdate(update: any) {
    // Handler: New chat members
    if (update.message?.new_chat_members) {
        const chatId = update.message.chat.id;
        for (const member of update.message.new_chat_members) {
            if (!member.is_bot) {
                const nome = member.first_name || member.username || 'Agente';
                await sendMessage(chatId, MENSAGENS.BOAS_VINDAS(nome));
            }
        }
        return;
    }

    // Handler: Callback queries (button clicks)
    if (update.callback_query) {
        await handleCallbackQuery(update.callback_query);
        return;
    }

    if (!update.message) return;

    const { chat, text, from } = update.message;
    const chatId = chat.id;
    const username = from?.username || from?.first_name || 'anônimo';

    // Handler: File uploads (documents, photos)
    if (update.message.document || update.message.photo) {
        await handleFileUpload(update.message, chatId);
        return;
    }

    const cleanText = text?.split('@')[0].trim();
    console.log(`[Intelink] Msg from ${username} (${chatId}): ${cleanText}`);

    // Handler: Telegram Link Code (6-digit)
    if (cleanText && /^\d{6}$/.test(cleanText.trim())) {
        await handleLinkCode(chatId, cleanText.trim(), from);
        return;
    }

    // Handler: Commands via Registry
    if (cleanText?.startsWith('/')) {
        const parsed = parseCommand(cleanText);
        if (parsed && commandRegistry.has(parsed.command)) {
            const ctx: CommandContext = {
                chatId,
                userId: from?.id || 0,
                username,
                text: cleanText,
                args: parsed.args,
                chatType: chat.type as any,
                message: update.message
            };

            const deps: CommandDependencies = {
                supabase,
                sendMessage,
                sendMessageHTML,
                sendMessageWithButtons,
                botToken: BOT_TOKEN
            };

            const handled = await commandRegistry.execute(parsed.command, ctx, deps);
            if (handled) {
                console.log(`[Intelink] ✅ /${parsed.command} handled`);
                return;
            }
        }
        
        // Unknown command
        await sendMessage(chatId, `❓ Comando não reconhecido: \`${cleanText}\`\n\nDigite \`/ajuda\` para ver os comandos disponíveis.`);
        return;
    }

    // Handler: Free text (AI Chat in private)
    if (chat.type === 'private' && cleanText) {
        const { data: session } = await supabase
            .from('intelink_sessions')
            .select('investigation_id, ai_chat_enabled')
            .eq('user_id', from?.id)
            .single();

        if (session?.ai_chat_enabled && session?.investigation_id) {
            await handleAIChat(chatId, cleanText, session.investigation_id, username);
        } else if (!session?.ai_chat_enabled && session) {
            // Annotation mode - silently ignore
        } else {
            // First message - offer AI chat
            await sendMessageWithButtons(chatId, `👋 Olá, **${username}**!

Você ainda não selecionou uma operação.

Use \`/investigacoes\` para listar operações ou \`/ajuda\` para ver os comandos.`, [
                [{ text: "📂 Ver Operações", callback_data: "case_select" }],
                [{ text: "❓ Ajuda", callback_data: "menu_main" }]
            ]);
        }
    }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LINK CODE HANDLER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function handleLinkCode(chatId: number, linkCode: string, from: any) {
    console.log(`[Intelink] Checking link code: ${linkCode}`);
    
    const { data: member } = await supabase
        .from('intelink_unit_members')
        .select('id, name, phone, telegram_link_expires_at')
        .eq('telegram_link_code', linkCode)
        .maybeSingle();
    
    if (!member) {
        await sendMessage(chatId, `❓ Código não reconhecido.

Se você está tentando vincular sua conta:
1. Acesse o site e faça login com seu telefone
2. Copie o código de 6 dígitos gerado
3. Envie o código aqui

🌐 https://intelink.ia.br/auth`);
        return;
    }

    // Check expiration
    if (new Date() > new Date(member.telegram_link_expires_at)) {
        await sendMessage(chatId, `❌ **Código expirado**

Este código de vinculação já expirou.
Volte ao site e solicite um novo código.`);
        return;
    }
    
    // Link the account
    const { error } = await supabase
        .from('intelink_unit_members')
        .update({
            telegram_chat_id: String(chatId),
            telegram_user_id: String(from?.id),
            telegram_username: from?.username || from?.first_name || null,
            telegram_link_code: null,
            telegram_link_expires_at: null
        })
        .eq('id', member.id);
    
    if (!error) {
        console.log(`[Intelink] ✅ Telegram linked for: ${member.name}`);
        await sendMessage(chatId, `✅ **Telegram vinculado com sucesso!**

👤 **${member.name}**
📞 ${member.phone}

${VISUAL.separator}

🔐 Agora você pode:
• Fazer login no sistema web
• Receber códigos de verificação (2FA)

🌐 **Acesse:** https://intelink.ia.br/auth`);
    } else {
        console.error('[Intelink] Link error:', error);
        await sendMessage(chatId, `❌ **Erro ao vincular**\n\nOcorreu um erro. Tente novamente.`);
    }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CALLBACK QUERY HANDLER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function handleCallbackQuery(callbackQuery: any) {
    const { id: callbackId, data, message } = callbackQuery;
    const chatId = message.chat.id;
    const messageId = message.message_id;

    await answerCallbackQuery(callbackId);

    // Route callbacks
    const handlers: Record<string, () => Promise<void>> = {
        'menu_main': async () => {
            await deleteMessage(chatId, messageId);
            await sendMainMenu(chatId, "🏠 **Menu Principal**");
        },
        'menu_prompts': async () => {
            await deleteMessage(chatId, messageId);
            await sendPromptMenu(chatId);
        },
        'case_select': async () => {
            await deleteMessage(chatId, messageId);
            await listUserInvestigations(chatId);
        },
        'search_prompt': async () => {
            await sendMessage(chatId, '🔍 **Busca Semântica**\n\nDigite:\n`/buscar [termo]`\n\nExemplo: `/buscar suspeito ameaça`');
        },
        'search_whois': async () => {
            await sendMessage(chatId, '👤 **Consulta de Entidade**\n\nDigite:\n`/quem [nome]`\n\nExemplo: `/quem João Silva`');
        },
        'analyze_bridge': async () => {
            await handleAnalyzeCommand(chatId, '/analisar');
        },
        'enable_ai_chat': async () => {
            await deleteMessage(chatId, messageId);
            await supabase.from('intelink_sessions').update({ ai_chat_enabled: true }).eq('chat_id', chatId);
            await sendMessage(chatId, `🤖 **Modo Chat IA Ativado!**\n\nAgora você pode conversar comigo livremente.\n\n🔕 Para desativar: \`/silencio\``);
        },
        'disable_ai_chat': async () => {
            await deleteMessage(chatId, messageId);
            await supabase.from('intelink_sessions').update({ ai_chat_enabled: false }).eq('chat_id', chatId);
            await sendMessage(chatId, `📝 **Modo Anotações Ativado**\n\nNão responderei mensagens livres.\n\n🔔 Para reativar: \`/chat\``);
        },
        'noop': async () => {
            await deleteMessage(chatId, messageId);
        },
        'case_back': async () => {
            await deleteMessage(chatId, messageId);
            const { data: session } = await supabase.from('intelink_sessions').select('investigation_id').eq('chat_id', chatId).single();
            if (session?.investigation_id) {
                await selectInvestigation(chatId, session.investigation_id);
            } else {
                await listUserInvestigations(chatId);
            }
        },
        'search_graph': async () => {
            const { data: session } = await supabase.from('intelink_sessions').select('investigation_id').eq('chat_id', chatId).single();
            if (session?.investigation_id) {
                await sendMessage(chatId, `🕸️ **Abrir Grafo Visual:**\n\nhttps://intelink.ia.br/graph/${session.investigation_id}`);
            } else {
                await sendMessage(chatId, '⚠️ Selecione um caso primeiro.');
            }
        },
        'confirm_cleanup': async () => {
            await deleteMessage(chatId, messageId);
            await handleCleanupConfirm(chatId);
        }
    };

    // Check direct handlers
    if (handlers[data]) {
        await handlers[data]();
        return;
    }

    // Dynamic handlers
    if (data.startsWith('prompt_')) {
        await deleteMessage(chatId, messageId);
        await sendMetaPrompt(chatId, data.replace('prompt_', ''));
    } else if (data.startsWith('select_inv_')) {
        await deleteMessage(chatId, messageId);
        await selectInvestigation(chatId, data.replace('select_inv_', ''));
    } else if (data.startsWith('entity_') || data.startsWith('ver_')) {
        await deleteMessage(chatId, messageId);
        const entityId = data.replace('entity_', '').replace('ver_', '');
        await showEntityDetails(chatId, entityId);
    }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CLEANUP HANDLER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function handleCleanupConfirm(chatId: number) {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: messages } = await supabase
        .from('intelink_message_log')
        .select('message_id')
        .eq('chat_id', chatId)
        .eq('can_delete', true)
        .gte('created_at', yesterday);

    if (messages && messages.length > 0) {
        let deleted = 0;
        for (const msg of messages) {
            try {
                await deleteMessage(chatId, msg.message_id);
                deleted++;
            } catch (_e) {}
        }
        
        await supabase
            .from('intelink_message_log')
            .delete()
            .eq('chat_id', chatId)
            .eq('can_delete', true)
            .gte('created_at', yesterday);
        
        await sendMessage(chatId, `🧹 **Limpeza concluída!**\n\n${deleted} mensagens removidas.`);
    } else {
        await sendMessage(chatId, '📭 Nenhuma mensagem para limpar.');
    }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// WRAPPER FUNCTIONS (delegate to modules)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const VISUAL_CONFIG = {
    separator: VISUAL.separator,
    separatorShort: VISUAL.separatorShort,
    getType: (type: string) => ({ icon: '📎', label: type }),
    formatName: VISUAL.formatName
};

async function sendMainMenu(chatId: number, text: string) {
    await sendMainMenuModule(chatId, text, sendMessage);
}

async function sendPromptMenu(chatId: number) {
    await sendPromptMenuModule(chatId, sendMessage);
}

async function handleAnalyzeCommand(chatId: number, text: string) {
    const deps: CommandDeps = { supabase, sendMessage, visual: VISUAL_CONFIG };
    await handleAnalyzeCommandModule(chatId, text, deps);
}

async function handleFindingsCommand(chatId: number) {
    const deps: CommandDeps = { supabase, sendMessage, visual: VISUAL_CONFIG };
    await handleFindingsCommandModule(chatId, deps);
}

async function handleAIChat(chatId: number, userMessage: string, investigationId: string | null, username: string) {
    const deps: AIChatDeps = { 
        supabase, 
        openai, 
        sendMessage: (cId: number, txt: string) => sendMessage(cId, txt),
        visual: {
            separator: VISUAL.separator,
            separatorShort: VISUAL.separatorShort,
            getType: (type: string) => ({ icon: '📎', label: type })
        }
    };
    await handleAIChatModule(chatId, userMessage, investigationId, username, deps);
}

async function generateEmbedding(text: string): Promise<number[]> {
    return generateEmbeddingModule(openai, text);
}

async function sendMessage(chatId: number, text: string, replyMarkup?: any) {
    await sendMessageModule(BOT_TOKEN, chatId, text, replyMarkup);
}

async function sendMessageHTML(chatId: number, text: string, replyMarkup?: any) {
    await sendMessageHTMLModule(BOT_TOKEN, chatId, text, replyMarkup);
}

async function handleFileUpload(message: any, chatId: number) {
    const deps: FileUploadDeps = { 
        supabase, 
        botToken: BOT_TOKEN,
        sendMessage: (cId: number, txt: string) => sendMessage(cId, txt)
    };
    await handleFileUploadModule(message, chatId, deps);
}

async function downloadTelegramFile(fileId: string): Promise<Buffer | null> {
    return downloadTelegramFileModule(fileId, BOT_TOKEN);
}

async function uploadToSupabase(storagePath: string, file: Buffer, contentType: string): Promise<string | null> {
    return uploadToSupabaseModule(supabase, storagePath, file, contentType);
}

async function answerCallbackQuery(callbackQueryId: string, text?: string) {
    await answerCallbackQueryModule(callbackQueryId, BOT_TOKEN, text);
}

async function listUserInvestigations(chatId: number) {
    const deps: InvestigationDeps = { supabase, sendMessage };
    await listUserInvestigationsModule(chatId, deps);
}

async function selectInvestigation(chatId: number, investigationId: string) {
    const deps: InvestigationDeps = { supabase, sendMessage };
    await selectInvestigationModule(chatId, investigationId, deps);
}

async function showEntityDetails(chatId: number, entityId: string) {
    const deps: InvestigationDeps = { supabase, sendMessage };
    await showEntityDetailsModule(chatId, entityId, deps);
}

async function sendMetaPrompt(chatId: number, type: string) {
    await sendMetaPromptModule(chatId, type, (cId: number, txt: string) => sendMessage(cId, txt));
}
