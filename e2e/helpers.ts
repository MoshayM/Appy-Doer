import type { Page } from '@playwright/test'

export async function login(page: Page) {
  await page.goto('/login')
  await page.locator('#email').fill('test@example.com')
  await page.locator('#password').fill('testpass123')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.waitForURL('**/dashboard**', { timeout: 20000 })
}
