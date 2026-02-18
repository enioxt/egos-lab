/**
 * Mensagens do Sistema INTELINK
 * 
 * Templates de mensagens para o bot do Telegram
 * Extraído de intelink-service.ts para modularização
 */

// ============================================
// VISUAL HELPERS (importado do serviço principal)
// ============================================

export interface VisualConfig {
    separator: string;
    separatorShort: string;
}

// ============================================
// MENSAGENS DO SISTEMA
// ============================================

export function createMessages(visual: VisualConfig) {
    return {
        // Boas-vindas para novos membros do grupo
        BOAS_VINDAS: (nome: string) => `
🎖️ **BEM-VINDO AO INTELINK, ${nome.toUpperCase()}!**
${visual.separator}

O **INTELINK** é o Sistema de Inteligência Policial que auxilia na análise de informações, mapeamento de vínculos e geração de relatórios.

🔐 **PRIMEIRO PASSO - ACESSAR O DASHBOARD**
Para acessar o painel web, me envie uma mensagem **privada** com o comando:
👉 [Clique aqui para abrir chat privado](https://t.me/IntelinkBot)
Digite: \`/iniciar\`

${visual.separatorShort}
📋 **COMANDOS DISPONÍVEIS**

🔹 **Operações:**
• \`/investigacoes\` - Listar/selecionar operações
• \`/exportar\` - Exportar todos os dados do caso
• \`/buscar [termo]\` - Busca inteligente em entidades
• \`/quem [nome]\` - Ver perfil de pessoa/entidade
• \`/grafo [nome]\` - Ver conexões da entidade

🔹 **Análise:**
• \`/analisar\` - Detectar "pontes" na rede
• \`/achados\` - Ver achados investigativos
• \`/modelo\` - Templates para extrair dados de BOs

🔹 **Equipe:**
• \`/equipe\` - Gerenciar membros da delegacia

🔹 **Ajuda:**
• \`/ajuda\` - Ver todas as instruções
• \`/comandos\` - Lista rápida de comandos

${visual.separatorShort}
📲 **DICA:** Envie PDFs de BOs ou fotos de documentos que eu extraio os dados automaticamente!

_Sistema desenvolvido para a Polícia Civil de Minas Gerais_
`,

        // Comando /ajuda completo
        AJUDA: `
🕵️ **INTELINK - GUIA COMPLETO**
${visual.separator}

**O QUE É O INTELINK?**
Sistema de Inteligência Policial para:
• Mapear vínculos entre pessoas, veículos e locais
• Buscar informações em operações anteriores
• Gerar relatórios automáticos com IA
• Detectar "pontes" (pessoas que conectam grupos criminosos)

${visual.separatorShort}
🔐 **COMO ACESSAR O DASHBOARD WEB**

1️⃣ Clique aqui: [Chat Privado](https://t.me/IntelinkBot)
2️⃣ Digite: \`/iniciar\`
3️⃣ Clique no link que eu enviar
4️⃣ Pronto! Você está logado no painel web

${visual.separatorShort}
📋 **TODOS OS COMANDOS**

🔹 **INVESTIGAÇÕES**
• \`/investigacoes\` - Listar ou criar operações
• \`/exportar\` - Ver todos os dados do caso ativo
• \`/buscar [termo]\` - Busca semântica em todas as entidades
• \`/quem JOÃO SILVA\` - Ver tudo sobre uma pessoa
• \`/grafo MARIA\` - Ver conexões de 1º e 2º grau

🔹 **ANÁLISE AVANÇADA**
• \`/analisar\` - Detectar pontes entre grupos
• \`/modelo ocorrencia\` - Template para extrair dados de BO
• \`/modelo depoimento\` - Template para extrair dados de depoimento

🔹 **INSERIR DADOS**
• \`/inserir {json}\` - Inserir entidades manualmente
• **Enviar arquivo PDF** - Extração automática
• **Enviar foto** - OCR + extração

🔹 **EQUIPE**
• \`/equipe\` - Gerenciar membros da delegacia

🔹 **OUTROS**
• \`/comandos\` - Lista rápida
• \`/ajuda\` - Este menu

${visual.separatorShort}
💡 **DICAS**

• Nomes de pessoas sempre em MAIÚSCULAS
• Use aspas para buscas exatas: \`/buscar "JOÃO DA SILVA"\`
• PDFs de BOs são extraídos automaticamente
• O grafo mostra conexões visuais no dashboard

${visual.separatorShort}
🔗 **LINKS ÚTEIS**
• [Dashboard Web](http://localhost:3001)
• [Central de Inteligência](http://localhost:3001/central)
• [Chat Privado com Bot](https://t.me/IntelinkBot)

_Desenvolvido por EGOS para a PCMG_
`,

        // Lista rápida de comandos
        COMANDOS: `
📋 **COMANDOS RÁPIDOS**
${visual.separatorShort}

\`/investigacoes\` - Listar casos
\`/buscar [termo]\` - Buscar entidade
\`/quem [nome]\` - Ver perfil
\`/grafo [nome]\` - Ver conexões
\`/analisar\` - Detectar pontes
\`/modelo\` - Templates de extração
\`/inserir {json}\` - Inserir dados
\`/ajuda\` - Guia completo
`,

        // Erro genérico
        ERRO_GENERICO: `❌ **Ocorreu um erro**

Tente novamente ou use \`/ajuda\` para ver os comandos disponíveis.`,

        // Sem operação selecionada
        SEM_INVESTIGACAO: `⚠️ **Nenhuma operação selecionada**

Use \`/investigacoes\` para selecionar um caso.`,

        // Sucesso ao inserir
        SUCESSO_INSERCAO: (count: { entities: number; relationships: number }) => `
✅ **Dados Inseridos com Sucesso!**
${visual.separatorShort}

📊 **Resumo:**
• Entidades: ${count.entities}
• Vínculos: ${count.relationships}

_Use \`/grafo\` para visualizar as conexões._
`
    };
}

// Tipo exportado
export type Messages = ReturnType<typeof createMessages>;
