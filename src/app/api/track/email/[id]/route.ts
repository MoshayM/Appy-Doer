import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const GIF = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64')

export async function GET(_req: NextRequest, ctx: { params: { id: string } }) {
  const trackingId = ctx.params.id
  try {
    const track = await prisma.emailTrack.findUnique({ where: { trackingId } })
    if (track) {
      const isFirstOpen = !track.openedAt
      await prisma.emailTrack.update({
        where: { trackingId },
        data: {
          openCount: { increment: 1 },
          openedAt:  track.openedAt ?? new Date(),
        },
      })
      // On first open, promote EmailThread status from SENT → OPENED
      if (isFirstOpen && track.gmailThreadId) {
        await prisma.emailThread.updateMany({
          where: { userId: track.userId, gmailThreadId: track.gmailThreadId, status: 'SENT' },
          data:  { status: 'OPENED' },
        }).catch(() => {})
      }
    }
  } catch { /* non-critical */ }

  return new NextResponse(GIF, {
    headers: {
      'Content-Type':  'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma':        'no-cache',
    },
  })
}
