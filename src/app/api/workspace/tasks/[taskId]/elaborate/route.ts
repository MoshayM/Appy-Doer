import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Anthropic from '@anthropic-ai/sdk'
import { fetchEmailAttachments, getGmailAccessToken, type AttachmentImage } from '@/lib/gmail-attachments'

let _anthropic: Anthropic | null = null
function getAnthropic() {
  if (!_anthropic) _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
  return _anthropic
}

export interface TaskElaboration {
  elaboration: string
  clientContext: string | null
  clientRequirements: string[]
  suggestions: string[]
  solvingRoadmap: { step: number; title: string; description: string; estimateMinutes: number; clientNote: string }[]
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  estimateHours: number
  emailSource: string | null
}

const MAX_MSG_CHARS = 600
const MAX_MESSAGES = 8

function trimBody(text: string | null | undefined): string {
  if (!text) return ''
  const clean = text.replace(/\s+/g, ' ').trim()
  return clean.length > MAX_MSG_CHARS ? clean.slice(0, MAX_MSG_CHARS) + '…' : clean
}

function extractJson(raw: string): string {
  const s = raw.trim()
  // Strip markdown code fences if present
  const fenced = s.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenced) return fenced[1].trim()
  // Find first { ... last }
  const start = s.indexOf('{')
  const end = s.lastIndexOf('}')
  if (start !== -1 && end !== -1) return s.slice(start, end + 1)
  return s
}

export const POST = withAuth(async (_req, user, ctx) => {
  try {
    const taskId: string = ctx?.params?.taskId ?? ''

    const task = await prisma.projectTask.findFirst({
      where: { id: taskId, workspace: { userId: user.id } },
      include: {
        workspace: {
          select: { id: true, title: true, objective: true, leadId: true },
        },
      },
    })
    if (!task) return NextResponse.json({ error: { code: 'NOT_FOUND' } }, { status: 404 })

    // ── 1. Find email thread ────────────────────────────────────────────────
    let emailContext = ''
    let emailSource: string | null = null

    type ThreadRow = {
      subject: string
      contactEmail: string
      contactName: string | null
      messages: { fromEmail: string; fromName: string | null; bodyText: string | null; sentAt: Date; isInbound: boolean; gmailMessageId: string | null }[]
    }

    let thread: ThreadRow | null = null

    if (task.workspace.leadId) {
      thread = await prisma.emailThread.findFirst({
        where: { leadId: task.workspace.leadId, userId: user.id },
        orderBy: { lastMessageAt: 'desc' },
        include: {
          messages: {
            orderBy: { sentAt: 'asc' },
            take: MAX_MESSAGES,
            select: { fromEmail: true, fromName: true, bodyText: true, sentAt: true, isInbound: true, gmailMessageId: true },
          },
        },
      })
    }

    if (!thread) {
      const keywords = [task.workspace.title, task.title]
        .join(' ')
        .toLowerCase()
        .split(/\s+/)
        .filter(w => w.length > 3)

      const threads = await prisma.emailThread.findMany({
        where: { userId: user.id },
        orderBy: { lastMessageAt: 'desc' },
        take: 20,
        include: {
          messages: {
            orderBy: { sentAt: 'asc' },
            take: MAX_MESSAGES,
            select: { fromEmail: true, fromName: true, bodyText: true, sentAt: true, isInbound: true, gmailMessageId: true },
          },
        },
      })

      if (keywords.length > 0) {
        const scored = threads.map(t => ({
          t,
          score: keywords.filter(k => t.subject.toLowerCase().includes(k)).length,
        }))
        const best = scored.sort((a, b) => b.score - a.score)[0]
        if (best && best.score > 0) thread = best.t
      }

      if (!thread) {
        thread = threads.find(t => t.messages.some(m => m.isInbound)) ?? null
      }
    }

    // ── Fetch attachments from inbound messages ─────────────────────────────
    let attachmentImages: AttachmentImage[] = []
    let otherAttachments: string[] = []

    if (thread && thread.messages.length > 0) {
      const lines: string[] = []
      for (const m of thread.messages) {
        const sender = m.fromName ? `${m.fromName} <${m.fromEmail}>` : m.fromEmail
        const date = m.sentAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
        const body = trimBody(m.bodyText)
        if (body) lines.push(`[${date}] From: ${sender}\n${body}`)
      }
      if (lines.length > 0) {
        const contactLabel = thread.contactName ?? thread.contactEmail
        emailContext = `\nEMAIL CONVERSATION WITH CLIENT:\nSubject: ${thread.subject}\nContact: ${contactLabel} (${thread.contactEmail})\n\n${lines.join('\n\n---\n\n')}`
        emailSource = `${thread.subject} — ${contactLabel}`
      }

      // Fetch images from inbound messages
      const gmailToken = await getGmailAccessToken(user.id)
      if (gmailToken) {
        const inboundIds = thread.messages
          .filter(m => m.isInbound && m.gmailMessageId)
          .map(m => m.gmailMessageId) as string[]
        if (inboundIds.length) {
          const fetched = await fetchEmailAttachments(inboundIds, gmailToken, 4)
          attachmentImages = fetched.images
          otherAttachments = fetched.otherFiles
        }
      }
    }

    // ── 2. Build prompt ─────────────────────────────────────────────────────
    const hasEmail       = emailContext.length > 0
    const hasImages      = attachmentImages.length > 0
    const hasOtherFiles  = otherAttachments.length > 0

    // Attachment context note (prevents "go collect drawings" suggestions)
    const attachmentCtx = hasImages
      ? `\n\nCLIENT ATTACHMENTS PROVIDED (images already shared — analyze them directly, do NOT suggest collecting them):\n${attachmentImages.map(i => `• ${i.filename}`).join('\n')}`
      : hasOtherFiles
        ? `\n\nCLIENT ATTACHMENTS PROVIDED (already shared — do NOT ask client to resend):\n${otherAttachments.map(f => `• ${f}`).join('\n')}`
        : ''

    const attachmentInstruction = hasImages
      ? 'Also analyze the attached images (drawings, diagrams, screenshots) provided by the client and extract specific requirements from them.'
      : ''

    const prompt = `You are a work planning assistant for a freelancer.

PROJECT: ${task.workspace.title}${task.workspace.objective ? `\nOBJECTIVE: ${task.workspace.objective}` : ''}
TASK: ${task.title}${task.description ? `\nDESCRIPTION: ${task.description}` : ''}
${emailContext}${attachmentCtx}

Your job: ${hasEmail
  ? `Read the email conversation carefully and understand exactly what the client is asking. ${attachmentInstruction} Then create a precise, actionable plan specifically tailored to the client's requirements. Never suggest collecting files or drawings that the client has already provided.`
  : 'Create a practical, actionable plan for completing this task.'}

Return a JSON object with EXACTLY these fields — no markdown, no extra text:

{
  "elaboration": <2-3 sentences describing what this task involves${hasEmail ? ' and how it connects to the client conversation' : ''}${hasImages ? ', and what was found in the client drawings/images' : ''}>,
  "clientContext": <${hasEmail ? 'one sentence summarizing exactly what the client is asking for, based on the emails and any attachments' : 'null'}>,
  "clientRequirements": <${hasEmail ? 'array of specific requirements extracted from the email conversation and attachments — be concrete, not generic' : 'empty array []'}>,
  "suggestions": <array of 4 practical, specific tips for completing this task — do NOT suggest collecting documents that client has already provided>,
  "solvingRoadmap": <array of 4-5 steps, each with: step (number), title (string), description (what exactly to do), estimateMinutes (number), clientNote (${hasEmail ? 'how this step addresses the client request' : 'why this step matters'})>,
  "priority": <"HIGH", "MEDIUM", or "LOW">,
  "estimateHours": <total estimated hours as a number>,
  "emailSource": <${hasEmail ? `"${(emailSource ?? '').replace(/"/g, "'")}"` : 'null'}>
}`

    // Build Claude message content (with vision if images exist)
    const userContent: (Anthropic.Messages.TextBlockParam | Anthropic.Messages.ImageBlockParam)[] = [{ type: 'text', text: prompt }]
    if (hasImages) {
      for (const img of attachmentImages) {
        userContent.push({
          type: 'image',
          source: { type: 'base64', media_type: img.mimeType, data: img.base64 },
        })
      }
      userContent.push({ type: 'text', text: `These are the ${attachmentImages.length} image attachment(s) from the client email. Extract all visible requirements, dimensions, specifications, or design details from them.` })
    }

    const msg = await getAnthropic().messages.create({
      model: hasImages ? 'claude-sonnet-4-6' : 'claude-haiku-4-5-20251001',
      max_tokens: 3500,
      messages: [{ role: 'user', content: userContent }],
    })

    const raw = (msg.content.find(c => c.type === 'text') as { type: 'text'; text: string } | undefined)?.text ?? ''

    let data: TaskElaboration
    try {
      data = JSON.parse(extractJson(raw))
    } catch {
      // Truncated or malformed JSON — build a best-effort fallback so the UI never hard-errors
      data = {
        elaboration: raw.slice(0, 500) || `Task: ${task.title}`,
        clientContext: hasEmail ? 'Client context extracted from email thread.' : null,
        clientRequirements: [],
        suggestions: [
          'Review all client requirements carefully before starting.',
          'Break the work into smaller deliverables.',
          'Confirm scope and timeline with the client.',
          'Document and share your work clearly.',
        ],
        solvingRoadmap: [
          { step: 1, title: 'Understand Requirements', description: 'Read the task brief and all client communications.', estimateMinutes: 30, clientNote: 'Clarify any ambiguities before proceeding.' },
          { step: 2, title: 'Plan Your Approach', description: 'Outline the steps needed to deliver the work.', estimateMinutes: 20, clientNote: '' },
          { step: 3, title: 'Execute', description: 'Complete the core deliverable.', estimateMinutes: 60, clientNote: '' },
          { step: 4, title: 'Review & Deliver', description: 'Quality-check and send to client.', estimateMinutes: 20, clientNote: '' },
        ],
        priority: 'MEDIUM',
        estimateHours: 2,
        emailSource: emailSource,
      }
    }

    return NextResponse.json(data)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to elaborate task'
    return NextResponse.json({ error: { code: 'ELABORATE_FAILED', message: msg } }, { status: 500 })
  }
})
