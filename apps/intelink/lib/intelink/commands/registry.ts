/**
 * Command Registry - INTELINK Bot
 * 
 * Registro central de todos os comandos do bot
 */

import { Command, CommandContext, CommandDependencies } from './types';

// ============================================
// REGISTRY
// ============================================

class CommandRegistry {
    private commands = new Map<string, Command>();
    private aliases = new Map<string, string>();

    /**
     * Registra um comando
     */
    register(command: Command): void {
        this.commands.set(command.name, command);
        
        // Registrar aliases
        if (command.aliases) {
            for (const alias of command.aliases) {
                this.aliases.set(alias, command.name);
            }
        }
    }

    /**
     * Registra múltiplos comandos
     */
    registerAll(commands: Command[]): void {
        for (const command of commands) {
            this.register(command);
        }
    }

    /**
     * Busca um comando pelo nome ou alias
     */
    get(name: string): Command | undefined {
        // Busca direta
        const direct = this.commands.get(name);
        if (direct) return direct;

        // Busca por alias
        const aliasTarget = this.aliases.get(name);
        if (aliasTarget) {
            return this.commands.get(aliasTarget);
        }

        return undefined;
    }

    /**
     * Verifica se um comando existe
     */
    has(name: string): boolean {
        return this.commands.has(name) || this.aliases.has(name);
    }

    /**
     * Lista todos os comandos
     */
    list(): Command[] {
        return Array.from(this.commands.values());
    }

    /**
     * Executa um comando
     */
    async execute(
        name: string,
        ctx: CommandContext,
        deps: CommandDependencies
    ): Promise<boolean> {
        const command = this.get(name);
        
        if (!command) {
            return false;
        }

        // Verificar se é privado apenas
        if (command.privateOnly && ctx.chatType !== 'private') {
            await deps.sendMessage(
                ctx.chatId,
                `🔐 **Acesso Restrito**\n\nO comando \`/${command.name}\` só funciona em **chat privado** com o bot.\n\n👉 [Clique aqui para abrir chat privado](https://t.me/IntelinkBot)`
            );
            return true;
        }

        try {
            await command.execute(ctx, deps);
            return true;
        } catch (error) {
            console.error(`[Command ${command.name}] Error:`, error);
            await deps.sendMessage(
                ctx.chatId,
                `❌ **Erro ao executar comando**\n\nOcorreu um erro ao processar \`/${command.name}\`. Tente novamente.`
            );
            return true;
        }
    }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

export const commandRegistry = new CommandRegistry();

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Parseia o texto de uma mensagem em comando e argumentos
 */
export function parseCommand(text: string): { command: string; args: string } | null {
    if (!text || !text.startsWith('/')) {
        return null;
    }

    // Remove mention do bot (/comando@BotName)
    const cleanText = text.split('@')[0];
    
    // Extrai comando e argumentos
    const parts = cleanText.slice(1).split(' ');
    const command = parts[0].toLowerCase();
    const args = parts.slice(1).join(' ');

    return { command, args };
}

export default commandRegistry;
