import { request, chromium } from '@playwright/test'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import path from 'path'
import fs from 'fs'

export const AUTH_FILE        = path.join(__dirname, '.auth', 'user.json')
export const ADMIN_AUTH_FILE  = path.join(__dirname, '.auth', 'admin.json')
export const SA_AUTH_FILE     = path.join(__dirname, '.auth', 'superadmin.json')

// ── Load .env.local so Prisma can connect during setup ──────────────────────
function loadEnvLocal() {
  const envPath = path.resolve(__dirname, '../.env.local')
  if (!fs.existsSync(envPath)) return
  const content = fs.readFileSync(envPath, 'utf-8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const raw = trimmed.slice(eq + 1).trim()
    const val = raw.startsWith('"') || raw.startsWith("'")
      ? raw.slice(1, -1)
      : raw
    if (!process.env[key]) process.env[key] = val
  }
}

export default async function globalSetup() {
  loadEnvLocal()

  const authDir = path.join(__dirname, '.auth')
  if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true })

  // ── 1. Upsert admin accounts directly via Prisma ────────────────────────────
  const prisma = new PrismaClient()
  try {
    const adminAccounts = [
      {
        email:    'moshay1996@gmail.com',
        name:     'Admin Moshay',
        role:     'ADMIN'      as const,
        password: 'BuddyAdmin@1996!M',
      },
      {
        email:    'moshaymuthukumar@gmail.com',
        name:     'Super Admin Mosh',
        role:     'SUPER_ADMIN' as const,
        password: 'BuddyRoot@Mosh!24',
      },
    ]

    for (const acc of adminAccounts) {
      const hash = await bcrypt.hash(acc.password, 12)
      const user = await prisma.user.upsert({
        where:  { email: acc.email },
        update: { role: acc.role, passwordHash: hash },
        create: {
          email:        acc.email,
          name:         acc.name,
          role:         acc.role,
          plan:         'TRIAL',
          passwordHash: hash,
        },
      })
      await prisma.userContext.upsert({
        where:  { userId: user.id },
        update: {},
        create: { userId: user.id },
      })
      console.log(`[globalSetup] ${acc.role} ready: ${acc.email}`)
    }
  } catch (err) {
    console.warn('[globalSetup] Prisma admin upsert failed — ensure DATABASE_URL is set:', err)
  } finally {
    await prisma.$disconnect()
  }

  // ── 2. Register regular test user (idempotent via API) ──────────────────────
  const api = await request.newContext({ baseURL: 'http://localhost:3000' })
  const registerRes = await api.post('/api/auth/register', {
    data: { name: 'Test User', email: 'test@example.com', password: 'testpass123' },
  })
  const registerBody = await registerRes.json()
  if (!registerRes.ok() && registerBody?.error?.code !== 'EMAIL_EXISTS') {
    throw new Error(`globalSetup: failed to create test user — ${JSON.stringify(registerBody)}`)
  }
  await api.dispose()
  console.log('[globalSetup] test@example.com ready')

  // ── 3. Browser sessions — save auth state for each role ─────────────────────
  const browser = await chromium.launch()

  async function saveSession(email: string, password: string, file: string) {
    const context = await browser.newContext()
    const page    = await context.newPage()
    await page.goto('http://localhost:3000/login')
    await page.locator('#email').fill(email)
    await page.locator('#password').fill(password)
    await page.getByRole('button', { name: 'Sign in' }).click()
    await page.waitForURL('**/dashboard**', { timeout: 20000 })
    await context.storageState({ path: file })
    await context.close()
    console.log(`[globalSetup] auth state saved → ${path.basename(file)}`)
  }

  await saveSession('test@example.com',          'testpass123',      AUTH_FILE)
  await saveSession('moshay1996@gmail.com',       'BuddyAdmin@1996!M', ADMIN_AUTH_FILE)
  await saveSession('moshaymuthukumar@gmail.com', 'BuddyRoot@Mosh!24', SA_AUTH_FILE)

  await browser.close()
}
