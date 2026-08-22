import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getAuthUser } from '@/lib/auth'
import { verifySessionJwt, SESSION_COOKIE } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'
import { getISTDateKey } from '@/lib/utils'
import { PLAN_LIMITS } from '@/lib/constants'

export async function GET() {
  const user = await getAuthUser()
  if (!user) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 })
  }

  // Read authMethod from the JWT to detect Google OAuth sessions even when
  // the account also has a passwordHash (e.g. admin accounts seeded with passwords)
  const cookieStore = cookies()
  const rawToken = cookieStore.get(SESSION_COOKIE)?.value
  const jwtPayload = rawToken ? await verifySessionJwt(rawToken) : null
  const signedInWithGoogle = jwtPayload?.authMethod === 'google'

  const [sub, usage, dbUser] = await Promise.all([
    prisma.subscription.findUnique({ where: { userId: user.id } }),
    prisma.dailyUsage.findUnique({
      where: { userId_dateIST: { userId: user.id, dateIST: getISTDateKey() } },
    }),
    prisma.user.findUnique({ where: { id: user.id }, select: { passwordHash: true } }),
  ])

  const limit = PLAN_LIMITS[user.plan].aiOutputsPerDay
  const used  = usage?.aiOutputs ?? 0
  const remaining = user.role === 'SUPER_ADMIN' ? 9999 : Math.max(0, limit - used)

  return NextResponse.json({
    id: user.id,
    email: user.email,
    role: user.role,
    plan: user.plan,
    hasPassword: !signedInWithGoogle && !!dbUser?.passwordHash,
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
