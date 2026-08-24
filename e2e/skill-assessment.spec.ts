import { test, expect } from '@playwright/test'

test.describe('Skill Assessment', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/skills')
  })

  test('page loads with profession input and expertise buttons', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /skill assessment/i })).toBeVisible()
    await expect(
      page.locator('input[placeholder*="engineer"], input[placeholder*="Engineer"], input[placeholder*="profession"]').first()
    ).toBeVisible()
    for (const level of ['Beginner', 'Intermediate', 'Advanced', 'Expert']) {
      await expect(page.getByRole('button', { name: new RegExp(`^${level}$`, 'i') })).toBeVisible()
    }
  })

  test('assess button disabled until profession is filled', async ({ page }) => {
    const submitBtn = page.getByRole('button', { name: /assess my skills/i })
    await expect(submitBtn).toBeDisabled()
    await page.locator('input[placeholder*="engineer"], input[placeholder*="Engineer"], input[placeholder*="profession"]').first().fill('Backend Developer')
    await expect(submitBtn).toBeEnabled()
  })

  test('expertise level selection changes active button style', async ({ page }) => {
    const advBtn = page.getByRole('button', { name: /^Advanced$/i })
    await advBtn.click()
    await expect(advBtn).toHaveClass(/bg-indigo-600|bg-gray-900/)
  })

  test('intermediate is selected by default', async ({ page }) => {
    const interBtn = page.getByRole('button', { name: /^Intermediate$/i })
    await expect(interBtn).toHaveClass(/bg-indigo-600|bg-gray-900/)
  })

  test('runs full skill assessment and shows results', async ({ page }) => {
    test.setTimeout(90000)
    await page.locator('input[placeholder*="engineer"], input[placeholder*="Engineer"], input[placeholder*="profession"]').first().fill('Full Stack Developer')
    await page.getByRole('button', { name: /^Advanced$/i }).click()
    await page.getByRole('button', { name: /assess my skills/i }).click()

    await expect(page.getByText(/readiness score/i)).toBeVisible({ timeout: 40000 })
    await expect(page.getByText(/monetizable skills/i)).toBeVisible()
    await expect(page.getByText(/recommended focus areas/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /save skills/i })).toBeVisible()
  })

  test('can add a custom skill after assessment', async ({ page }) => {
    test.setTimeout(90000)
    await page.locator('input[placeholder*="engineer"], input[placeholder*="Engineer"], input[placeholder*="profession"]').first().fill('Graphic Designer')
    await page.getByRole('button', { name: /^Intermediate$/i }).click()
    await page.getByRole('button', { name: /assess my skills/i }).click()
    await expect(page.getByText(/readiness score/i)).toBeVisible({ timeout: 40000 })

    const skillInput = page.locator('input[placeholder*="skill"], input[placeholder*="Skill"]').last()
    await skillInput.fill('ZZZCustomTestSkill')
    await skillInput.press('Enter')
    await expect(page.locator('text=ZZZCustomTestSkill').first()).toBeVisible({ timeout: 5000 })
  })

  test('retake assessment returns to form', async ({ page }) => {
    test.setTimeout(90000)
    await page.locator('input[placeholder*="engineer"], input[placeholder*="Engineer"], input[placeholder*="profession"]').first().fill('Data Analyst')
    await page.getByRole('button', { name: /^Beginner$/i }).click()
    await page.getByRole('button', { name: /assess my skills/i }).click()
    await expect(page.getByText(/readiness score/i)).toBeVisible({ timeout: 40000 })
    await page.getByRole('button', { name: /retake/i }).click()
    await expect(page.getByRole('button', { name: /assess my skills/i })).toBeVisible()
  })
})
