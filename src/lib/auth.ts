import { createSupabaseServerClient } from '@/lib/supabase/server'
import { verifySessionJwt, SESSION_COOKIE } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'
import { Plan, PlatformRole } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { PLAN_LIMITS, TRIAL_DAYS } from '@/lib/constants'
import { getISTDateKey } from '@/lib/utils'

export type AuthUser = {
  id: string
  email: string
  role: PlatformRole
  plan: Plan
  trialDaysRemaining: number | null
}

async function resolveDbUser(email: string): Promise<AuthUser | null> {
  const dbUser = await prisma.user.findUnique({
    where: { email },
    include: { subscription: true },
  })
  if (!dbUser) return null

  let trialDaysRemaining: number | null = null
  if (dbUser.plan === 'TRIAL' && dbUser.subscription?.trialEndsAt) {
    const diff = dbUser.subscription.trialEndsAt.getTime() - Date.now()
    trialDaysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }

  await prisma.user.update({
    where: { id: dbUser.id },
    data: { lastActiveAt: new Date() },
  })

  return { id: dbUser.id, email: dbUser.email, role: dbUser.role, plan: dbUser.plan, trialDaysRemaining }
}

export async function getAuthUser(): Promise<AuthUser | null> {
  // ── Local JWT takes priority — always checked first ───────────────────────
  try {
    const cookieStore = cookies()
    const token = cookieStore.get(SESSION_COOKIE)?.value
    if (token) {
      const payload = await verifySessionJwt(token)
      if (payload?.email) return resolveDbUser(payload.email)
    }
  } catch {
    // fall through to Supabase
  }

  // ── No local session: try Supabase if configured ──────────────────────────
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      const supabase = createSupabaseServerClient()
      if (!supabase) return null
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.email) return null
      return resolveDbUser(user.email)
    } catch {
      return null
    }
  }

  return null
}

// ─── Entitlement guard ────────────────────────────────────────────────────────

export function isSuperAdmin(user: AuthUser) {
  return user.role === 'SUPER_ADMIN'
}

export function canGenerate(user: AuthUser): boolean {
  if (user.role === 'SUPER_ADMIN') return true
  if (user.plan === 'FREE') return false
  return true
}

export async function checkUsageLimit(userId: string, plan: Plan): Promise<boolean> {
  if (plan === 'FREE') return false

  const limit = PLAN_LIMITS[plan].aiOutputsPerDay
  if (limit >= 9999) return true

  const dateKey = getISTDateKey()
  const usage = await prisma.dailyUsage.findUnique({
    where: { userId_dateIST: { userId, dateIST: dateKey } },
  })

  return (usage?.aiOutputs ?? 0) < limit
}

export async function incrementUsage(userId: string): Promise<void> {
  const dateKey = getISTDateKey()
  await prisma.dailyUsage.upsert({
    where: { userId_dateIST: { userId, dateIST: dateKey } },
    update: { aiOutputs: { increment: 1 } },
    create: { userId, dateIST: dateKey, aiOutputs: 1 },
  })
}

// ─── Route handler helpers ────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RouteHandler = (req: NextRequest, user: AuthUser, ctx?: any) => Promise<NextResponse>

export function withAuth(handler: RouteHandler) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async (req: NextRequest, ctx?: any) => {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 })
    }
    return handler(req, user, ctx)
  }
}

export function withAdminAuth(handler: RouteHandler) {
  return withAuth(async (req, user, ctx) => {
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Admin access required' } }, { status: 403 })
    }
    return handler(req, user, ctx)
  })
}

export function withSuperAdminAuth(handler: RouteHandler) {
  return withAuth(async (req, user, ctx) => {
    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Super admin access required' } }, { status: 403 })
    }
    return handler(req, user, ctx)
  })
}

export function withGenerationAccess(handler: RouteHandler) {
  return withAuth(async (req, user, ctx) => {
    if (!canGenerate(user)) {
      return NextResponse.json(
        { error: { code: 'FREE_LOCKED', message: 'Upgrade to generate', upgradeTrigger: 'PLAN_UPGRADE' } },
        { status: 403 },
      )
    }
    return handler(req, user, ctx)
  })
}
