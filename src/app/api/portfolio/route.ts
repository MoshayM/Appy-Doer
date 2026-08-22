import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const GET = withAuth(async (_req, user) => {
  const assets = await prisma.portfolioAsset.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(assets)
})

export const POST = withAuth(async (req, user) => {
  const { type, content, fileUrl } = await req.json()
  const asset = await prisma.portfolioAsset.create({
    data: { userId: user.id, type, content, fileUrl },
  })
  return NextResponse.json(asset, { status: 201 })
})
