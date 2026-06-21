import { request } from '@playwright/test'

export default async function globalSetup() {
  const api = await request.newContext({ baseURL: 'http://localhost:3000' })

  const res  = await api.post('/api/auth/register', {
    data: { name: 'Test User', email: 'test@example.com', password: 'testpass123' },
  })
  const body = await res.json()

  // EMAIL_EXISTS means the user was already created in a previous run — that's fine
  if (!res.ok() && body?.error?.code !== 'EMAIL_EXISTS') {
    throw new Error(`globalSetup: failed to create test user — ${JSON.stringify(body)}`)
  }

  await api.dispose()
  console.log('[globalSetup] test@example.com ready')
}
