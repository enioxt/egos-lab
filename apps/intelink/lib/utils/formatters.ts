/**
 * Data Formatting Utilities
 * 
 * Humaniza dados técnicos (snake_case, inglês) para exibição ao usuário.
 * 
 * @version 1.0.0
 * @created 2025-12-15
 */

// ============================================================
// RELATIONSHIP TYPES - Tradução de tipos de relacionamento
// ============================================================

export const RELATIONSHIP_TYPE_LABELS: Record<string, string> = {
    // Vínculos investigativos
    'suspect_in': 'Suspeito em',
    'suspect': 'Suspeito',
    'victim_in': 'Vítima em',
    'victim': 'Vítima',
    'witness_in': 'Testemunha em',
    'witness': 'Testemunha',
    'member_of': 'Membro de',
    'member': 'Membro',
    'found_at': 'Encontrado em',
    'located_at': 'Localizado em',
    'lives_at': 'Mora em',
    'works_at': 'Trabalha em',
    'works_for': 'Trabalha para',
    
    // Vínculos de posse
    'owns': 'Possui',
    'owned_by': 'Propriedade de',
    'owner': 'Proprietário',
    'driver': 'Motorista',
    'passenger': 'Passageiro',
    
    // Vínculos pessoais
    'knows': 'Conhece',
    'known_by': 'Conhecido por',
    'related_to': 'Relacionado com',
    'family': 'Familiar',
    'partner': 'Parceiro(a)',
    'spouse': 'Cônjuge',
    'parent': 'Pai/Mãe',
    'child': 'Filho(a)',
    'sibling': 'Irmão(ã)',
    
    // Vínculos profissionais
    'employee': 'Funcionário',
    'employer': 'Empregador',
    'colleague': 'Colega',
    'contact': 'Contato',
    'client': 'Cliente',
    'supplier': 'Fornecedor',
    
    // Vínculos de comunicação
    'caller': 'Ligou para',
    'called': 'Recebeu ligação de',
    'messaged': 'Enviou mensagem para',
    'contacted': 'Contatou',
    
    // Vínculos de localização
    'frequents': 'Frequenta',
    'visited': 'Visitou',
    'seen_at': 'Visto em',
    'registered_at': 'Registrado em',
    
    // Vínculos de associação
    'associated_with': 'Associado com',
    'associated': 'Associado',
    'linked_to': 'Vinculado a',
    'connected_to': 'Conectado a',
    
    // Vínculos de documento/menção (IA extractions)
    'appeared_together': 'Citados no mesmo documento',
    'mentioned_together': 'Mencionados juntos',
    'mentioned_with': 'Mencionado junto com',
    'mentioned_in': 'Mencionado em',
    'communicates_with': 'Comunica-se com',
    'communicated_with': 'Comunicou-se com',
    
    // Tipos genéricos (fallback)
    'connection': 'Conexão',
    'link': 'Vínculo',
    'relationship': 'Relacionamento',
    'reference': 'Referência',
    
    // Tipos em português (legacy)
    'possui': 'Proprietário',
    'dirige': 'Motorista',
    'usa': 'Utiliza',
    'visto_em': 'Visto em',
    'estacionado': 'Estacionado em',
    'conhece': 'Conhece',
    'frequenta': 'Frequenta',
    'mora_em': 'Mora em',
    'trabalha_com': 'Trabalha com',
    'familiar': 'Familiar',
    'associado': 'Associado',
    'comparsa': 'Comparsa',
    'relacionado': 'Relacionado',
    'local': 'Local',
};

/**
 * Traduz tipo de relacionamento de snake_case/inglês para português legível
 */
export function humanizeRelationType(type: string | undefined | null): string {
    if (!type) return 'Vínculo';
    
    // Normalizar: minúsculas e substituir espaços por underscore
    const normalized = type.toLowerCase().trim().replace(/\s+/g, '_');
    
    // Buscar tradução direta
    if (RELATIONSHIP_TYPE_LABELS[normalized]) {
        return RELATIONSHIP_TYPE_LABELS[normalized];
    }
    
    // Tentar sem sufixos comuns (_in, _at, _to, _of, _by)
    const withoutSuffix = normalized.replace(/_(in|at|to|of|by|with)$/, '');
    if (RELATIONSHIP_TYPE_LABELS[withoutSuffix]) {
        return RELATIONSHIP_TYPE_LABELS[withoutSuffix];
    }
    
    // Fallback: converter snake_case para Title Case
    return type
        .replace(/_/g, ' ')
        .replace(/\b\w/g, char => char.toUpperCase());
}

// ============================================================
// ENTITY FIELD LABELS - Tradução de campos de entidade
// ============================================================

export const ENTITY_FIELD_LABELS: Record<string, string> = {
    // Campos de pessoa
    'name': 'Nome',
    'cpf': 'CPF',
    'rg': 'RG',
    'role': 'Função',
    'occupation': 'Ocupação',
    'profession': 'Profissão',
    'birthdate': 'Data de Nascimento',
    'birth_date': 'Data de Nascimento',
    'age': 'Idade',
    'gender': 'Gênero',
    'sex': 'Sexo',
    'nationality': 'Nacionalidade',
    'mother': 'Mãe',
    'father': 'Pai',
    'mother_name': 'Nome da Mãe',
    'father_name': 'Nome do Pai',
    'filiation': 'Filiação',
    'marital_status': 'Estado Civil',
    'education': 'Escolaridade',
    
    // Campos de contato
    'phone': 'Telefone',
    'email': 'E-mail',
    'address': 'Endereço',
    'city': 'Cidade',
    'state': 'Estado',
    'zip': 'CEP',
    'zipcode': 'CEP',
    'country': 'País',
    
    // Campos de veículo
    'plate': 'Placa',
    'license_plate': 'Placa',
    'brand': 'Marca',
    'model': 'Modelo',
    'year': 'Ano',
    'color': 'Cor',
    'chassis': 'Chassi',
    'renavam': 'RENAVAM',
    'vehicle_type': 'Tipo de Veículo',
    
    // Campos de arma
    'caliber': 'Calibre',
    'calibre': 'Calibre',
    'serial': 'Número de Série',
    'serial_number': 'Número de Série',
    'weapon_type': 'Tipo de Arma',
    'manufacturer': 'Fabricante',
    'registration': 'Registro',
    
    // Campos de organização
    'cnpj': 'CNPJ',
    'company_name': 'Razão Social',
    'trade_name': 'Nome Fantasia',
    'fantasy_name': 'Nome Fantasia',
    
    // Campos gerais
    'description': 'Descrição',
    'notes': 'Observações',
    'status': 'Status',
    'type': 'Tipo',
    'category': 'Categoria',
    'source': 'Fonte',
    'confidence': 'Confiança',
    'created_at': 'Criado em',
    'updated_at': 'Atualizado em',
};

/**
 * Traduz nome de campo de snake_case/inglês para português legível
 */
export function humanizeFieldLabel(field: string | undefined | null): string {
    if (!field) return '';
    
    const normalized = field.toLowerCase().trim();
    
    if (ENTITY_FIELD_LABELS[normalized]) {
        return ENTITY_FIELD_LABELS[normalized];
    }
    
    // Fallback: converter snake_case para Title Case
    return field
        .replace(/_/g, ' ')
        .replace(/\b\w/g, char => char.toUpperCase());
}

// ============================================================
// FILENAME UTILITIES - Limpeza de nomes de arquivo
// ============================================================

/**
 * Limpa nome de arquivo para exibição
 * - Remove extensões (.pdf, .docx, .doc)
 * - Remove prefixos numéricos (ex: "67-191 ")
 * - Substitui underscores e hífens por espaços
 * - Capitaliza primeira letra
 */
export function prettifyFilename(filename: string | undefined | null): string {
    if (!filename) return 'Documento';
    
    let cleaned = filename;
    
    // Remove extensões comuns
    cleaned = cleaned.replace(/\.(pdf|docx?|xlsx?|txt|csv|png|jpe?g|gif|mp3|mp4|wav)$/i, '');
    
    // Remove prefixos numéricos (ex: "67-191 ", "001_", "2024-01-")
    cleaned = cleaned.replace(/^[\d\-_]+\s*/g, '');
    
    // Substitui underscores e hífens por espaços
    cleaned = cleaned.replace(/[_-]+/g, ' ');
    
    // Remove espaços extras
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    // Capitaliza primeira letra de cada palavra
    cleaned = cleaned.replace(/\b\w/g, char => char.toUpperCase());
    
    return cleaned || 'Documento';
}

/**
 * Retorna ícone baseado na extensão do arquivo
 */
export function getFileExtension(filename: string | undefined | null): string {
    if (!filename) return '';
    
    const match = filename.match(/\.(\w+)$/i);
    return match ? match[1].toLowerCase() : '';
}

// ============================================================
// STATUS LABELS - Tradução de status
// ============================================================

export const STATUS_LABELS: Record<string, string> = {
    'pending': 'Pendente',
    'in_progress': 'Em Andamento',
    'completed': 'Concluído',
    'confirmed': 'Confirmado',
    'rejected': 'Rejeitado',
    'archived': 'Arquivado',
    'active': 'Ativo',
    'inactive': 'Inativo',
    'draft': 'Rascunho',
    'published': 'Publicado',
    'deleted': 'Excluído',
    'high': 'Alta',
    'medium': 'Média',
    'low': 'Baixa',
    'critical': 'Crítico',
};

/**
 * Traduz status para português
 */
export function humanizeStatus(status: string | undefined | null): string {
    if (!status) return '';
    
    const normalized = status.toLowerCase().trim();
    return STATUS_LABELS[normalized] || status;
}

// ============================================================
// CONFIDENCE LABELS - Labels de confiança
// ============================================================

export const CONFIDENCE_LABELS: Record<string, string> = {
    'high': 'Alta Confiança',
    'medium': 'Média Confiança',
    'low': 'Baixa Confiança',
    'high_confidence': 'Alta Confiança',
    'medium_confidence': 'Média Confiança',
    'low_confidence': 'Baixa Confiança',
    'confirmed': 'Confirmado',
    'partially_confirmed': 'Parcialmente Confirmado',
    'unconfirmed': 'Não Confirmado',
};

/**
 * Traduz nível de confiança para português
 */
export function humanizeConfidence(confidence: string | undefined | null): string {
    if (!confidence) return '';
    
    const normalized = confidence.toLowerCase().trim().replace(/\s+/g, '_');
    return CONFIDENCE_LABELS[normalized] || confidence;
}

// ============================================================
// DATE FORMATTING - Formatação de datas
// ============================================================

/**
 * Formata data relativa (ex: "há 5min", "ontem", "há 3 dias")
 */
export function formatRelativeDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'agora';
    if (diffMins < 60) return `há ${diffMins}min`;
    if (diffHours < 24) return `há ${diffHours}h`;
    if (diffDays === 1) return 'ontem';
    if (diffDays < 7) return `há ${diffDays} dias`;
    // Fallback para data absoluta
    return date.toLocaleDateString('pt-BR');
}

// ============================================================
// INVESTIGATION HELPERS - Helpers de investigação
// ============================================================

export interface Investigation {
    id: string;
    title: string;
    status: string;
    created_at: string;
    updated_at: string;
    entity_count?: number;
    relationship_count?: number;
    evidence_count?: number;
    deleted_at?: string | null;
}

/**
 * Verifica se uma investigação está incompleta e retorna os motivos
 */
export function isInvestigationIncomplete(inv: Investigation): { incomplete: boolean; reasons: string[] } {
    const reasons: string[] = [];
    
    if (!inv.entity_count || inv.entity_count === 0) {
        reasons.push('Nenhuma entidade cadastrada');
    } else if (inv.entity_count < 2) {
        reasons.push('Apenas 1 entidade (mínimo recomendado: 2)');
    }
    
    if (!inv.relationship_count || inv.relationship_count === 0) {
        reasons.push('Nenhum vínculo entre entidades');
    }
    
    return {
        incomplete: reasons.length > 0,
        reasons
    };
}
