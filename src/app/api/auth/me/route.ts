import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getISTDateKey } from '@/lib/utils'
import { PLAN_LIMITS } from '@/lib/constants'

export async function GET() {
  const user = await getAuthUser()
  if (!user) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 })
  }

  const [sub, usage] = await Promise.all([
    prisma.subscription.findUnique({ where: { userId: user.id } }),
    prisma.dailyUsage.findUnique({
      where: { userId_dateIST: { userId: user.id, dateIST: getISTDateKey() } },
    }),
  ])

  const limit = PLAN_LIMITS[user.plan].aiOutputsPerDay
  const used  = usage?.aiOutputs ?? 0
  const remaining = user.role === 'SUPER_ADMIN' ? 9999 : Math.max(0, limit - used)

  return NextResponse.json({
    id: user.id,
    email: user.email,
    role: user.role,
    plan: user.plan,
    trialDaysRemaining: user.trialDaysRemaining,
    trialEndsAt: sub?.trialEndsAt,
    subscriptionStatus: sub?.status,
    entitlements: {
      canGenerate: user.plan !== 'FREE' || user.role === 'SUPER_ADMIN',
      aiOutputsRemaining: remaining,
      aiOutputsLimit: limit,
    },
  })
}
