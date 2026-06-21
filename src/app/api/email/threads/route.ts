import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const GET = withAuth(async (_req, user) => {
  const threads = await prisma.emailThread.findMany({
    where: { userId: user.id },
    orderBy: { lastMessageAt: 'desc' },
    take: 100,
    include: {
      messages: {
        orderBy: { sentAt: 'desc' },
        take: 1,
        select: { fromName: true, fromEmail: true, bodyText: true, isInbound: true, sentAt: true },
      },
    },
  })
  return NextResponse.json(threads)
})
