import { request, chromium } from '@playwright/test'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'
import path from 'path'
import fs from 'fs'

export const AUTH_FILE        = path.join(__dirname, '.auth', 'user.json')
export const ADMIN_AUTH_FILE  = path.join(__dirname, '.auth', 'admin.json')
export const SA_AUTH_FILE     = path.join(__dirname, '.auth', 'superadmin.json')

// ── Load .env.local into process.env ────────────────────────────────────────
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
    const val = raw.startsWith('"') || raw.startsWith("'") ? raw.slice(1, -1) : raw
    if (!process.env[key]) process.env[key] = val
  }
}

// ── Upsert test accounts via Neon HTTP (bypasses port-5432 restriction) ─────
async function upsertAccounts(accounts: Array<{
  email: string; name: string; role: string; password: string
}>) {
  const { neon } = await import('@neondatabase/serverless')
  const url = process.env.DATABASE_URL
  if (!url || url.includes('localhost')) {
    console.warn('[globalSetup] DATABASE_URL not set to remote DB — skipping DB upsert')
    return
  }
  const sql = neon(url)

  for (const acc of accounts) {
    const hash = await bcrypt.hash(acc.password, 12)
    try {
      // Upsert user (only columns that exist on the User table)
      const rows = await sql`
        INSERT INTO "User" (id, email, name, role, plan, "passwordHash", "createdAt")
        VALUES (
          gen_random_uuid(),
          ${acc.email}, ${acc.name}, ${acc.role}::"PlatformRole",
          'TRIAL'::"Plan",
          ${hash},
          NOW()
        )
        ON CONFLICT (email) DO UPDATE
          SET role         = ${acc.role}::"PlatformRole",
              "passwordHash" = ${hash}
        RETURNING id
      `
      const userId = rows[0]?.id
      if (userId) {
        const ctxId = randomUUID()
        await sql`
          INSERT INTO "UserContext" (id, "userId", "updatedAt")
          VALUES (${ctxId}, ${userId}, NOW())
          ON CONFLICT ("userId") DO NOTHING
        `
      }
      console.log(`[globalSetup] ${acc.role} ready: ${acc.email}`)
    } catch (err) {
      console.warn(`[globalSetup] upsert failed for ${acc.email}:`, (err as Error).message)
    }
  }
}

export default async function globalSetup() {
  loadEnvLocal()

  const authDir = path.join(__dirname, '.auth')
  if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true })

  // ── 1. Upsert all test accounts via Neon HTTP ───────────────────────────────
  await upsertAccounts([
    { email: 'test@example.com',           name: 'Test User',       role: 'CUSTOMER',    password: 'testpass123' },
    { email: 'moshay1996@gmail.com',        name: 'Admin Moshay',    role: 'ADMIN',       password: 'BuddyAdmin@1996!M' },
    { email: 'moshaymuthukumar@gmail.com',  name: 'Super Admin Mosh', role: 'SUPER_ADMIN', password: 'BuddyRoot@Mosh!24' },
  ])

  // ── 2. Register test user via API as idempotent fallback ────────────────────
  const api = await request.newContext({ baseURL: 'http://localhost:3000' })
  const registerRes = await api.post('/api/auth/register', {
    data: { name: 'Test User', email: 'test@example.com', password: 'testpass123' },
  })
  const registerBody = await registerRes.json()
  if (!registerRes.ok() && registerBody?.error?.code !== 'EMAIL_EXISTS') {
    console.warn('[globalSetup] register warning:', JSON.stringify(registerBody))
  }
  await api.dispose()
  console.log('[globalSetup] test@example.com API check done')

  // ── 3. Browser sessions — save auth state for each role ─────────────────────
  const browser = await chromium.launch()

  async function saveSession(email: string, password: string, file: string, label: string) {
    const context = await browser.newContext()
    const page    = await context.newPage()
    await page.goto('http://localhost:3000/login')
    await page.locator('#email').fill(email)
    await page.locator('#password').fill(password)
    await page.getByRole('button', { name: 'Sign in' }).click()
    try {
      await page.waitForURL('**/dashboard**', { timeout: 30000 })
      await context.storageState({ path: file })
      console.log(`[globalSetup] auth state saved → ${path.basename(file)}`)
    } catch {
      // Capture what URL we ended up on for debugging
      console.warn(`[globalSetup] login timed out for ${email} — current URL: ${page.url()}`)
      // Save state anyway — tests will fail gracefully if not authenticated
      await context.storageState({ path: file })
    }
    await context.close()
  }

  await saveSession('test@example.com',          'testpass123',       AUTH_FILE,        'user')
  await saveSession('moshay1996@gmail.com',        'BuddyAdmin@1996!M', ADMIN_AUTH_FILE,  'admin')
  await saveSession('moshaymuthukumar@gmail.com',  'BuddyRoot@Mosh!24', SA_AUTH_FILE,     'superadmin')

  await browser.close()
}
