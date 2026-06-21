import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logActivity } from '@/lib/activity'

export const GET = withAuth(async (_req, user) => {
  const leads = await prisma.lead.findMany({
    where: { userId: user.id },
    include: { clientProfile: { select: { temperature: true } } },
    orderBy: { lastActivityAt: 'desc' },
  })
  return NextResponse.json(leads)
})

export const POST = withAuth(async (req, user) => {
  const body = await req.json()
  const { name, company, contact, service, notes, stage,
          source, priority, followUpDate, linkedinUrl, website } = body

  if (!name) {
    return NextResponse.json({ error: { code: 'INVALID_INPUT', message: 'Lead name required' } }, { status: 400 })
  }

  // Extra tracking fields stored in artifacts JSON
  const artifacts: Record<string, unknown> = {}
  if (source)      artifacts.source      = source
  if (priority)    artifacts.priority    = priority
  if (followUpDate) artifacts.followUpDate = followUpDate
  if (linkedinUrl) artifacts.linkedinUrl = linkedinUrl
  if (website)     artifacts.website     = website
  artifacts.interactions = []

  const lead = await prisma.lead.create({
    data: {
      userId: user.id, name, company, contact, service, notes,
      ...(stage ? { stage } : {}),
      artifacts: artifacts as import('@prisma/client').Prisma.InputJsonValue,
    },
    include: { clientProfile: { select: { temperature: true } } },
  })

  await logActivity(user.id, user.role, 'LEAD_ADDED', { leadId: lead.id, name: lead.name, company: lead.company })

  return NextResponse.json(lead, { status: 201 })
})
