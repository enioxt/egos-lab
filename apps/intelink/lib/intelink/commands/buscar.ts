/**
 * Comando /buscar - Busca inteligente de entidades
 */

import { Command, CommandContext, CommandDependencies, VISUAL } from './types';

export const buscarCommand: Command = {
    name: 'buscar',
    aliases: ['search', 'find'],
    description: 'Busca inteligente de entidades',
    
    async execute(ctx: CommandContext, deps: CommandDependencies): Promise<void> {
        const { supabase, sendMessage } = deps;
        const { chatId, userId, args } = ctx;
        
        const query = args?.trim();
        
        // Se não passou termo, mostrar ajuda
        if (!query) {
            // Buscar entidades recentes para sugestões
            const { data: recentEntities } = await supabase
                .from('intelink_entities')
                .select('name, type')
                .order('created_at', { ascending: false })
                .limit(5);

            const suggestions = recentEntities?.slice(0, 5).map(e => {
                const firstName = e.name.split(' ')[0];
                return `\`/buscar ${firstName}\``;
            }).join('\n• ') || '';

            await sendMessage(chatId, `🔍 **BUSCA INTELIGENTE**
${VISUAL.separator}

📝 **Como usar:**
\`/buscar [termo]\`

💡 **O que a busca encontra:**
• Nome de pessoas (JOÃO, MARIA)
• Placas de veículos (ABC-1234)
• Telefones (11999999999)
• CPFs (12345678900)
• Vulgos/Apelidos
• Endereços

${suggestions ? `📌 **Sugestões recentes:**\n• ${suggestions}` : ''}

${VISUAL.separatorShort}
🔎 **Exemplos:**
• \`/buscar ABC-1234\` - placa
• \`/buscar Honda\` - marca
• \`/buscar Carlão\` - vulgo
• \`/buscar Centro\` - bairro`);
            return;
        }
        
        // Buscar entidades que contenham o termo
        const { data: entities, error } = await supabase
            .from('intelink_entities')
            .select(`
                id, name, type, properties, vulgo,
                investigation:intelink_investigations(id, title)
            `)
            .or(`name.ilike.%${query}%,vulgo.ilike.%${query}%,properties->cpf.ilike.%${query}%,properties->plate.ilike.%${query}%,properties->phone.ilike.%${query}%`)
            .limit(10);
        
        if (error) {
            await sendMessage(chatId, `❌ Erro na busca: ${error.message}`);
            return;
        }
        
        if (!entities || entities.length === 0) {
            await sendMessage(chatId, `🔍 **Nenhum resultado para:** "${query}"
${VISUAL.separator}

💡 **Dicas:**
• Use parte do nome/placa
• Tente sinônimos
• Verifique a grafia

📋 Para ver o que existe: \`/buscar\``);
            return;
        }
        
        // Mostrar resultados
        let response = `🔍 **Resultados para:** "${query}"
${VISUAL.separator}

📊 Encontrados: ${entities.length} entidade(s)

`;
        
        entities.forEach((ent, i) => {
            const typeInfo = VISUAL.getType(ent.type);
            const invTitle = (ent.investigation as any)?.title || 'N/A';
            
            response += `${typeInfo.icon} **${ent.name}**${ent.vulgo ? ` (${ent.vulgo})` : ''}\n`;
            response += `   Tipo: ${typeInfo.label}\n`;
            response += `   Operação: ${invTitle}\n`;
            
            // Mostrar propriedades relevantes
            if (ent.properties) {
                const props = ent.properties as Record<string, any>;
                if (props.cpf) response += `   CPF: ${props.cpf}\n`;
                if (props.plate) response += `   Placa: ${props.plate}\n`;
                if (props.phone) response += `   Tel: ${props.phone}\n`;
            }
            response += '\n';
        });
        
        // Links para detalhes
        response += `${VISUAL.separatorShort}\n`;
        response += `👉 \`/quem ${entities[0].name.split(' ')[0]}\` - Ver detalhes\n`;
        response += `👉 \`/grafo ${entities[0].name.split(' ')[0]}\` - Ver conexões`;
        
        await sendMessage(chatId, response);
    }
};
