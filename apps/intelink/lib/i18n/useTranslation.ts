/**
 * useTranslation Hook
 * 
 * React hook para traduções com suporte a re-render automático.
 * 
 * Uso:
 *   const { t, locale, setLocale } = useTranslation();
 *   <span>{t('common.save')}</span>
 */

import { useState, useEffect, useCallback } from 'react';
import { 
    t as translate, 
    getLocale, 
    setLocale as setGlobalLocale, 
    Locale,
    getAvailableLocales
} from './translations';

interface UseTranslationReturn {
    t: (key: string) => string;
    locale: Locale;
    setLocale: (locale: Locale) => void;
    locales: Locale[];
}

export function useTranslation(): UseTranslationReturn {
    const [locale, setLocaleState] = useState<Locale>(getLocale());

    // Sync with localStorage on mount
    useEffect(() => {
        setLocaleState(getLocale());
    }, []);

    // Handle locale change
    const setLocale = useCallback((newLocale: Locale) => {
        setGlobalLocale(newLocale);
        setLocaleState(newLocale);
    }, []);

    // Translation function bound to current locale
    const t = useCallback((key: string): string => {
        return translate(key);
    }, [locale]);

    return {
        t,
        locale,
        setLocale,
        locales: getAvailableLocales(),
    };
}

export default useTranslation;
