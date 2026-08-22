import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const DELETE = withAuth(async (_req: NextRequest, user, ctx) => {
  const id = ctx?.params?.id as string
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const track = await prisma.emailTrack.findFirst({ where: { id, userId: user.id } })
  if (!track) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.emailTrack.delete({ where: { id } })
  return NextResponse.json({ deleted: true })
})
