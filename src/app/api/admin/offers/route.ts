import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const GET = withAdminAuth(async () => {
  const campaigns = await prisma.offerCampaign.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { offers: true } } },
  })
  return NextResponse.json(campaigns)
})

export const POST = withAdminAuth(async (req) => {
  const body = await req.json()
  const { name, type, description, rules, minDiscountPct, maxDiscountPct, startsAt, endsAt } = body

  const campaign = await prisma.offerCampaign.create({
    data: { name, type, description, rules, minDiscountPct, maxDiscountPct, startsAt, endsAt },
  })
  return NextResponse.json(campaign, { status: 201 })
})

export const PUT = withAdminAuth(async (req) => {
  const body = await req.json()
  const { id, active, ...rest } = body

  const campaign = await prisma.offerCampaign.update({
    where: { id },
    data: { active, ...rest },
  })
  return NextResponse.json(campaign)
})
