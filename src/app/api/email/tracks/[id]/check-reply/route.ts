import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { syncGmailForUser } from '@/lib/services/gmail-sync'

const REPLIED_STATUSES = new Set(['REPLIED', 'INTERESTED', 'NEGOTIATING', 'WON'])

export const POST = withAuth(async (req: NextRequest, user, ctx) => {
  const trackId = ctx?.params?.id as string
  const track = await prisma.emailTrack.findFirst({ where: { id: trackId, userId: user.id } })
  if (!track) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (!track.gmailThreadId) {
    return NextResponse.json({ replied: false, reason: 'no_thread_id' })
  }

  try {
    await syncGmailForUser(user.id)

    const thread = await prisma.emailThread.findUnique({
      where: { userId_gmailThreadId: { userId: user.id, gmailThreadId: track.gmailThreadId } },
    })

    const hasReply = thread ? REPLIED_STATUSES.has(thread.status) : false

    await prisma.emailTrack.update({
      where: { id: trackId },
      data: {
        repliedAt:      hasReply && !track.repliedAt ? new Date() : undefined,
        replyCheckedAt: new Date(),
      },
    })

    return NextResponse.json({ replied: hasReply, threadId: thread?.id ?? null })
  } catch (err) {
    console.error('[check-reply]', err)
    return NextResponse.json({ replied: false, reason: 'sync_error' })
  }
})
