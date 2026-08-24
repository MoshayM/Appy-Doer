import { test, expect } from '@playwright/test'

test.describe('Income Tracking', () => {

  test('income page loads without redirect', async ({ page }) => {
    await page.goto('/dashboard/income')
    await expect(page).not.toHaveURL(/\/login/)
    await expect(page.locator('body')).not.toBeEmpty()
  })

  test('offers page loads without redirect', async ({ page }) => {
    await page.goto('/dashboard/offers')
    await expect(page).not.toHaveURL(/\/login/)
    await expect(page.locator('body')).not.toBeEmpty()
  })

  test('income dashboard API returns data', async ({ page }) => {
    const res = await page.request.get('/api/dashboard/income')
    expect(res.status()).not.toBe(401)
    expect(res.status()).not.toBe(500)
  })

  test('milestones API returns data', async ({ page }) => {
    const res = await page.request.get('/api/milestones')
    expect(res.status()).not.toBe(401)
    expect(res.status()).not.toBe(500)
  })

  test('income projects API POST creates a project', async ({ page }) => {
    const res = await page.request.post('/api/income/projects', {
      data: { projectTitle: 'E2E Test Project', clientName: 'Test Client', agreedAmount: 50000, currency: 'INR' },
    })
    expect([200, 201]).toContain(res.status())
    const body = await res.json()
    expect(body.projectTitle ?? body.title ?? body.project?.projectTitle).toBeTruthy()
  })
})
