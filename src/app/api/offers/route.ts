import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const GET = withAuth(async (_req, user) => {
  const offers = await prisma.offer.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(offers)
})

export const POST = withAuth(async (req, user) => {
  const { name, detail } = await req.json()
  if (!name) return NextResponse.json({ error: { code: 'INVALID_INPUT' } }, { status: 400 })

  const offer = await prisma.offer.create({ data: { userId: user.id, name, detail } })
  return NextResponse.json(offer, { status: 201 })
})
