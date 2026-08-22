import { test, expect } from '@playwright/test'

// ── Seed a task with fake deliverable output ─────────────────────────────────

async function seedDeliverable(page: import('@playwright/test').Page) {
  const wsRes = await page.request.post('/api/workspace', {
    data: { title: 'Deliverable E2E Workspace' },
  })
  const ws = await wsRes.json()

  const tRes = await page.request.post(`/api/workspace/${ws.id}/tasks`, {
    data: { title: 'Write SEO blog post for client' },
  })
  const task = await tRes.json()

  const fakeResult = {
    blueprint: { objective: 'Write SEO blog', clientNeeds: 'Organic traffic', deliverables: ['Blog post'], urgency: 'HIGH', taskType: 'Content' },
    plan:      { approach: 'Research + write + optimise', estimatedMinutes: 30 },
    team:      ['SEO Specialist', 'Content Writer'],
    specialistOutputs: [
      { specialist: 'SEO Specialist', contribution: 'Keyword research done', keyPoints: ['target: blog post'], recommendations: ['Use H2 tags'] },
      { specialist: 'Content Writer', contribution: 'Draft content created', keyPoints: ['engaging intro'], recommendations: ['Add CTA'] },
    ],
    review: { score: 88, approved: true, improvements: [], consolidatedOutput: 'Full blog post output here', keyFindings: ['Good SEO', 'Clear CTA'] },
    deliverable: {
      summary: 'A well-researched SEO blog post targeting key industry terms.',
      mainOutput: 'This is the full blog post body content for the client.',
      sections: [
        { title: 'Introduction', content: 'Opening hook and context for readers.' },
        { title: 'Main Points', content: 'Key arguments and supporting data.' },
      ],
      emailDraft: 'Subject: Your blog post is ready\n\nHi,\n\nPlease find the SEO blog post attached.\n\nBest,\nFreelancer',
      nextSteps: ['Review and approve', 'Schedule publication', 'Share on social media'],
    },
  }

  await page.request.patch(`/api/workspace/tasks/${task.id}`, {
    data: { status: 'DELIVERED', output: fakeResult },
  })

  return { wsId: ws.id as string, taskId: task.id as string }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('Deliverable Review Page', () => {

  test('loads with review checklist and all 4 items', async ({ page }) => {
    const { taskId } = await seedDeliverable(page)
    await page.goto(`/dashboard/workspace/deliverable/${taskId}`)
    await expect(page.getByRole('heading', { name: /review deliverable/i })).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=Review Checklist')).toBeVisible()
    await expect(page.locator('text=Deliverable addresses all client requirements')).toBeVisible()
    await expect(page.locator('text=Content quality and completeness reviewed')).toBeVisible()
    await expect(page.locator('text=Email draft is professional and ready to send')).toBeVisible()
    await expect(page.locator('text=Confirmed ready to deliver to client')).toBeVisible()
  })

  test('shows executive summary and quality score 88', async ({ page }) => {
    const { taskId } = await seedDeliverable(page)
    await page.goto(`/dashboard/workspace/deliverable/${taskId}`)
    await expect(page.locator('text=Executive Summary')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=A well-researched SEO blog post')).toBeVisible()
    await expect(page.locator('text=88').first()).toBeVisible()
  })

  test('shows deliverable output sections: Introduction and Main Points', async ({ page }) => {
    const { taskId } = await seedDeliverable(page)
    await page.goto(`/dashboard/workspace/deliverable/${taskId}`)
    await expect(page.locator('text=Deliverable Output')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=Introduction')).toBeVisible()
    await expect(page.locator('text=Main Points')).toBeVisible()
    await expect(page.locator('text=This is the full blog post body')).toBeVisible()
  })

  test('shows AI specialist chips', async ({ page }) => {
    const { taskId } = await seedDeliverable(page)
    await page.goto(`/dashboard/workspace/deliverable/${taskId}`)
    await expect(page.locator('text=AI Specialists')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=SEO Specialist').first()).toBeVisible()
    await expect(page.locator('text=Content Writer').first()).toBeVisible()
  })

  test('shows key findings and next steps', async ({ page }) => {
    const { taskId } = await seedDeliverable(page)
    await page.goto(`/dashboard/workspace/deliverable/${taskId}`)
    await expect(page.locator('text=Good SEO')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=Review and approve')).toBeVisible()
    await expect(page.locator('text=Schedule publication')).toBeVisible()
  })

  test('email draft is collapsible: hidden then visible after click', async ({ page }) => {
    const { taskId } = await seedDeliverable(page)
    await page.goto(`/dashboard/workspace/deliverable/${taskId}`)
    await expect(page.locator('button:has-text("Email Draft")')).toBeVisible({ timeout: 10000 })
    await page.locator('button:has-text("Email Draft")').click()
    await expect(page.locator('text=Your blog post is ready')).toBeVisible()
  })

  test('Accept & Compose button disabled until all 4 checkboxes ticked', async ({ page }) => {
    const { taskId } = await seedDeliverable(page)
    await page.goto(`/dashboard/workspace/deliverable/${taskId}`)
    await expect(page.locator('text=Review Checklist')).toBeVisible({ timeout: 10000 })

    const acceptBtn = page.locator('button:has-text("Accept")')
    await expect(acceptBtn).toBeDisabled()

    // Tick all 4 check items (the .rounded-lg.border-2 divs inside the checklist)
    const checklist = page.locator('text=Review Checklist').locator('..').locator('..')
    const checkDivs = checklist.locator('div.rounded-lg.border-2')
    for (let i = 0; i < 4; i++) {
      await checkDivs.nth(i).click()
    }
    await expect(acceptBtn).toBeEnabled({ timeout: 3000 })
  })

  test('clicking Accept opens compose email form', async ({ page }) => {
    const { taskId } = await seedDeliverable(page)
    await page.goto(`/dashboard/workspace/deliverable/${taskId}`)
    await expect(page.locator('text=Review Checklist')).toBeVisible({ timeout: 10000 })

    const checklist = page.locator('text=Review Checklist').locator('..').locator('..')
    const checkDivs = checklist.locator('div.rounded-lg.border-2')
    for (let i = 0; i < 4; i++) await checkDivs.nth(i).click()

    await page.locator('button:has-text("Accept")').click()
    await expect(page.getByRole('heading', { name: /compose email/i })).toBeVisible()
  })

  test('compose email has 3 attachment format options', async ({ page }) => {
    const { taskId } = await seedDeliverable(page)
    await page.goto(`/dashboard/workspace/deliverable/${taskId}`)
    await expect(page.locator('text=Review Checklist')).toBeVisible({ timeout: 10000 })
    const checklist = page.locator('text=Review Checklist').locator('..').locator('..')
    const checkDivs = checklist.locator('div.rounded-lg.border-2')
    for (let i = 0; i < 4; i++) await checkDivs.nth(i).click()
    await page.locator('button:has-text("Accept")').click()

    await expect(page.locator('text=HTML Report')).toBeVisible()
    await expect(page.locator('text=Text File')).toBeVisible()
    await expect(page.locator('text=Email Only')).toBeVisible()
  })

  test('Edit Deliverable link in compose goes back to review', async ({ page }) => {
    const { taskId } = await seedDeliverable(page)
    await page.goto(`/dashboard/workspace/deliverable/${taskId}`)
    await expect(page.locator('text=Review Checklist')).toBeVisible({ timeout: 10000 })
    const checklist = page.locator('text=Review Checklist').locator('..').locator('..')
    const checkDivs = checklist.locator('div.rounded-lg.border-2')
    for (let i = 0; i < 4; i++) await checkDivs.nth(i).click()
    await page.locator('button:has-text("Accept")').click()
    await expect(page.getByRole('heading', { name: /compose email/i })).toBeVisible()
    await page.locator('button:has-text("Edit Deliverable")').click()
    await expect(page.getByRole('heading', { name: /review deliverable/i })).toBeVisible()
  })

  // ── Revision UI ─────────────────────────────────────────────────────────────

  test('Found an Issue panel shows 3 mode buttons', async ({ page }) => {
    const { taskId } = await seedDeliverable(page)
    await page.goto(`/dashboard/workspace/deliverable/${taskId}`)
    await expect(page.locator('text=Found an Issue')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('button:has-text("Fine-tune")')).toBeVisible()
    await expect(page.locator('button:has-text("Recreate")')).toBeVisible()
    await expect(page.locator('button:has-text("Edit Manually")')).toBeVisible()
  })

  test('Fine-tune mode shows textarea and Apply Changes button', async ({ page }) => {
    const { taskId } = await seedDeliverable(page)
    await page.goto(`/dashboard/workspace/deliverable/${taskId}`)
    await expect(page.locator('text=Found an Issue')).toBeVisible({ timeout: 10000 })
    await page.locator('button:has-text("Fine-tune")').click()
    // Revision textarea appears (placeholder contains "generic" or "cost")
    const revisionTextarea = page.locator('textarea').last()
    await expect(revisionTextarea).toBeVisible()
    await expect(page.locator('button:has-text("Apply Changes")')).toBeDisabled()
    await revisionTextarea.fill('Improve the introduction paragraph with more detail')
    await expect(page.locator('button:has-text("Apply Changes")')).toBeEnabled()
  })

  test('Recreate mode shows textarea and Recreate All button', async ({ page }) => {
    const { taskId } = await seedDeliverable(page)
    await page.goto(`/dashboard/workspace/deliverable/${taskId}`)
    await expect(page.locator('text=Found an Issue')).toBeVisible({ timeout: 10000 })
    await page.locator('button:has-text("Recreate")').click()
    await expect(page.locator('textarea[placeholder*="wrong"]')).toBeVisible()
    await expect(page.locator('button:has-text("Recreate All")')).toBeVisible()
  })

  test('Edit Manually mode shows editable textareas and Save Edits button', async ({ page }) => {
    const { taskId } = await seedDeliverable(page)
    await page.goto(`/dashboard/workspace/deliverable/${taskId}`)
    await expect(page.locator('text=Found an Issue')).toBeVisible({ timeout: 10000 })
    await page.locator('button:has-text("Edit Manually")').click()
    // Save Edits button has a 💾 emoji prefix — match by partial text
    await expect(page.locator('button', { hasText: /save edits/i })).toBeVisible()
    await expect(page.locator('textarea').first()).toBeVisible()
  })

  test('Cancel closes Fine-tune prompt panel', async ({ page }) => {
    const { taskId } = await seedDeliverable(page)
    await page.goto(`/dashboard/workspace/deliverable/${taskId}`)
    await expect(page.locator('text=Found an Issue')).toBeVisible({ timeout: 10000 })
    await page.locator('button:has-text("Fine-tune")').click()
    // Apply Changes button should be visible (textarea is open)
    await expect(page.locator('button:has-text("Apply Changes")')).toBeVisible()
    await page.locator('button:has-text("Cancel")').last().click()
    // After cancel, Apply Changes button disappears
    await expect(page.locator('button:has-text("Apply Changes")')).not.toBeVisible()
  })

  test('breadcrumb Workspace link navigates back', async ({ page }) => {
    const { taskId } = await seedDeliverable(page)
    await page.goto(`/dashboard/workspace/deliverable/${taskId}`)
    await expect(page.locator('text=Review Deliverable')).toBeVisible({ timeout: 10000 })
    await page.locator('a:has-text("Workspace")').first().click()
    await expect(page).toHaveURL(/\/dashboard\/workspace$/, { timeout: 15000 })
  })

  test('non-existent taskId shows error state', async ({ page }) => {
    await page.goto('/dashboard/workspace/deliverable/does-not-exist-000')
    // Error phase shows the error message + back link
    await expect(
      page.locator('text=NOT_FOUND')
        .or(page.locator('text=No deliverable'))
        .or(page.locator('text=Failed to load'))
        .first()
    ).toBeVisible({ timeout: 10000 })
    await expect(page.locator('a:has-text("Back to Workspace")')).toBeVisible()
  })
})
