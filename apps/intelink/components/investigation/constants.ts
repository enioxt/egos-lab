/**
 * Investigation Page Constants
 * Extracted from app/investigation/[id]/page.tsx
 */

// Mapeamento de tipos para PT-BR
export const TYPE_LABELS: Record<string, string> = {
    // Entidades
    'PERSON': 'Pessoa',
    'VEHICLE': 'Veículo',
    'LOCATION': 'Local',
    'ORGANIZATION': 'Organização',
    'COMPANY': 'Empresa',
    'WEAPON': 'Arma',
    'FIREARM': 'Arma de Fogo',
    'PHONE': 'Telefone',
    // Evidências (tipos de arquivo)
    'OTHER': 'Outro',
    'IMAGE': 'Imagem',
    'AUDIO': 'Áudio',
    'DOCUMENT': 'Documento',
    // Evidências (tipos de material)
    'DRUG': 'Droga',
    'droga': 'Droga',
    'DEVICE': 'Dispositivo',
    'dispositivo': 'Dispositivo',
    'MONEY': 'Dinheiro',
    'dinheiro': 'Dinheiro',
    'audio': 'Áudio',
    'image': 'Imagem',
    'document': 'Documento',
};

// Tradução de labels de campos (key) para PT-BR
export const FIELD_LABELS: Record<string, string> = {
    'type': 'Tipo',
    'owner': 'Proprietário',
    'address': 'Endereço',
    'phone': 'Telefone',
    'cnpj': 'CNPJ',
    'cpf': 'CPF',
    'role': 'Papel',
    'vulgo': 'Vulgo',
    'profession': 'Profissão',
};

// Tradução de valores para PT-BR
export const VALUE_TRANSLATIONS: Record<string, string> = {
    'company': 'Empresa',
    'COMPANY': 'Empresa',
    'gang': 'Facção',
    'GANG': 'Facção',
    'institution': 'Instituição',
    'INSTITUTION': 'Instituição',
    'suspect': 'Suspeito',
    'SUSPECT': 'Suspeito',
    'witness': 'Testemunha',
    'WITNESS': 'Testemunha',
    'victim': 'Vítima',
    'VICTIM': 'Vítima',
    'informant': 'Informante',
    'INFORMANT': 'Informante',
};

// Helper para traduzir valores
export const translateValue = (value: any): string => {
    const strValue = String(value);
    return VALUE_TRANSLATIONS[strValue] || strValue;
};

// Helper para traduzir labels
export const translateLabel = (label: string): string => {
    return FIELD_LABELS[label] || label;
};

// Entity type colors for graph
export const ENTITY_COLORS: Record<string, string> = { 
    'PERSON': '#60a5fa', 
    'VEHICLE': '#f472b6', 
    'LOCATION': '#34d399', 
    'ORGANIZATION': '#fbbf24',
    'WEAPON': '#f87171',
    'FIREARM': '#f87171'
};

// Get entity color
export const getEntityColor = (type: string): string => {
    return ENTITY_COLORS[type] || '#9ca3af';
};
