import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const DELETE = withAuth(async (_req, user, ctx) => {
  const id: string = ctx?.params?.id ?? ''

  const ws = await prisma.projectWorkspace.findFirst({
    where: { id, userId: user.id },
  })
  if (!ws) return NextResponse.json({ error: { code: 'NOT_FOUND' } }, { status: 404 })

  await prisma.projectWorkspace.delete({ where: { id } })
  return NextResponse.json({ success: true })
})
