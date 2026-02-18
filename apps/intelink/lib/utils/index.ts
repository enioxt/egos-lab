/**
 * Utility functions index
 * Import from '@/lib/utils' for easy access to all utilities
 */

// Phone utilities
export {
    normalizePhone,
    phonesMatch,
    formatPhoneDisplay,
    formatPhoneWhatsApp,
    getWhatsAppLink,
    extractPhonesFromText,
    isValidPhone,
    cleanPhoneForStorage,
    stripNonDigits,
    type PhoneInfo
} from './phone-normalizer';

// Re-export search utility if exists
export { matchesSearch } from './search';
