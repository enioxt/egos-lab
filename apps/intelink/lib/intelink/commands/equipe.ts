/**
 * Comando /equipe - Gerenciamento de equipe
 */

import { Command, CommandContext, CommandDependencies, VISUAL } from './types';

export const equipeCommand: Command = {
    name: 'equipe',
    aliases: ['team', 'membros'],
    description: 'Gerenciar membros da equipe',
    
    async execute(ctx: CommandContext, deps: CommandDependencies): Promise<void> {
        const { supabase, sendMessage } = deps;
        const { chatId, userId, args } = ctx;
        
        const subCommand = args?.trim().toLowerCase();
        
        // Menu principal
        if (!subCommand) {
            await sendMessage(chatId, `👥 **GERENCIAMENTO DE EQUIPE**
${VISUAL.separator}

**Comandos disponíveis:**

📋 \`/equipe listar\` - Ver membros da equipe
➕ \`/equipe adicionar\` - Adicionar novo membro
🔗 \`/equipe vincular\` - Vincular seu Telegram

${VISUAL.separatorShort}
**Cargos disponíveis:**
🔴 Delegado
🟢 Escrivão
🔵 Investigador
🟣 Perito

🌐 **Gerenciamento completo:**
http://localhost:3001/equipe`);
            return;
        }
        
        // Subcomando: listar
        if (subCommand === 'listar' || subCommand === 'list') {
            const { data: members, error } = await supabase
                .from('intelink_unit_members')
                .select('id, name, role, chief_function, is_chief, telegram_user_id')
                .order('name');

            if (!members || members.length === 0) {
                await sendMessage(chatId, '📭 Nenhum membro cadastrado ainda.\n\nUse \`/equipe adicionar\` ou acesse o dashboard.');
                return;
            }

            const roleIcons: Record<string, string> = {
                'delegado': '🔴',
                'escrivao': '🟢',
                'investigador': '🔵',
                'perito': '🟣',
                'medico_legista': '🩺',
                'estagiario': '📚'
            };

            const chiefIcons: Record<string, string> = {
                'subinspetor': '⭐',
                'inspetor': '⭐⭐',
                'chefe_cartorio': '📋',
                'chefe_pericia': '🔬',
                'chefe_iml': '🏥',
                'delegado_regional': '🏛️',
                'delegado_departamento': '🏢'
            };

            let response = `👥 **MEMBROS DA EQUIPE**
${VISUAL.separator}

`;
            members.forEach(m => {
                const icon = roleIcons[m.role] || '👤';
                const chiefIcon = m.chief_function ? chiefIcons[m.chief_function] || '' : '';
                const linked = m.telegram_user_id ? '✓' : '';
                
                response += `${icon}${chiefIcon} **${m.name}** ${linked}\n`;
                response += `   ${m.role}${m.chief_function ? ` (${m.chief_function})` : ''}\n\n`;
            });

            response += `${VISUAL.separatorShort}\n`;
            response += `Total: ${members.length} membro(s)\n`;
            response += `✓ = Telegram vinculado`;

            await sendMessage(chatId, response);
            return;
        }
        
        // Subcomando: vincular
        if (subCommand === 'vincular' || subCommand === 'link') {
            await sendMessage(chatId, `🔗 **VINCULAR TELEGRAM**
${VISUAL.separator}

Para vincular seu Telegram ao sistema:

1️⃣ Acesse o dashboard web
2️⃣ Vá em Equipe → Seu perfil
3️⃣ Clique em "Vincular Telegram"
4️⃣ Use o código gerado aqui

🌐 http://localhost:3001/equipe

Ou peça ao administrador para vincular seu ID:
\`Seu Telegram ID: ${userId}\``);
            return;
        }
        
        // Subcomando: adicionar
        if (subCommand === 'adicionar' || subCommand === 'add') {
            await sendMessage(chatId, `➕ **ADICIONAR MEMBRO**
${VISUAL.separator}

Para adicionar membros, use o dashboard web:
🌐 http://localhost:3001/equipe

Lá você pode:
• Definir cargo e cor
• Adicionar foto
• Vincular Telegram
• Definir chefe da unidade`);
            return;
        }
        
        // Comando não reconhecido
        await sendMessage(chatId, `❓ Subcomando não reconhecido: "${subCommand}"\n\nUse \`/equipe\` para ver opções disponíveis.`);
    }
};
