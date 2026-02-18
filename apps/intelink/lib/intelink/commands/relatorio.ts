/**
 * Relatorio Command - INTELINK Bot
 * 
 * Gera ou mostra relatório estatístico do dia
 */

import { Command, CommandContext, CommandDependencies, VISUAL } from './types';

export const relatorioCommand: Command = {
    name: 'relatorio',
    aliases: ['report', 'stats'],
    description: 'Ver estatísticas do dia',

    async execute(ctx: CommandContext, deps: CommandDependencies): Promise<void> {
        const { chatId } = ctx;
        const { supabase, sendMessage } = deps;

        const today = new Date().toISOString().split('T')[0];
        const todayStart = `${today}T00:00:00`;
        const todayEnd = `${today}T23:59:59`;

        // Buscar estatísticas do dia
        const [entities, relationships, investigations] = await Promise.all([
            supabase
                .from('intelink_entities')
                .select('type', { count: 'exact' })
                .gte('created_at', todayStart)
                .lte('created_at', todayEnd),
            supabase
                .from('intelink_relationships')
                .select('id', { count: 'exact' })
                .gte('created_at', todayStart)
                .lte('created_at', todayEnd),
            supabase
                .from('intelink_investigations')
                .select('id', { count: 'exact' })
                .gte('created_at', todayStart)
                .lte('created_at', todayEnd)
        ]);

        // Contar por tipo de entidade
        const typeCounts: Record<string, number> = {};
        if (entities.data) {
            for (const e of entities.data) {
                typeCounts[e.type] = (typeCounts[e.type] || 0) + 1;
            }
        }

        const msg = `📊 **RELATÓRIO DO DIA**
${VISUAL.separator}
📅 ${new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

**📈 ESTATÍSTICAS:**

👥 Entidades Adicionadas: **${entities.count || 0}**
   • 👤 Pessoas: ${typeCounts['PERSON'] || 0}
   • 🚗 Veículos: ${typeCounts['VEHICLE'] || 0}
   • 📍 Locais: ${typeCounts['LOCATION'] || 0}
   • 🔫 Armas: ${typeCounts['FIREARM'] || 0}

🔗 Relacionamentos: **${relationships.count || 0}**
📂 Operações Criadas: **${investigations.count || 0}**

${VISUAL.separatorShort}
🤖 _Relatório gerado automaticamente pelo INTELINK_

🌐 [Ver Analytics Completo](http://localhost:3001/analytics)`;

        await sendMessage(chatId, msg);
    }
};
