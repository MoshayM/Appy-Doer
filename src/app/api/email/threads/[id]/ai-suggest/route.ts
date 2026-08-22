import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Anthropic from '@anthropic-ai/sdk'

export const POST = withAuth(async (_req, user, ctx) => {
  const threadId = ctx?.params?.id as string

  const [thread, userCtx, skillRun, offerRun] = await Promise.all([
    prisma.emailThread.findFirst({
      where: { id: threadId, userId: user.id },
      include: { messages: { orderBy: { sentAt: 'asc' }, take: 10 } },
    }),
    prisma.userContext.findUnique({ where: { userId: user.id } }),
    prisma.agentRun.findFirst({
      where: { userId: user.id, agentType: 'SKILL_ASSESSMENT', success: true },
      orderBy: { createdAt: 'desc' },
      select: { outputJson: true },
    }),
    prisma.agentRun.findFirst({
      where: { userId: user.id, agentType: 'OFFER_BUILDER', success: true },
      orderBy: { createdAt: 'desc' },
      select: { outputJson: true },
    }),
  ])

  if (!thread) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

  const conversationText = thread.messages.length > 0
    ? thread.messages.map(m => {
        const sender = m.isInbound ? (thread.contactName || thread.contactEmail) : 'You (Freelancer)'
        const text = m.bodyText || m.bodyHtml?.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() || '(no text)'
        return `${sender}:\n${text.slice(0, 800)}`
      }).join('\n\n---\n\n')
    : 'No messages yet — first outreach email sent.'

  const skillData = skillRun?.outputJson as Record<string, unknown> | null
  const offerData = offerRun?.outputJson as Record<string, unknown> | null

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  try {
    const res = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: `You are an expert communication strategist for Indian freelancers. Analyze this email thread and generate a smart, context-aware reply suggestion.

FREELANCER PROFILE:
- Profession: ${userCtx?.profession ?? 'Independent Freelancer'}
- Key services: ${(skillData?.monetizableSkills as string[] | undefined)?.slice(0, 5).join(', ') ?? 'Professional freelance services'}
- Offer: ${(offerData as { offerName?: string } | null)?.offerName ?? 'Custom freelance services'}
- Positioning: ${(offerData as { positioningStatement?: string } | null)?.positioningStatement ?? ''}

EMAIL THREAD:
${conversationText}

CLIENT: ${thread.contactName || thread.contactEmail} | Subject: ${thread.subject}

Based on the LATEST CLIENT MESSAGE, provide a comprehensive reply intelligence package.

Respond with ONLY valid JSON (no markdown, no code blocks):
{
  "intent": "INTERESTED | NEED_QUOTE | NEED_MEETING | NEED_SAMPLE | NOT_INTERESTED | WRONG_CONTACT | OUT_OF_OFFICE | SPAM",
  "confidence": 0-100,
  "urgency": "LOW | MEDIUM | HIGH",
  "summary": "One clear sentence: what the client wants or said",
  "suggestedReply": "Complete professional reply (2-4 paragraphs). Address their specific ask. Be warm, direct, confident. End with clear next step.",
  "tone": "Professional & Warm | Direct & Concise | Empathetic | Enthusiastic | Formal",
  "communicationTips": [
    "Specific tip 1 about what to include or say",
    "Specific tip 2 about tone or approach",
    "Specific tip 3 about next steps or follow-up"
  ],
  "suggestedAttachments": [
    "Specific document/asset to attach, e.g.: Service pricing PDF",
    "Portfolio or case study relevant to their ask",
    "Proposal template if they asked for quote"
  ],
  "nextSteps": "Recommended next action in one sentence",
  "keyInsight": "One standout observation about this client or opportunity"
}`,
      }],
    })

    const raw = res.content[0].type === 'text' ? res.content[0].text.trim() : '{}'
    const suggestion = JSON.parse(raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim())
    return NextResponse.json(suggestion)
  } catch (err) {
    console.error('[ai-suggest]', err)
    return NextResponse.json({ error: { code: 'AI_FAILED', message: 'AI suggestion failed' } }, { status: 500 })
  }
})
