/**
 * Telegram Utilities para INTELINK Bot
 * 
 * Funções de comunicação com a API do Telegram
 * Extraído de intelink-service.ts para modularização
 */

// ============================================
// TYPES
// ============================================

export interface TelegramButton {
    text: string;
    callback_data: string;
}

export interface ReplyMarkup {
    inline_keyboard?: TelegramButton[][];
}

// ============================================
// SEND MESSAGE (MARKDOWN)
// ============================================

/**
 * Envia mensagem com formatação Markdown
 */
export async function sendMessage(
    botToken: string,
    chatId: number, 
    text: string, 
    replyMarkup?: ReplyMarkup
): Promise<void> {
    try {
        const body: Record<string, unknown> = {
            chat_id: chatId,
            text,
            parse_mode: 'Markdown'
        };
        
        if (replyMarkup) {
            body.reply_markup = replyMarkup;
        }

        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        const data = await response.json();
        if (!data.ok) {
            console.error('[Telegram] API Error:', data);
        }
    } catch (e) {
        console.error('[Telegram] Network Error:', e);
    }
}

// ============================================
// SEND MESSAGE (HTML)
// ============================================

/**
 * Envia mensagem com formatação HTML (suporta links clicáveis)
 */
export async function sendMessageHTML(
    botToken: string,
    chatId: number, 
    text: string, 
    replyMarkup?: ReplyMarkup
): Promise<void> {
    try {
        const body: Record<string, unknown> = {
            chat_id: chatId,
            text,
            parse_mode: 'HTML',
            disable_web_page_preview: true
        };
        
        if (replyMarkup) {
            body.reply_markup = replyMarkup;
        }

        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        const data = await response.json();
        if (!data.ok) {
            console.error('[Telegram] API Error:', data);
        }
    } catch (e) {
        console.error('[Telegram] Network Error:', e);
    }
}

// ============================================
// SEND MESSAGE WITH BUTTONS
// ============================================

/**
 * Envia mensagem com botões inline
 */
export async function sendMessageWithButtons(
    botToken: string,
    chatId: number, 
    text: string, 
    buttons: TelegramButton[][]
): Promise<void> {
    await sendMessage(botToken, chatId, text, { inline_keyboard: buttons });
}

// ============================================
// ANSWER CALLBACK QUERY
// ============================================

/**
 * Responde callback query para parar animação de loading
 */
export async function answerCallbackQuery(
    botToken: string,
    callbackQueryId: string, 
    text?: string
): Promise<void> {
    try {
        await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                callback_query_id: callbackQueryId,
                text: text || '',
                show_alert: false
            }),
        });
    } catch (e) {
        console.error('[Telegram] answerCallbackQuery Error:', e);
    }
}

// ============================================
// FACTORY FUNCTION
// ============================================

/**
 * Cria funções de envio com bot token já configurado
 */
export function createTelegramClient(botToken: string) {
    return {
        sendMessage: (chatId: number, text: string, replyMarkup?: ReplyMarkup) =>
            sendMessage(botToken, chatId, text, replyMarkup),
        sendMessageHTML: (chatId: number, text: string, replyMarkup?: ReplyMarkup) =>
            sendMessageHTML(botToken, chatId, text, replyMarkup),
        sendMessageWithButtons: (chatId: number, text: string, buttons: TelegramButton[][]) =>
            sendMessageWithButtons(botToken, chatId, text, buttons),
        answerCallbackQuery: (callbackQueryId: string, text?: string) =>
            answerCallbackQuery(botToken, callbackQueryId, text),
    };
}

export type TelegramClient = ReturnType<typeof createTelegramClient>;
