import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const PATCH = withAuth(async (req: NextRequest, user, ctx: any) => {
  const taskId: string = ctx?.params?.taskId ?? ''
  const body = await req.json()

  const task = await prisma.projectTask.findFirst({
    where: { id: taskId, workspace: { userId: user.id } },
  })
  if (!task) return NextResponse.json({ error: { code: 'NOT_FOUND' } }, { status: 404 })

  const updated = await prisma.projectTask.update({
    where: { id: taskId },
    data: {
      ...(body.status && { status: body.status }),
      ...(body.output !== undefined && { output: body.output as Prisma.InputJsonValue }),
      ...(body.title  && { title:  body.title }),
    },
  })
  return NextResponse.json(updated)
})

export const DELETE = withAuth(async (_req, user, ctx) => {
  const taskId: string = ctx?.params?.taskId ?? ''

  const task = await prisma.projectTask.findFirst({
    where: { id: taskId, workspace: { userId: user.id } },
  })
  if (!task) return NextResponse.json({ error: { code: 'NOT_FOUND' } }, { status: 404 })

  await prisma.projectTask.delete({ where: { id: taskId } })
  return NextResponse.json({ success: true })
})
