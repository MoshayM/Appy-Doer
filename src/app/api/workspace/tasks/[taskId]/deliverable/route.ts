import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const GET = withAuth(async (_req, user, ctx: any) => {
  try {
    const taskId: string = ctx?.params?.taskId ?? ''

    const task = await prisma.projectTask.findFirst({
      where: { id: taskId, workspace: { userId: user.id } },
      select: {
        id: true,
        title: true,
        status: true,
        output: true,
        workspace: {
          select: { id: true, title: true, leadId: true },
        },
      },
    })

    if (!task) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    if (!task.output) return NextResponse.json({ error: 'NO_DELIVERABLE' }, { status: 404 })

    // Pre-fill client details: Lead record is the primary source of truth
    let client = { email: '', name: '', threadSubject: '' }

    if (task.workspace.leadId) {
      // 1. Get name + contact directly from the Lead record
      const lead = await prisma.lead.findUnique({
        where: { id: task.workspace.leadId },
        select: { name: true, contact: true },
      })
      if (lead) {
        client.name  = lead.name
        client.email = lead.contact ?? ''
      }

      // 2. Get subject line from the most recent EmailThread linked to this lead
      const thread = await prisma.emailThread.findFirst({
        where: { leadId: task.workspace.leadId, userId: user.id },
        orderBy: { lastMessageAt: 'desc' },
        select: { contactEmail: true, contactName: true, subject: true },
      })
      if (thread) {
        client.threadSubject = thread.subject
        // Use thread email/name only if Lead had no contact info
        if (!client.email)  client.email = thread.contactEmail
        if (!client.name)   client.name  = thread.contactName ?? ''
      }
    }

    return NextResponse.json({
      taskId: task.id,
      taskTitle: task.title,
      taskStatus: task.status,
      workspaceTitle: task.workspace.title,
      workspaceId: task.workspace.id,
      result: task.output,
      client,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to load deliverable'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
})

// PATCH — save manually-edited deliverable sections
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const PATCH = withAuth(async (req: NextRequest, user, ctx: any) => {
  try {
    const taskId: string = ctx?.params?.taskId ?? ''
    const body = await req.json()

    const task = await prisma.projectTask.findFirst({
      where: { id: taskId, workspace: { userId: user.id } },
      select: { id: true, output: true },
    })
    if (!task) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

    // Merge edited deliverable into existing output
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing = (task.output as Record<string, any>) ?? {}
    const updated = {
      ...existing,
      deliverable: { ...(existing.deliverable ?? {}), ...body.deliverable },
      _revised: true,
      _manualEdit: true,
    }

    await prisma.projectTask.update({
      where: { id: taskId },
      data: { output: updated as unknown as Prisma.InputJsonValue },
    })

    return NextResponse.json({ ok: true, result: updated })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to save'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
})
