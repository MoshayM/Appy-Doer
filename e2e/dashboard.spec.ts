import { test, expect } from '@playwright/test'

async function login(page: import('@playwright/test').Page) {
  await page.goto('/login')
  await page.getByLabel('Email').fill('test@example.com')
  await page.getByLabel('Password').fill('testpass123')
  await page.getByRole('button', { name: /sign in/i }).click()
  await page.waitForURL('**/dashboard**', { timeout: 15000 })
}

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('dashboard loads after login', async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard/)
    await expect(page.locator('body')).not.toBeEmpty()
  })

  test('skill assessment page loads', async ({ page }) => {
    await page.goto('/dashboard/skills')
    await expect(page.getByRole('heading', { name: /skill assessment/i })).toBeVisible()
    await expect(page.getByPlaceholder(/software engineer/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /beginner/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /expert/i })).toBeVisible()
  })

  test('opportunity discovery page loads', async ({ page }) => {
    await page.goto('/dashboard/opportunities')
    await expect(page.getByRole('heading', { name: /opportunity discovery/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /discover opportunities/i }).first()).toBeVisible()
  })

  test('skill assessment form — submit disabled without profession', async ({ page }) => {
    await page.goto('/dashboard/skills')
    const submitBtn = page.getByRole('button', { name: /assess my skills/i })
    await expect(submitBtn).toBeDisabled()
    await page.getByPlaceholder(/software engineer/i).fill('Backend Developer')
    await expect(submitBtn).toBeEnabled()
  })

  test('expertise level selection works', async ({ page }) => {
    await page.goto('/dashboard/skills')
    const advancedBtn = page.getByRole('button', { name: /^advanced$/i })
    await advancedBtn.click()
    await expect(advancedBtn).toHaveClass(/bg-indigo-600/)
  })
})
