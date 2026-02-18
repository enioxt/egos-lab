/**
 * Comandos Command - INTELINK Bot
 * 
 * Lista rápida de todos os comandos disponíveis
 */

import { Command, CommandContext, CommandDependencies, VISUAL } from './types';

export const comandosCommand: Command = {
    name: 'comandos',
    aliases: ['commands', 'menu'],
    description: 'Lista rápida de comandos',

    async execute(ctx: CommandContext, deps: CommandDependencies): Promise<void> {
        const { chatId } = ctx;
        const { sendMessage } = deps;

        const capabilities = `🤖 **COMANDOS RÁPIDOS - INTELINK**
${VISUAL.separator}

🔹 **Operações:**
• \`/investigacoes\` - Listar/selecionar operações
• \`/exportar\` - Exportar todos os dados do caso
• \`/buscar [termo]\` - Busca inteligente
• \`/quem [nome]\` - Perfil de entidade
• \`/grafo [nome]\` - Ver conexões

🔹 **Análise:**
• \`/analisar\` - Detectar pontes na rede
• \`/modelo\` - Templates de extração

🔹 **Outros:**
• \`/equipe\` - Gerenciar membros
• \`/ajuda\` - Guia completo

📲 **Envie PDFs/fotos** para extração automática

🌐 [Abrir Dashboard Web](http://localhost:3001)`;

        await sendMessage(chatId, capabilities);
    }
};
