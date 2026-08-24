import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const GET = withAuth(async (_req, user, ctx) => {
  const attachId: string = ctx?.params?.attachId ?? ''

  const attachment = await prisma.ticketAttachment.findUnique({
    where: { id: attachId },
    include: {
      message: {
        include: {
          ticket: { select: { userId: true } },
        },
      },
    },
  })

  if (!attachment || attachment.message.ticket.userId !== user.id) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  }

  const buffer = Buffer.from(attachment.dataBase64, 'base64')
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': attachment.mimeType,
      'Content-Disposition': `inline; filename="${attachment.filename}"`,
      'Content-Length': String(buffer.byteLength),
    },
  })
})
