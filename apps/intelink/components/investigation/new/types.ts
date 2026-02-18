/**
 * Types for New Investigation page components
 */

export interface PoliceUnit {
    id: string;
    code: string;
    name: string;
}

export interface TeamMember {
    id: string;
    name: string;
    role: string;
    unit_id: string;
    telegram_username?: string;
}

export interface EntityInput {
    id: string;
    type: 'PERSON' | 'VEHICLE' | 'LOCATION' | 'ORGANIZATION' | 'FIREARM' | 'PHONE';
    role: 'suspeito' | 'testemunha' | 'autor' | 'vitima' | 'informante' | 'evidencia';
    name: string;
    metadata: Record<string, string>;
}

export interface Attachment {
    id: string;
    type: 'ocorrencia' | 'relatorio' | 'depoimento' | 'foto' | 'video' | 'documento';
    name: string;
    file?: File;
}

export type TabType = 'info' | 'equipe' | 'entidades' | 'anexos';
export type EntityType = EntityInput['type'];
export type EntityRole = EntityInput['role'];
export type AttachmentType = Attachment['type'];
