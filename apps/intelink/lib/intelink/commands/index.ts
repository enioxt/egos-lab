/**
 * Commands Index - INTELINK Bot
 * 
 * Exporta e registra todos os comandos do bot
 */

import { commandRegistry } from './registry';
import { Command } from './types';

// Import commands
import { helpCommand } from './help';
import { startCommand, devCommand } from './start';
import { investigacoesCommand } from './investigacoes';
import { buscarCommand } from './buscar';
import { equipeCommand } from './equipe';
import { exportarCommand } from './exportar';
import { quemCommand } from './quem';
import { grafoCommand } from './grafo';
import { modeloCommand } from './modelo';
import { analisarCommand } from './analisar';
import { comandosCommand } from './comandos';
import { achadosCommand } from './achados';
import { relatorioCommand } from './relatorio';
import { inserirCommand } from './inserir';
import { limparCommand } from './limpar';
import { vincularCommand } from './vincular';

// ============================================
// ALL COMMANDS (17 migrated - 100% ✅)
// ============================================

const allCommands: Command[] = [
    helpCommand,
    startCommand,
    devCommand,
    investigacoesCommand,
    buscarCommand,
    equipeCommand,
    exportarCommand,
    quemCommand,
    grafoCommand,
    modeloCommand,
    analisarCommand,
    comandosCommand,
    achadosCommand,
    relatorioCommand,
    inserirCommand,
    limparCommand,
    vincularCommand,
];

// Register all commands
commandRegistry.registerAll(allCommands);

// ============================================
// EXPORTS
// ============================================

export { commandRegistry, parseCommand } from './registry';
export type { Command, CommandContext, CommandDependencies } from './types';
export { VISUAL } from './types';

// Re-export individual commands for direct usage
export { helpCommand } from './help';
export { startCommand, devCommand } from './start';

export default commandRegistry;
