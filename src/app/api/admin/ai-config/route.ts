import { NextRequest, NextResponse } from 'next/server'
import { withSuperAdminAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AgentType } from '@prisma/client'
import { DEFAULT_TOKEN_BUDGETS, PRIMARY_MODEL, FALLBACK_MODEL } from '@/lib/constants'

export const GET = withSuperAdminAuth(async () => {
  const configs = await prisma.agentConfig.findMany({ orderBy: { agentType: 'asc' } })

  // Fill missing configs with defaults for display
  const allTypes = Object.keys(DEFAULT_TOKEN_BUDGETS) as AgentType[]
  const configMap = Object.fromEntries(configs.map(c => [c.agentType, c]))

  const result = allTypes.map(agentType => ({
    agentType,
    model:           configMap[agentType]?.model           ?? PRIMARY_MODEL,
    fallbackModel:   configMap[agentType]?.fallbackModel   ?? FALLBACK_MODEL,
    maxInputTokens:  configMap[agentType]?.maxInputTokens  ?? DEFAULT_TOKEN_BUDGETS[agentType].input,
    maxOutputTokens: configMap[agentType]?.maxOutputTokens ?? DEFAULT_TOKEN_BUDGETS[agentType].output,
    systemPrompt:    configMap[agentType]?.systemPrompt    ?? '',
    enabled:         configMap[agentType]?.enabled         ?? true,
  }))

  return NextResponse.json(result)
})

export const PUT = withSuperAdminAuth(async (req) => {
  const body = await req.json()
  const { agentType, model, fallbackModel, maxInputTokens, maxOutputTokens, systemPrompt, enabled } = body

  const config = await prisma.agentConfig.upsert({
    where: { agentType },
    update: { model, fallbackModel, maxInputTokens, maxOutputTokens, systemPrompt, enabled },
    create: { agentType, model, fallbackModel, maxInputTokens, maxOutputTokens, systemPrompt, enabled },
  })

  return NextResponse.json(config)
})
