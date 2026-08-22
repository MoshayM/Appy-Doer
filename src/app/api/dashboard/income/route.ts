import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const GET = withAuth(async (_req, user) => {
  const [leads, milestones, agentRuns, subscription] = await Promise.all([
    prisma.lead.findMany({ where: { userId: user.id }, select: { stage: true, lastActivityAt: true } }),
    prisma.revenueMilestone.findMany({ where: { userId: user.id }, orderBy: { achievedAt: 'asc' } }),
    prisma.agentRun.count({ where: { userId: user.id } }),
    prisma.subscription.findUnique({ where: { userId: user.id } }),
  ])

  const won   = leads.filter(l => l.stage === 'WON').length
  const total = leads.length
  const active = leads.filter(l => !['WON', 'LOST'].includes(l.stage)).length
  const conversionRate = total > 0 ? Math.round((won / total) * 100) : 0

  return NextResponse.json({
    overview: {
      totalLeads: total,
      wonLeads: won,
      activePipeline: active,
      conversionRate,
      totalAgentRuns: agentRuns,
    },
    milestones,
    subscription: subscription
      ? { plan: subscription.plan, status: subscription.status, trialEndsAt: subscription.trialEndsAt }
      : null,
    firstIncomeAchieved: milestones.some(m => m.isFirstIncome),
  })
})
