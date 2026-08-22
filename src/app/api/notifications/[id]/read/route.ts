import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const POST = withAuth(async (_req, user, ctx) => {
  const id: string = ctx?.params?.id ?? ''
  const updated = await prisma.notificationCampaign.updateMany({
    where: { id, userId: user.id, read: false },
    data: { read: true },
  })
  return NextResponse.json({ updated: updated.count })
})
