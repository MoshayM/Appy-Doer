import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const POST = withAuth(async (_req, user, ctx) => {
  const id: string = ctx?.params?.id ?? ''
  // Mark as shown (seen/dismissed without accepting)
  const updated = await prisma.subscriptionOffer.updateMany({
    where: { id, userId: user.id, accepted: false },
    data: { shown: true },
  })
  return NextResponse.json({ updated: updated.count })
})
