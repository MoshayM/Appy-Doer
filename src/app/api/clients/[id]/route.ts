import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ClientTemperature } from '@prisma/client'

export const GET = withAuth(async (_req, user, ctx) => {
  const id: string = ctx?.params?.id ?? ''
  const client = await prisma.clientProfile.findFirst({
    where: { id, userId: user.id },
    include: {
      insights: { orderBy: { createdAt: 'desc' }, take: 5 },
      lead: { select: { name: true, contact: true } },
      relationship: true,
    },
  })
  if (!client) return NextResponse.json({ error: { code: 'NOT_FOUND' } }, { status: 404 })
  return NextResponse.json(client)
})

export const PATCH = withAuth(async (req, user, ctx) => {
  const id: string = ctx?.params?.id ?? ''
  const body = await req.json()
  const updated = await prisma.clientProfile.updateMany({
    where: { id, userId: user.id },
    data: {
      ...(body.temperature && { temperature: body.temperature as ClientTemperature }),
      ...(body.companyName && { companyName: body.companyName }),
    },
  })
  return NextResponse.json({ updated: updated.count })
})

export const DELETE = withAuth(async (_req, user, ctx) => {
  const id: string = ctx?.params?.id ?? ''
  await prisma.clientProfile.deleteMany({ where: { id, userId: user.id } })
  return NextResponse.json({ deleted: true })
})
