import { test, expect } from '@playwright/test'

// storageState pre-authenticates all tests in this file

async function createWorkspace(page: import('@playwright/test').Page): Promise<string> {
  const res = await page.request.post('/api/workspace', {
    data: { title: 'E2E Test Workspace', objective: 'Playwright test objective' },
  })
  const data = await res.json()
  return data.id as string
}

async function createTask(page: import('@playwright/test').Page, workspaceId: string): Promise<string> {
  const res = await page.request.post(`/api/workspace/${workspaceId}/tasks`, {
    data: { title: 'E2E Test Task: Write project proposal' },
  })
  const data = await res.json()
  return data.id as string
}

test.describe('Workspace — Work Support Center', () => {

  test('page loads with header and AI Support button', async ({ page }) => {
    await page.goto('/dashboard/workspace')
    await expect(page.getByRole('heading', { name: /work support center/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /get ai support/i })).toBeVisible()
  })

  test('workspace and task appear after creation via API', async ({ page }) => {
    const wsId = await createWorkspace(page)
    await createTask(page, wsId)
    await page.goto('/dashboard/workspace')
    await expect(page.locator('text=E2E Test Workspace').first()).toBeVisible()
    await expect(page.locator('text=E2E Test Task: Write project proposal').first()).toBeVisible()
  })

  test('add task button shows task input row', async ({ page }) => {
    await createWorkspace(page)
    await page.goto('/dashboard/workspace')
    await page.locator('button', { hasText: '+ Task' }).first().click()
    await expect(page.locator('input[placeholder="Describe the task…"]')).toBeVisible()
    // Escape closes the row
    await page.keyboard.press('Escape')
    await expect(page.locator('input[placeholder="Describe the task…"]')).not.toBeVisible()
  })

  test('can add a task via + Task form', async ({ page }) => {
    const wsId = await createWorkspace(page)
    await page.goto('/dashboard/workspace')
    await page.locator('button', { hasText: '+ Task' }).first().click()
    await page.locator('input[placeholder="Describe the task…"]').fill('Build landing page for client')
    await page.getByRole('button', { name: 'Add' }).click()
    await expect(page.locator('text=Build landing page for client').first()).toBeVisible({ timeout: 15000 })
  })

  test('clicking a task row expands it and shows elaboration state', async ({ page }) => {
    const wsId = await createWorkspace(page)
    await createTask(page, wsId)
    await page.goto('/dashboard/workspace')
    await page.locator('text=E2E Test Task: Write project proposal').first().click()

    const spinner    = page.locator('text=Reading client emails')
    const analyseBtn = page.locator('button', { hasText: /analyse with ai/i })
    const overview   = page.locator('button', { hasText: 'Overview' })
    await expect(spinner.or(analyseBtn).or(overview)).toBeVisible({ timeout: 10000 })
  })

  // All 5 elaboration-dependent tests combined into ONE so the AI call happens
  // once (~4-8 min) instead of 5 separate times (20-40 min total).
  test('elaboration suite: tabs visible, roadmap, textarea, execute button, execution flow', async ({ page }) => {
    test.setTimeout(600000) // 10 min total
    const wsId = await createWorkspace(page)
    await createTask(page, wsId)
    await page.goto('/dashboard/workspace')
    await page.locator('text=E2E Test Task: Write project proposal').first().click()

    // ── Wait for AI elaboration (Claude can take 3–8 min) ─────────────────────
    await expect(page.locator('button', { hasText: 'Overview' })).toBeVisible({ timeout: 480000 })

    // ── Overview / Roadmap / Suggestions tabs visible ─────────────────────────
    await expect(page.locator('button', { hasText: 'Roadmap' })).toBeVisible()
    await expect(page.locator('button', { hasText: 'Suggestions' })).toBeVisible()

    // ── Roadmap tab shows numbered steps ─────────────────────────────────────
    await page.locator('button', { hasText: 'Roadmap' }).click()
    await expect(page.locator('.space-y-4').first()).toBeVisible({ timeout: 10000 })
    await page.locator('button', { hasText: 'Overview' }).click()

    // ── Your Instructions textarea accepts freeform text ──────────────────────
    const notes = page.locator('textarea[placeholder*="instructions"], textarea[placeholder*="Instructions"]').first()
    await notes.fill('Focus on budget constraints and timeline')
    await expect(notes).toHaveValue('Focus on budget constraints and timeline')

    // ── Execute with AI Team button is visible ────────────────────────────────
    const executeBtn = page.locator('button', { hasText: /execute with ai team/i })
    await expect(executeBtn).toBeVisible({ timeout: 10000 })

    // ── Execution flow: clicking Execute shows clarification or AI coach card ──
    // (If elaboration errored, fall back to Analyse button before clicking Execute)
    const analyseBtn = page.locator('button', { hasText: /analyse with ai/i })
    if (await analyseBtn.isVisible()) {
      await analyseBtn.click()
      await expect(executeBtn).toBeVisible({ timeout: 100000 })
    }
    await executeBtn.click()
    const clarify  = page.locator('text=AI needs a few details').or(page.locator('text=Before We Start'))
    const checking = page.locator('div:has-text("Checking requirements")').first()
    const working  = page.locator('div:has-text("AI Team at Work")').first()
    await expect(clarify.or(checking).or(working).first()).toBeVisible({ timeout: 30000 })
  })

  test('delete task shows undo toast', async ({ page }) => {
    const wsId = await createWorkspace(page)
    await createTask(page, wsId)
    await page.goto('/dashboard/workspace')
    const taskRow = page.locator('text=E2E Test Task: Write project proposal').first()
    await taskRow.hover()
    await page.locator('button', { hasText: 'Delete' }).first().click()
    await expect(page.locator('text=deleted').first()).toBeVisible({ timeout: 5000 })
    await expect(page.getByRole('button', { name: 'Undo' })).toBeVisible()
  })

  test('undo delete restores the task', async ({ page }) => {
    const wsId = await createWorkspace(page)
    await createTask(page, wsId)
    await page.goto('/dashboard/workspace')
    const taskRow = page.locator('text=E2E Test Task: Write project proposal').first()
    await taskRow.hover()
    await page.locator('button', { hasText: 'Delete' }).first().click()
    await expect(page.locator('text=deleted').first()).toBeVisible({ timeout: 5000 })
    await page.getByRole('button', { name: 'Undo' }).click()
    await expect(page.locator('text=E2E Test Task: Write project proposal').first()).toBeVisible({ timeout: 5000 })
  })

  test('workspace GET API returns workspaces and tasks', async ({ page }) => {
    await createWorkspace(page)
    const res = await page.request.get('/api/workspace')
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(Array.isArray(body.workspaces)).toBeTruthy()
    expect(Array.isArray(body.tasks)).toBeTruthy()
  })
})
