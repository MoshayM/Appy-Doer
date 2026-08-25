import { defineConfig, devices } from '@playwright/test'
import path from 'path'

const AUTH_FILE       = path.join(__dirname, 'e2e', '.auth', 'user.json')
const ADMIN_AUTH_FILE = path.join(__dirname, 'e2e', '.auth', 'admin.json')
const SA_AUTH_FILE    = path.join(__dirname, 'e2e', '.auth', 'superadmin.json')

export default defineConfig({
  testDir:     './e2e',
  globalSetup: './e2e/global-setup.ts',
  timeout:     45000,
  retries:     1,
  reporter:    [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL:    'http://localhost:3000',
    trace:      'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    // ── 1. Auth spec (no stored auth — tests the login/register flow itself) ──
    {
      name:      'auth',
      testMatch: 'auth.spec.ts',
      use:       { ...devices['Desktop Chrome'] },
    },

    // ── 2. Super Admin spec (dedicated superadmin session) ─────────────────────
    {
      name:      'superadmin',
      testMatch: 'superadmin.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        storageState: SA_AUTH_FILE,
      },
    },

    // ── 3. All other specs (pre-authenticated regular user session) ─────────────
    {
      name:       'chromium',
      testIgnore: ['auth.spec.ts', 'superadmin.spec.ts'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: AUTH_FILE,
      },
    },
  ],

  // ── Exported paths for use inside spec files ────────────────────────────────
  // (referenced directly via the path constants above in this config)

  webServer: {
    command:             'npx next dev -p 3000',
    url:                 'http://localhost:3000',
    reuseExistingServer: true,
    timeout:             120000,
  },
})

export { AUTH_FILE, ADMIN_AUTH_FILE, SA_AUTH_FILE }
