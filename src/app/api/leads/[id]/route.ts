import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NotificationService } from '@/lib/services/notification'
import { logActivity } from '@/lib/activity'

export const PATCH = withAuth(async (req, user, ctx: { params: { id: string } }) => {
  const params = ctx?.params ?? { id: '' }
  const body = await req.json()
  const { stage, notes, artifacts, name, company, contact, service,
          source, priority, followUpDate, linkedinUrl, website, addInteraction } = body

  const existing = await prisma.lead.findFirst({ where: { id: params.id, userId: user.id } })
  if (!existing) {
    return NextResponse.json({ error: { code: 'NOT_FOUND' } }, { status: 404 })
  }

  // Merge extra tracking fields into artifacts
  let mergedArtifacts = artifacts
  if (source !== undefined || priority !== undefined || followUpDate !== undefined ||
      linkedinUrl !== undefined || website !== undefined || addInteraction) {
    const prev = (existing.artifacts ?? {}) as Record<string, unknown>
    const interactions = (prev.interactions as unknown[]) ?? []
    if (addInteraction) {
      interactions.push({ id: crypto.randomUUID(), ...addInteraction, date: new Date().toISOString() })
    }
    mergedArtifacts = {
      ...prev,
      ...(artifacts ?? {}),
      ...(source      !== undefined ? { source }      : {}),
      ...(priority    !== undefined ? { priority }    : {}),
      ...(followUpDate !== undefined ? { followUpDate } : {}),
      ...(linkedinUrl !== undefined ? { linkedinUrl } : {}),
      ...(website     !== undefined ? { website }     : {}),
      interactions,
    }
  }

  const lead = await prisma.lead.update({
    where: { id: params.id },
    data: {
      ...(stage          !== undefined && { stage }),
      ...(notes          !== undefined && { notes }),
      ...(mergedArtifacts !== undefined && { artifacts: mergedArtifacts }),
      ...(name           !== undefined && { name }),
      ...(company        !== undefined && { company }),
      ...(contact        !== undefined && { contact }),
      ...(service        !== undefined && { service }),
      lastActivityAt: new Date(),
    },
    include: { clientProfile: { select: { temperature: true } } },
  })

  // Log stage changes
  if (stage && stage !== existing.stage) {
    const action = stage === 'WON' ? 'LEAD_WON' : 'LEAD_MOVED'
    await logActivity(user.id, user.role, action, { leadId: lead.id, name: lead.name, from: existing.stage, to: stage })
  }

  // First Income Celebration — triggered when WON for the first time
  if (stage === 'WON' && existing.stage !== 'WON') {
    const alreadyCelebrated = await prisma.revenueMilestone.findFirst({
      where: { userId: user.id, isFirstIncome: true },
    })

    if (!alreadyCelebrated) {
      await prisma.revenueMilestone.create({
        data: {
          userId: user.id,
          label: 'First Income',
          amountINR: 0,
          isFirstIncome: true,
        },
      })

      await NotificationService.sendFirstIncomeCelebration(user.id, 0)

      await logActivity(user.id, user.role, 'FIRST_INCOME_CELEBRATED', { leadId: lead.id })
    }
  }

  return NextResponse.json(lead)
})

export const DELETE = withAuth(async (_req, user, ctx: { params: { id: string } }) => {
  const params = ctx?.params ?? { id: '' }
  const existing = await prisma.lead.findFirst({ where: { id: params.id, userId: user.id } })
  if (!existing) {
    return NextResponse.json({ error: { code: 'NOT_FOUND' } }, { status: 404 })
  }

  await prisma.lead.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
})
