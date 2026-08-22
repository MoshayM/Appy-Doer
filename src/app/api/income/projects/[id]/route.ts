import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function commissionTier(tokens: number): { rate: number; tier: string } {
  if (tokens >= 20000) return { rate: 0.07, tier: 'PREMIUM' }
  if (tokens >= 5000)  return { rate: 0.05, tier: 'STANDARD' }
  return { rate: 0.03, tier: 'BASIC' }
}

export const PATCH = withAuth(async (req: NextRequest, user, ctx) => {
  const id = ctx?.params?.id as string
  const { receivedAmount, agreedAmount, projectTitle, clientName, dueDate, notes } = await req.json()

  const existing = await prisma.projectIncome.findFirst({ where: { id, userId: user.id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const newReceived = receivedAmount != null ? Number(receivedAmount) : existing.receivedAmount
  const newAgreed   = agreedAmount   != null ? Number(agreedAmount)   : existing.agreedAmount

  // Recalculate commission based on new received amount
  const runs = await prisma.agentRun.aggregate({
    where: { userId: user.id, ...(existing.workspaceId ? { workspaceId: existing.workspaceId } : {}) },
    _sum:  { inputTokens: true, outputTokens: true },
  })
  const tokensConsumed   = Math.min(
    (runs._sum.inputTokens ?? 0) + (runs._sum.outputTokens ?? 0), 30000
  )
  const { rate, tier }   = commissionTier(tokensConsumed)
  const commissionAmount = Math.round(newReceived * rate)

  const [income] = await prisma.$transaction([
    prisma.projectIncome.update({
      where: { id },
      data: {
        receivedAmount: newReceived,
        agreedAmount:   newAgreed,
        ...(projectTitle != null && { projectTitle }),
        ...(clientName   != null && { clientName }),
        ...(dueDate      != null && { dueDate: new Date(dueDate) }),
        ...(notes        != null && { notes }),
      },
      include: { commissions: { orderBy: { createdAt: 'desc' }, take: 1 } },
    }),
    prisma.platformCommission.updateMany({
      where: { projectIncomeId: id },
      data:  { commissionRate: rate, commissionAmount, tokensConsumed, tier, status: commissionAmount > 0 ? 'CREDITED' : 'PENDING' },
    }),
  ])

  return NextResponse.json(income)
})

export const DELETE = withAuth(async (_req, user, ctx) => {
  const id = ctx?.params?.id as string
  await prisma.projectIncome.deleteMany({ where: { id, userId: user.id } })
  return NextResponse.json({ success: true })
})
