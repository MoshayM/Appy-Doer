import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const GET = withAuth(async (_req, user) => {
  const context = await prisma.userContext.findUnique({ where: { userId: user.id } })
  return NextResponse.json(context ?? {})
})

export const PATCH = withAuth(async (req: NextRequest, user) => {
  const body = await req.json()
  const {
    profession, experienceYears, industry,
    availableHoursPerWeek, incomeTargetINR,
    skills, interests,
  } = body

  const context = await prisma.userContext.upsert({
    where: { userId: user.id },
    update: {
      ...(profession            !== undefined && { profession }),
      ...(experienceYears       !== undefined && { experienceYears }),
      ...(industry              !== undefined && { industry }),
      ...(availableHoursPerWeek !== undefined && { availableHoursPerWeek }),
      ...(incomeTargetINR       !== undefined && { incomeTargetINR }),
      ...(skills                !== undefined && { skills }),
      ...(interests             !== undefined && { interests }),
      version: { increment: 1 },
    },
    create: {
      userId: user.id,
      profession, experienceYears, industry,
      availableHoursPerWeek, incomeTargetINR,
      skills:    skills    ?? [],
      interests: interests ?? [],
    },
  })

  return NextResponse.json(context)
})
