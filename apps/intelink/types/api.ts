/**
 * API Types - Shared interfaces for API routes
 * 
 * SSOT for all API request/response types
 */

// ============================================
// COMMON TYPES
// ============================================

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: ApiError;
}

export interface ApiError {
    code: string;
    message: string;
    details?: any;
}

export interface PaginationParams {
    page?: number;
    limit?: number;
    offset?: number;
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
}

// ============================================
// ENTITY TYPES
// ============================================

export type EntityType = 
    | 'PERSON' 
    | 'VEHICLE' 
    | 'LOCATION' 
    | 'ORGANIZATION' 
    | 'COMPANY' 
    | 'FIREARM' 
    | 'WEAPON'
    | 'DOCUMENT'
    | 'OTHER';

export interface Entity {
    id: string;
    name: string;
    type: EntityType;
    metadata?: Record<string, any>;
    investigation_id: string;
    created_at: string;
    updated_at?: string;
}

export interface CreateEntityRequest {
    name: string;
    type: EntityType;
    metadata?: Record<string, any>;
    investigation_id: string;
}

export interface UpdateEntityRequest {
    name?: string;
    type?: EntityType;
    metadata?: Record<string, any>;
}

// ============================================
// RELATIONSHIP TYPES
// ============================================

export type RelationshipType = 
    | 'FAMILY'
    | 'ACCOMPLICE'
    | 'LEADER_OF'
    | 'MEMBER_OF'
    | 'OWNER'
    | 'EMPLOYEE'
    | 'CUSTOMER'
    | 'WITNESS'
    | 'VICTIM'
    | 'SUSPECT'
    | 'LOCATED_AT'
    | 'USES'
    | 'OWNS'
    | 'UNKNOWN';

export interface Relationship {
    id: string;
    source_id: string;
    target_id: string;
    type: RelationshipType;
    description?: string;
    confidence?: number;
    investigation_id: string;
    created_at: string;
}

// ============================================
// INVESTIGATION TYPES
// ============================================

export type InvestigationStatus = 'active' | 'archived' | 'finished' | 'pending';

export interface Investigation {
    id: string;
    title: string;
    description?: string;
    status: InvestigationStatus;
    unit_id?: string;
    created_by?: string;
    created_at: string;
    updated_at?: string;
    deleted_at?: string;
}

export interface CreateInvestigationRequest {
    title: string;
    description?: string;
    unit_id?: string;
}

// ============================================
// FINDING TYPES (Achados Investigativos)
// ============================================

export type FindingType = 
    | 'interview_impression'
    | 'surveillance_obs'
    | 'technical_analysis'
    | 'connection_hypothesis'
    | 'modus_operandi'
    | 'source_intel';

export type ActionPriority = 'immediate' | 'high' | 'medium' | 'low';

export interface InvestigatorFinding {
    id: string;
    investigation_id: string;
    finding_type: FindingType;
    title: string;
    description?: string;
    subject_entity_ids?: string[];
    subject_names?: string[];
    confidence: number;
    source_type?: string;
    source_document_id?: string;
    corroborated_by?: string[];
    corroboration_count?: number;
    suggested_action?: string;
    action_priority?: ActionPriority;
    is_actionable?: boolean;
    status: 'active' | 'archived' | 'invalidated';
    created_at: string;
    updated_at?: string;
}

export interface CreateFindingRequest {
    investigation_id: string;
    finding_type: FindingType;
    title: string;
    description?: string;
    subject_names?: string[];
    confidence: number;
    suggested_action?: string;
    action_priority?: ActionPriority;
}

// ============================================
// CROSS-CASE ALERT TYPES
// ============================================

export type AlertStatus = 'pending' | 'confirmed' | 'dismissed' | 'investigating';
export type MatchType = 'name' | 'cpf' | 'phone' | 'plate';

export interface CrossCaseAlert {
    id: string;
    entity_name: string;
    entity_type: EntityType;
    match_type: MatchType;
    confidence: number;
    description?: string;
    status: AlertStatus;
    source_investigation_id: string;
    target_investigation_id: string;
    created_at: string;
    resolved_at?: string;
}

// ============================================
// DOCUMENT TYPES
// ============================================

export type DocumentType = 'reds' | 'relatorio' | 'cs' | 'depoimento' | 'livre' | 'audio';

export interface Document {
    id: string;
    investigation_id: string;
    type: DocumentType;
    title?: string;
    content?: string;
    extracted_data?: Record<string, any>;
    file_url?: string;
    created_at: string;
}

export interface ExtractDocumentRequest {
    investigation_id: string;
    document_type: DocumentType;
    content: string;
}

// ============================================
// CHAT TYPES
// ============================================

export interface ChatMessage {
    id: string;
    session_id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    created_at: string;
}

export interface ChatSession {
    id: string;
    investigation_id?: string;
    mode: 'individual' | 'central';
    title?: string;
    created_at: string;
    updated_at?: string;
}

// ============================================
// MEMBER/AUTH TYPES
// ============================================

export type MemberRole = 
    | 'delegado'
    | 'escrivao'
    | 'investigador'
    | 'perito'
    | 'medico_legista'
    | 'agente'
    | 'estagiario'
    | 'admin';

export interface Member {
    id: string;
    name: string;
    phone?: string;
    role: MemberRole;
    unit_id?: string;
    telegram_id?: number;
    is_active: boolean;
    created_at: string;
}

// ============================================
// VALIDATION SCHEMAS (for future Zod integration)
// ============================================

export const ENTITY_TYPES: EntityType[] = [
    'PERSON', 'VEHICLE', 'LOCATION', 'ORGANIZATION', 
    'COMPANY', 'FIREARM', 'WEAPON', 'DOCUMENT', 'OTHER'
];

export const FINDING_TYPES: FindingType[] = [
    'interview_impression', 'surveillance_obs', 'technical_analysis',
    'connection_hypothesis', 'modus_operandi', 'source_intel'
];

export const ACTION_PRIORITIES: ActionPriority[] = [
    'immediate', 'high', 'medium', 'low'
];

export const MEMBER_ROLES: MemberRole[] = [
    'delegado', 'escrivao', 'investigador', 'perito',
    'medico_legista', 'agente', 'estagiario', 'admin'
];
