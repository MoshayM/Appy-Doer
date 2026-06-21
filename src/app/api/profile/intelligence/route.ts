import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const GET = withAuth(async (_req, user) => {
  const profiles = await prisma.professionalProfile.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(profiles)
})

export const POST = withAuth(async (req, user) => {
  const body = await req.json()
  const {
    primaryType, headline, summary, positioning, outputs, ...rest
  } = body

  const profile = await prisma.professionalProfile.create({
    data: {
      userId: user.id,
      primaryType: primaryType ?? 'PUBLIC_PROFILE',
      headline: headline ?? '',
      summary: summary ?? '',
      positioning: positioning ?? null,
      websiteSlug: outputs?.websiteSlug ?? null,
      published: false,
      detail: { ...rest, outputs } as never,
    },
  })
  return NextResponse.json(profile, { status: 201 })
})

export const PATCH = withAuth(async (req, user) => {
  const body = await req.json()
  const { primaryType, headline, summary, positioning, outputs, ...rest } = body

  const latest = await prisma.professionalProfile.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    select: { id: true },
  })

  if (!latest) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'No profile found' } }, { status: 404 })
  }

  const updated = await prisma.professionalProfile.update({
    where: { id: latest.id },
    data: {
      ...(primaryType   ? { primaryType }               : {}),
      ...(headline  !== undefined ? { headline }         : {}),
      ...(summary   !== undefined ? { summary }          : {}),
      ...(positioning !== undefined ? { positioning }    : {}),
      ...(outputs?.websiteSlug !== undefined ? { websiteSlug: outputs.websiteSlug } : {}),
      detail: { ...rest, outputs } as never,
    },
  })

  return NextResponse.json(updated)
})
