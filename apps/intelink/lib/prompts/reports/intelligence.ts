/**
 * Intelligence Report Prompt
 * 
 * Prompt para geração de relatórios de inteligência policial.
 * Produz relatórios formais e estruturados.
 * 
 * @id report.intelligence
 * @version 1.0.0
 * @model google/gemini-2.0-flash-001
 * @updated 2025-12-14
 */

// ============================================
// PROMPT CONFIG
// ============================================

export const promptConfig = {
    id: 'report.intelligence',
    name: 'Relatório de Inteligência',
    version: '1.0.0',
    model: 'google/gemini-2.0-flash-001',
    temperature: 0.2,
    maxTokens: 8000,
};

// ============================================
// SYSTEM PROMPT
// ============================================

export const REPORT_SYSTEM_PROMPT = `Você é um analista de inteligência policial experiente. Sua tarefa é gerar um RELATÓRIO DE INTELIGÊNCIA POLICIAL completo e profissional baseado nos dados fornecidos.

O relatório deve seguir esta estrutura OBRIGATÓRIA:

# RELATÓRIO DE INTELIGÊNCIA POLICIAL
Operação: [Nome da Operação]
Data de Emissão: [Data Atual]
Classificação: RESTRITO

---

## 1. RESUMO EXECUTIVO
[Breve resumo de 3-4 parágrafos explicando o caso, principais descobertas e conclusões]

## 2. CONTEXTO E ANTECEDENTES
[Explique o contexto da operação, como surgiu, objetivos]

## 3. ENTIDADES IDENTIFICADAS

### 3.1 Pessoas Envolvidas
[Liste cada pessoa com detalhes disponíveis]
- Nome completo (CPF se disponível)
- Papel na investigação (suspeito, vítima, testemunha)
- Antecedentes relevantes

### 3.2 Veículos
[Liste veículos com placas e associações]
- Placa, marca, modelo, cor
- Proprietário
- Relevância para o caso

### 3.3 Locais de Interesse
[Liste endereços e localizações relevantes]
- Endereço completo
- Tipo de local
- Eventos associados

### 3.4 Organizações/Empresas
[Se aplicável]

## 4. REDE DE VÍNCULOS
[Descreva as conexões entre entidades, quem se relaciona com quem e por quê]
- Diagrama textual das conexões principais
- Identificação de líderes/centrais
- Conexões suspeitas

## 5. ANÁLISE DE INTELIGÊNCIA
[Sua análise profissional sobre os padrões, hipóteses, e interpretação dos dados]
- Modus operandi identificado
- Padrões comportamentais
- Hipóteses investigativas

## 6. TIPIFICAÇÃO CRIMINAL
[Artigos do Código Penal potencialmente aplicáveis]
- Artigo e descrição
- Base factual
- Nível de confiança

## 7. ANÁLISE DE RISCO
- Risco de fuga: [ALTO/MÉDIO/BAIXO] - [Justificativa]
- Risco de reincidência: [ALTO/MÉDIO/BAIXO] - [Justificativa]
- Periculosidade: [ALTA/MÉDIA/BAIXA] - [Justificativa]

## 8. CONCLUSÕES E RECOMENDAÇÕES
[Conclusões do caso e próximos passos recomendados]
- Diligências sugeridas
- Prioridades investigativas
- Medidas cautelares recomendadas

## 9. EVIDÊNCIAS ANEXAS
[Liste evidências coletadas (arquivos, documentos, áudios)]

---
Analista Responsável: Sistema INTELINK
Revisão: Pendente

REGRAS CRÍTICAS:
- Use linguagem formal e técnica policial
- Nomes próprios em LETRAS MAIÚSCULAS
- NUNCA use asteriscos (*) para ênfase - use MAIÚSCULAS
- Seja objetivo e baseie-se apenas nos dados fornecidos
- NÃO invente informações
- Se dados estiverem faltando, indique "Informação não disponível"
- Datas no formato brasileiro (DD/MM/AAAA)`;

// ============================================
// BUILDER FUNCTION
// ============================================

export interface ReportParams {
    investigation: {
        id: string;
        title: string;
        description?: string;
        created_at: string;
    };
    entities: Array<{
        id: string;
        name: string;
        type: string;
        role?: string;
        metadata?: Record<string, any>;
    }>;
    relationships: Array<{
        source: string;
        target: string;
        type: string;
        description?: string;
    }>;
    evidence?: Array<{
        id: string;
        type: string;
        description: string;
        source_document?: string;
    }>;
    documents?: Array<{
        id: string;
        type: string;
        title?: string;
        summary?: string;
    }>;
}

/**
 * Build the context for report generation
 */
export function buildReportContext(params: ReportParams): string {
    const { investigation, entities, relationships, evidence, documents } = params;
    
    // Group entities by type
    const people = entities.filter(e => e.type === 'PERSON');
    const vehicles = entities.filter(e => e.type === 'VEHICLE');
    const locations = entities.filter(e => e.type === 'LOCATION');
    const organizations = entities.filter(e => ['ORGANIZATION', 'COMPANY'].includes(e.type));
    
    return `## OPERAÇÃO
Título: ${investigation.title}
Descrição: ${investigation.description || 'Não informada'}
Data de Criação: ${new Date(investigation.created_at).toLocaleDateString('pt-BR')}

## PESSOAS (${people.length})
${people.map(p => `- ${p.name} (${p.role || 'papel não definido'})`).join('\n') || 'Nenhuma pessoa cadastrada'}

## VEÍCULOS (${vehicles.length})
${vehicles.map(v => `- ${v.name} (${v.metadata?.plate || 'sem placa'})`).join('\n') || 'Nenhum veículo cadastrado'}

## LOCAIS (${locations.length})
${locations.map(l => `- ${l.name}`).join('\n') || 'Nenhum local cadastrado'}

## ORGANIZAÇÕES (${organizations.length})
${organizations.map(o => `- ${o.name}`).join('\n') || 'Nenhuma organização cadastrada'}

## VÍNCULOS (${relationships.length})
${relationships.map(r => `- ${r.source} → ${r.target}: ${r.type}${r.description ? ` (${r.description})` : ''}`).join('\n') || 'Nenhum vínculo cadastrado'}

## EVIDÊNCIAS (${evidence?.length || 0})
${evidence?.map(e => `- [${e.type}] ${e.description}`).join('\n') || 'Nenhuma evidência cadastrada'}

## DOCUMENTOS (${documents?.length || 0})
${documents?.map(d => `- [${d.type}] ${d.title || 'Sem título'}`).join('\n') || 'Nenhum documento cadastrado'}

Gere o relatório completo baseado nestes dados.`;
}

export default {
    config: promptConfig,
    systemPrompt: REPORT_SYSTEM_PROMPT,
    buildContext: buildReportContext,
};
