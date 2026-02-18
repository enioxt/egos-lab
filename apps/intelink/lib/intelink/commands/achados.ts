/**
 * Achados Command - INTELINK Bot
 * 
 * Lista achados investigativos da operação ativa
 */

import { Command, CommandContext, CommandDependencies, VISUAL } from './types';

const FINDING_TYPE_LABELS: Record<string, { icon: string; label: string }> = {
    'interview_impression': { icon: '🗣️', label: 'Impressão de Entrevista' },
    'surveillance_obs': { icon: '👁️', label: 'Observação de Vigilância' },
    'technical_analysis': { icon: '🔬', label: 'Análise Técnica' },
    'connection_hypothesis': { icon: '🔗', label: 'Hipótese de Conexão' },
    'modus_operandi': { icon: '🎭', label: 'Modus Operandi' },
    'source_intel': { icon: '🕵️', label: 'Informação de Fonte' }
};

export const achadosCommand: Command = {
    name: 'achados',
    aliases: ['findings'],
    description: 'Ver achados investigativos',

    async execute(ctx: CommandContext, deps: CommandDependencies): Promise<void> {
        const { chatId, userId } = ctx;
        const { supabase, sendMessage } = deps;

        // Buscar operação ativa
        const { data: session } = await supabase
            .from('intelink_sessions')
            .select('investigation_id, investigation:intelink_investigations(id, title)')
            .eq('user_id', userId)
            .single();

        if (!session?.investigation_id) {
            await sendMessage(chatId, `⚠️ **Selecione uma operação primeiro**

Use \`/investigacoes\` para listar e selecionar.`);
            return;
        }

        const invTitle = (session as any).investigation?.title || 'Operação';

        // Buscar achados
        const { data: findings } = await supabase
            .from('investigator_findings')
            .select('*')
            .eq('investigation_id', session.investigation_id)
            .order('confidence', { ascending: false })
            .limit(20);

        if (!findings || findings.length === 0) {
            await sendMessage(chatId, `📭 **Nenhum achado registrado**
${VISUAL.separator}
📂 ${invTitle}

Achados investigativos são observações e hipóteses que ainda não são provas formais.

💡 Use \`/modelo relatorio\` para gerar um prompt que extrai achados automaticamente.`);
            return;
        }

        let msg = `🔍 **ACHADOS INVESTIGATIVOS**
${VISUAL.separator}
📂 **${invTitle}**
📊 ${findings.length} achado(s) registrado(s)

`;

        // Agrupar por tipo
        const grouped: Record<string, any[]> = {};
        for (const f of findings) {
            const tipo = f.finding_type || 'other';
            if (!grouped[tipo]) grouped[tipo] = [];
            grouped[tipo].push(f);
        }

        for (const [tipo, items] of Object.entries(grouped)) {
            const typeInfo = FINDING_TYPE_LABELS[tipo] || { icon: '📌', label: tipo };
            msg += `${VISUAL.separatorShort}\n${typeInfo.icon} **${typeInfo.label.toUpperCase()}** (${items.length})\n\n`;
            
            for (const item of items) {
                const conf = Math.round((item.confidence || 0.7) * 100);
                msg += `• **${item.title || 'Sem título'}** (${conf}%)\n`;
                if (item.description) {
                    const desc = item.description.substring(0, 100);
                    msg += `  _${desc}${item.description.length > 100 ? '...' : ''}_\n`;
                }
                msg += '\n';
            }
        }

        msg += `${VISUAL.separatorShort}
🌐 Ver detalhes no dashboard:
http://localhost:3001/investigation/${session.investigation_id}`;

        await sendMessage(chatId, msg);
    }
};
