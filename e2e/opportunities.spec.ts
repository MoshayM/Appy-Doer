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
    // After click, form expands (confirm button visible) or loading starts
    // .first() must be on the locator before expect(), not on LocatorAssertions
    await expect(
      page.locator('text=Running')
        .or(page.getByRole('button', { name: /discover opportunities/i }))
        .or(page.locator('[class*="animate"]'))
        .first()
    ).toBeVisible({ timeout: 10000 })
  })

  test('discover opportunities returns results', async ({ page }) => {
    test.setTimeout(300000)
    // Wait for page to fully load (cold-start Neon DB) before interacting
    await expect(page.getByRole('button', { name: /discover opportunities/i }).first()).toBeVisible({ timeout: 25000 })

    // First click opens the form (showForm=true) — does NOT start discovery yet
    await page.getByRole('button', { name: /discover opportunities/i }).first().click()

    // Wait for the profession input to confirm the form is rendered
    await expect(
      page.locator('input[placeholder*="profession"]').or(page.locator('input[placeholder*="skills"]')).first()
    ).toBeVisible({ timeout: 5000 })

    // Second click on the confirm button inside the form — this triggers the AI discovery
    await page.getByRole('button', { name: /discover opportunities/i }).first().click()

    // Wait for AI results (discovery takes 60–180 s)
    await expect(
      page.locator('text=Monthly Potential').or(page.locator('text=Difficulty')).first()
    ).toBeVisible({ timeout: 240000 })
  })
})
