import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node', // API/Bot tests don't need DOM
    setupFiles: './vitest.setup.ts',
    include: ['**/*.test.ts'],
    exclude: ['node_modules/', '.next/', 'coverage/'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        '.next/',
        'coverage/',
        '**/*.config.{ts,js}',
        '**/*.d.ts',
      ],
    },
    testTimeout: 10000, // 10s for API tests
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
