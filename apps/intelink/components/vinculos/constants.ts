/**
 * Vinculos Constants
 * Extracted from central/vinculos/page.tsx
 */

import { User, Building2, Car, MapPin } from 'lucide-react';

// ============================================
// INTERFACES
// ============================================

export interface Investigation {
    id: string;
    title: string;
    unit_id: string;
}

export interface UnifiedLink {
    id: string;
    source_entity_id: string;
    target_entity_id: string;
    source_entity_name: string;
    target_entity_name: string;
    source_entity_type: string;
    target_entity_type: string;
    source_investigation_id: string;
    target_investigation_id: string;
    source_investigation?: { title: string };
    target_investigation?: { title: string };
    match_type: string;
    match_reason?: string;
    confidence: number;
    status: string;
    created_at: string;
    reviewed_at?: string;
    reviewed_by?: string;
    reviewer_name?: string;
    metadata?: Record<string, unknown>;
    // Cross-case alert specific
    entity_name?: string;
    entity_type?: string;
    description?: string;
}

export interface VinculosStats {
    total: number;
    pending: number;
    confirmed: number;
    rejected: number;
    high_confidence: number;
    cross_case: number;
}

// ============================================
// VISUAL CONSTANTS
// ============================================

export const TYPE_ICONS: Record<string, typeof User> = {
    PERSON: User,
    ORGANIZATION: Building2,
    COMPANY: Building2,
    VEHICLE: Car,
    LOCATION: MapPin,
};

export const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    in_progress: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    confirmed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export const STATUS_LABELS: Record<string, string> = {
    pending: 'Pendente',
    in_progress: 'Em Análise',
    confirmed: 'Confirmado',
    rejected: 'Rejeitado',
};

export const TYPE_LABELS_PT: Record<string, string> = {
    PERSON: 'Pessoa',
    ORGANIZATION: 'Organização',
    COMPANY: 'Empresa',
    VEHICLE: 'Veículo',
    LOCATION: 'Local',
    PHONE: 'Telefone',
    cpf: 'CPF',
    nome: 'Nome',
    placa: 'Placa',
};

export const CONFIDENCE_DESCRIPTIONS: Record<string, string> = {
    high: 'Alta confiança - identificador único (CPF/Placa)',
    medium: 'Média confiança - nome muito similar',
    low: 'Baixa confiança - padrão similar',
};

export const MATCH_CRITERIA_LABELS: Record<string, string> = {
    cpf: 'CPF idêntico',
    cpf_fuzzy: 'CPF similar',
    nome: 'Nome idêntico',
    nome_similar: 'Nome similar',
    placa: 'Placa idêntica',
    placa_fuzzy: 'Placa similar',
    telefone: 'Telefone idêntico',
    endereco: 'Endereço similar',
    rg: 'RG idêntico',
    default: 'Padrão detectado',
};

// ============================================
// CACHE
// ============================================

export const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// ============================================
// HELPERS
// ============================================

export function getConfidenceDescription(confidence: number): string {
    if (confidence >= 0.9) return CONFIDENCE_DESCRIPTIONS.high;
    if (confidence >= 0.7) return CONFIDENCE_DESCRIPTIONS.medium;
    return CONFIDENCE_DESCRIPTIONS.low;
}

export function getConfidenceColor(confidence: number): string {
    if (confidence >= 0.9) return 'text-emerald-400';
    if (confidence >= 0.7) return 'text-yellow-400';
    return 'text-slate-400';
}

export function getConfidenceBgColor(confidence: number): string {
    if (confidence >= 0.9) return 'bg-emerald-500/20 border-emerald-500/30';
    if (confidence >= 0.7) return 'bg-yellow-500/20 border-yellow-500/30';
    return 'bg-slate-500/20 border-slate-500/30';
}
