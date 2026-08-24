import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const GET = withAuth(async (_req, user) => {
  // Only show threads that originated from a cold email sent via the app
  const tracks = await prisma.emailTrack.findMany({
    where: { userId: user.id, gmailThreadId: { not: null } },
    select: { gmailThreadId: true },
  })
  const trackedIds = tracks.map(t => t.gmailThreadId).filter(Boolean) as string[]

  if (!trackedIds.length) return NextResponse.json([])

  const threads = await prisma.emailThread.findMany({
    where: { userId: user.id, gmailThreadId: { in: trackedIds } },
    orderBy: { lastMessageAt: 'desc' },
    take: 100,
    select: {
      id: true, gmailThreadId: true, leadId: true,
      contactEmail: true, contactName: true, subject: true,
      status: true, lastMessageAt: true, unreadCount: true,
      aiInsight: true, aiIntent: true,
      messages: {
        orderBy: { sentAt: 'desc' },
        take: 1,
        select: { fromName: true, fromEmail: true, bodyText: true, isInbound: true, sentAt: true },
      },
    },
  })
  return NextResponse.json(threads)
})
