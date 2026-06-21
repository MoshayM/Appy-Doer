import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// SSE endpoint — inline auth because we must return raw Response, not NextResponse
export async function GET(_req: NextRequest) {
  const user = await getAuthUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId  = user.id
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      let lastCheck = new Date()
      let closed    = false

      const send = (data: unknown) => {
        if (closed) return
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        } catch {
          closed = true
        }
      }

      // Send initial unread count
      const initial = await prisma.notificationCampaign.count({
        where: { userId, channel: 'IN_APP', read: false },
      })
      send({ type: 'count', unread: initial })

      // Poll every 10 s for new notifications
      const interval = setInterval(async () => {
        if (closed) { clearInterval(interval); return }
        try {
          const newNotifs = await prisma.notificationCampaign.findMany({
            where:   { userId, channel: 'IN_APP', createdAt: { gt: lastCheck } },
            orderBy: { createdAt: 'desc' },
            take:    5,
            select:  { id: true, type: true, title: true, body: true, meta: true, createdAt: true },
          })
          if (newNotifs.length > 0) {
            const unread = await prisma.notificationCampaign.count({
              where: { userId, channel: 'IN_APP', read: false },
            })
            send({ type: 'notifications', notifications: newNotifs, unread })
            lastCheck = new Date()
          }
        } catch {
          closed = true
          clearInterval(interval)
        }
      }, 10_000)

      // Heartbeat every 25 s to keep connection alive
      const heartbeat = setInterval(() => {
        if (closed) { clearInterval(heartbeat); return }
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`))
        } catch {
          closed = true
          clearInterval(heartbeat)
        }
      }, 25_000)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type':      'text/event-stream',
      'Cache-Control':     'no-cache, no-transform',
      'Connection':        'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
