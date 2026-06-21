import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const GET = withAuth(async (_req, user) => {
  const stories = await prisma.successStory.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(stories)
})

export const POST = withAuth(async (req, user) => {
  const { title, body, incomeINR } = await req.json()
  if (!title) return NextResponse.json({ error: { code: 'INVALID_INPUT' } }, { status: 400 })

  const story = await prisma.successStory.create({
    data: { userId: user.id, title, body: body ?? '', incomeINR: incomeINR ?? null },
  })
  return NextResponse.json(story, { status: 201 })
})
