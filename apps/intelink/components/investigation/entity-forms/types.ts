/**
 * Entity Form Types - Shared types for entity forms
 */

export interface EntityInput {
    id: string;
    type: 'PERSON' | 'VEHICLE' | 'LOCATION' | 'ORGANIZATION' | 'FIREARM' | 'PHONE';
    role: 'suspeito' | 'testemunha' | 'autor' | 'vitima' | 'informante' | 'evidencia';
    name: string;
    metadata: Record<string, string>;
}

export interface EntityFormProps {
    entity: EntityInput;
    onUpdate: (id: string, updates: Partial<EntityInput>) => void;
}

export const ENTITY_ROLES = [
    { value: 'suspeito', label: 'Suspeito' },
    { value: 'testemunha', label: 'Testemunha' },
    { value: 'autor', label: 'Autor' },
    { value: 'vitima', label: 'Vítima' },
    { value: 'informante', label: 'Informante' },
    { value: 'evidencia', label: 'Evidência' },
] as const;
