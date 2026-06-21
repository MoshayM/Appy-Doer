import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const GET = withAuth(async (_req, user) => {
  const [roadmap, agentRuns] = await Promise.all([
    prisma.opportunityRoadmap.findFirst({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } }),
    prisma.agentRun.findMany({
      where: { userId: user.id, agentType: 'OPPORTUNITY_DISCOVERY', success: true },
      orderBy: { createdAt: 'desc' },
      take: 1,
      select: { outputJson: true, createdAt: true },
    }),
  ])
  return NextResponse.json({ roadmap, latestRun: agentRuns[0] ?? null })
})
