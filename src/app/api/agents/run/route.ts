import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { runAgent } from '@/lib/services/agent-runner'
import { AgentType } from '@prisma/client'
import { logActivity } from '@/lib/activity'
import {
  SkillAssessmentSchema, OpportunityDiscoverySchema, OfferBuilderSchema,
  PortfolioBuilderSchema, ProfileIntelligenceSchema, ClientIntelligenceSchema,
  ClientDiscoverySchema, ClientAcquisitionSchema, RelationshipSuccessSchema, WorkSupportSchema,
  ReplyIntelligenceSchema,
} from '@/lib/services/agent-schemas'
import { z } from 'zod'

const agentSchemas: Partial<Record<AgentType, z.ZodTypeAny>> = {
  SKILL_ASSESSMENT:       SkillAssessmentSchema,
  OPPORTUNITY_DISCOVERY:  OpportunityDiscoverySchema,
  OFFER_BUILDER:          OfferBuilderSchema,
  PORTFOLIO_BUILDER:      PortfolioBuilderSchema,
  PROFILE_INTELLIGENCE:   ProfileIntelligenceSchema,
  CLIENT_INTELLIGENCE:    ClientIntelligenceSchema,
  CLIENT_DISCOVERY:       ClientDiscoverySchema,
  CLIENT_ACQUISITION:     ClientAcquisitionSchema,
  RELATIONSHIP_SUCCESS:   RelationshipSuccessSchema,
  WORK_SUPPORT:           WorkSupportSchema,
  REPLY_INTELLIGENCE:     ReplyIntelligenceSchema,
}

export const POST = withAuth(async (req, user) => {
  try {
    const body = await req.json()
    const { agentType, userPrompt, workspaceId } = body as {
      agentType: AgentType
      userPrompt?: string
      workspaceId?: string
    }

    const schema = agentSchemas[agentType]
    if (!schema) {
      return NextResponse.json(
        { error: { code: 'UNKNOWN_AGENT', message: `Agent type ${agentType} not available` } },
        { status: 400 },
      )
    }

    const result = await runAgent({
      userId: user.id,
      role: user.role,
      plan: user.plan,
      agentType,
      userPrompt,
      workspaceId,
      schema,
    })

    await logActivity(user.id, user.role, agentType, { workspaceId })

    return NextResponse.json(result)
  } catch (err: unknown) {
    const e = err as { code?: string; message?: string; status?: number; upgradeTrigger?: string }
    if (e.code) {
      return NextResponse.json(
        { error: { code: e.code, message: e.message, upgradeTrigger: e.upgradeTrigger } },
        { status: e.status ?? 400 },
      )
    }
    console.error('[agents/run]', err)
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: 'Agent run failed' } }, { status: 500 })
  }
})
