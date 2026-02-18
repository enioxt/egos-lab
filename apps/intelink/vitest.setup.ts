import { expect, vi, beforeEach, afterEach } from 'vitest';

// Mock environment variables
vi.stubEnv('TELEGRAM_BOT_TOKEN', 'test-bot-token');
vi.stubEnv('OPENROUTER_API_KEY', 'test-openrouter-key');
vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');
vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key');
vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-service-key');

// Global test utilities
beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// Custom matchers (if needed)
expect.extend({
  toBeValidCommand(received: string) {
    const validCommands = [
      '/start', '/iniciar', '/help', '/ajuda', '/comandos',
      '/investigacoes', '/caso', '/buscar', '/quem', '/grafo',
      '/modelo', '/equipe', '/exportar', '/analisar', '/inserir',
      '/relatorio', '/achados', '/limpar', '/dev'
    ];
    const pass = validCommands.includes(received);
    return {
      pass,
      message: () => pass 
        ? `Expected ${received} not to be a valid command`
        : `Expected ${received} to be a valid command. Valid: ${validCommands.join(', ')}`
    };
  }
});

// Type augmentation for custom matchers
declare module 'vitest' {
  interface Assertion<T = unknown> {
    toBeValidCommand(): T;
  }
  interface AsymmetricMatchersContaining {
    toBeValidCommand(): unknown;
  }
}
