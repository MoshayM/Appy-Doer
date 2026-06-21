import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const GET = withAuth(async (_req, user) => {
  const [workspaces, tasks] = await Promise.all([
    prisma.projectWorkspace.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, status: true, updatedAt: true },
    }),
    prisma.projectTask.findMany({
      where: { workspace: { userId: user.id } },
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, status: true, workspaceId: true },
    }),
  ])
  return NextResponse.json({ workspaces, tasks })
})

export const POST = withAuth(async (req, user) => {
  const { title, leadId, clientProfileId } = await req.json()
  if (!title) return NextResponse.json({ error: { code: 'INVALID_INPUT' } }, { status: 400 })

  const workspace = await prisma.projectWorkspace.create({
    data: {
      userId: user.id,
      leadId: leadId ?? null,
      clientProfileId: clientProfileId ?? null,
      title,
      status: 'NOT_STARTED',
    },
  })
  return NextResponse.json(workspace, { status: 201 })
})
