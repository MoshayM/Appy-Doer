import { test, expect } from '@playwright/test'

async function login(page: import('@playwright/test').Page) {
  await page.goto('/login')
  await page.getByLabel('Email').fill('test@example.com')
  await page.getByLabel('Password').fill('testpass123')
  await page.getByRole('button', { name: /sign in/i }).click()
  await page.waitForURL('**/dashboard**', { timeout: 15000 })
}

test.describe('Skill Assessment (AI)', () => {
  test.setTimeout(90000)

  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('runs full skill assessment and shows results', async ({ page }) => {
    await page.goto('/dashboard/skills')
    await page.getByPlaceholder(/software engineer/i).fill('Full Stack Developer')
    await page.getByRole('button', { name: /^advanced$/i }).click()
    await page.getByRole('button', { name: /assess my skills/i }).click()

    // Wait for AI response — can take up to 30s
    await expect(page.getByText(/readiness score/i)).toBeVisible({ timeout: 30000 })
    await expect(page.getByText(/your skills/i)).toBeVisible()
    await expect(page.getByText(/monetizable skills/i)).toBeVisible()
    await expect(page.getByText(/recommended focus areas/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /save skills/i })).toBeVisible()
  })

  test('can add a custom skill in results', async ({ page }) => {
    await page.goto('/dashboard/skills')
    await page.getByPlaceholder(/software engineer/i).fill('Graphic Designer')
    await page.getByRole('button', { name: /^intermediate$/i }).click()
    await page.getByRole('button', { name: /assess my skills/i }).click()
    await expect(page.getByText(/readiness score/i)).toBeVisible({ timeout: 30000 })

    // Type a unique custom skill and press Enter
    const skillInput = page.locator('input[placeholder*="Add skill"], input[placeholder*="skill"]').last()
    await skillInput.fill('ZZZCustomTestSkill')
    await skillInput.press('Enter')
    // Skill tags render as <span>skill name<button>×</button></span>, so use filter hasText
    await expect(page.locator('span.bg-indigo-50').filter({ hasText: 'ZZZCustomTestSkill' })).toBeVisible()
  })

  test('retake assessment button returns to form', async ({ page }) => {
    await page.goto('/dashboard/skills')
    await page.getByPlaceholder(/software engineer/i).fill('Data Analyst')
    await page.getByRole('button', { name: /^beginner$/i }).click()
    await page.getByRole('button', { name: /assess my skills/i }).click()
    await expect(page.getByText(/readiness score/i)).toBeVisible({ timeout: 30000 })

    await page.getByRole('button', { name: /retake assessment/i }).click()
    await expect(page.getByRole('button', { name: /assess my skills/i })).toBeVisible()
  })
})
