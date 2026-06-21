import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'

export const GET = withAuth(async (_req, user) => {
  const { prisma } = await import('@/lib/prisma')
  const accounts = await prisma.connectedAccount.findMany({
    where: { userId: user.id },
    select: {
      platform:          true,
      providerAccountId: true,
      accountEmail:      true,
      profileUrl:        true,
      profileData:       true,
      enabled:           true,
      status:            true,
      tokenExpiry:       true,
      connectedAt:       true,
      updatedAt:         true,
    } as never,
  })
  return NextResponse.json(accounts)
})
