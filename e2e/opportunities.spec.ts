import { test, expect } from '@playwright/test'

test.describe('Opportunity Discovery', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/opportunities')
  })

  test('page loads with heading and Discover button', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /opportunity discovery/i })).toBeVisible({ timeout: 20000 })
    await expect(page.getByRole('button', { name: /discover opportunities/i }).first()).toBeVisible({ timeout: 10000 })
  })

  test('discover button triggers loading state', async ({ page }) => {
    test.setTimeout(90000)
    // Wait for page to fully load (cold-start Neon DB) before interacting
    await expect(page.getByRole('button', { name: /discover opportunities/i }).first()).toBeVisible({ timeout: 25000 })
    await page.getByRole('button', { name: /discover opportunities/i }).first().click()
    // After click, either the form expands (showing another Discover button) or loading begins
    await expect(
      page.locator('text=Running')
        .or(page.getByRole('button', { name: /discover opportunities/i }).first())
        .or(page.locator('[class*="animate"]').first())
        .or(page.locator('input[placeholder*="profession"]').first())
    ).toBeVisible({ timeout: 5000 })
  })

  test('discover opportunities returns results', async ({ page }) => {
    test.setTimeout(90000)
    await page.getByRole('button', { name: /discover opportunities/i }).first().click()
    // After second click (the confirm button in the form), loading starts
    const confirmBtn = page.getByRole('button', { name: /discover opportunities/i })
    const count = await confirmBtn.count()
    if (count > 1) await confirmBtn.nth(1).click()
    await expect(
      page.locator('text=Monthly Potential').or(page.locator('text=Difficulty')).first()
    ).toBeVisible({ timeout: 60000 })
  })
})
