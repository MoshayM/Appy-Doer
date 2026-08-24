import { NextRequest, NextResponse } from 'next/server'
import { withSuperAdminAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const PATCH = withSuperAdminAuth(async (req: NextRequest, _user, ctx) => {
  const key   = decodeURIComponent(ctx?.params?.key as string ?? '')
  const { value } = await req.json() as { value: unknown }

  if (!key) return NextResponse.json({ error: { code: 'INVALID_INPUT', message: 'Key required' } }, { status: 400 })

  const flag = await prisma.featureFlag.findUnique({ where: { key } })
  if (!flag) return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Flag not found' } }, { status: 404 })

  const updated = await prisma.featureFlag.update({
    where: { key },
    data:  { value: value as never },
  })

  return NextResponse.json({ key: updated.key, value: updated.value, updatedAt: updated.updatedAt })
})
