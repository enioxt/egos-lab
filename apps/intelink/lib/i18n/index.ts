/**
 * Intelink i18n Module
 * 
 * Centraliza traduções e internacionalização.
 * 
 * @example
 * // Uso com hook (recomendado para componentes)
 * import { useTranslation } from '@/lib/i18n';
 * const { t, locale, setLocale } = useTranslation();
 * 
 * // Uso direto (para funções utilitárias)
 * import { t, setLocale } from '@/lib/i18n';
 */

export { default as t, setLocale, getLocale, type Locale, type TranslationKeys } from './translations';
export { useTranslation } from './useTranslation';
