/**
 * Limpar Command - INTELINK Bot
 * 
 * Limpa mensagens antigas do bot no grupo
 * Nota: Requer callback para confirmação (gerenciado pelo handleCallbackQuery)
 */

import { Command, CommandContext, CommandDependencies, VISUAL } from './types';

export const limparCommand: Command = {
    name: 'limpar',
    aliases: ['clean', 'cleanup'],
    description: 'Limpar mensagens do bot no grupo',

    async execute(ctx: CommandContext, deps: CommandDependencies): Promise<void> {
        const { chatId, chatType } = ctx;
        const { sendMessage, sendMessageWithButtons } = deps;

        // Verificar se é grupo
        if (chatType === 'private') {
            await sendMessage(chatId, `⚠️ Este comando só funciona em grupos.

Use em um grupo do Telegram para limpar mensagens antigas do bot.`);
            return;
        }

        // Mostrar confirmação com botões
        await sendMessageWithButtons(
            chatId,
            `🧹 **LIMPEZA DE MENSAGENS**
${VISUAL.separator}

⚠️ **Atenção:** Este comando deletará as mensagens do bot das últimas 24 horas.

Para confirmar, um administrador deve clicar no botão abaixo.

_Nota: O Telegram só permite deletar mensagens de até 48 horas._`,
            [
                [{ text: "✅ Confirmar Limpeza", callback_data: "confirm_cleanup" }],
                [{ text: "❌ Cancelar", callback_data: "noop" }]
            ]
        );
    }
};

// Nota: A execução real da limpeza é feita no handleCallbackQuery
// quando o usuário clica em "Confirmar Limpeza" (callback_data: "confirm_cleanup")
