import { defineConfig } from '@playwright/test';

export default defineConfig({
  timeout: 5000,
  reporter: 'html',
  testDir: 'src/features/spam-demo/',
  use: {
    baseURL: 'http://localhost:3001/spam-demo',
    browserName: 'chromium',
  },
  webServer: {
    command: 'yarn run dev',
    url: 'http://localhost:3001',
    reuseExistingServer: true,
  },
});
