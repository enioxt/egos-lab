/**
 * Modelo Command - INTELINK Bot
 * 
 * Mostra meta-prompts para extração de dados
 */

import { Command, CommandContext, CommandDependencies, VISUAL } from './types';

// Meta-prompts disponíveis
const META_PROMPTS: Record<string, { title: string; prompt: string }> = {
    ocorrencia: {
        title: '📋 OCORRÊNCIA POLICIAL',
        prompt: `Atue como Escrivão de Polícia Digital especializado em estruturação de dados.

TAREFA: Extrair entidades e relacionamentos do texto abaixo.

REGRAS OBRIGATÓRIAS:
1. Nomes em MAIÚSCULAS
2. CPF: 000.000.000-00
3. Placa: ABC-1234 (formato Mercosul aceito)
4. Datas: DD/MM/AAAA
5. Tipos de entidade: PERSON, VEHICLE, LOCATION, ORGANIZATION, PHONE, FIREARM

FORMATO JSON:
{
  "entities": [
    {"type": "PERSON", "name": "NOME COMPLETO", "metadata": {"cpf": "", "role": "suspeito|vítima|testemunha", "vulgo": ""}}
  ],
  "relationships": [
    {"source": "NOME1", "target": "NOME2", "type": "TIPO", "description": ""}
  ]
}

TEXTO:
[Cole aqui o texto da ocorrência]`
    },
    depoimento: {
        title: '📝 DEPOIMENTO/INTERROGATÓRIO',
        prompt: `Atue como Escrivão de Polícia Digital.

TAREFA: Extrair informações estruturadas de depoimento.

FOCO ESPECIAL:
- Relações entre pessoas mencionadas
- Locais citados (endereços, estabelecimentos)
- Veículos mencionados
- Cronologia dos fatos
- Apelidos/vulgas

FORMATO JSON:
{
  "depoente": {"name": "", "role": "testemunha|vítima|indiciado"},
  "entities": [...],
  "relationships": [...],
  "timeline": [{"data": "", "evento": ""}]
}

DEPOIMENTO:
[Cole aqui o texto do depoimento]`
    },
    relatorio: {
        title: '📊 RELATÓRIO INVESTIGATIVO',
        prompt: `Atue como Analista de Inteligência Policial.

TAREFA: Consolidar informações de relatório investigativo.

EXTRAIR:
- Todas as pessoas citadas (com qualificação)
- Vínculos entre pessoas
- Organizações criminosas
- Veículos utilizados
- Locais relevantes
- Armas apreendidas

FORMATO JSON:
{
  "resumo": "string",
  "entities": [...],
  "relationships": [...],
  "achados_investigativos": [
    {"tipo": "HIPOTESE|MO|IMPRESSAO", "descricao": "", "confianca": 0-100}
  ]
}

RELATÓRIO:
[Cole aqui o texto do relatório]`
    }
};

export const modeloCommand: Command = {
    name: 'modelo',
    aliases: ['prompt', 'template'],
    description: 'Ver templates de extração de dados',

    async execute(ctx: CommandContext, deps: CommandDependencies): Promise<void> {
        const { chatId, args } = ctx;
        const { sendMessage } = deps;

        const tipo = args.toLowerCase().trim();

        // Se não passou tipo, mostrar menu
        if (!tipo) {
            const menu = `📋 **META-PROMPTS DISPONÍVEIS**
${VISUAL.separator}

Use estes prompts no ChatGPT/Gemini para extrair dados estruturados.

**Comandos:**
• \`/modelo ocorrencia\` - Boletim de ocorrência
• \`/modelo depoimento\` - Depoimento/Interrogatório
• \`/modelo relatorio\` - Relatório investigativo

${VISUAL.separatorShort}
💡 **Como usar:**
1. Copie o prompt abaixo
2. Cole no ChatGPT/Gemini
3. Adicione seus dados brutos
4. Use \`/inserir {json}\` com o resultado`;

            await sendMessage(chatId, menu);
            return;
        }

        // Buscar meta-prompt
        const metaPrompt = META_PROMPTS[tipo];
        
        if (!metaPrompt) {
            await sendMessage(chatId, `❌ Modelo "${tipo}" não encontrado.

**Disponíveis:** ocorrencia, depoimento, relatorio

Use \`/modelo\` para ver todos.`);
            return;
        }

        // Enviar em partes se necessário (limite Telegram 4096)
        const fullMsg = `${metaPrompt.title}
${VISUAL.separator}

**Copie o prompt abaixo e cole no ChatGPT/Gemini:**

\`\`\`
${metaPrompt.prompt}
\`\`\`

${VISUAL.separatorShort}
📋 Após gerar o JSON, use:
\`/inserir {json gerado}\``;

        if (fullMsg.length > 4000) {
            // Dividir em partes
            await sendMessage(chatId, `${metaPrompt.title}\n${VISUAL.separator}\n\n**Prompt:**`);
            await sendMessage(chatId, `\`\`\`\n${metaPrompt.prompt}\n\`\`\``);
            await sendMessage(chatId, `📋 Após gerar o JSON, use:\n\`/inserir {json gerado}\``);
        } else {
            await sendMessage(chatId, fullMsg);
        }
    }
};
