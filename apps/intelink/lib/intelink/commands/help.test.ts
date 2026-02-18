/**
 * Tests for /ajuda command
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { helpCommand } from './help';
import { CommandContext, CommandDependencies } from './types';

describe('helpCommand', () => {
  let mockCtx: CommandContext;
  let mockDeps: CommandDependencies;
  let sentMessages: string[];

  beforeEach(() => {
    sentMessages = [];
    
    mockCtx = {
      chatId: 12345,
      userId: 67890,
      username: 'testuser',
      text: 'ajuda',
      args: '',
      chatType: 'private',
      message: {},
    };

    mockDeps = {
      supabase: {} as any,
      sendMessage: vi.fn().mockImplementation((chatId, text) => {
        sentMessages.push(text);
        return Promise.resolve();
      }),
      sendMessageHTML: vi.fn(),
      sendMessageWithButtons: vi.fn(),
      botToken: 'test-token',
    };
  });

  it('should have correct metadata', () => {
    expect(helpCommand.name).toBe('ajuda');
    expect(helpCommand.aliases).toContain('help');
    expect(helpCommand.aliases).toContain('h');
    expect(helpCommand.description).toBeDefined();
  });

  it('should send help message with all sections', async () => {
    await helpCommand.execute(mockCtx, mockDeps);

    expect(mockDeps.sendMessage).toHaveBeenCalledTimes(1);
    expect(mockDeps.sendMessage).toHaveBeenCalledWith(
      mockCtx.chatId,
      expect.any(String)
    );

    const message = sentMessages[0];
    
    // Check all sections are present
    expect(message).toContain('GUIA COMPLETO');
    expect(message).toContain('GERENCIAMENTO DE INVESTIGAÇÕES');
    expect(message).toContain('BUSCA E ANÁLISE');
    expect(message).toContain('INSERÇÃO DE DADOS');
    expect(message).toContain('EQUIPE');
    expect(message).toContain('RELATÓRIOS');
  });

  it('should include all main commands in help', async () => {
    await helpCommand.execute(mockCtx, mockDeps);
    
    const message = sentMessages[0];
    
    // Core commands
    expect(message).toContain('/investigacoes');
    expect(message).toContain('/caso');
    expect(message).toContain('/buscar');
    expect(message).toContain('/quem');
    expect(message).toContain('/grafo');
    expect(message).toContain('/analisar');
    expect(message).toContain('/inserir');
    expect(message).toContain('/modelo');
    expect(message).toContain('/equipe');
    expect(message).toContain('/relatorio');
  });
});
