import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const GET = withAuth(async (_req, user) => {
  const offer = await prisma.subscriptionOffer.findFirst({
    where: {
      userId: user.id,
      accepted: false,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    orderBy: { createdAt: 'desc' },
    include: { campaign: { select: { name: true, type: true } } },
  })

  if (!offer) return NextResponse.json(null)

  // Mark as shown
  if (!offer.shown) {
    await prisma.subscriptionOffer.update({ where: { id: offer.id }, data: { shown: true } })
  }

  return NextResponse.json(offer)
})
