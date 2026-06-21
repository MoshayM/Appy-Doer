import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const POST = withAuth(async (_req, user) => {
  const sub = await prisma.subscription.findFirst({
    where: { userId: user.id, status: { in: ['ACTIVE', 'TRIALING'] } },
  })
  if (!sub) return NextResponse.json({ error: { code: 'NO_ACTIVE_SUB' } }, { status: 404 })

  await prisma.subscription.update({
    where: { id: sub.id },
    data: { status: 'CANCELED' },
  })

  await prisma.user.update({ where: { id: user.id }, data: { plan: 'FREE' } })

  return NextResponse.json({ ok: true })
})
