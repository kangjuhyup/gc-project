import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  fileParallelism: false,
  resolve: {
    alias: {
      '@application': resolve(__dirname, './src/application'),
      '@domain': resolve(__dirname, './src/domain'),
      '@infrastructure': resolve(__dirname, './src/infrastructure'),
      '@presentation': resolve(__dirname, './src/presentation'),
    },
  },
  test: {
    environment: 'node',
    include: ['test/e2e/**/*.e2e-spec.ts'],
    maxWorkers: 1,
    minWorkers: 1,
    testTimeout: 30_000,
    hookTimeout: 30_000,
    restoreMocks: true,
    clearMocks: true,
  },
});
