import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Anthropic from '@anthropic-ai/sdk'

export const POST = withAuth(async (req: NextRequest, user) => {
  const formData = await req.formData()
  const file     = formData.get('file') as File | null
  const source   = (formData.get('source') as string | null) ?? 'resume'

  if (!file) {
    return NextResponse.json({ error: { message: 'No file provided' } }, { status: 400 })
  }

  const maxBytes = 10 * 1024 * 1024 // 10 MB
  if (file.size > maxBytes) {
    return NextResponse.json({ error: { message: 'File too large — maximum 10 MB' } }, { status: 400 })
  }

  const isPdf  = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
  if (!isPdf) {
    return NextResponse.json(
      { error: { message: 'Only PDF files are supported. For DOCX, copy-paste the text instead.' } },
      { status: 400 },
    )
  }

  const bytes  = await file.arrayBuffer()
  const base64 = Buffer.from(bytes).toString('base64')

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const res = await anthropic.messages.create({
    model:      'claude-sonnet-4-6',
    max_tokens: 1500,
    messages: [{
      role: 'user',
      content: [
        {
          type:   'document',
          source: { type: 'base64', media_type: 'application/pdf', data: base64 },
        } as never,
        {
          type: 'text',
          text: `Extract a complete structured professional profile from this resume/CV document. Return ONLY valid JSON, no markdown.

{
  "name": "full name or null",
  "headline": "current job title / professional headline or null",
  "profession": "primary profession in 1-3 words or null",
  "phone": "phone number or null",
  "email": "email address or null",
  "location": "city/region or null",
  "company": "current company or null",
  "experienceYears": number or null,
  "industry": "industry domain or null",
  "summary": "brief professional summary or null",
  "education": [
    { "degree": "degree type", "field": "field of study", "institution": "college/university", "year": graduation_year_number_or_null }
  ],
  "experiences": [
    { "company": "company name", "role": "job title", "duration": "e.g. 2 years 3 months", "description": "responsibilities and outcomes" }
  ],
  "skills": ["skill1", "skill2"],
  "certifications": ["certification name"],
  "projects": [
    { "title": "project title", "description": "what it was and the problem it solved", "tech": ["tech used"] }
  ],
  "languages": ["English", "Hindi"],
  "interests": ["interest1", "interest2"]
}`,
        },
      ],
    }],
  })

  let parsed: Record<string, unknown> = {}
  try {
    const raw = res.content[0].type === 'text' ? res.content[0].text : '{}'
    parsed = JSON.parse(raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim())
  } catch {
    return NextResponse.json({ error: { message: 'Could not parse resume — try copy-pasting the text instead' } }, { status: 422 })
  }

  const platform = source === 'naukri' ? 'NAUKRI_TEXT' : 'RESUME'

  await prisma.connectedAccount.upsert({
    where:  { userId_platform: { userId: user.id, platform: platform as never } },
    update: { profileData: parsed as never, updatedAt: new Date() },
    create: { userId: user.id, platform: platform as never, profileData: parsed as never },
  })

  const interests = (parsed.interests as string[] | undefined) ?? []
  const skills    = (parsed.skills    as string[] | undefined) ?? []

  if (parsed.profession || skills.length || interests.length) {
    await prisma.userContext.upsert({
      where:  { userId: user.id },
      update: {
        ...(parsed.profession      ? { profession:       parsed.profession      as string } : {}),
        ...(parsed.experienceYears ? { experienceYears:  parsed.experienceYears as number } : {}),
        ...(parsed.industry        ? { industry:         parsed.industry        as string } : {}),
        ...(skills.length          ? { skills }                                             : {}),
        ...(interests.length       ? { interests }                                          : {}),
      },
      create: {
        userId:          user.id,
        profession:      (parsed.profession      as string | null) ?? null,
        experienceYears: (parsed.experienceYears as number | null) ?? null,
        industry:        (parsed.industry        as string | null) ?? null,
        skills,
        interests,
      },
    })
  }

  return NextResponse.json({ imported: true, profile: parsed })
})
