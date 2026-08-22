import { test, expect } from '@playwright/test'

test.describe('CRM / Leads', () => {

  test('CRM page loads without redirect', async ({ page }) => {
    await page.goto('/dashboard/crm')
    await expect(page).not.toHaveURL(/\/login/)
    await expect(page.locator('body')).not.toBeEmpty()
  })

  test('clients page loads without redirect', async ({ page }) => {
    await page.goto('/dashboard/clients')
    await expect(page).not.toHaveURL(/\/login/)
    await expect(page.locator('body')).not.toBeEmpty()
  })

  test('leads API GET returns array', async ({ page }) => {
    const res = await page.request.get('/api/leads')
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(Array.isArray(body.leads ?? body)).toBeTruthy()
  })

  test('leads API POST creates a lead', async ({ page }) => {
    const res = await page.request.post('/api/leads', {
      data: { name: 'E2E Test Lead', contact: 'e2elead@example.com', service: 'Web Development' },
    })
    expect(res.ok()).toBeTruthy()
    const lead = await res.json()
    expect(lead.name).toBe('E2E Test Lead')
  })

  test('relationship page loads without redirect', async ({ page }) => {
    await page.goto('/dashboard/relationship')
    await expect(page).not.toHaveURL(/\/login/)
    await expect(page.locator('body')).not.toBeEmpty()
  })

  test('connections page loads without redirect', async ({ page }) => {
    await page.goto('/dashboard/connections')
    await expect(page).not.toHaveURL(/\/login/)
    await expect(page.locator('body')).not.toBeEmpty()
  })

  test('outreach page loads without redirect', async ({ page }) => {
    await page.goto('/dashboard/outreach')
    await expect(page).not.toHaveURL(/\/login/)
    await expect(page.locator('body')).not.toBeEmpty()
  })
})
