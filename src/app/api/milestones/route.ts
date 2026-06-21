import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const GET = withAuth(async (_req, user) => {
  const milestones = await prisma.revenueMilestone.findMany({
    where: { userId: user.id },
    orderBy: { achievedAt: 'desc' },
  })
  return NextResponse.json(milestones)
})
