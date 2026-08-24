import { test, expect } from '@playwright/test'

test.describe('Opportunity Discovery', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/opportunities')
  })

  test('page loads with heading and Discover button', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /opportunity discovery/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /discover opportunities/i }).first()).toBeVisible()
  })

  test('discover button triggers loading state', async ({ page }) => {
    await page.getByRole('button', { name: /discover opportunities/i }).first().click()
    // Loading spinner or "Running" text should appear
    await expect(
      page.locator('text=Running').or(page.locator('[aria-label="loading"]')).first()
    ).toBeVisible({ timeout: 5000 })
  })

  test('discover opportunities returns results', async ({ page }) => {
    test.setTimeout(90000)
    await page.getByRole('button', { name: /discover opportunities/i }).first().click()
    await expect(
      page.locator('text=Monthly Potential').or(page.locator('text=Difficulty')).first()
    ).toBeVisible({ timeout: 60000 })
  })
})
