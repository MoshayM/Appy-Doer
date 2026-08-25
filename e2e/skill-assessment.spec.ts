import { test, expect } from '@playwright/test'

test.describe('Skill Assessment', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/skills')
  })

  test('page loads with profession input and expertise buttons', async ({ page }) => {
    // Extended timeout for Neon DB cold-start on first load
    await expect(page.getByRole('heading', { name: /skill assessment/i })).toBeVisible({ timeout: 20000 })
    await expect(
      page.locator('input[placeholder*="engineer"], input[placeholder*="Engineer"], input[placeholder*="profession"]').first()
    ).toBeVisible({ timeout: 20000 })
    for (const level of ['Beginner', 'Intermediate', 'Advanced', 'Expert']) {
      await expect(page.getByRole('button', { name: new RegExp(`^${level}$`, 'i') })).toBeVisible({ timeout: 10000 })
    }
  })

  test('assess button disabled until profession is filled', async ({ page }) => {
    const profInput = page.locator('input[placeholder*="engineer"], input[placeholder*="Engineer"], input[placeholder*="profession"]').first()
    const submitBtn = page.getByRole('button', { name: /assess my skills/i })
    await expect(profInput).toBeVisible({ timeout: 20000 })
    await profInput.clear()
    await expect(submitBtn).toBeDisabled({ timeout: 5000 })
    await profInput.fill('Backend Developer')
    await expect(submitBtn).toBeEnabled({ timeout: 5000 })
  })

  test('expertise level selection changes active button style', async ({ page }) => {
    const advBtn = page.getByRole('button', { name: /^Advanced$/i })
    await advBtn.click()
    await expect(advBtn).toHaveClass(/bg-indigo-600|bg-gray-900/)
  })

  test('intermediate is selected by default', async ({ page }) => {
    const interBtn = page.getByRole('button', { name: /^Intermediate$/i })
    await expect(interBtn).toHaveClass(/bg-indigo-600|bg-gray-900/, { timeout: 20000 })
  })

  test('runs full skill assessment and shows results', async ({ page }) => {
    test.setTimeout(300000)
    await page.locator('input[placeholder*="engineer"], input[placeholder*="Engineer"], input[placeholder*="profession"]').first().fill('Full Stack Developer')
    await page.getByRole('button', { name: /^Advanced$/i }).click()
    await page.getByRole('button', { name: /assess my skills/i }).click()

    // Wait for loading to start so we can distinguish "button reappeared on error" from "button not yet hidden"
    await expect(page.getByRole('button', { name: /assess my skills/i })).not.toBeVisible({ timeout: 15000 })

    // Wait for SUCCESS (readiness score) or FAILURE (button reappears after API error).
    // On API error this resolves in seconds; on slow AI it waits up to 180s.
    const successText = page.getByText(/readiness score/i)
    const errorButton = page.getByRole('button', { name: /assess my skills/i })
    await expect(successText.or(errorButton).first()).toBeVisible({ timeout: 180000 })

    // Assert success — if the API key is disabled this fails immediately with a clear message
    await expect(successText).toBeVisible({
      timeout: 3000,
      message: 'Skill assessment did not return results — check ANTHROPIC_API_KEY in .env.local (current key may be disabled)',
    })
    await expect(page.getByText(/monetizable skills/i)).toBeVisible()
    await expect(page.getByText(/recommended focus areas/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /save skills/i })).toBeVisible()
  })

  test('can add a custom skill after assessment', async ({ page }) => {
    test.setTimeout(300000)
    await page.locator('input[placeholder*="engineer"], input[placeholder*="Engineer"], input[placeholder*="profession"]').first().fill('Graphic Designer')
    await page.getByRole('button', { name: /^Intermediate$/i }).click()
    await page.getByRole('button', { name: /assess my skills/i }).click()

    await expect(page.getByRole('button', { name: /assess my skills/i })).not.toBeVisible({ timeout: 15000 })

    const successText = page.getByText(/readiness score/i)
    const errorButton = page.getByRole('button', { name: /assess my skills/i })
    await expect(successText.or(errorButton).first()).toBeVisible({ timeout: 180000 })

    await expect(successText).toBeVisible({
      timeout: 3000,
      message: 'Skill assessment did not return results — check ANTHROPIC_API_KEY in .env.local (current key may be disabled)',
    })

    const skillInput = page.locator('input[placeholder*="skill"], input[placeholder*="Skill"]').last()
    await skillInput.fill('ZZZCustomTestSkill')
    await skillInput.press('Enter')
    await expect(page.locator('text=ZZZCustomTestSkill').first()).toBeVisible({ timeout: 5000 })
  })

  test('retake assessment returns to form', async ({ page }) => {
    test.setTimeout(300000)
    await page.locator('input[placeholder*="engineer"], input[placeholder*="Engineer"], input[placeholder*="profession"]').first().fill('Data Analyst')
    await page.getByRole('button', { name: /^Beginner$/i }).click()
    await page.getByRole('button', { name: /assess my skills/i }).click()

    await expect(page.getByRole('button', { name: /assess my skills/i })).not.toBeVisible({ timeout: 15000 })

    const successText = page.getByText(/readiness score/i)
    const errorButton = page.getByRole('button', { name: /assess my skills/i })
    await expect(successText.or(errorButton).first()).toBeVisible({ timeout: 180000 })

    await expect(successText).toBeVisible({
      timeout: 3000,
      message: 'Skill assessment did not return results — check ANTHROPIC_API_KEY in .env.local (current key may be disabled)',
    })
    await page.getByRole('button', { name: /retake/i }).click()
    await expect(page.getByRole('button', { name: /assess my skills/i })).toBeVisible()
  })
})
