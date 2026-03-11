import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    exclude: ['src/features/spam-demo/**/*.test.{tsx,ts,jsx,js}'],
    globals: true,
    environment: 'jsdom',
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{js,ts,jsx,tsx}'],
      exclude: ['src/**/*.test.{js,ts,jsx,tsx}'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
