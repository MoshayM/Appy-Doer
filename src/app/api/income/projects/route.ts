import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Commission tiers based on total AI tokens consumed for linked workspace/lead
function commissionTier(tokens: number): { rate: number; tier: string } {
  if (tokens >= 20000) return { rate: 0.07, tier: 'PREMIUM' }
  if (tokens >= 5000)  return { rate: 0.05, tier: 'STANDARD' }
  return { rate: 0.03, tier: 'BASIC' }
}

export const GET = withAuth(async (_req, user) => {
  const incomes = await prisma.projectIncome.findMany({
    where:   { userId: user.id },
    orderBy: { createdAt: 'desc' },
    include: { commissions: { orderBy: { createdAt: 'desc' }, take: 1 } },
  })

  const totalReceived = incomes.reduce((s, i) => s + i.receivedAmount, 0)
  const totalPending  = incomes.reduce((s, i) => s + Math.max(0, i.agreedAmount - i.receivedAmount), 0)
  const totalCommission = incomes.reduce((s, i) => s + (i.commissions[0]?.commissionAmount ?? 0), 0)

  return NextResponse.json({ incomes, summary: { totalReceived, totalPending, totalCommission } })
})

export const POST = withAuth(async (req: NextRequest, user) => {
  const { projectTitle, clientName, agreedAmount, receivedAmount, leadId, workspaceId, dueDate, notes } =
    await req.json()

  if (!projectTitle || agreedAmount == null)
    return NextResponse.json({ error: 'projectTitle and agreedAmount are required' }, { status: 400 })

  // Count tokens consumed for the linked workspace or user overall
  let tokensConsumed = 0
  if (workspaceId) {
    const runs = await prisma.agentRun.aggregate({
      where:  { userId: user.id, workspaceId },
      _sum:   { inputTokens: true, outputTokens: true },
    })
    tokensConsumed = (runs._sum.inputTokens ?? 0) + (runs._sum.outputTokens ?? 0)
  } else if (leadId) {
    const ws = await prisma.projectWorkspace.findFirst({ where: { userId: user.id, leadId } })
    if (ws) {
      const runs = await prisma.agentRun.aggregate({
        where: { userId: user.id, workspaceId: ws.id },
        _sum:  { inputTokens: true, outputTokens: true },
      })
      tokensConsumed = (runs._sum.inputTokens ?? 0) + (runs._sum.outputTokens ?? 0)
    }
  }
  if (tokensConsumed === 0) {
    // Fall back: count all agent runs for this user as a platform engagement proxy
    const runs = await prisma.agentRun.aggregate({
      where: { userId: user.id },
      _sum:  { inputTokens: true, outputTokens: true },
    })
    tokensConsumed = Math.min((runs._sum.inputTokens ?? 0) + (runs._sum.outputTokens ?? 0), 30000)
  }

  const { rate, tier } = commissionTier(tokensConsumed)
  const baseForCommission = Math.max(receivedAmount ?? 0, 0)
  const commissionAmount  = Math.round(baseForCommission * rate)

  const income = await prisma.projectIncome.create({
    data: {
      userId: user.id,
      projectTitle,
      clientName:    clientName ?? null,
      agreedAmount:  Number(agreedAmount),
      receivedAmount: Number(receivedAmount ?? 0),
      leadId:        leadId ?? null,
      workspaceId:   workspaceId ?? null,
      dueDate:       dueDate ? new Date(dueDate) : null,
      notes:         notes ?? null,
      commissions:   {
        create: {
          userId:          user.id,
          commissionRate:  rate,
          commissionAmount,
          tokensConsumed,
          tier,
          status:          commissionAmount > 0 ? 'CREDITED' : 'PENDING',
        },
      },
    },
    include: { commissions: true },
  })

  return NextResponse.json(income, { status: 201 })
})
