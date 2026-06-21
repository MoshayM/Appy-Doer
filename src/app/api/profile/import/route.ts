import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Anthropic from '@anthropic-ai/sdk'

export const POST = withAuth(async (req: NextRequest, user) => {
  const { text, source } = await req.json()
  if (!text || text.length < 50) {
    return NextResponse.json({ error: { message: 'Paste at least 50 characters of your profile text' } }, { status: 400 })
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const res = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    messages: [{
      role: 'user',
      content: `Extract a complete structured professional profile from this text. Return ONLY valid JSON, no markdown.

Focus on PRIMARY DATA first: name and education qualifications are the most important fields.
Then capture interests, experience, and skills as evidence.

{
  "name": "full name or null",
  "headline": "current job title / professional headline or null",
  "profession": "primary profession in 1-3 words or null",
  "location": "city/region or null",
  "company": "current company or null",
  "experienceYears": number or null,
  "industry": "industry domain or null",
  "summary": "brief professional summary in 1-2 sentences or null",

  "education": [
    {
      "degree": "B.Tech / MBA / B.Com / M.Sc / Diploma / etc.",
      "field": "field of study e.g. Computer Science, Finance, Marketing",
      "institution": "college/university name or null",
      "year": graduation year as number or null
    }
  ],

  "interests": ["genuine interest 1", "interest 2"],

  "experiences": [
    {
      "company": "company name",
      "role": "job title",
      "duration": "e.g. 2 years 3 months",
      "description": "what they did — key responsibilities and outcomes"
    }
  ],

  "skills": ["skill1", "skill2"],

  "certifications": ["certification name"],

  "projects": [
    {
      "title": "project title",
      "description": "what it was and what problem it solved",
      "tech": ["tech used"]
    }
  ],

  "languages": ["English", "Hindi"]
}

Extract from this text (be thorough — education and interests are the most important):
${text.slice(0, 4000)}`,
    }],
  })

  let parsed: Record<string, unknown> = {}
  try {
    const raw = res.content[0].type === 'text' ? res.content[0].text : '{}'
    parsed = JSON.parse(raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim())
  } catch {
    return NextResponse.json({ error: { message: 'Could not parse profile — try pasting cleaner text' } }, { status: 422 })
  }

  const platform = source === 'resume' ? 'RESUME' : 'NAUKRI_TEXT'

  await prisma.connectedAccount.upsert({
    where:  { userId_platform: { userId: user.id, platform: platform as never } },
    update: { profileData: parsed as never, updatedAt: new Date() },
    create: { userId: user.id, platform: platform as never, profileData: parsed as never },
  })

  // Sync the richer data into UserContext — interests are now included
  const interests = (parsed.interests as string[] | undefined) ?? []
  const skills    = (parsed.skills    as string[] | undefined) ?? []

  if (parsed.profession || skills.length || interests.length) {
    await prisma.userContext.upsert({
      where:  { userId: user.id },
      update: {
        ...(parsed.profession      ? { profession:      parsed.profession      as string } : {}),
        ...(parsed.experienceYears ? { experienceYears: parsed.experienceYears as number } : {}),
        ...(parsed.industry        ? { industry:        parsed.industry        as string } : {}),
        ...(skills.length          ? { skills }                                           : {}),
        ...(interests.length       ? { interests }                                        : {}),
      },
      create: {
        userId:         user.id,
        profession:     (parsed.profession     as string | null) ?? null,
        experienceYears:(parsed.experienceYears as number | null) ?? null,
        industry:       (parsed.industry       as string | null) ?? null,
        skills,
        interests,
      },
    })
  }

  return NextResponse.json({ imported: true, profile: parsed })
})
