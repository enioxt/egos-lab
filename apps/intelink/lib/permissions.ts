/**
 * Intelink Role-Based Access Control (RBAC)
 * Hierarchical permissions system
 */

// Role hierarchy (higher = more privileges)
export const ROLE_HIERARCHY: Record<string, number> = {
    admin: 100,
    delegado: 80,
    investigador: 60,
    escrivao: 50,
    perito: 50,
    agente: 40,
    estagiario: 10,
};

// Available permissions
export type Permission = 
    | 'view_cases'
    | 'create_case'
    | 'edit_case'
    | 'archive_case'
    | 'delete_case'
    | 'view_entities'
    | 'create_entity'
    | 'edit_entity'
    | 'delete_entity'
    | 'view_evidence'
    | 'upload_evidence'
    | 'delete_evidence'
    | 'view_team'
    | 'manage_team'
    | 'view_analytics'
    | 'view_central_graph'
    | 'run_analysis'
    | 'export_data'
    | 'use_chat'
    | 'admin_settings';

// Role-based permissions
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
    admin: [
        'view_cases', 'create_case', 'edit_case', 'archive_case', 'delete_case',
        'view_entities', 'create_entity', 'edit_entity', 'delete_entity',
        'view_evidence', 'upload_evidence', 'delete_evidence',
        'view_team', 'manage_team',
        'view_analytics', 'view_central_graph', 'run_analysis', 'export_data',
        'use_chat', 'admin_settings'
    ],
    delegado: [
        'view_cases', 'create_case', 'edit_case', 'archive_case',
        'view_entities', 'create_entity', 'edit_entity', 'delete_entity',
        'view_evidence', 'upload_evidence', 'delete_evidence',
        'view_team', 'manage_team',
        'view_analytics', 'view_central_graph', 'run_analysis', 'export_data',
        'use_chat'
    ],
    investigador: [
        'view_cases', 'create_case', 'edit_case',
        'view_entities', 'create_entity', 'edit_entity',
        'view_evidence', 'upload_evidence',
        'view_team',
        'view_analytics', 'view_central_graph', 'run_analysis', 'export_data',
        'use_chat'
    ],
    escrivao: [
        'view_cases', 'edit_case',
        'view_entities', 'create_entity', 'edit_entity',
        'view_evidence', 'upload_evidence',
        'view_team',
        'view_analytics', 'export_data',
        'use_chat'
    ],
    perito: [
        'view_cases',
        'view_entities', 'create_entity', 'edit_entity',
        'view_evidence', 'upload_evidence',
        'view_team',
        'view_analytics', 'run_analysis',
        'use_chat'
    ],
    agente: [
        'view_cases',
        'view_entities', 'create_entity',
        'view_evidence', 'upload_evidence',
        'view_team',
        'use_chat'
    ],
    estagiario: [
        'view_cases',
        'view_entities',
        'view_evidence',
        'view_team'
        // NO: chat, analytics, central graph, export, create/edit
    ],
};

// Check if a role has a specific permission
export function hasPermission(role: string, permission: Permission): boolean {
    const permissions = ROLE_PERMISSIONS[role.toLowerCase()] || ROLE_PERMISSIONS.estagiario;
    return permissions.includes(permission);
}

// Check if a role can perform an action on another role
export function canManageRole(managerRole: string, targetRole: string): boolean {
    const managerLevel = ROLE_HIERARCHY[managerRole.toLowerCase()] || 0;
    const targetLevel = ROLE_HIERARCHY[targetRole.toLowerCase()] || 0;
    return managerLevel > targetLevel;
}

// Get all permissions for a role
export function getRolePermissions(role: string): Permission[] {
    return ROLE_PERMISSIONS[role.toLowerCase()] || ROLE_PERMISSIONS.estagiario;
}

// Check if role can access a page
export function canAccessPage(role: string, page: string): boolean {
    const permissions = getRolePermissions(role);
    
    const pagePermissions: Record<string, Permission> = {
        '/': 'view_cases',
        '/chat': 'use_chat',
        '/analytics': 'view_analytics',
        '/central/graph': 'view_central_graph',
        '/equipe': 'view_team',
        '/jobs': 'view_cases',
        '/reports': 'export_data',
    };
    
    const requiredPermission = pagePermissions[page];
    if (!requiredPermission) return true; // Unknown pages are allowed by default
    
    return permissions.includes(requiredPermission);
}

// Get restricted pages for a role
export function getRestrictedPages(role: string): string[] {
    const allPages = ['/', '/chat', '/analytics', '/central/graph', '/equipe', '/jobs', '/reports'];
    return allPages.filter(page => !canAccessPage(role, page));
}

// Permission check hook for React components
export function useHasPermission(role: string | undefined, permission: Permission): boolean {
    if (!role) return false;
    return hasPermission(role, permission);
}

// Get role display info
export function getRoleInfo(role: string): { 
    name: string; 
    level: number; 
    permissions: Permission[];
    restrictedFeatures: string[];
} {
    const roleKey = role.toLowerCase();
    const level = ROLE_HIERARCHY[roleKey] || 0;
    const permissions = ROLE_PERMISSIONS[roleKey] || [];
    
    const allPermissions = Object.values(ROLE_PERMISSIONS).flat();
    const uniqueAll = [...new Set(allPermissions)];
    const restrictedFeatures = uniqueAll.filter(p => !permissions.includes(p));
    
    const names: Record<string, string> = {
        admin: 'Administrador',
        delegado: 'Delegado(a)',
        investigador: 'Investigador(a)',
        escrivao: 'Escrivão(ã)',
        perito: 'Perito(a)',
        agente: 'Agente',
        estagiario: 'Estagiário(a)',
    };
    
    return {
        name: names[roleKey] || role,
        level,
        permissions,
        restrictedFeatures
    };
}
