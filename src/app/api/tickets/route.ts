import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NotificationService } from '@/lib/services/notification'
import { logActivity } from '@/lib/activity'

export const POST = withAuth(async (req, user) => {
  const body = await req.json()
  const { title, description, priority = 'MEDIUM', workflowContext } = body

  if (!title?.trim() || !description?.trim()) {
    return NextResponse.json({ error: { code: 'VALIDATION', message: 'Title and description are required' } }, { status: 400 })
  }

  const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
  if (!validPriorities.includes(priority)) {
    return NextResponse.json({ error: { code: 'VALIDATION', message: 'Invalid priority' } }, { status: 400 })
  }

  const ticket = await prisma.supportTicket.create({
    data: {
      userId: user.id,
      title: title.trim(),
      description: description.trim(),
      priority,
      workflowContext: workflowContext?.trim() || null,
    },
  })

  const userRecord = await prisma.user.findUnique({ where: { id: user.id }, select: { name: true, email: true } })

  // Non-blocking admin notification
  NotificationService.notifyAdminsOfNewTicket(
    ticket.id,
    ticket.title,
    userRecord?.name ?? '',
    userRecord?.email ?? user.email,
    priority,
  ).catch(() => { /* non-blocking */ })

  await logActivity(user.id, user.role, 'TICKET_RAISED', { ticketId: ticket.id, title: ticket.title })

  return NextResponse.json({ ticket }, { status: 201 })
})

export const GET = withAuth(async (req, user) => {
  const url    = new URL(req.url)
  const status = url.searchParams.get('status')

  const tickets = await prisma.supportTicket.findMany({
    where: {
      userId: user.id,
      ...(status ? { status: status as never } : {}),
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ tickets })
})
