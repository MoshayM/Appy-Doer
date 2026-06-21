import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const AGENT_ORDER = [
  'SKILL_ASSESSMENT',
  'OPPORTUNITY_DISCOVERY',
  'OFFER_BUILDER',
  'PORTFOLIO_BUILDER',
  'PROFILE_INTELLIGENCE',
]

export const GET = withAuth(async (_req, user) => {
  const runs = await prisma.agentRun.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'asc' },
    select: { id: true, agentType: true, outputJson: true, createdAt: true, success: true },
  })

  interface SessionRun {
    id: string
    agentType: string
    outputJson: unknown
    createdAt: string
    success: boolean
  }

  interface AgentSession {
    id: string
    skillName: string
    startedAt: string
    runs: SessionRun[]
  }

  const sessions: AgentSession[] = []
  let currentSession: AgentSession | null = null

  for (const run of runs) {
    const runData: SessionRun = {
      id: run.id,
      agentType: run.agentType,
      outputJson: run.outputJson,
      createdAt: run.createdAt.toISOString(),
      success: run.success,
    }

    if (run.agentType === 'SKILL_ASSESSMENT') {
      if (currentSession) sessions.push(currentSession)
      const output = run.outputJson as Record<string, unknown> | null
      const skillName = (output?.classification as string | undefined) ?? 'Skill Assessment'
      currentSession = {
        id: run.id,
        skillName,
        startedAt: run.createdAt.toISOString(),
        runs: [runData],
      }
    } else if (currentSession) {
      currentSession.runs.push(runData)
    }
  }
  if (currentSession) sessions.push(currentSession)

  // Sort each session's runs in agent flow order
  for (const s of sessions) {
    s.runs.sort((a, b) => AGENT_ORDER.indexOf(a.agentType) - AGENT_ORDER.indexOf(b.agentType))
  }

  return NextResponse.json(sessions.reverse())
})
