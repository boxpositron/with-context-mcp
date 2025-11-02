import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.{test,spec}.{js,ts}'],
    exclude: ['tests/integration/test-*.js', 'node_modules', 'dist'],
    env: {
      NODE_ENV: 'development',
      OBSIDIAN_API_KEY: 'test-api-key-for-ci',
      OBSIDIAN_API_URL: 'https://127.0.0.1:27124',
      OBSIDIAN_VAULT: 'TestVault',
      PROJECT_BASE_PATH: 'Projects',
      LOG_LEVEL: 'info',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules',
        'dist',
        'tests',
        '**/*.config.{js,ts}',
        '**/*.d.ts',
      ],
    },
  },
});
