import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const body = await req.json() as {
      name?: string; headline?: string; bio?: string; location?: string
      skills?: string[]; experienceYears?: number; education?: string
      interests?: string[]; website?: string; linkedinUrl?: string
      githubUrl?: string; fiverrUrl?: string; upworkUrl?: string; youtubeUrl?: string
    }

    if (!body.name?.trim() && !body.headline?.trim()) {
      return NextResponse.json(
        { error: { message: 'At least name or headline is required' } },
        { status: 400 },
      )
    }

    const profileData = {
      name:           body.name?.trim(),
      headline:       body.headline?.trim(),
      bio:            body.bio?.trim(),
      location:       body.location?.trim(),
      skills:         body.skills         ?? [],
      interests:      body.interests      ?? [],
      experienceYears: body.experienceYears,
      education:      body.education?.trim(),
      website:        body.website?.trim(),
      linkedinUrl:    body.linkedinUrl?.trim(),
      githubUrl:      body.githubUrl?.trim(),
      fiverrUrl:      body.fiverrUrl?.trim(),
      upworkUrl:      body.upworkUrl?.trim(),
      youtubeUrl:     body.youtubeUrl?.trim(),
      importMethod:   'manual_entry',
    }

    await prisma.connectedAccount.upsert({
      where:  { userId_platform: { userId: user.id, platform: 'MANUAL' } },
      update: { profileData: profileData as never, updatedAt: new Date() },
      create: { userId: user.id, platform: 'MANUAL', profileData: profileData as never },
    })

    // Sync skills + interests to UserContext for AI agent access
    await prisma.userContext.upsert({
      where:  { userId: user.id },
      update: {
        ...(body.skills?.length    ? { skills:    body.skills }    : {}),
        ...(body.interests?.length ? { interests: body.interests } : {}),
      },
      create: {
        userId:    user.id,
        skills:    body.skills    ?? [],
        interests: body.interests ?? [],
      },
    })

    return NextResponse.json({ saved: true })

  } catch (err) {
    console.error('[manual-entry]', err)
    return NextResponse.json(
      { error: { message: 'Failed to save — please try again' } },
      { status: 500 },
    )
  }
})
