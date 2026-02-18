/**
 * Document Upload Constants
 * Extracted from DocumentUploadModal.tsx
 */

import { Users, Car, MapPin, Building2, Target, Phone } from 'lucide-react';
import { DocumentType } from '@/components/intelink/DocumentActionButtons';

export const UPLOAD_TYPE_CONFIG: Record<DocumentType, { 
    label: string; 
    description: string; 
    color: string; 
    accept: string; 
    extensions: string;
}> = {
    reds: { label: 'REDS / BO', description: 'Extração objetiva de fatos confirmados', color: 'blue', accept: '.pdf,.docx,.doc,.txt', extensions: 'PDF, DOCX, DOC, TXT' },
    cs: { label: 'Comunicação de Serviço', description: 'Extração cautelosa - hipóteses marcadas', color: 'amber', accept: '.pdf,.docx,.doc,.txt', extensions: 'PDF, DOCX, DOC, TXT' },
    inquerito: { label: 'Inquérito Policial', description: 'IP completo - oitivas, perícias, diligências', color: 'indigo', accept: '.pdf,.docx,.doc,.txt', extensions: 'PDF, DOCX, DOC, TXT' },
    depoimento: { label: 'Oitiva / Depoimento', description: 'Extração cautelosa - alegações', color: 'purple', accept: '.pdf,.docx,.doc,.txt', extensions: 'PDF, DOCX, DOC, TXT' },
    laudo_pericial: { label: 'Laudo Pericial', description: 'Conclusões periciais e metodologia', color: 'cyan', accept: '.pdf,.docx,.doc,.txt', extensions: 'PDF, DOCX, DOC, TXT' },
    laudo_medico: { label: 'Exame Médico / IML', description: 'Lesões, causa mortis, corpo de delito', color: 'red', accept: '.pdf,.docx,.doc,.txt', extensions: 'PDF, DOCX, DOC, TXT' },
    audio: { label: 'Áudio', description: 'Transcrição + extração', color: 'rose', accept: '.mp3,.wav,.m4a,.ogg,.webm', extensions: 'MP3, WAV, M4A, OGG' },
    livre: { label: 'Texto Livre', description: 'Digite ou cole o texto', color: 'slate', accept: '', extensions: '' },
};

export const ENTITY_ICONS: Record<string, typeof Users> = {
    PERSON: Users,
    VEHICLE: Car,
    LOCATION: MapPin,
    ORGANIZATION: Building2,
    COMPANY: Building2,
    FIREARM: Target,
    PHONE: Phone,
};

export const ENTITY_COLORS: Record<string, string> = {
    PERSON: 'blue',
    VEHICLE: 'pink',
    LOCATION: 'emerald',
    ORGANIZATION: 'red',
    COMPANY: 'amber',
    FIREARM: 'rose',
    PHONE: 'violet',
};

export type Step = 'upload' | 'checking' | 'duplicate_warning' | 'extracting' | 'review' | 'saving' | 'success' | 'error';

export interface DuplicateMatch {
    document_id: string;
    investigation_id: string;
    investigation_title: string;
    unit_name: string | null;
    document_type: string;
    uploaded_at: string;
    match_type: string;
    is_same_investigation: boolean;
}
