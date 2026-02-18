/**
 * Comando /ajuda - Guia completo do bot
 */

import { Command, CommandContext, CommandDependencies, VISUAL } from './types';

export const helpCommand: Command = {
    name: 'ajuda',
    aliases: ['help', 'h'],
    description: 'Mostra o guia completo de comandos',

    async execute(ctx: CommandContext, deps: CommandDependencies): Promise<void> {
        const helpMessage = `🕵️ **GUIA COMPLETO - INTELINK**
${VISUAL.separator}

📋 **GERENCIAMENTO DE INVESTIGAÇÕES**
• \`/investigacoes\` - Listar todas as operações
• \`/caso [nome]\` - Criar ou acessar operação
• \`/exportar\` - Exportar todos os dados do caso atual

🔍 **BUSCA E ANÁLISE**
• \`/buscar [termo]\` - Busca inteligente em todos dados
• \`/quem [nome]\` - Ver perfil completo de entidade
• \`/grafo [nome]\` - Visualizar conexões de entidade
• \`/analisar\` - Detectar pontes na rede de conexões

📥 **INSERÇÃO DE DADOS**
• \`/inserir {json}\` - Adicionar dados em formato JSON
• \`/modelo\` - Ver templates de extração
• Envie **PDFs ou fotos** para extração automática

👥 **EQUIPE**
• \`/equipe listar\` - Ver membros da operação
• \`/equipe vincular @user\` - Vincular telegram a membro
• \`/equipe adicionar [dados]\` - Adicionar novo membro

📊 **RELATÓRIOS**
• \`/relatorio\` - Estatísticas da operação
• \`/achados\` - Ver achados investigativos

⚙️ **OUTROS**
• \`/iniciar\` - Gerar link de acesso ao dashboard
• \`/dev\` - Link de desenvolvimento (localhost)
• \`/comandos\` - Lista rápida de comandos
• \`/limpar\` - Limpar seleção de operação

${VISUAL.separatorShort}
🌐 **Dashboard Web:** Após \`/iniciar\`, acesse o link gerado
📲 Envie documentos para extração automática com IA`;

        await deps.sendMessage(ctx.chatId, helpMessage);
    }
};

export default helpCommand;
