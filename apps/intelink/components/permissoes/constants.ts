/**
 * Permissoes Page Constants
 * Extracted from app/central/permissoes/page.tsx
 */

import { Crown, UserCog, User, GraduationCap, Eye } from 'lucide-react';
import { SystemRole } from '@/hooks/useRole';

export interface Member {
    id: string;
    name: string;
    role: string;
    system_role: SystemRole;
    unit_id: string;
    unit?: { code: string; name: string };
    phone?: string;
    email?: string;
}

export interface VisitorFormData {
    name: string;
    phone: string;
    email: string;
    notes: string;
}

export interface PendingRoleChange {
    memberId: string;
    memberName: string;
    newRole: SystemRole;
}

export interface PasswordResetModal {
    memberId: string;
    memberName: string;
}

export const ROLE_ICONS: Record<SystemRole, typeof Crown> = {
    super_admin: Crown,
    unit_admin: UserCog,
    member: User,
    intern: GraduationCap,
    visitor: Eye,
};

export const ROLE_COLORS: Record<SystemRole, string> = {
    super_admin: 'bg-red-500/20 text-red-400 border-red-500',
    unit_admin: 'bg-orange-500/20 text-orange-400 border-orange-500',
    member: 'bg-blue-500/20 text-blue-400 border-blue-500',
    intern: 'bg-slate-500/20 text-slate-400 border-slate-500',
    visitor: 'bg-slate-600/20 text-slate-500 border-slate-600',
};

export const INITIAL_VISITOR_FORM: VisitorFormData = {
    name: '',
    phone: '',
    email: '',
    notes: '',
};
