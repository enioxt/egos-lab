/**
 * Intelink i18n Translations
 * 
 * Centraliza todas as strings traduzíveis do sistema.
 * Suporte inicial: PT-BR (default) e EN.
 * 
 * Uso:
 *   import { t, setLocale } from '@/lib/i18n/translations';
 *   t('common.save') // "Salvar"
 *   setLocale('en');
 *   t('common.save') // "Save"
 */

// ============================================================================
// TYPES
// ============================================================================

export type Locale = 'pt-BR' | 'en';

export interface TranslationKeys {
    common: {
        save: string;
        cancel: string;
        delete: string;
        edit: string;
        create: string;
        search: string;
        loading: string;
        error: string;
        success: string;
        confirm: string;
        back: string;
        next: string;
        previous: string;
        close: string;
        yes: string;
        no: string;
        all: string;
        none: string;
        filter: string;
        export: string;
        import: string;
        refresh: string;
    };
    auth: {
        login: string;
        logout: string;
        welcome: string;
        chatId: string;
        tokenExpired: string;
        unauthorized: string;
        sessionExpired: string;
    };
    investigation: {
        title: string;
        create: string;
        status: {
            active: string;
            archived: string;
            deleted: string;
        };
        entity: string;
        entities: string;
        relationship: string;
        relationships: string;
        evidence: string;
        noEntities: string;
        noRelationships: string;
    };
    entity: {
        types: {
            PERSON: string;
            VEHICLE: string;
            LOCATION: string;
            ORGANIZATION: string;
            COMPANY: string;
            PHONE: string;
            FIREARM: string;
        };
        roles: {
            author: string;
            victim: string;
            witness: string;
            suspect: string;
            informant: string;
        };
    };
    graph: {
        title: string;
        zoomIn: string;
        zoomOut: string;
        fitView: string;
        mobileWarning: string;
        continueAnyway: string;
        backToDetails: string;
    };
    chat: {
        title: string;
        placeholder: string;
        send: string;
        thinking: string;
        askAboutCase: string;
    };
    demo: {
        welcome: string;
        step: string;
        autoPlay: string;
        finish: string;
    };
    errors: {
        generic: string;
        network: string;
        notFound: string;
        forbidden: string;
        validation: string;
    };
}

// ============================================================================
// TRANSLATIONS
// ============================================================================

const translations: Record<Locale, TranslationKeys> = {
    'pt-BR': {
        common: {
            save: 'Salvar',
            cancel: 'Cancelar',
            delete: 'Excluir',
            edit: 'Editar',
            create: 'Criar',
            search: 'Buscar',
            loading: 'Carregando...',
            error: 'Erro',
            success: 'Sucesso',
            confirm: 'Confirmar',
            back: 'Voltar',
            next: 'Próximo',
            previous: 'Anterior',
            close: 'Fechar',
            yes: 'Sim',
            no: 'Não',
            all: 'Todos',
            none: 'Nenhum',
            filter: 'Filtrar',
            export: 'Exportar',
            import: 'Importar',
            refresh: 'Atualizar',
        },
        auth: {
            login: 'Entrar',
            logout: 'Sair',
            welcome: 'Bem-vindo',
            chatId: 'Chat ID',
            tokenExpired: 'Sessão expirada. Faça login novamente.',
            unauthorized: 'Acesso não autorizado.',
            sessionExpired: 'Sua sessão expirou.',
        },
        investigation: {
            title: 'Operação',
            create: 'Nova Operação',
            status: {
                active: 'Ativa',
                archived: 'Arquivada',
                deleted: 'Excluída',
            },
            entity: 'Entidade',
            entities: 'Entidades',
            relationship: 'Vínculo',
            relationships: 'Vínculos',
            evidence: 'Evidência',
            noEntities: 'Nenhuma entidade cadastrada',
            noRelationships: 'Nenhum vínculo encontrado',
        },
        entity: {
            types: {
                PERSON: 'Pessoa',
                VEHICLE: 'Veículo',
                LOCATION: 'Local',
                ORGANIZATION: 'Organização',
                COMPANY: 'Empresa',
                PHONE: 'Telefone',
                FIREARM: 'Arma de Fogo',
            },
            roles: {
                author: 'Autor',
                victim: 'Vítima',
                witness: 'Testemunha',
                suspect: 'Suspeito',
                informant: 'Informante',
            },
        },
        graph: {
            title: 'Grafo de Conexões',
            zoomIn: 'Ampliar',
            zoomOut: 'Reduzir',
            fitView: 'Ajustar Visualização',
            mobileWarning: 'Experiência Desktop Recomendada',
            continueAnyway: 'Continuar mesmo assim',
            backToDetails: 'Voltar para detalhes',
        },
        chat: {
            title: 'Chat com IA',
            placeholder: 'Pergunte sobre o caso...',
            send: 'Enviar',
            thinking: 'Analisando...',
            askAboutCase: 'Pergunte sobre a operação',
        },
        demo: {
            welcome: 'Bem-vindo ao Intelink',
            step: 'Passo',
            autoPlay: 'Reprodução automática',
            finish: 'Finalizar',
        },
        errors: {
            generic: 'Ocorreu um erro inesperado.',
            network: 'Erro de conexão. Verifique sua internet.',
            notFound: 'Recurso não encontrado.',
            forbidden: 'Você não tem permissão para acessar este recurso.',
            validation: 'Dados inválidos. Verifique os campos.',
        },
    },
    'en': {
        common: {
            save: 'Save',
            cancel: 'Cancel',
            delete: 'Delete',
            edit: 'Edit',
            create: 'Create',
            search: 'Search',
            loading: 'Loading...',
            error: 'Error',
            success: 'Success',
            confirm: 'Confirm',
            back: 'Back',
            next: 'Next',
            previous: 'Previous',
            close: 'Close',
            yes: 'Yes',
            no: 'No',
            all: 'All',
            none: 'None',
            filter: 'Filter',
            export: 'Export',
            import: 'Import',
            refresh: 'Refresh',
        },
        auth: {
            login: 'Login',
            logout: 'Logout',
            welcome: 'Welcome',
            chatId: 'Chat ID',
            tokenExpired: 'Session expired. Please login again.',
            unauthorized: 'Unauthorized access.',
            sessionExpired: 'Your session has expired.',
        },
        investigation: {
            title: 'Investigation',
            create: 'New Investigation',
            status: {
                active: 'Active',
                archived: 'Archived',
                deleted: 'Deleted',
            },
            entity: 'Entity',
            entities: 'Entities',
            relationship: 'Relationship',
            relationships: 'Relationships',
            evidence: 'Evidence',
            noEntities: 'No entities registered',
            noRelationships: 'No relationships found',
        },
        entity: {
            types: {
                PERSON: 'Person',
                VEHICLE: 'Vehicle',
                LOCATION: 'Location',
                ORGANIZATION: 'Organization',
                COMPANY: 'Company',
                PHONE: 'Phone',
                FIREARM: 'Firearm',
            },
            roles: {
                author: 'Perpetrator',
                victim: 'Victim',
                witness: 'Witness',
                suspect: 'Suspect',
                informant: 'Informant',
            },
        },
        graph: {
            title: 'Connection Graph',
            zoomIn: 'Zoom In',
            zoomOut: 'Zoom Out',
            fitView: 'Fit View',
            mobileWarning: 'Desktop Experience Recommended',
            continueAnyway: 'Continue anyway',
            backToDetails: 'Back to details',
        },
        chat: {
            title: 'AI Chat',
            placeholder: 'Ask about the case...',
            send: 'Send',
            thinking: 'Analyzing...',
            askAboutCase: 'Ask about the investigation',
        },
        demo: {
            welcome: 'Welcome to Intelink',
            step: 'Step',
            autoPlay: 'Auto-play',
            finish: 'Finish',
        },
        errors: {
            generic: 'An unexpected error occurred.',
            network: 'Connection error. Check your internet.',
            notFound: 'Resource not found.',
            forbidden: 'You do not have permission to access this resource.',
            validation: 'Invalid data. Check the fields.',
        },
    },
};

// ============================================================================
// STATE & FUNCTIONS
// ============================================================================

let currentLocale: Locale = 'pt-BR';

/**
 * Set the current locale
 */
export function setLocale(locale: Locale): void {
    currentLocale = locale;
    if (typeof window !== 'undefined') {
        localStorage.setItem('intelink_locale', locale);
    }
}

/**
 * Get the current locale
 */
export function getLocale(): Locale {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('intelink_locale') as Locale;
        if (saved && translations[saved]) {
            currentLocale = saved;
        }
    }
    return currentLocale;
}

/**
 * Translate a key path like 'common.save' or 'entity.types.PERSON'
 */
export function t(keyPath: string): string {
    const keys = keyPath.split('.');
    let result: any = translations[currentLocale];
    
    for (const key of keys) {
        if (result && typeof result === 'object' && key in result) {
            result = result[key];
        } else {
            // Fallback to pt-BR if key not found
            let fallback: any = translations['pt-BR'];
            for (const k of keys) {
                if (fallback && typeof fallback === 'object' && k in fallback) {
                    fallback = fallback[k];
                } else {
                    return keyPath; // Return key if not found
                }
            }
            return typeof fallback === 'string' ? fallback : keyPath;
        }
    }
    
    return typeof result === 'string' ? result : keyPath;
}

/**
 * Get all translations for the current locale
 */
export function getAllTranslations(): TranslationKeys {
    return translations[currentLocale];
}

/**
 * Get available locales
 */
export function getAvailableLocales(): Locale[] {
    return Object.keys(translations) as Locale[];
}

// ============================================================================
// EXPORTS
// ============================================================================

export default t;
