/**
 * INTELINK Bot Setup & Security
 * Multi-tenant security with group membership validation
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN_INTELINK;

export interface BotCommand {
    command: string;
    description: string;
}

/**
 * Register bot commands with Telegram
 * Run once on deploy or when commands change
 */
export async function registerBotCommands(): Promise<boolean> {
    if (!BOT_TOKEN) {
        console.error('TELEGRAM_BOT_TOKEN_INTELINK not set');
        return false;
    }

    const commands: BotCommand[] = [
        { command: 'iniciar', description: '🔐 Ativar sistema e obter token web' },
        { command: 'caso', description: '📂 Selecionar/criar operação' },
        { command: 'buscar', description: '🔍 Busca semântica em entidades' },
        { command: 'quem', description: '👤 Consultar perfil de entidade' },
        { command: 'grafo', description: '🕸️ Ver conexões visuais' },
        { command: 'analisar', description: '🌉 Detectar pontes na rede' },
        { command: 'inserir', description: '📥 Adicionar dados via JSON' },
        { command: 'modelo', description: '📋 Templates de extração (BO, Depoimento)' },
        { command: 'ajuda', description: '💡 Menu de ajuda' },
        { command: 'comandos', description: '📜 Lista de comandos' }
    ];

    try {
        const response = await fetch(
            `https://api.telegram.org/bot${BOT_TOKEN}/setMyCommands`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ commands })
            }
        );

        const result = await response.json();
        
        if (result.ok) {
            console.log('✅ Bot commands registered successfully');
            return true;
        } else {
            console.error('❌ Failed to register commands:', result.description);
            return false;
        }
    } catch (error) {
        console.error('❌ Error registering commands:', error);
        return false;
    }
}

/**
 * Check if a user is a member of a specific group
 */
export async function isGroupMember(userId: number, groupChatId: number): Promise<boolean> {
    if (!BOT_TOKEN) return false;

    try {
        const response = await fetch(
            `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: groupChatId,
                    user_id: userId
                })
            }
        );

        const result = await response.json();
        
        if (result.ok) {
            const status = result.result.status;
            // Valid member statuses
            return ['creator', 'administrator', 'member'].includes(status);
        }
        
        return false;
    } catch (error) {
        console.error('Error checking group membership:', error);
        return false;
    }
}

/**
 * Get all groups a user is member of (from our tracked groups)
 */
export async function getUserGroups(
    userId: number, 
    knownGroupIds: number[]
): Promise<number[]> {
    const memberGroups: number[] = [];
    
    for (const groupId of knownGroupIds) {
        if (await isGroupMember(userId, groupId)) {
            memberGroups.push(groupId);
        }
    }
    
    return memberGroups;
}

/**
 * Security validation for private chat access
 * User must be member of at least one registered police group
 */
export async function validateUserAccess(
    userId: number,
    supabase: any
): Promise<{
    isValid: boolean;
    unitIds: string[];
    error?: string;
}> {
    try {
        // Get all registered police units with their group IDs
        const { data: units, error } = await supabase
            .from('intelink_police_units')
            .select('id, code, telegram_group_id')
            .not('telegram_group_id', 'is', null);

        if (error || !units?.length) {
            return {
                isValid: false,
                unitIds: [],
                error: 'No registered police units found'
            };
        }

        // Check membership in each group
        const validUnits: string[] = [];
        
        for (const unit of units) {
            if (unit.telegram_group_id) {
                const isMember = await isGroupMember(userId, unit.telegram_group_id);
                if (isMember) {
                    validUnits.push(unit.id);
                }
            }
        }

        if (validUnits.length === 0) {
            return {
                isValid: false,
                unitIds: [],
                error: 'User is not a member of any registered police group'
            };
        }

        return {
            isValid: true,
            unitIds: validUnits
        };
    } catch (error) {
        console.error('Error validating user access:', error);
        return {
            isValid: false,
            unitIds: [],
            error: 'Access validation failed'
        };
    }
}

/**
 * Known police group IDs (should be in DB, but hardcoded for MVP)
 */
export const KNOWN_POLICE_GROUPS = {
    DHPP: -4814357401,  // Grupo DHPP
    // Add more as needed
};

/**
 * Message templates for security responses
 */
export const SECURITY_MESSAGES = {
    NOT_IN_GROUP: `🔐 **Acesso Negado**

Você precisa ser membro de um grupo oficial de delegacia para usar este sistema.

Se você é policial e deveria ter acesso, entre em contato com seu superior para ser adicionado ao grupo.`,

    PRIVATE_ONLY: `⚠️ **Comando de Configuração**

Este comando só funciona em **chat privado** com o bot para sua segurança.

👉 [Abrir Chat Privado](https://t.me/IntelinkBot)`,

    GROUP_ONLY: `⚠️ **Comando de Operação**

Para acessar operações, use os comandos no **grupo da delegacia**.

Dados sensíveis não são exibidos em chats privados.`,

    TOKEN_EXPIRED: `🔐 **Sessão Expirada**

Seu token de acesso expirou. Use /iniciar para gerar um novo.`,

    INVALID_TOKEN: `🔐 **Token Inválido**

O token de acesso não é válido. Use /iniciar para gerar um novo.`
};
