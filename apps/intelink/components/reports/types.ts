/**
 * Reports Page Types
 * Extracted from app/reports/page.tsx
 */

export interface Investigation {
    id: string;
    title: string;
    status: string;
    updated_at: string;
    created_at?: string;
}

export interface Entity {
    id: string;
    name: string;
    type: string;
    investigation_id: string;
    investigation?: { title: string }[] | { title: string };
}

export interface GeneratedReport {
    id: string;
    type: string;
    title: string;
    target_name?: string;
    created_at: string;
    content?: string;
}

export interface ReportSectionsConfig {
    summary: boolean;
    entities: boolean;
    relationships: boolean;
    timeline: boolean;
    sources: boolean;
    analysis: boolean;
}

export interface MultiDossieResult {
    entityId: string;
    entityName: string;
    report: string;
    selected: boolean;
}
