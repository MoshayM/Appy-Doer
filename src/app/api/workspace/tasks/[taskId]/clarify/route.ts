import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Anthropic from '@anthropic-ai/sdk'

export interface ClarifyQuestion {
  id: string
  question: string
  hint?: string
  type: 'text' | 'select'
  options?: string[]
  required: boolean
}

export interface ClarifyResult {
  needsClarification: boolean
  questions: ClarifyQuestion[]
}

let _anthropic: Anthropic | null = null
function getAnthropic() {
  if (!_anthropic) _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
  return _anthropic
}

function extractJson(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenced) return fenced[1].trim()
  const s = raw.indexOf('{'), e = raw.lastIndexOf('}')
  if (s !== -1 && e !== -1) return raw.slice(s, e + 1)
  return raw.trim()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const POST = withAuth(async (_req, user, ctx: any) => {
  try {
    const taskId: string = ctx?.params?.taskId ?? ''

    const task = await prisma.projectTask.findFirst({
      where: { id: taskId, workspace: { userId: user.id } },
      include: {
        workspace: { select: { title: true, objective: true, leadId: true } },
      },
    })
    if (!task) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

    // Build minimal email context to inform the question-generation agent
    let emailCtx = ''
    if (task.workspace.leadId) {
      const thread = await prisma.emailThread.findFirst({
        where: { leadId: task.workspace.leadId, userId: user.id },
        orderBy: { lastMessageAt: 'desc' },
        include: {
          messages: {
            orderBy: { sentAt: 'asc' },
            take: 6,
            select: { bodyText: true, isInbound: true },
          },
        },
      })
      if (thread?.messages.length) {
        const lines = thread.messages
          .filter(m => m.isInbound && m.bodyText)
          .map(m => (m.bodyText ?? '').replace(/\s+/g, ' ').trim().slice(0, 400))
          .filter(Boolean)
        if (lines.length) emailCtx = `\nClient email context:\n${lines.join('\n---\n')}`
      }
    }

    const prompt = `You are helping a freelancer prepare to execute a client task using an AI team. Before the AI team starts, identify 1-3 critical pieces of information that are NOT already clear from the task and email context. Only ask what is truly necessary — skip questions for things already mentioned.

Task: "${task.title}"
Project: "${task.workspace.title}"${task.workspace.objective ? `\nObjective: ${task.workspace.objective}` : ''}${emailCtx}

Return ONLY a JSON object:
{
  "needsClarification": true or false,
  "questions": [
    {
      "id": "q1",
      "question": "specific concise question text",
      "hint": "example answer or helper text (optional)",
      "type": "text",
      "required": true
    }
  ]
}

Use "type": "select" with an "options": ["opt1","opt2","opt3"] array only when the answer is clearly one of a small fixed set.

Rules:
- If everything needed is already clear, return { "needsClarification": false, "questions": [] }
- Maximum 3 questions
- Only ask what will meaningfully change how the AI approaches the work
- Do NOT ask for information already in the email or task description`

    const msg = await getAnthropic().messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 700,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = msg.content.find(c => c.type === 'text') as { type: 'text'; text: string } | undefined
    const text = raw?.text ?? ''

    let result: ClarifyResult = { needsClarification: false, questions: [] }
    try {
      const parsed = JSON.parse(extractJson(text))
      if (parsed && typeof parsed.needsClarification === 'boolean') {
        result = {
          needsClarification: parsed.needsClarification && Array.isArray(parsed.questions) && parsed.questions.length > 0,
          questions: Array.isArray(parsed.questions) ? parsed.questions.slice(0, 3) : [],
        }
      }
    } catch { /* return safe default on parse failure */ }

    return NextResponse.json(result)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Clarify check failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
})
