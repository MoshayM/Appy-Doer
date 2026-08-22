import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const DELETE = withAuth(async (_req, user, ctx) => {
  const id: string = ctx?.params?.id ?? ''
  await prisma.notificationCampaign.deleteMany({
    where: { id, userId: user.id },
  })
  return NextResponse.json({ success: true })
})
