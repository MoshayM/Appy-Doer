import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const GET = withAuth(async (_req, user, ctx) => {
  const id: string = ctx?.params?.id ?? ''
  const ticket = await prisma.supportTicket.findFirst({
    where: { id, userId: user.id },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
        include: {
          attachments: {
            select: { id: true, filename: true, mimeType: true, sizeBytes: true },
          },
        },
      },
    },
  })
  if (!ticket) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  return NextResponse.json({ ticket })
})

export const DELETE = withAuth(async (_req, user, ctx) => {
  const id: string = ctx?.params?.id ?? ''
  const ticket = await prisma.supportTicket.findFirst({ where: { id, userId: user.id } })
  if (!ticket) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  await prisma.supportTicket.delete({ where: { id } })
  return NextResponse.json({ success: true })
})
