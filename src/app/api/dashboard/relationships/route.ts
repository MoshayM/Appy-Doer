import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const GET = withAuth(async (_req, user) => {
  const clients = await prisma.clientProfile.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: 'asc' },
    take: 10,
    select: {
      id: true,
      companyName: true,
      temperature: true,
      lead: { select: { name: true } },
      relationship: { select: { lastContactAt: true } },
    },
  })

  const now = new Date()
  const mapped = clients.map(c => ({
    id: c.id,
    name: c.lead?.name ?? c.companyName,
    company: c.companyName,
    temperature: c.temperature,
    lastContactedAt: c.relationship?.lastContactAt ?? null,
  }))

  const dueForFollowup = mapped.filter(c => {
    if (!c.lastContactedAt) return true
    const daysSince = (now.getTime() - new Date(c.lastContactedAt).getTime()) / 86400000
    return daysSince > 14
  })

  return NextResponse.json({ clients: mapped, dueForFollowup })
})
