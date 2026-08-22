import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const POST = withAuth(async (_req, user, ctx: { params: { id: string } }) => {
  const id = ctx?.params?.id
  if (!id) return NextResponse.json({ error: { code: 'INVALID' } }, { status: 400 })

  // Clear any previous selection
  await prisma.opportunityRoadmap.updateMany({
    where: { userId: user.id, selected: true },
    data: { selected: false },
  })

  // Select this opportunity (store it from agent run output)
  await prisma.userContext.upsert({
    where: { userId: user.id },
    update: { selectedOpportunityId: id, version: { increment: 1 } },
    create: { userId: user.id, selectedOpportunityId: id },
  })

  return NextResponse.json({ success: true })
})
