import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const GET = withAuth(async (_req, user) => {
  const [context, latestRuns, sub, leads] = await Promise.all([
    prisma.userContext.findUnique({ where: { userId: user.id } }),
    prisma.agentRun.findMany({
      where: { userId: user.id, success: true },
      distinct: ['agentType'],
      orderBy: { createdAt: 'desc' },
      select: { agentType: true, createdAt: true },
    }),
    prisma.subscription.findFirst({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } }),
    prisma.lead.count({ where: { userId: user.id } }),
  ])

  const completedAgents = new Set(latestRuns.map(r => r.agentType))

  let nextAction = 'SKILL_ASSESSMENT'
  let nextRoute = '/dashboard/skills'

  if (completedAgents.has('SKILL_ASSESSMENT') && !completedAgents.has('OPPORTUNITY_DISCOVERY')) {
    nextAction = 'OPPORTUNITY_DISCOVERY'; nextRoute = '/dashboard/opportunities'
  } else if (completedAgents.has('OPPORTUNITY_DISCOVERY') && !completedAgents.has('OFFER_BUILDER')) {
    nextAction = 'OFFER_BUILDER'; nextRoute = '/dashboard/offers'
  } else if (completedAgents.has('OFFER_BUILDER') && !completedAgents.has('PORTFOLIO_BUILDER')) {
    nextAction = 'PORTFOLIO_BUILDER'; nextRoute = '/dashboard/portfolio'
  } else if (completedAgents.has('PORTFOLIO_BUILDER') && !completedAgents.has('PROFILE_INTELLIGENCE')) {
    nextAction = 'PROFILE_INTELLIGENCE'; nextRoute = '/dashboard/profile'
  } else if (completedAgents.has('PROFILE_INTELLIGENCE') && leads === 0) {
    nextAction = 'CLIENT_ACQUISITION'; nextRoute = '/dashboard/crm'
  } else if (leads > 0 && !completedAgents.has('CLIENT_INTELLIGENCE')) {
    nextAction = 'CLIENT_INTELLIGENCE'; nextRoute = '/dashboard/clients'
  } else if (completedAgents.has('CLIENT_INTELLIGENCE') && !completedAgents.has('RELATIONSHIP_SUCCESS')) {
    nextAction = 'RELATIONSHIP_SUCCESS'; nextRoute = '/dashboard/relationship'
  } else if (completedAgents.size >= 7) {
    nextAction = 'WORK_SUPPORT'; nextRoute = '/dashboard/workspace'
  }

  return NextResponse.json({
    completedAgents: Array.from(completedAgents),
    journeyProgress: Math.round((completedAgents.size / 9) * 100),
    nextAction,
    nextRoute,
    memoryVersion: context?.version ?? 0,
    subscriptionStatus: sub?.status ?? 'TRIALING',
    plan: user.plan,
  })
})
