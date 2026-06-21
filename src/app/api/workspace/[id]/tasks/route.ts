import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const GET = withAuth(async (_req, user, ctx) => {
  const id: string = ctx?.params?.id ?? ''
  const tasks = await prisma.projectTask.findMany({
    where: { workspaceId: id, workspace: { userId: user.id } },
    orderBy: { orderIndex: 'asc' },
  })
  return NextResponse.json(tasks)
})

export const POST = withAuth(async (req, user, ctx) => {
  const id: string = ctx?.params?.id ?? ''
  const { title, description } = await req.json()
  if (!title) return NextResponse.json({ error: { code: 'INVALID_INPUT' } }, { status: 400 })

  const ws = await prisma.projectWorkspace.findFirst({ where: { id, userId: user.id } })
  if (!ws) return NextResponse.json({ error: { code: 'NOT_FOUND' } }, { status: 404 })

  const task = await prisma.projectTask.create({
    data: { workspaceId: id, title, description: description ?? null, status: 'NOT_STARTED' },
  })
  return NextResponse.json(task, { status: 201 })
})
