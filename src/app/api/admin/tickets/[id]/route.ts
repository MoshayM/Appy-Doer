import { NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NotificationService } from '@/lib/services/notification'

export const PATCH = withAdminAuth(async (req, _user, { params }: { params: { id: string } }) => {
  const { id } = params
  const body = await req.json()
  const { status, resolution } = body

  const validStatuses = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: { code: 'VALIDATION', message: 'Invalid status' } }, { status: 400 })
  }

  const existing = await prisma.supportTicket.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Ticket not found' } }, { status: 404 })
  }

  const ticket = await prisma.supportTicket.update({
    where: { id },
    data: {
      status,
      resolution: resolution?.trim() || existing.resolution,
      resolvedAt: status === 'RESOLVED' ? new Date() : existing.resolvedAt,
    },
  })

  // Notify user of the status change
  NotificationService.notifyUserTicketUpdated(
    existing.userId,
    existing.title,
    status,
    resolution?.trim(),
  ).catch(() => { /* non-blocking */ })

  return NextResponse.json({ ticket })
})
