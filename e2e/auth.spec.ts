import { test, expect } from '@playwright/test'
import { login } from './helpers'

test.describe('Authentication', () => {

  test('login page loads with correct heading and fields', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
    await expect(page.locator('#email')).toBeVisible()
    await expect(page.locator('#password')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible()
  })

  test('register page loads with correct heading and fields', async ({ page }) => {
    await page.goto('/register')
    await expect(page.getByRole('heading', { name: 'Start your free trial' })).toBeVisible()
    await expect(page.locator('#name')).toBeVisible()
    await expect(page.locator('#email')).toBeVisible()
    await expect(page.locator('#password')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Start free trial' })).toBeVisible()
  })

  test('redirects unauthenticated user from dashboard to login', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/)
  })

  test('login with test credentials reaches dashboard', async ({ page }) => {
    await login(page)
    await expect(page).toHaveURL(/\/dashboard/)
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible()
  })

  test('shows error on wrong password', async ({ page }) => {
    await page.goto('/login')
    await page.locator('#email').fill('test@example.com')
    await page.locator('#password').fill('wrongpassword123')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page.locator('.bg-red-50').first()).toBeVisible({ timeout: 15000 })
  })

  test('register rejects existing email', async ({ page }) => {
    await page.goto('/register')
    await page.locator('#name').fill('Test User')
    await page.locator('#email').fill('test@example.com')
    await page.locator('#password').fill('testpass123')
    await page.getByRole('button', { name: 'Start free trial' }).click()
    await expect(page.locator('.bg-red-50').first()).toBeVisible({ timeout: 20000 })
  })

  test('password strength indicator appears on register page', async ({ page }) => {
    await page.goto('/register')
    // 'abcdefgh': length>=8 only → score 1 → "Weak password"
    await page.locator('#password').fill('abcdefgh')
    await expect(page.locator('text=Weak password')).toBeVisible()
    // 'Abcdefg1': all 3 checks → score 3 → "Strong password"
    await page.locator('#password').fill('Abcdefg1')
    await expect(page.locator('text=Strong password')).toBeVisible()
  })

  test('show/hide password toggle works on login', async ({ page }) => {
    await page.goto('/login')
    const input = page.locator('#password')
    await expect(input).toHaveAttribute('type', 'password')
    await page.getByRole('button', { name: /show password/i }).click()
    await expect(input).toHaveAttribute('type', 'text')
    await page.getByRole('button', { name: /hide password/i }).click()
    await expect(input).toHaveAttribute('type', 'password')
  })

  test('login page has link to register', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('link', { name: 'Start free trial' }).click()
    await expect(page).toHaveURL(/\/register/)
  })

  test('register page has link to login', async ({ page }) => {
    await page.goto('/register')
    await page.locator('a[href="/login"]').click()
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })
})
