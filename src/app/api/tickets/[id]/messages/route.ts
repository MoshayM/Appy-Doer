import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const GET = withAuth(async (_req, user, ctx) => {
  const ticketId: string = ctx?.params?.id ?? ''
  const ticket = await prisma.supportTicket.findFirst({ where: { id: ticketId, userId: user.id } })
  if (!ticket) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

  const messages = await prisma.ticketMessage.findMany({
    where: { ticketId },
    orderBy: { createdAt: 'asc' },
    include: {
      attachments: {
        select: { id: true, filename: true, mimeType: true, sizeBytes: true },
      },
    },
  })
  return NextResponse.json({ messages })
})

export const POST = withAuth(async (req, user, ctx) => {
  const ticketId: string = ctx?.params?.id ?? ''
  const ticket = await prisma.supportTicket.findFirst({ where: { id: ticketId, userId: user.id } })
  if (!ticket) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

  const body = await req.json()
  const { text = '', attachments = [] } = body

  if (!text.trim() && attachments.length === 0) {
    return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 })
  }

  const userRecord = await prisma.user.findUnique({
    where: { id: user.id }, select: { name: true, email: true },
  })
  const senderName = userRecord?.name || userRecord?.email || 'User'

  const message = await prisma.ticketMessage.create({
    data: {
      ticketId,
      senderRole: 'USER',
      senderId: user.id,
      senderName,
      body: text.trim(),
      attachments: attachments.length > 0 ? {
        create: attachments.map((a: { filename: string; mimeType: string; sizeBytes: number; dataBase64: string }) => ({
          filename: a.filename,
          mimeType: a.mimeType,
          sizeBytes: a.sizeBytes,
          dataBase64: a.dataBase64,
        })),
      } : undefined,
    },
    include: {
      attachments: {
        select: { id: true, filename: true, mimeType: true, sizeBytes: true },
      },
    },
  })

  // Reopen ticket if it was resolved/closed
  if (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') {
    await prisma.supportTicket.update({ where: { id: ticketId }, data: { status: 'OPEN' } })
  }

  return NextResponse.json({ message }, { status: 201 })
})
