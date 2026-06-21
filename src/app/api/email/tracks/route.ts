import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const GET = withAuth(async (_req, user) => {
  const tracks = await prisma.emailTrack.findMany({
    where:   { userId: user.id },
    orderBy: { sentAt: 'desc' },
    take:    50,
    select: {
      id: true, trackingId: true, recipientEmail: true, subject: true,
      sentVia: true, sentAt: true, openedAt: true, openCount: true,
      repliedAt: true, leadId: true, gmailThreadId: true,
    },
  })

  const gmailIds = tracks.map(t => t.gmailThreadId).filter(Boolean) as string[]
  let threads: { id: string; gmailThreadId: string }[] = []
  try {
    if (gmailIds.length) {
      threads = await prisma.emailThread.findMany({
        where:  { userId: user.id, gmailThreadId: { in: gmailIds } },
        select: { id: true, gmailThreadId: true },
      })
    }
  } catch { /* EmailThread table may not be available yet */ }
  const threadMap = new Map(threads.map(t => [t.gmailThreadId, t.id]))

  return NextResponse.json(
    tracks.map(({ gmailThreadId, ...rest }) => ({
      ...rest,
      emailThreadId: gmailThreadId ? (threadMap.get(gmailThreadId) ?? null) : null,
    }))
  )
})
