import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const GET = withAuth(async (req: NextRequest, user) => {
  const url   = new URL(req.url)
  const limit = parseInt(url.searchParams.get('limit') ?? '20', 10)

  const CLIENT_TYPES = ['REPLY_RECEIVED', 'RELATIONSHIP_REMINDER']

  const notifications = await prisma.notificationCampaign.findMany({
    where:   { userId: user.id, channel: 'IN_APP', type: { in: CLIENT_TYPES } },
    orderBy: { createdAt: 'desc' },
    take:    limit,
    select:  { id: true, type: true, title: true, body: true, read: true, meta: true, createdAt: true },
  })

  const unread = await prisma.notificationCampaign.count({
    where: { userId: user.id, channel: 'IN_APP', read: false, type: { in: CLIENT_TYPES } },
  })

  return NextResponse.json({ notifications, unread })
})

export const PATCH = withAuth(async (req: NextRequest, user) => {
  const { ids, markAllRead } = await req.json() as { ids?: string[]; markAllRead?: boolean }

  const CLIENT_TYPES = ['REPLY_RECEIVED', 'RELATIONSHIP_REMINDER']

  if (markAllRead) {
    await prisma.notificationCampaign.updateMany({
      where: { userId: user.id, channel: 'IN_APP', read: false, type: { in: CLIENT_TYPES } },
      data:  { read: true },
    })
    return NextResponse.json({ success: true })
  }

  if (ids?.length) {
    await prisma.notificationCampaign.updateMany({
      where: { userId: user.id, id: { in: ids } },
      data:  { read: true },
    })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Provide ids or markAllRead' }, { status: 400 })
})
