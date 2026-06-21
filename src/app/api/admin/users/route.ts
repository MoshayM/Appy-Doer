import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const GET = withAdminAuth(async (req) => {
  const url    = new URL(req.url)
  const page   = parseInt(url.searchParams.get('page') ?? '1')
  const limit  = parseInt(url.searchParams.get('limit') ?? '20')
  const search = url.searchParams.get('search') ?? ''

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where: search
        ? { OR: [{ email: { contains: search, mode: 'insensitive' } }, { name: { contains: search, mode: 'insensitive' } }] }
        : undefined,
      include: { subscription: { select: { status: true, trialEndsAt: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count(),
  ])

  return NextResponse.json({ users, total, page, pages: Math.ceil(total / limit) })
})
