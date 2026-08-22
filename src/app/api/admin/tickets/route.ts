import { NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const GET = withAdminAuth(async (req) => {
  const url      = new URL(req.url)
  const page     = parseInt(url.searchParams.get('page') ?? '1')
  const limit    = parseInt(url.searchParams.get('limit') ?? '20')
  const status   = url.searchParams.get('status')
  const priority = url.searchParams.get('priority')
  const search   = url.searchParams.get('search') ?? ''

  const where = {
    ...(status   ? { status:   status   as never } : {}),
    ...(priority ? { priority: priority as never } : {}),
    ...(search   ? { OR: [
      { title:       { contains: search, mode: 'insensitive' as const } },
      { description: { contains: search, mode: 'insensitive' as const } },
    ]} : {}),
  }

  const [tickets, total] = await Promise.all([
    prisma.supportTicket.findMany({
      where,
      include: { user: { select: { id: true, email: true, name: true, plan: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.supportTicket.count({ where }),
  ])

  return NextResponse.json({ tickets, total, page, pages: Math.ceil(total / limit) })
})
