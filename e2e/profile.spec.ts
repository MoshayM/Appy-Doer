import { test, expect } from '@playwright/test'

test.describe('Profile & Account', () => {

  test('profile page loads without redirect', async ({ page }) => {
    await page.goto('/dashboard/profile')
    await expect(page).not.toHaveURL(/\/login/)
    await expect(page.locator('body')).not.toBeEmpty()
  })

  test('portfolio page loads without redirect', async ({ page }) => {
    await page.goto('/dashboard/portfolio')
    await expect(page).not.toHaveURL(/\/login/)
    await expect(page.locator('body')).not.toBeEmpty()
  })

  test('tickets page loads without redirect', async ({ page }) => {
    await page.goto('/dashboard/tickets')
    await expect(page).not.toHaveURL(/\/login/)
    await expect(page.locator('body')).not.toBeEmpty()
  })

  test('auth/me returns authenticated user', async ({ page }) => {
    const res = await page.request.get('/api/auth/me')
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body.email).toBe('test@example.com')
  })

  test('profile API GET returns user data', async ({ page }) => {
    const res = await page.request.get('/api/profile')
    expect(res.status()).not.toBe(401)
    expect(res.status()).not.toBe(500)
  })

  test('notifications API returns data', async ({ page }) => {
    const res = await page.request.get('/api/notifications')
    expect(res.status()).not.toBe(401)
    expect(res.status()).not.toBe(500)
  })

  test('activity API returns data', async ({ page }) => {
    const res = await page.request.get('/api/activity')
    expect(res.status()).not.toBe(401)
    expect(res.status()).not.toBe(500)
  })

  test('agent history API returns data', async ({ page }) => {
    const res = await page.request.get('/api/agent-history')
    expect(res.status()).not.toBe(401)
    expect(res.status()).not.toBe(500)
  })
})
