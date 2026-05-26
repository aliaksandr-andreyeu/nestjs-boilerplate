import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: [
      { find: '@shared', replacement: path.resolve(__dirname, 'libs/shared/index.ts') },
      { find: /^@shared\/(.*)$/, replacement: path.resolve(__dirname, 'libs/shared/src/$1') },
      { find: /^@gateway\/(.*)$/, replacement: path.resolve(__dirname, 'apps/gateway/src/$1') },
      { find: /^@auth\/(.*)$/, replacement: path.resolve(__dirname, 'apps/auth-service/src/$1') },
      { find: /^@events\/(.*)$/, replacement: path.resolve(__dirname, 'apps/events-service/src/$1') },
      {
        find: '@prisma/app-client',
        replacement: path.resolve(__dirname, 'node_modules/@prisma/app-client')
      }
    ]
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.spec.ts'],
    exclude: ['node_modules/**', 'dist/**', '**/*.e2e-spec.ts', 'apps/**/test/**'],
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      include: ['apps/**/src/**/*.ts', 'libs/shared/src/**/*.ts'],
      exclude: [
        '**/*.spec.ts',
        '**/*.e2e-spec.ts',
        '**/main.ts',
        '**/*.module.ts',
        '**/prisma/**',
        '**/*.dto.ts',
        '**/dto/**'
      ]
    }
  }
});
