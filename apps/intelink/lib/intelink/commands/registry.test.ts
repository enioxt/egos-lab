/**
 * Tests for Command Registry
 */

import { describe, it, expect } from 'vitest';
// Import from index to ensure commands are registered
import { commandRegistry, parseCommand } from './index';

describe('commandRegistry', () => {
  it('should have all 16 commands registered', () => {
    const commands = commandRegistry.list();
    expect(commands.length).toBeGreaterThanOrEqual(14);
  });

  it('should find command by name', () => {
    const helpCmd = commandRegistry.get('ajuda');
    expect(helpCmd).toBeDefined();
    expect(helpCmd?.name).toBe('ajuda');
  });

  it('should find command by alias', () => {
    const helpCmd = commandRegistry.get('help');
    expect(helpCmd).toBeDefined();
    expect(helpCmd?.name).toBe('ajuda');
  });

  it('should return undefined for unknown command', () => {
    const unknown = commandRegistry.get('unknowncommand123');
    expect(unknown).toBeUndefined();
  });

  it('should have all core commands', () => {
    const coreCommands = [
      'ajuda', 'iniciar', 'investigacoes', 'buscar', 'quem',
      'grafo', 'modelo', 'equipe', 'exportar', 'analisar',
      'inserir', 'relatorio', 'achados', 'limpar', 'comandos'
    ];

    for (const cmdName of coreCommands) {
      const cmd = commandRegistry.get(cmdName);
      expect(cmd, `Command ${cmdName} should exist`).toBeDefined();
    }
  });

  it('should resolve Portuguese aliases', () => {
    // /start -> iniciar (start is alias)
    const startCmd = commandRegistry.get('start');
    expect(startCmd?.name).toBe('iniciar');

    // /caso -> investigacoes
    const casoCmd = commandRegistry.get('caso');
    expect(casoCmd?.name).toBe('investigacoes');
  });

  it('should have unique command names', () => {
    const commands = commandRegistry.list();
    const names = commands.map((c: { name: string }) => c.name);
    const uniqueNames = [...new Set(names)];
    expect(names.length).toBe(uniqueNames.length);
  });

  it('should parse command from text', () => {
    const result = parseCommand('/ajuda');
    expect(result).not.toBeNull();
    expect(result?.command).toBe('ajuda');
  });

  it('should parse command with args', () => {
    const result = parseCommand('/buscar termo de busca');
    expect(result).not.toBeNull();
    expect(result?.command).toBe('buscar');
    expect(result?.args).toBe('termo de busca');
  });
});
