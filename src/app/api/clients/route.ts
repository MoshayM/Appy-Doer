import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const GET = withAuth(async (_req, user) => {
  const clients = await prisma.clientProfile.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      companyName: true,
      temperature: true,
      lead: { select: { name: true } },
      relationship: { select: { lastContactAt: true } },
    },
  })
  return NextResponse.json(clients.map(c => ({
    id: c.id,
    name: c.lead?.name ?? c.companyName,
    company: c.companyName,
    temperature: c.temperature,
    lastContactedAt: c.relationship?.lastContactAt ?? null,
  })))
})

export const POST = withAuth(async (req, user) => {
  const { companyName, leadId, industry, region } = await req.json()
  if (!companyName) return NextResponse.json({ error: { code: 'INVALID_INPUT' } }, { status: 400 })

  const client = await prisma.clientProfile.create({
    data: {
      userId: user.id,
      companyName,
      leadId: leadId ?? null,
      industry: industry ?? null,
      region: region ?? null,
      temperature: 'COLD',
      detail: {},
    },
  })
  return NextResponse.json(client, { status: 201 })
})
