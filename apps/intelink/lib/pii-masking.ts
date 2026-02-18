/**
 * PII Masking Utilities
 * 
 * Sprint 23 - P0 Task: PII Masking
 * Masks sensitive personal information in API responses
 * 
 * LGPD Compliance: Art. 6, III - Necessidade
 * Only expose PII when strictly necessary
 */

// =====================================================
// MASKING PATTERNS
// =====================================================

/**
 * Mask CPF: 123.456.789-00 → 123.***.***-00
 */
export function maskCPF(cpf: string | null | undefined): string | null {
    if (!cpf) return null;
    
    // Remove formatting
    const clean = cpf.replace(/\D/g, '');
    
    if (clean.length !== 11) return cpf; // Invalid, return as-is
    
    // Keep first 3 and last 2 digits
    return `${clean.slice(0, 3)}.***.***-${clean.slice(-2)}`;
}

/**
 * Mask RG: 12.345.678-9 → 12.***.***-9
 */
export function maskRG(rg: string | null | undefined): string | null {
    if (!rg) return null;
    
    const clean = rg.replace(/\D/g, '');
    
    if (clean.length < 7) return rg; // Too short
    
    return `${clean.slice(0, 2)}.***.***-${clean.slice(-1)}`;
}

/**
 * Mask Phone: (31) 99999-8888 → (31) 9****-**88
 */
export function maskPhone(phone: string | null | undefined): string | null {
    if (!phone) return null;
    
    const clean = phone.replace(/\D/g, '');
    
    if (clean.length < 10) return phone;
    
    // Format: (XX) X****-**XX
    const ddd = clean.slice(0, 2);
    const first = clean.slice(2, 3);
    const last = clean.slice(-2);
    
    return `(${ddd}) ${first}****-**${last}`;
}

/**
 * Mask Email: user@domain.com → u***@d***.com
 */
export function maskEmail(email: string | null | undefined): string | null {
    if (!email) return null;
    
    const [local, domain] = email.split('@');
    if (!domain) return email;
    
    const [domainName, ...tld] = domain.split('.');
    
    const maskedLocal = local.length > 1 
        ? `${local[0]}${'*'.repeat(Math.min(local.length - 1, 3))}`
        : local;
    
    const maskedDomain = domainName.length > 1
        ? `${domainName[0]}${'*'.repeat(Math.min(domainName.length - 1, 3))}`
        : domainName;
    
    return `${maskedLocal}@${maskedDomain}.${tld.join('.')}`;
}

/**
 * Mask Address: Rua X, 123 → Rua X, ***
 */
export function maskAddress(address: string | null | undefined): string | null {
    if (!address) return null;
    
    // Mask numbers (house number, apt, etc)
    return address.replace(/\d+/g, '***');
}

// =====================================================
// ENTITY MASKING
// =====================================================

interface MaskOptions {
    /** Mask CPF/RG/CNPJ */
    maskDocuments?: boolean;
    /** Mask phone numbers */
    maskPhones?: boolean;
    /** Mask email addresses */
    maskEmails?: boolean;
    /** Mask street addresses */
    maskAddresses?: boolean;
    /** Fields to always expose (whitelist) */
    expose?: string[];
}

const DEFAULT_OPTIONS: MaskOptions = {
    maskDocuments: true,
    maskPhones: true,
    maskEmails: true,
    maskAddresses: false, // Addresses may be relevant for investigation
    expose: [],
};

/**
 * Mask PII in entity metadata
 */
export function maskEntityMetadata(
    metadata: Record<string, any> | null | undefined,
    options: MaskOptions = DEFAULT_OPTIONS
): Record<string, any> | null {
    if (!metadata) return null;
    
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const masked = { ...metadata };
    
    // Skip whitelisted fields
    const shouldMask = (field: string) => !opts.expose?.includes(field);
    
    // Document IDs
    if (opts.maskDocuments) {
        if (shouldMask('cpf') && masked.cpf) {
            masked.cpf = maskCPF(masked.cpf);
        }
        if (shouldMask('rg') && masked.rg) {
            masked.rg = maskRG(masked.rg);
        }
        if (shouldMask('cnpj') && masked.cnpj) {
            // CNPJ: 12.345.678/0001-90 → 12.***.***/**01-90
            const cnpj = String(masked.cnpj).replace(/\D/g, '');
            if (cnpj.length === 14) {
                masked.cnpj = `${cnpj.slice(0, 2)}.***.***/**${cnpj.slice(-4, -2)}-${cnpj.slice(-2)}`;
            }
        }
    }
    
    // Phone numbers
    if (opts.maskPhones) {
        if (shouldMask('telefone') && masked.telefone) {
            masked.telefone = maskPhone(masked.telefone);
        }
        if (shouldMask('phone') && masked.phone) {
            masked.phone = maskPhone(masked.phone);
        }
        if (shouldMask('celular') && masked.celular) {
            masked.celular = maskPhone(masked.celular);
        }
    }
    
    // Email
    if (opts.maskEmails) {
        if (shouldMask('email') && masked.email) {
            masked.email = maskEmail(masked.email);
        }
    }
    
    // Address
    if (opts.maskAddresses) {
        if (shouldMask('endereco') && masked.endereco) {
            masked.endereco = maskAddress(masked.endereco);
        }
        if (shouldMask('address') && masked.address) {
            masked.address = maskAddress(masked.address);
        }
    }
    
    return masked;
}

/**
 * Mask PII in an array of entities
 */
export function maskEntities<T extends { metadata?: Record<string, any> }>(
    entities: T[],
    options?: MaskOptions
): T[] {
    return entities.map(entity => ({
        ...entity,
        metadata: maskEntityMetadata(entity.metadata, options),
    }));
}

/**
 * Check if user has permission to see unmasked PII
 * Based on role hierarchy
 */
export function canViewUnmaskedPII(role: string): boolean {
    const allowedRoles = ['super_admin', 'unit_admin'];
    return allowedRoles.includes(role);
}

// =====================================================
// MIDDLEWARE HELPER
// =====================================================

/**
 * Apply PII masking to API response based on user role
 */
export function applyPIIMasking<T extends { metadata?: Record<string, any> }>(
    data: T | T[],
    userRole: string,
    options?: MaskOptions
): T | T[] {
    // Admins see unmasked data
    if (canViewUnmaskedPII(userRole)) {
        return data;
    }
    
    // Apply masking for non-admins
    if (Array.isArray(data)) {
        return maskEntities(data, options);
    }
    
    return {
        ...data,
        metadata: maskEntityMetadata(data.metadata, options),
    };
}
