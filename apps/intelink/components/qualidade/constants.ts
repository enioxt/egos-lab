/**
 * Qualidade Page Constants
 * Extracted from app/central/qualidade/page.tsx
 */

import React from 'react';
import { 
    FileText, MapPin, Users, CheckCircle, AlertTriangle 
} from 'lucide-react';

export interface DataJob {
    id: string;
    job_type: string;
    priority: string;
    status: string;
    entity_name: string;
    entity_type: string;
    entity_id?: string;
    investigation_id?: string;
    title: string;
    description: string;
    ai_suggestion: string;
    ai_confidence: number;
    original_value: string;
    suggested_value: string;
    points_reward: number;
    created_at: string;
    assigned_to: number | null;
    assigned_at?: string;
    deadline_at?: string;
    deadline_days?: number;
}

export interface UserPoints {
    id: string;
    user_id: number;
    username: string;
    total_points: number;
    rank: string;
    entities_added: number;
    corrections_made: number;
}

export const MAX_ASSIGNED_TASKS = 3;

export const JOB_TYPES: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    'typo_fix': { label: 'Correção de Erro', icon: React.createElement(FileText, { className: "w-4 h-4" }), color: 'yellow' },
    'duplicate_merge': { label: 'Duplicata', icon: React.createElement(Users, { className: "w-4 h-4" }), color: 'orange' },
    'address_enrich': { label: 'Endereço Incompleto', icon: React.createElement(MapPin, { className: "w-4 h-4" }), color: 'blue' },
    'data_validation': { label: 'Validação', icon: React.createElement(CheckCircle, { className: "w-4 h-4" }), color: 'green' },
    'conflict_resolution': { label: 'Conflito', icon: React.createElement(AlertTriangle, { className: "w-4 h-4" }), color: 'red' },
};

export const PRIORITY_COLORS: Record<string, string> = {
    'critical': 'bg-red-500/20 text-red-400 border-red-500/30',
    'high': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    'medium': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    'low': 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

export const PRIORITY_LABELS: Record<string, string> = {
    'critical': 'Crítico',
    'high': 'Alto',
    'medium': 'Médio',
    'low': 'Baixo',
};

export const STATUS_COLORS: Record<string, string> = {
    'pending': 'bg-slate-500/20 text-slate-400',
    'assigned': 'bg-blue-500/20 text-blue-400',
    'in_progress': 'bg-yellow-500/20 text-yellow-400',
    'completed': 'bg-green-500/20 text-green-400',
    'rejected': 'bg-red-500/20 text-red-400',
};

export const STATUS_LABELS: Record<string, string> = {
    'pending': 'Pendente',
    'assigned': 'Atribuído',
    'in_progress': 'Em Andamento',
    'completed': 'Concluído',
    'rejected': 'Rejeitado',
};
