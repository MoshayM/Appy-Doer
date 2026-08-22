import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const GET = withAuth(async (_req: NextRequest, user, ctx) => {
  const id = ctx?.params?.id as string

  const thread = await prisma.emailThread.findFirst({
    where: { id, userId: user.id },
    include: {
      messages: { orderBy: { sentAt: 'asc' } },
    },
  })

  if (!thread) return NextResponse.json({ error: 'Thread not found' }, { status: 404 })

  // Mark as read — reset unread count
  if (thread.unreadCount > 0) {
    await prisma.emailThread.update({
      where: { id },
      data: { unreadCount: 0 },
    })
  }

  return NextResponse.json({ ...thread, unreadCount: 0 })
})

// PATCH — update status
export const PATCH = withAuth(async (req: NextRequest, user, ctx) => {
  const id     = ctx?.params?.id as string
  const { status } = await req.json()

  const thread = await prisma.emailThread.findFirst({ where: { id, userId: user.id } })
  if (!thread) return NextResponse.json({ error: 'Thread not found' }, { status: 404 })

  const updated = await prisma.emailThread.update({
    where: { id },
    data: { status, updatedAt: new Date() },
  })
  return NextResponse.json(updated)
})
