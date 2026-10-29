import { defineConfig } from 'vitest/config';
import path from 'node:path';

const rootDir = import.meta.dirname;

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.ts'],
    testTimeout: 30_000,
  },
  resolve: {
    alias: [
      { find: '#shared', replacement: path.resolve(rootDir, 'shared') },
      { find: '~', replacement: path.resolve(rootDir, 'app') },
    ],
  },
});
