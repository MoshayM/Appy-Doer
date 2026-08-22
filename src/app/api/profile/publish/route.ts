import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const POST = withAuth(async (req, user) => {
  const { profileId, slug } = await req.json()
  if (!profileId) return NextResponse.json({ error: { code: 'INVALID_INPUT' } }, { status: 400 })

  // Ensure slug is unique across published profiles
  const base = (slug as string)?.toLowerCase().replace(/[^a-z0-9-]/g, '-') ?? user.id
  let websiteSlug = base
  const existing = await prisma.professionalProfile.findFirst({ where: { websiteSlug, published: true } })
  if (existing && existing.id !== profileId) websiteSlug = `${base}-${Date.now()}`

  // Unpublish previous published profile for this user
  await prisma.professionalProfile.updateMany({
    where: { userId: user.id, published: true },
    data: { published: false },
  })

  const updated = await prisma.professionalProfile.update({
    where: { id: profileId, userId: user.id },
    data: { published: true, websiteSlug },
  })
  return NextResponse.json({ id: updated.id, websiteSlug: updated.websiteSlug })
})
