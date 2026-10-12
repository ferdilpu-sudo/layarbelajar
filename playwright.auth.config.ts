import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/auth-e2e',
  fullyParallel: false,
  retries: 0,
  timeout: 90_000,
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'off', // No credential-bearing browser trace artifacts.
    screenshot: 'off',
    video: 'off',
  },
  projects: [
    { name: 'local-auth-mobile-360', use: { ...devices['Desktop Chrome'], viewport: { width: 360, height: 800 } } },
    { name: 'local-auth-tablet-768', use: { ...devices['Desktop Chrome'], viewport: { width: 768, height: 1024 } } },
    { name: 'local-auth-desktop-1280', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
    { name: 'local-auth-wide-1920', use: { ...devices['Desktop Chrome'], viewport: { width: 1920, height: 1080 } } },
  ],
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
