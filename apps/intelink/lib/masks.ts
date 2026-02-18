/**
 * INTELINK Masks
 * 
 * Máscaras para documentos brasileiros (CPF, RG, CNPJ, Telefone, Placa)
 */

// ============================================
// CPF - 11 dígitos: 111.111.111-11
// ============================================

export function formatCPF(value: string): string {
  // Remove tudo que não é dígito
  const digits = value.replace(/\D/g, '').slice(0, 11);
  
  // Aplica a máscara progressivamente
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
}

export function unformatCPF(value: string): string {
  return value.replace(/\D/g, '');
}

export function isValidCPF(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(digits)) return false;
  
  // Validação do dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits[i]) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(digits[9])) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(digits[i]) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(digits[10])) return false;
  
  return true;
}

// ============================================
// RG - Formato varia por estado
// ============================================

export type BrazilianState = 
  | 'AC' | 'AL' | 'AM' | 'AP' | 'BA' | 'CE' | 'DF' | 'ES' | 'GO'
  | 'MA' | 'MG' | 'MS' | 'MT' | 'PA' | 'PB' | 'PE' | 'PI' | 'PR'
  | 'RJ' | 'RN' | 'RO' | 'RR' | 'RS' | 'SC' | 'SE' | 'SP' | 'TO';

// Configuração de RG por estado
const RG_CONFIG: Record<BrazilianState, { maxDigits: number; format: (digits: string) => string }> = {
  AC: { maxDigits: 7, format: (d) => d },
  AL: { maxDigits: 8, format: (d) => d.length <= 7 ? d : `${d.slice(0, 7)}-${d.slice(7)}` },
  AM: { maxDigits: 9, format: (d) => d.length <= 8 ? d : `${d.slice(0, 8)}-${d.slice(8)}` },
  AP: { maxDigits: 9, format: (d) => d },
  BA: { maxDigits: 10, format: (d) => d.length <= 8 ? d : `${d.slice(0, 8)}-${d.slice(8)}` },
  CE: { maxDigits: 10, format: (d) => d },
  DF: { maxDigits: 7, format: (d) => d },
  ES: { maxDigits: 7, format: (d) => d },
  GO: { maxDigits: 7, format: (d) => d },
  MA: { maxDigits: 9, format: (d) => d },
  MG: { maxDigits: 8, format: (d) => {
    if (d.length <= 2) return d;
    if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  }},
  MS: { maxDigits: 9, format: (d) => d },
  MT: { maxDigits: 8, format: (d) => d },
  PA: { maxDigits: 7, format: (d) => d },
  PB: { maxDigits: 8, format: (d) => d },
  PE: { maxDigits: 7, format: (d) => d },
  PI: { maxDigits: 9, format: (d) => d },
  PR: { maxDigits: 9, format: (d) => {
    if (d.length <= 2) return d;
    if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
    if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}-${d.slice(8)}`;
  }},
  RJ: { maxDigits: 9, format: (d) => {
    if (d.length <= 2) return d;
    if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
    if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}-${d.slice(8)}`;
  }},
  RN: { maxDigits: 9, format: (d) => d },
  RO: { maxDigits: 9, format: (d) => d },
  RR: { maxDigits: 8, format: (d) => d },
  RS: { maxDigits: 10, format: (d) => d },
  SC: { maxDigits: 8, format: (d) => {
    if (d.length <= 2) return d;
    if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  }},
  SE: { maxDigits: 9, format: (d) => d },
  SP: { maxDigits: 9, format: (d) => {
    // SP pode ter letra no final (dígito verificador)
    const onlyDigits = d.replace(/[^0-9X]/gi, '').slice(0, 9);
    if (onlyDigits.length <= 2) return onlyDigits;
    if (onlyDigits.length <= 5) return `${onlyDigits.slice(0, 2)}.${onlyDigits.slice(2)}`;
    if (onlyDigits.length <= 8) return `${onlyDigits.slice(0, 2)}.${onlyDigits.slice(2, 5)}.${onlyDigits.slice(5)}`;
    return `${onlyDigits.slice(0, 2)}.${onlyDigits.slice(2, 5)}.${onlyDigits.slice(5, 8)}-${onlyDigits.slice(8)}`;
  }},
  TO: { maxDigits: 8, format: (d) => d },
};

export function formatRG(value: string, state: BrazilianState): string {
  const config = RG_CONFIG[state];
  if (!config) return value;
  
  // Para SP, permitir letra X no final
  const isSP = state === 'SP';
  const digits = isSP 
    ? value.replace(/[^0-9X]/gi, '').slice(0, config.maxDigits).toUpperCase()
    : value.replace(/\D/g, '').slice(0, config.maxDigits);
  
  return config.format(digits);
}

export function unformatRG(value: string): string {
  return value.replace(/[^0-9X]/gi, '').toUpperCase();
}

// ============================================
// CNPJ - 14 dígitos: 11.111.111/1111-11
// ============================================

export function formatCNPJ(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 14);
  
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

// ============================================
// TELEFONE - (11) 91111-1111 ou (11) 1111-1111
// ============================================

export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  
  if (digits.length <= 2) return digits.length ? `(${digits}` : '';
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

// ============================================
// PLACA DE VEÍCULO - Mercosul: ABC1D23
// ============================================

export function formatPlaca(value: string): string {
  // Remove caracteres especiais, mantém letras e números
  const clean = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 7);
  
  // Formato Mercosul: ABC1D23 (3 letras, 1 número, 1 letra, 2 números)
  // Formato antigo: ABC-1234 (3 letras, 4 números)
  
  // Não aplica máscara complexa, apenas uppercase e limite
  return clean;
}

// ============================================
// RENAVAM - 11 dígitos
// ============================================

export function formatRenavam(value: string): string {
  return value.replace(/\D/g, '').slice(0, 11);
}

// ============================================
// CHASSI - 17 caracteres alfanuméricos
// ============================================

export function formatChassi(value: string): string {
  // Chassi não tem I, O, Q (confundem com 1, 0)
  return value.replace(/[^A-HJ-NPR-Za-hj-npr-z0-9]/g, '').toUpperCase().slice(0, 17);
}

// ============================================
// BRAZILIAN STATES LIST
// ============================================

export const BRAZILIAN_STATES: { code: BrazilianState; name: string }[] = [
  { code: 'AC', name: 'Acre' },
  { code: 'AL', name: 'Alagoas' },
  { code: 'AM', name: 'Amazonas' },
  { code: 'AP', name: 'Amapá' },
  { code: 'BA', name: 'Bahia' },
  { code: 'CE', name: 'Ceará' },
  { code: 'DF', name: 'Distrito Federal' },
  { code: 'ES', name: 'Espírito Santo' },
  { code: 'GO', name: 'Goiás' },
  { code: 'MA', name: 'Maranhão' },
  { code: 'MG', name: 'Minas Gerais' },
  { code: 'MS', name: 'Mato Grosso do Sul' },
  { code: 'MT', name: 'Mato Grosso' },
  { code: 'PA', name: 'Pará' },
  { code: 'PB', name: 'Paraíba' },
  { code: 'PE', name: 'Pernambuco' },
  { code: 'PI', name: 'Piauí' },
  { code: 'PR', name: 'Paraná' },
  { code: 'RJ', name: 'Rio de Janeiro' },
  { code: 'RN', name: 'Rio Grande do Norte' },
  { code: 'RO', name: 'Rondônia' },
  { code: 'RR', name: 'Roraima' },
  { code: 'RS', name: 'Rio Grande do Sul' },
  { code: 'SC', name: 'Santa Catarina' },
  { code: 'SE', name: 'Sergipe' },
  { code: 'SP', name: 'São Paulo' },
  { code: 'TO', name: 'Tocantins' },
];
