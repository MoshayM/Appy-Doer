import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PaymentService } from '@/lib/services/payment'

export const POST = withAuth(async (req, user, ctx) => {
  const id: string = ctx?.params?.id ?? ''
  const offer = await prisma.subscriptionOffer.findFirst({ where: { id, userId: user.id, accepted: false } })
  if (!offer) return NextResponse.json({ error: { code: 'NOT_FOUND' } }, { status: 404 })

  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { email: true } })
  if (!dbUser) return NextResponse.json({ error: { code: 'USER_NOT_FOUND' } }, { status: 404 })

  const result = await PaymentService.subscribe({
    userId: user.id,
    email: dbUser.email,
    plan: offer.plan,
    interval: offer.interval,
    gateway: 'RAZORPAY',
    offerId: id,
  })
  return NextResponse.json(result)
})
