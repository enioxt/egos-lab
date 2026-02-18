/**
 * INTELINK - Criminal Articles Database
 * 
 * Base de dados de artigos criminais brasileiros para detecção automática.
 * Inclui: Código Penal, Lei de Drogas, Maria da Penha, Armas, etc.
 * 
 * @version 1.0.0
 * @updated 2025-12-09
 */

// ============================================================================
// TYPES
// ============================================================================

export interface CriminalArticle {
    id: string;
    law: string;
    lawName: string;
    article: string;
    title: string;
    description: string;
    penalty: string;
    keywords: string[];
    severity: 'LEVE' | 'MEDIO' | 'GRAVE' | 'GRAVISSIMO';
    category: string;
}

export interface DetectionResult {
    article: CriminalArticle;
    confidence: number;
    matchedKeywords: string[];
    excerpt: string;
}

// ============================================================================
// CRIMINAL ARTICLES DATABASE
// ============================================================================

export const CRIMINAL_ARTICLES: CriminalArticle[] = [
    // ========================================================================
    // CÓDIGO PENAL - CRIMES CONTRA A PESSOA
    // ========================================================================
    {
        id: 'cp-121',
        law: 'CP',
        lawName: 'Código Penal',
        article: 'Art. 121',
        title: 'Homicídio',
        description: 'Matar alguém',
        penalty: 'Reclusão de 6 a 20 anos',
        keywords: ['homicídio', 'matar', 'morte', 'assassinato', 'assassinar', 'óbito', 'matou', 'tirou a vida', 'ceifou a vida'],
        severity: 'GRAVISSIMO',
        category: 'Crimes contra a vida'
    },
    {
        id: 'cp-121-2',
        law: 'CP',
        lawName: 'Código Penal',
        article: 'Art. 121, §2º',
        title: 'Homicídio Qualificado',
        description: 'Homicídio com qualificadoras (motivo torpe, fútil, meio cruel, etc.)',
        penalty: 'Reclusão de 12 a 30 anos',
        keywords: ['homicídio qualificado', 'motivo torpe', 'motivo fútil', 'meio cruel', 'emboscada', 'asfixia', 'veneno', 'fogo', 'recurso que dificulte defesa', 'feminicídio'],
        severity: 'GRAVISSIMO',
        category: 'Crimes contra a vida'
    },
    {
        id: 'cp-129',
        law: 'CP',
        lawName: 'Código Penal',
        article: 'Art. 129',
        title: 'Lesão Corporal',
        description: 'Ofender a integridade corporal ou a saúde de outrem',
        penalty: 'Detenção de 3 meses a 1 ano',
        keywords: ['lesão corporal', 'agressão', 'espancamento', 'ferimento', 'machucado', 'agrediu', 'bateu', 'socou', 'chutou', 'lesões'],
        severity: 'MEDIO',
        category: 'Crimes contra a pessoa'
    },
    {
        id: 'cp-129-grave',
        law: 'CP',
        lawName: 'Código Penal',
        article: 'Art. 129, §1º',
        title: 'Lesão Corporal Grave',
        description: 'Lesão que resulta em incapacidade, debilidade permanente, etc.',
        penalty: 'Reclusão de 1 a 5 anos',
        keywords: ['lesão grave', 'incapacidade', 'debilidade permanente', 'perigo de vida', 'aceleração de parto', 'fratura', 'trauma grave'],
        severity: 'GRAVE',
        category: 'Crimes contra a pessoa'
    },
    {
        id: 'cp-147',
        law: 'CP',
        lawName: 'Código Penal',
        article: 'Art. 147',
        title: 'Ameaça',
        description: 'Ameaçar alguém de causar-lhe mal injusto e grave',
        penalty: 'Detenção de 1 a 6 meses ou multa',
        keywords: ['ameaça', 'ameaçou', 'vai matar', 'vai morrer', 'vou te pegar', 'intimidação', 'ameaçando'],
        severity: 'LEVE',
        category: 'Crimes contra a pessoa'
    },
    {
        id: 'cp-148',
        law: 'CP',
        lawName: 'Código Penal',
        article: 'Art. 148',
        title: 'Sequestro e Cárcere Privado',
        description: 'Privar alguém de sua liberdade mediante sequestro ou cárcere privado',
        penalty: 'Reclusão de 1 a 3 anos',
        keywords: ['sequestro', 'cárcere privado', 'privação de liberdade', 'manteve preso', 'trancou', 'sequestrou', 'refém'],
        severity: 'GRAVE',
        category: 'Crimes contra a liberdade'
    },

    // ========================================================================
    // CÓDIGO PENAL - CRIMES CONTRA O PATRIMÔNIO
    // ========================================================================
    {
        id: 'cp-155',
        law: 'CP',
        lawName: 'Código Penal',
        article: 'Art. 155',
        title: 'Furto',
        description: 'Subtrair coisa alheia móvel para si ou para outrem',
        penalty: 'Reclusão de 1 a 4 anos e multa',
        keywords: ['furto', 'furtou', 'subtraiu', 'roubou', 'levou', 'surrupiou', 'subtração'],
        severity: 'MEDIO',
        category: 'Crimes contra o patrimônio'
    },
    {
        id: 'cp-157',
        law: 'CP',
        lawName: 'Código Penal',
        article: 'Art. 157',
        title: 'Roubo',
        description: 'Subtrair coisa móvel alheia mediante grave ameaça ou violência',
        penalty: 'Reclusão de 4 a 10 anos e multa',
        keywords: ['roubo', 'assalto', 'roubou', 'assaltou', 'rendeu', 'anunciou o assalto', 'mediante ameaça', 'arma de fogo'],
        severity: 'GRAVE',
        category: 'Crimes contra o patrimônio'
    },
    {
        id: 'cp-157-2',
        law: 'CP',
        lawName: 'Código Penal',
        article: 'Art. 157, §2º',
        title: 'Roubo Majorado',
        description: 'Roubo com emprego de arma, concurso de pessoas, etc.',
        penalty: 'Reclusão de 4 a 10 anos + 1/3 a 1/2',
        keywords: ['roubo com arma', 'arma de fogo', 'concurso de pessoas', 'em grupo', 'bando armado'],
        severity: 'GRAVISSIMO',
        category: 'Crimes contra o patrimônio'
    },
    {
        id: 'cp-158',
        law: 'CP',
        lawName: 'Código Penal',
        article: 'Art. 158',
        title: 'Extorsão',
        description: 'Constranger alguém mediante violência ou grave ameaça a fazer ou tolerar algo',
        penalty: 'Reclusão de 4 a 10 anos e multa',
        keywords: ['extorsão', 'exigiu dinheiro', 'cobrou sob ameaça', 'constrangeu', 'sequestro relâmpago'],
        severity: 'GRAVE',
        category: 'Crimes contra o patrimônio'
    },
    {
        id: 'cp-171',
        law: 'CP',
        lawName: 'Código Penal',
        article: 'Art. 171',
        title: 'Estelionato',
        description: 'Obter vantagem ilícita mediante artifício, ardil ou qualquer outro meio fraudulento',
        penalty: 'Reclusão de 1 a 5 anos e multa',
        keywords: ['estelionato', 'golpe', 'fraude', 'enganou', 'ludibriou', 'trapaceou', 'falsa identidade', 'documento falso', 'pix', 'golpe do pix'],
        severity: 'MEDIO',
        category: 'Crimes contra o patrimônio'
    },
    {
        id: 'cp-180',
        law: 'CP',
        lawName: 'Código Penal',
        article: 'Art. 180',
        title: 'Receptação',
        description: 'Adquirir, receber, transportar, conduzir ou ocultar coisa produto de crime',
        penalty: 'Reclusão de 1 a 4 anos e multa',
        keywords: ['receptação', 'produto de crime', 'coisa roubada', 'comprou roubado', 'desmanche'],
        severity: 'MEDIO',
        category: 'Crimes contra o patrimônio'
    },

    // ========================================================================
    // CÓDIGO PENAL - CRIMES CONTRA A DIGNIDADE SEXUAL
    // ========================================================================
    {
        id: 'cp-213',
        law: 'CP',
        lawName: 'Código Penal',
        article: 'Art. 213',
        title: 'Estupro',
        description: 'Constranger alguém mediante violência ou grave ameaça a ter conjunção carnal ou praticar ato libidinoso',
        penalty: 'Reclusão de 6 a 10 anos',
        keywords: ['estupro', 'abuso sexual', 'violência sexual', 'conjunção carnal', 'ato libidinoso', 'violentou sexualmente'],
        severity: 'GRAVISSIMO',
        category: 'Crimes contra a dignidade sexual'
    },
    {
        id: 'cp-217a',
        law: 'CP',
        lawName: 'Código Penal',
        article: 'Art. 217-A',
        title: 'Estupro de Vulnerável',
        description: 'Ter conjunção carnal ou praticar ato libidinoso com menor de 14 anos ou vulnerável',
        penalty: 'Reclusão de 8 a 15 anos',
        keywords: ['estupro de vulnerável', 'menor de 14', 'abuso de menor', 'pedofilia', 'criança', 'incapaz'],
        severity: 'GRAVISSIMO',
        category: 'Crimes contra a dignidade sexual'
    },

    // ========================================================================
    // LEI 11.343/2006 - LEI DE DROGAS
    // ========================================================================
    {
        id: 'drogas-28',
        law: 'Lei 11.343/2006',
        lawName: 'Lei de Drogas',
        article: 'Art. 28',
        title: 'Porte de Drogas para Consumo Pessoal',
        description: 'Adquirir, guardar, ter em depósito para consumo pessoal',
        penalty: 'Advertência, prestação de serviços comunitários',
        keywords: ['porte de drogas', 'uso pessoal', 'usuário', 'para consumo', 'pequena quantidade'],
        severity: 'LEVE',
        category: 'Crimes de drogas'
    },
    {
        id: 'drogas-33',
        law: 'Lei 11.343/2006',
        lawName: 'Lei de Drogas',
        article: 'Art. 33',
        title: 'Tráfico de Drogas',
        description: 'Importar, exportar, preparar, produzir, fabricar, adquirir, vender, expor à venda, oferecer, ter em depósito, transportar drogas',
        penalty: 'Reclusão de 5 a 15 anos e multa',
        keywords: ['tráfico', 'traficante', 'vender droga', 'fornecedor', 'boca de fumo', 'ponto de venda', 'entorpecente', 'cocaína', 'crack', 'maconha', 'lança-perfume', 'ecstasy'],
        severity: 'GRAVISSIMO',
        category: 'Crimes de drogas'
    },
    {
        id: 'drogas-35',
        law: 'Lei 11.343/2006',
        lawName: 'Lei de Drogas',
        article: 'Art. 35',
        title: 'Associação para o Tráfico',
        description: 'Associarem-se duas ou mais pessoas para o fim de praticar tráfico',
        penalty: 'Reclusão de 3 a 10 anos e multa',
        keywords: ['associação', 'organização criminosa', 'quadrilha', 'facção', 'cv', 'pcc', 'primeiro comando', 'comando vermelho'],
        severity: 'GRAVISSIMO',
        category: 'Crimes de drogas'
    },

    // ========================================================================
    // LEI 11.340/2006 - LEI MARIA DA PENHA
    // ========================================================================
    {
        id: 'maria-penha-violencia',
        law: 'Lei 11.340/2006',
        lawName: 'Lei Maria da Penha',
        article: 'Art. 5º e 7º',
        title: 'Violência Doméstica contra a Mulher',
        description: 'Violência física, psicológica, sexual, patrimonial ou moral contra mulher no âmbito doméstico',
        penalty: 'Agravante + medidas protetivas',
        keywords: ['violência doméstica', 'maria da penha', 'agressor', 'companheiro', 'marido', 'ex-marido', 'namorado', 'esposa', 'mulher', 'bateu na mulher', 'agrediu a esposa'],
        severity: 'GRAVE',
        category: 'Violência doméstica'
    },
    {
        id: 'maria-penha-descumprimento',
        law: 'Lei 11.340/2006 + CP',
        lawName: 'Lei Maria da Penha',
        article: 'Art. 24-A',
        title: 'Descumprimento de Medida Protetiva',
        description: 'Descumprir decisão judicial que defere medidas protetivas de urgência',
        penalty: 'Detenção de 3 meses a 2 anos',
        keywords: ['descumpriu medida protetiva', 'violou medida', 'aproximou da vítima', 'desrespeitou ordem judicial'],
        severity: 'GRAVE',
        category: 'Violência doméstica'
    },

    // ========================================================================
    // LEI 10.826/2003 - ESTATUTO DO DESARMAMENTO
    // ========================================================================
    {
        id: 'armas-12',
        law: 'Lei 10.826/2003',
        lawName: 'Estatuto do Desarmamento',
        article: 'Art. 12',
        title: 'Posse Irregular de Arma de Fogo',
        description: 'Possuir ou manter sob sua guarda arma de fogo de uso permitido em desacordo com determinação legal',
        penalty: 'Detenção de 1 a 3 anos e multa',
        keywords: ['posse de arma', 'arma em casa', 'arma irregular', 'arma sem registro'],
        severity: 'MEDIO',
        category: 'Crimes de armas'
    },
    {
        id: 'armas-14',
        law: 'Lei 10.826/2003',
        lawName: 'Estatuto do Desarmamento',
        article: 'Art. 14',
        title: 'Porte Ilegal de Arma de Fogo',
        description: 'Portar, deter, adquirir, fornecer arma de fogo de uso permitido sem autorização',
        penalty: 'Reclusão de 2 a 4 anos e multa',
        keywords: ['porte de arma', 'arma na cintura', 'andando armado', 'portando arma'],
        severity: 'GRAVE',
        category: 'Crimes de armas'
    },
    {
        id: 'armas-16',
        law: 'Lei 10.826/2003',
        lawName: 'Estatuto do Desarmamento',
        article: 'Art. 16',
        title: 'Posse ou Porte de Arma de Uso Restrito',
        description: 'Possuir, deter, fabricar ou empregar artefato explosivo ou arma de uso restrito',
        penalty: 'Reclusão de 3 a 6 anos e multa',
        keywords: ['arma de uso restrito', 'fuzil', 'metralhadora', 'granada', 'explosivo', 'arma de guerra'],
        severity: 'GRAVISSIMO',
        category: 'Crimes de armas'
    },

    // ========================================================================
    // LEI 12.850/2013 - ORGANIZAÇÕES CRIMINOSAS
    // ========================================================================
    {
        id: 'orcrim-2',
        law: 'Lei 12.850/2013',
        lawName: 'Lei de Organizações Criminosas',
        article: 'Art. 2º',
        title: 'Participação em Organização Criminosa',
        description: 'Promover, constituir, financiar ou integrar organização criminosa',
        penalty: 'Reclusão de 3 a 8 anos e multa',
        keywords: ['organização criminosa', 'orcrim', 'facção', 'milícia', 'grupo criminoso organizado', 'hierarquia criminosa'],
        severity: 'GRAVISSIMO',
        category: 'Crime organizado'
    },

    // ========================================================================
    // OUTROS CRIMES COMUNS
    // ========================================================================
    {
        id: 'cp-288',
        law: 'CP',
        lawName: 'Código Penal',
        article: 'Art. 288',
        title: 'Associação Criminosa',
        description: 'Associarem-se 3 ou mais pessoas para o fim específico de cometer crimes',
        penalty: 'Reclusão de 1 a 3 anos',
        keywords: ['associação criminosa', 'quadrilha', 'bando', 'grupo criminoso', '3 ou mais pessoas'],
        severity: 'GRAVE',
        category: 'Crimes contra a paz pública'
    },
    {
        id: 'cp-329',
        law: 'CP',
        lawName: 'Código Penal',
        article: 'Art. 329',
        title: 'Resistência',
        description: 'Opor-se à execução de ato legal mediante violência ou ameaça a funcionário competente',
        penalty: 'Detenção de 2 meses a 2 anos',
        keywords: ['resistência', 'resistiu à prisão', 'enfrentou policial', 'não se rendeu'],
        severity: 'MEDIO',
        category: 'Crimes contra a administração'
    },
    {
        id: 'cp-330',
        law: 'CP',
        lawName: 'Código Penal',
        article: 'Art. 330',
        title: 'Desobediência',
        description: 'Desobedecer a ordem legal de funcionário público',
        penalty: 'Detenção de 15 dias a 6 meses e multa',
        keywords: ['desobediência', 'desobedeceu', 'não cumpriu ordem', 'ignorou determinação'],
        severity: 'LEVE',
        category: 'Crimes contra a administração'
    },
    {
        id: 'cp-331',
        law: 'CP',
        lawName: 'Código Penal',
        article: 'Art. 331',
        title: 'Desacato',
        description: 'Desacatar funcionário público no exercício da função',
        penalty: 'Detenção de 6 meses a 2 anos e multa',
        keywords: ['desacato', 'ofendeu policial', 'xingou autoridade', 'desrespeitou funcionário'],
        severity: 'MEDIO',
        category: 'Crimes contra a administração'
    },
    {
        id: 'cp-299',
        law: 'CP',
        lawName: 'Código Penal',
        article: 'Art. 299',
        title: 'Falsidade Ideológica',
        description: 'Omitir ou inserir declaração falsa em documento público ou particular',
        penalty: 'Reclusão de 1 a 5 anos (doc. público) ou 1 a 3 anos (particular)',
        keywords: ['falsidade ideológica', 'declaração falsa', 'documento falso', 'falsificou'],
        severity: 'MEDIO',
        category: 'Crimes contra a fé pública'
    },
    {
        id: 'cp-317',
        law: 'CP',
        lawName: 'Código Penal',
        article: 'Art. 317',
        title: 'Corrupção Passiva',
        description: 'Solicitar ou receber vantagem indevida em razão da função',
        penalty: 'Reclusão de 2 a 12 anos e multa',
        keywords: ['corrupção', 'propina', 'suborno', 'vantagem indevida', 'servidor corrupto'],
        severity: 'GRAVISSIMO',
        category: 'Crimes contra a administração'
    },
    {
        id: 'cp-312',
        law: 'CP',
        lawName: 'Código Penal',
        article: 'Art. 312',
        title: 'Peculato',
        description: 'Apropriar-se de dinheiro, valor ou bem móvel público de que tem posse em razão do cargo',
        penalty: 'Reclusão de 2 a 12 anos e multa',
        keywords: ['peculato', 'desvio de verbas', 'apropriação de dinheiro público', 'desviou recursos'],
        severity: 'GRAVISSIMO',
        category: 'Crimes contra a administração'
    },
    {
        id: 'ctn-1',
        law: 'Lei 8.137/1990',
        lawName: 'Crimes contra a Ordem Tributária',
        article: 'Art. 1º',
        title: 'Sonegação Fiscal',
        description: 'Suprimir ou reduzir tributo mediante fraude',
        penalty: 'Reclusão de 2 a 5 anos e multa',
        keywords: ['sonegação', 'sonegar impostos', 'fraude fiscal', 'nota fria', 'evasão fiscal'],
        severity: 'GRAVE',
        category: 'Crimes tributários'
    },
    {
        id: 'lavagem',
        law: 'Lei 9.613/1998',
        lawName: 'Lei de Lavagem de Dinheiro',
        article: 'Art. 1º',
        title: 'Lavagem de Dinheiro',
        description: 'Ocultar ou dissimular a natureza, origem, localização de bens provenientes de infração penal',
        penalty: 'Reclusão de 3 a 10 anos e multa',
        keywords: ['lavagem de dinheiro', 'branqueamento', 'ocultar origem', 'empresa de fachada', 'laranja', 'conta laranja'],
        severity: 'GRAVISSIMO',
        category: 'Crimes financeiros'
    }
];

// ============================================================================
// DETECTION FUNCTION
// ============================================================================

/**
 * Detect criminal articles in a text
 */
export function detectCriminalArticles(text: string, minConfidence: number = 0.3): DetectionResult[] {
    const normalizedText = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const results: DetectionResult[] = [];

    for (const article of CRIMINAL_ARTICLES) {
        const matchedKeywords: string[] = [];
        let matchCount = 0;

        for (const keyword of article.keywords) {
            const normalizedKeyword = keyword.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            if (normalizedText.includes(normalizedKeyword)) {
                matchedKeywords.push(keyword);
                matchCount++;
            }
        }

        if (matchCount > 0) {
            const confidence = Math.min(matchCount / article.keywords.length + 0.2, 1);
            
            if (confidence >= minConfidence) {
                // Find excerpt containing the match
                const firstMatch = matchedKeywords[0].toLowerCase();
                const idx = normalizedText.indexOf(firstMatch.normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
                const start = Math.max(0, idx - 50);
                const end = Math.min(text.length, idx + firstMatch.length + 50);
                const excerpt = '...' + text.substring(start, end).trim() + '...';

                results.push({
                    article,
                    confidence,
                    matchedKeywords,
                    excerpt
                });
            }
        }
    }

    // Sort by confidence descending
    return results.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Get articles by category
 */
export function getArticlesByCategory(category: string): CriminalArticle[] {
    return CRIMINAL_ARTICLES.filter(a => a.category === category);
}

/**
 * Get articles by severity
 */
export function getArticlesBySeverity(severity: CriminalArticle['severity']): CriminalArticle[] {
    return CRIMINAL_ARTICLES.filter(a => a.severity === severity);
}

/**
 * Search articles by keyword
 */
export function searchArticles(query: string): CriminalArticle[] {
    const normalizedQuery = query.toLowerCase();
    return CRIMINAL_ARTICLES.filter(a => 
        a.title.toLowerCase().includes(normalizedQuery) ||
        a.description.toLowerCase().includes(normalizedQuery) ||
        a.keywords.some(k => k.toLowerCase().includes(normalizedQuery))
    );
}

/**
 * Get article by ID
 */
export function getArticleById(id: string): CriminalArticle | undefined {
    return CRIMINAL_ARTICLES.find(a => a.id === id);
}

/**
 * Format detection results for display
 */
export function formatDetectionResults(results: DetectionResult[]): string {
    if (results.length === 0) {
        return 'Nenhum artigo criminal detectado no texto.';
    }

    let output = 'TIPIFICAÇÕES IDENTIFICADAS\n';
    output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';

    for (const result of results) {
        const { article, confidence, matchedKeywords } = result;
        const confidencePercent = Math.round(confidence * 100);
        
        output += `${article.article} - ${article.title}\n`;
        output += `━━━━━━━━━━━━━━━━\n`;
        output += `- Lei: ${article.lawName}\n`;
        output += `- Descrição: ${article.description}\n`;
        output += `- Pena: ${article.penalty}\n`;
        output += `- Severidade: ${article.severity}\n`;
        output += `- Confiança: ${confidencePercent}%\n`;
        output += `- Termos encontrados: ${matchedKeywords.join(', ')}\n\n`;
    }

    return output;
}

export default {
    CRIMINAL_ARTICLES,
    detectCriminalArticles,
    getArticlesByCategory,
    getArticlesBySeverity,
    searchArticles,
    getArticleById,
    formatDetectionResults
};
