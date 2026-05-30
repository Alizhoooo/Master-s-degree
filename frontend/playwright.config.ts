import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  retries: 1,
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
  },
  webServer: [
    {
      command: 'node ../../backend/dist/main.js',
      port: 3001,
      cwd: '../../backend',
      reuseExistingServer: true,
      timeout: 15000,
    },
    {
      command: 'npx vite --port 5173',
      port: 5173,
      cwd: '.',
      reuseExistingServer: true,
      timeout: 15000,
    },
  ],
});
