import { test, expect } from '@playwright/test'

// storageState pre-authenticates this project — no login needed in beforeEach

test.describe('Dashboard', () => {

  test('dashboard loads: heading and stats visible', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible()
    await expect(page.locator('text=Active Leads').or(page.locator('text=Clients Won')).first()).toBeVisible()
  })

  test('journey steps section is present', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(
      page.locator('text=Skill Assessment').or(page.locator('text=Opportunity')).first()
    ).toBeVisible()
  })

  test('skill assessment page loads', async ({ page }) => {
    await page.goto('/dashboard/skills')
    await expect(page.getByRole('heading', { name: /skill assessment/i })).toBeVisible({ timeout: 20000 })
  })

  test('opportunities page loads', async ({ page }) => {
    await page.goto('/dashboard/opportunities')
    await expect(page.getByRole('heading', { name: /opportunity discovery/i })).toBeVisible({ timeout: 20000 })
  })

  test('workspace page loads', async ({ page }) => {
    await page.goto('/dashboard/workspace')
    await expect(page.getByRole('heading', { name: /work support center/i })).toBeVisible()
  })

  test('crm page loads without redirect', async ({ page }) => {
    await page.goto('/dashboard/crm')
    await expect(page).not.toHaveURL(/\/login/)
    await expect(page.locator('body')).not.toBeEmpty()
  })

  test('income page loads without redirect', async ({ page }) => {
    await page.goto('/dashboard/income')
    await expect(page).not.toHaveURL(/\/login/)
    await expect(page.locator('body')).not.toBeEmpty()
  })

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
})
