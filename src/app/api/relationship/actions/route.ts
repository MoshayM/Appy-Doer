import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const POST = withAuth(async (req, user) => {
  const { clientId, type } = await req.json()
  if (!clientId) return NextResponse.json({ error: { code: 'INVALID_INPUT' } }, { status: 400 })

  const client = await prisma.clientProfile.findFirst({ where: { id: clientId, userId: user.id } })
  if (!client) return NextResponse.json({ error: { code: 'NOT_FOUND' } }, { status: 404 })

  // Update the relationship's lastContactAt timestamp
  const rel = await prisma.clientRelationship.findFirst({ where: { clientProfileId: clientId } })
  if (rel) {
    await prisma.clientRelationship.update({
      where: { id: rel.id },
      data: { lastContactAt: new Date() },
    })
  }

  // Log the action in ActivityLog
  await prisma.activityLog.create({
    data: { userId: user.id, action: type ?? 'CONTACT', meta: { clientId } as never },
  })

  return NextResponse.json({ ok: true })
})
