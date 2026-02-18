/**
 * System Prompts para Análise de Operação
 * 
 * Gera insights investigativos baseados em todos os dados coletados:
 * - Artigos criminais aplicáveis
 * - Linhas de operação sugeridas
 * - Análise de risco (fuga, reincidência, periculosidade)
 * - Diligências recomendadas
 * - Resumo executivo
 * 
 * @version 1.1.0
 * @updated 2025-12-11
 * @changelog 1.1.0 - Adicionadas leis modernas (Stalking, LGPD, Crimes Cibernéticos)
 */

// ============================================
// TIPOS
// ============================================

export interface AnalysisInput {
    investigation: {
        id: string;
        title: string;
        description?: string;
        created_at: string;
    };
    entities: Array<{
        type: string;
        name: string;
        role?: string;
        metadata?: Record<string, any>;
    }>;
    evidence: Array<{
        type: string;
        description: string;
        source_document?: string;
    }>;
    documents: Array<{
        type: string;
        title?: string;
        extracted_text?: string;
        summary?: string;
    }>;
    relationships: Array<{
        source: string;
        target: string;
        type: string;
        description?: string;
    }>;
    timeline?: Array<{
        date: string;
        description: string;
    }>;
}

export interface AnalysisResult {
    criminal_articles: Array<{
        code: string;           // Ex: "CP Art. 121"
        article: string;        // Ex: "Homicídio"
        description: string;    // Descrição do artigo
        qualification?: string; // Ex: "qualificado", "tentado"
        confidence: 'high' | 'medium' | 'low';
        basis: string;          // Justificativa
    }>;
    investigation_lines: Array<{
        title: string;
        description: string;
        priority: 'high' | 'medium' | 'low';
        suggested_actions: string[];
    }>;
    risk_analysis: {
        flight_risk: 'high' | 'medium' | 'low';
        flight_risk_factors: string[];
        recidivism_risk: 'high' | 'medium' | 'low';
        recidivism_factors: string[];
        danger_level: 'high' | 'medium' | 'low';
        danger_factors: string[];
    };
    suggested_diligences: Array<{
        type: string;           // Ex: "OITIVA", "BUSCA", "PERÍCIA"
        description: string;
        priority: 'urgent' | 'high' | 'medium' | 'low';
        target?: string;        // Pessoa/local alvo
        justification: string;
    }>;
    executive_summary: {
        overview: string;       // Resumo dos fatos
        key_findings: string[]; // Principais descobertas
        critical_gaps: string[]; // Lacunas investigativas
        recommendations: string[]; // Recomendações gerais
    };
    metadata: {
        analyzed_at: string;
        entities_count: number;
        evidence_count: number;
        documents_count: number;
        model_used: string;
    };
}

// ============================================
// SYSTEM PROMPT PARA ANÁLISE
// ============================================

export const ANALYSIS_SYSTEM_PROMPT = `# SISTEMA: ANALISTA CRIMINAL - INTELINK

## SUA FUNÇÃO
Você é um analista criminal experiente da Polícia Civil de Minas Gerais.
Sua tarefa é analisar todos os dados de uma operação e gerar insights acionáveis.

## REGRAS CRÍTICAS
1. Responda APENAS com JSON válido
2. NÃO inclua texto antes ou depois do JSON
3. Baseie suas análises APENAS nos fatos apresentados
4. Quando incerto, use confidence "low"
5. Cite especificamente a lei brasileira quando aplicável

## LEGISLAÇÃO BRASILEIRA DE REFERÊNCIA
- CP: Código Penal (Decreto-Lei 2.848/1940)
- CPP: Código de Processo Penal (Decreto-Lei 3.689/1941)
- Lei 11.343/2006: Lei de Drogas
- Lei 11.340/2006: Lei Maria da Penha
- Lei 10.826/2003: Estatuto do Desarmamento
- Lei 8.069/1990: ECA (Estatuto da Criança e do Adolescente)
- Lei 9.503/1997: Código de Trânsito Brasileiro
- Lei 12.850/2013: Organizações Criminosas
- Lei 9.605/1998: Crimes Ambientais
- Lei 12.737/2012: Lei Carolina Dieckmann (Crimes Cibernéticos)
- Lei 14.132/2021: Stalking (Perseguição)
- Lei 14.155/2021: Fraude Eletrônica (Invasão de Dispositivo)
- Lei 13.709/2018: LGPD (Proteção de Dados)
- Lei 14.811/2024: Bullying e Cyberbullying

## SCHEMA JSON (sua resposta deve seguir EXATAMENTE este formato)

{
  "criminal_articles": [
    {
      "code": "CP Art. 121, §2º, I",
      "article": "Homicídio Qualificado",
      "description": "Homicídio cometido mediante paga ou promessa de recompensa",
      "qualification": "qualificado",
      "confidence": "high",
      "basis": "Narrativa indica execução mediante pagamento"
    }
  ],
  "investigation_lines": [
    {
      "title": "Identificação do Mandante",
      "description": "Investigar quem encomendou o crime",
      "priority": "high",
      "suggested_actions": [
        "Quebra de sigilo telefônico do suspeito",
        "Análise de movimentação financeira",
        "Oitiva de testemunhas próximas"
      ]
    }
  ],
  "risk_analysis": {
    "flight_risk": "high",
    "flight_risk_factors": [
      "Suspeito possui condições financeiras",
      "Não possui vínculo empregatício fixo",
      "Possui familiares em outro estado"
    ],
    "recidivism_risk": "medium",
    "recidivism_factors": [
      "Antecedentes por crimes similares",
      "Envolvimento com organização criminosa"
    ],
    "danger_level": "high",
    "danger_factors": [
      "Crime violento contra a vida",
      "Uso de arma de fogo",
      "Possível envolvimento com facção"
    ]
  },
  "suggested_diligences": [
    {
      "type": "OITIVA",
      "description": "Oitiva de MARIA DA SILVA, testemunha ocular",
      "priority": "urgent",
      "target": "MARIA DA SILVA",
      "justification": "Única testemunha presencial do fato"
    },
    {
      "type": "PERÍCIA",
      "description": "Exame de confronto balístico",
      "priority": "high",
      "target": "Arma apreendida",
      "justification": "Confirmar se projéteis correspondem à arma"
    }
  ],
  "executive_summary": {
    "overview": "Trata-se de operação de homicídio qualificado ocorrido em via pública...",
    "key_findings": [
      "Vítima foi executada com 5 disparos de arma de fogo",
      "Testemunha identifica autor como JOÃO DA SILVA",
      "Há indícios de crime encomendado"
    ],
    "critical_gaps": [
      "Mandante ainda não identificado",
      "Arma do crime não foi apreendida",
      "Motivação ainda incerta"
    ],
    "recommendations": [
      "Representar por prisão preventiva do suspeito",
      "Solicitar quebra de sigilo bancário e telefônico",
      "Requisitar imagens de câmeras de segurança da região"
    ]
  },
  "metadata": {
    "analyzed_at": "2025-12-04T21:00:00Z",
    "entities_count": 5,
    "evidence_count": 3,
    "documents_count": 2,
    "model_used": "gemini-2.0-flash"
  }
}

## TIPOS DE DILIGÊNCIAS COMUNS
- OITIVA: Depoimento de pessoa
- BUSCA: Busca e apreensão
- PERÍCIA: Exame pericial
- QUEBRA_SIGILO: Telefônico, bancário, fiscal
- REQUISIÇÃO: Documentos, imagens, informações
- RECONHECIMENTO: Reconhecimento pessoal ou fotográfico
- ACAREAÇÃO: Confronto entre depoimentos
- REPRODUÇÃO: Reprodução simulada dos fatos

## NÍVEIS DE RISCO
- high: Risco elevado, requer atenção imediata
- medium: Risco moderado, monitorar
- low: Risco baixo, acompanhar normalmente

## PRIORIDADES
- urgent: Fazer imediatamente (24-48h)
- high: Fazer em breve (1 semana)
- medium: Fazer quando possível (2-4 semanas)
- low: Pode aguardar (quando houver tempo)
`;

// ============================================
// FUNÇÃO PARA GERAR PROMPT DE CONTEXTO
// ============================================

export function buildAnalysisPrompt(input: AnalysisInput): string {
    const sections: string[] = [];
    
    // Cabeçalho
    sections.push(`# INVESTIGAÇÃO: ${input.investigation.title}`);
    sections.push(`ID: ${input.investigation.id}`);
    sections.push(`Data de abertura: ${new Date(input.investigation.created_at).toLocaleDateString('pt-BR')}`);
    
    if (input.investigation.description) {
        sections.push(`\nDescrição: ${input.investigation.description}`);
    }
    
    // Entidades
    if (input.entities.length > 0) {
        sections.push(`\n## ENTIDADES IDENTIFICADAS (${input.entities.length})`);
        input.entities.forEach(e => {
            const role = e.role ? ` [${e.role}]` : '';
            const meta = e.metadata ? ` - ${JSON.stringify(e.metadata)}` : '';
            sections.push(`- ${e.type}: ${e.name}${role}${meta}`);
        });
    }
    
    // Relacionamentos
    if (input.relationships.length > 0) {
        sections.push(`\n## VÍNCULOS (${input.relationships.length})`);
        input.relationships.forEach(r => {
            const desc = r.description ? ` (${r.description})` : '';
            sections.push(`- ${r.source} → ${r.type} → ${r.target}${desc}`);
        });
    }
    
    // Evidências
    if (input.evidence.length > 0) {
        sections.push(`\n## EVIDÊNCIAS (${input.evidence.length})`);
        input.evidence.forEach(e => {
            const source = e.source_document ? ` [${e.source_document}]` : '';
            sections.push(`- ${e.type}: ${e.description}${source}`);
        });
    }
    
    // Timeline
    if (input.timeline && input.timeline.length > 0) {
        sections.push(`\n## LINHA DO TEMPO`);
        input.timeline.forEach(t => {
            sections.push(`- ${t.date}: ${t.description}`);
        });
    }
    
    // Documentos processados
    if (input.documents.length > 0) {
        sections.push(`\n## DOCUMENTOS PROCESSADOS (${input.documents.length})`);
        input.documents.forEach(d => {
            sections.push(`### ${d.type.toUpperCase()}: ${d.title || 'Sem título'}`);
            if (d.summary) {
                sections.push(`Resumo: ${d.summary}`);
            }
            if (d.extracted_text) {
                // Limitar texto a 2000 caracteres por documento
                const text = d.extracted_text.slice(0, 2000);
                sections.push(`\nConteúdo:\n${text}${d.extracted_text.length > 2000 ? '...[truncado]' : ''}`);
            }
        });
    }
    
    sections.push(`\n## INSTRUÇÃO FINAL`);
    sections.push(`Analise todos os dados acima e gere um JSON seguindo o schema definido.`);
    sections.push(`Responda APENAS com o JSON, sem texto adicional.`);
    
    return sections.join('\n');
}

// ============================================
// TIPOS DE ARTIGOS CRIMINAIS COMUNS
// ============================================

export const COMMON_CRIMINAL_ARTICLES = {
    // Crimes contra a vida
    'CP Art. 121': 'Homicídio simples',
    'CP Art. 121, §1º': 'Homicídio privilegiado',
    'CP Art. 121, §2º': 'Homicídio qualificado',
    'CP Art. 121, §3º': 'Homicídio culposo',
    'CP Art. 122': 'Induzimento ao suicídio',
    'CP Art. 129': 'Lesão corporal',
    
    // Crimes patrimoniais
    'CP Art. 155': 'Furto',
    'CP Art. 157': 'Roubo',
    'CP Art. 158': 'Extorsão',
    'CP Art. 159': 'Extorsão mediante sequestro',
    'CP Art. 171': 'Estelionato',
    'CP Art. 180': 'Receptação',
    
    // Crimes sexuais
    'CP Art. 213': 'Estupro',
    'CP Art. 217-A': 'Estupro de vulnerável',
    
    // Crimes contra a honra
    'CP Art. 138': 'Calúnia',
    'CP Art. 139': 'Difamação',
    'CP Art. 140': 'Injúria',
    
    // Drogas
    'Lei 11.343 Art. 28': 'Porte de drogas para consumo',
    'Lei 11.343 Art. 33': 'Tráfico de drogas',
    'Lei 11.343 Art. 35': 'Associação para o tráfico',
    
    // Armas
    'Lei 10.826 Art. 12': 'Posse irregular de arma',
    'Lei 10.826 Art. 14': 'Porte ilegal de arma',
    'Lei 10.826 Art. 16': 'Posse/porte de arma de uso restrito',
    
    // Maria da Penha
    'Lei 11.340 Art. 5º': 'Violência doméstica',
    
    // Organização criminosa
    'Lei 12.850 Art. 1º': 'Organização criminosa',
    'Lei 12.850 Art. 2º': 'Promover organização criminosa',
    
    // Crimes Cibernéticos (Modernos)
    'Lei 12.737 Art. 154-A': 'Invasão de dispositivo informático',
    'Lei 14.155 Art. 171, §2º-A': 'Fraude eletrônica',
    'CP Art. 147-A': 'Stalking (Perseguição)',
    'CP Art. 146-A': 'Bullying (Intimidação Sistemática)',
    'Lei 13.709 Art. 42': 'Vazamento de dados pessoais (LGPD)',
    
    // Crimes contra crianças (Digital)
    'ECA Art. 241-A': 'Pornografia infantil na internet',
    'ECA Art. 241-B': 'Armazenamento de pornografia infantil',
    'ECA Art. 241-D': 'Aliciamento de menores pela internet',
};
