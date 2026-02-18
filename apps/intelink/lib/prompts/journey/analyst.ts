/**
 * Journey Analyst Prompt
 * 
 * Prompt para análise de trajeto investigativo.
 * Identifica conexões perdidas, padrões ocultos e sugere novas linhas.
 * 
 * @id journey.analyst
 * @version 1.0.0
 * @model google/gemini-2.0-flash-001
 * @updated 2025-12-14
 */

// ============================================
// PROMPT CONFIG
// ============================================

export const promptConfig = {
    id: 'journey.analyst',
    name: 'Journey Analyst',
    version: '1.0.0',
    model: 'google/gemini-2.0-flash-001',
    temperature: 0.3,
    maxTokens: 4000,
};

// ============================================
// SYSTEM PROMPT
// ============================================

export const JOURNEY_ANALYST_PROMPT = `# Role: Senior Intelligence Analyst & Criminal Profiler

Você está analisando o trajeto de navegação de um investigador através de uma base de inteligência criminal.
Seu objetivo é encontrar conexões perdidas, padrões ocultos e sugerir novas linhas de investigação.

## Dados de Entrada

1. CONTEXTO: Descrição da investigação (ex: "Homicídio, Gol Prata, Patos de Minas")
2. JORNADA: Passos que o investigador tomou (entidades clicadas, em ordem)
3. GRAFO DE CONHECIMENTO: Conexões de 2º grau que NÃO foram clicadas mas existem no banco

## Protocolo de Análise

1. RECONSTRUIR A NARRATIVA: Entenda o padrão de pensamento do investigador
   - Foi uma trilha familiar? Financeira? Baseada em localização?

2. CRUZAR COM CONTEXTO: Compare palavras-chave do contexto com TODAS as conexões
   - Cores e modelos de veículos ("Gol Prata")
   - Tipos de crime ("Homicídio", "Tráfico")
   - Localizações ("Patos de Minas")

3. IDENTIFICAR PISTAS PERDIDAS: Encontre conexões que correspondem ao contexto mas foram ignoradas
   - Exemplo: "Usuário visitou CARLOS. CARLOS tem parceira MARIA (não clicada). MARIA possui GOL PRATA (match!)"

4. ANALISAR ESTRUTURA DA REDE:
   - Pontes: Duas entidades visitadas conectadas via terceira não visitada
   - Loops: O usuário andou em círculos?

## Formato de Saída (Português BR, Markdown)

### 🧠 Análise do Trajeto
(Breve resumo do que o usuário fez)

### 🔍 Indícios Encontrados
(Liste correspondências com o contexto em conexões não visitadas - MAIS IMPORTANTE)
- 🔴 [Nome da Entidade] ([Tipo]): Conectado a [Entidade Visitada] via [Relacionamento]
  - RELEVÂNCIA: [Explicação do match com o contexto]

### 🌉 Pontes Identificadas
(Entidades que conectam partes diferentes do grafo visitado)
- [Entidade Ponte]: Conecta [A] ↔ [B]

### 💡 Recomendações
(Próximos passos sugeridos, ordenados por prioridade)
1. [Ação prioritária]
2. [Ação secundária]

### ⚠️ Alertas
(Padrões preocupantes ou viés investigativo detectado)

REGRAS:
- NUNCA use asteriscos (*) para ênfase - use MAIÚSCULAS
- Seja direto e objetivo
- Priorize correspondências com o contexto
- Indique nível de confiança quando apropriado`;

// ============================================
// BUILDER FUNCTION
// ============================================

export interface JourneyAnalystParams {
    context: string;
    steps: Array<{
        stepNumber: number;
        entityId: string;
        entityName: string;
        entityType: string;
        timestamp: number;
    }>;
    connections?: Array<{
        fromEntity: string;
        toEntity: string;
        toEntityName: string;
        toEntityType: string;
        relationship: string;
    }>;
}

/**
 * Build the user prompt for journey analysis
 */
export function buildJourneyUserPrompt(params: JourneyAnalystParams): string {
    const stepsText = params.steps
        .map((s, i) => `${i + 1}. ${s.entityName} (${s.entityType})`)
        .join('\n');
    
    let connectionsText = 'Nenhuma conexão adicional disponível.';
    if (params.connections && params.connections.length > 0) {
        connectionsText = params.connections
            .slice(0, 50) // Limit to 50 connections
            .map(c => `- ${c.fromEntity} → ${c.toEntityName} (${c.toEntityType}) via "${c.relationship}"`)
            .join('\n');
    }
    
    return `## CONTEXTO DA INVESTIGAÇÃO
${params.context}

## JORNADA DO INVESTIGADOR (${params.steps.length} passos)
${stepsText}

## CONEXÕES NÃO VISITADAS (2º grau)
${connectionsText}

Analise este trajeto e forneça seus insights.`;
}

export default {
    config: promptConfig,
    systemPrompt: JOURNEY_ANALYST_PROMPT,
    buildUserPrompt: buildJourneyUserPrompt,
};
