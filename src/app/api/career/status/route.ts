import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const GET = withAuth(async (_req, user) => {
  const [userCtx, skillRun, oppRun, offerRun] = await Promise.all([
    prisma.userContext.findUnique({
      where: { userId: user.id },
      select: { profession: true },
    }),
    prisma.agentRun.findFirst({
      where: { userId: user.id, agentType: 'SKILL_ASSESSMENT', success: true },
      orderBy: { createdAt: 'desc' },
      select: { outputJson: true },
    }),
    prisma.agentRun.findFirst({
      where: { userId: user.id, agentType: 'OPPORTUNITY_DISCOVERY', success: true },
      orderBy: { createdAt: 'desc' },
      select: { outputJson: true },
    }),
    prisma.agentRun.findFirst({
      where: { userId: user.id, agentType: 'OFFER_BUILDER', success: true },
      orderBy: { createdAt: 'desc' },
      select: { outputJson: true },
    }),
  ])

  return NextResponse.json({
    profile:       { profession: userCtx?.profession ?? null },
    skills:        skillRun?.outputJson ?? null,
    opportunities: oppRun?.outputJson   ?? null,
    offer:         offerRun?.outputJson  ?? null,
  })
})
