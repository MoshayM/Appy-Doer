import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import Anthropic from '@anthropic-ai/sdk'
import { fetchEmailAttachments, getGmailAccessToken, type AttachmentImage } from '@/lib/gmail-attachments'

export const maxDuration = 300

let _client: Anthropic | null = null
function ai() {
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
  return _client
}

function sse(event: string, data: unknown): Uint8Array {
  return new TextEncoder().encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
}

function extractJson(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenced) return fenced[1].trim()
  const s = raw.indexOf('{'), e = raw.lastIndexOf('}')
  if (s !== -1 && e !== -1) return raw.slice(s, e + 1)
  return raw.trim()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseAgent(raw: string, fallback: Record<string, any>): Record<string, any> {
  if (!raw.trim()) return fallback
  try { return JSON.parse(extractJson(raw)) } catch { return fallback }
}

// ── Claude call (with optional vision images) ──────────────────────────────

async function callAgent(
  system: string,
  userText: string,
  model: 'claude-haiku-4-5-20251001' | 'claude-sonnet-4-6' = 'claude-haiku-4-5-20251001',
  maxTokens = 1600,
  images?: AttachmentImage[]
): Promise<string> {
  const content: (Anthropic.Messages.TextBlockParam | Anthropic.Messages.ImageBlockParam)[] = [{ type: 'text', text: userText }]

  if (images?.length) {
    for (const img of images) {
      content.push({
        type: 'image',
        source: { type: 'base64', media_type: img.mimeType, data: img.base64 },
      })
    }
    content.push({ type: 'text', text: `Above are ${images.length} attachment image(s) sent by the client. Analyze them carefully as part of the task context.` })
  }

  const msg = await ai().messages.create({
    model, max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content }],
  })
  const text = msg.content.find(c => c.type === 'text')
  return text?.type === 'text' ? text.text : ''
}

// ── Agent system prompts ───────────────────────────────────────────────────

function buildAnalystPrompt(hasImages: boolean, otherFiles: string[]): string {
  const attachmentNote = hasImages
    ? `\n\nIMPORTANT: The client has already attached images (drawings, diagrams, screenshots) to their email. Analyze them directly — DO NOT suggest "collect drawings from client" or "ask client to share files" because they have already been provided.`
    : otherFiles.length
      ? `\n\nNOTE: The client has already attached these files: ${otherFiles.join(', ')}. DO NOT suggest collecting files that the client has already shared.`
      : ''

  return `You are a Senior Business Analyst. Read the task, client communication, and analyze any attached images (drawings, diagrams, documents) carefully and thoroughly.${attachmentNote}

If the client has provided drawings, specifications, or reference images — extract concrete requirements from them. Never ask for information that has already been provided.

Respond ONLY with this JSON:
{
  "objective": "clear one-sentence goal based on actual client request",
  "clientNeeds": "what the client actually wants — be specific, reference drawings or specs if provided",
  "deliverables": ["deliverable 1", "deliverable 2", "deliverable 3"],
  "urgency": "HIGH",
  "taskType": "Report / Website / Campaign / Analysis / Proposal / Document / Drawing / Other",
  "requiredSpecialists": ["Specialist A", "Specialist B", "Specialist C"],
  "attachmentsAnalyzed": ["brief description of each attachment analyzed"]
}`
}

const PROMPTS = {
  ARCHITECT: `You are a Senior Project Manager. Design a precise execution plan based on the actual work to be done, not on collecting information the client already provided.
Pick specialists ONLY from this list: Cost Analyst, Engineering Analyst, Software Engineer, UI/UX Designer, Content Writer, Proposal Specialist, Marketing Strategist, Research Specialist, Data Analyst, Video Producer, Graphic Designer, AI Automation Specialist.
Respond ONLY with this JSON:
{
  "approach": "1-2 sentence overall approach",
  "stages": [
    { "name": "stage name", "description": "what happens in this stage" }
  ],
  "team": ["Specialist 1", "Specialist 2", "Specialist 3"],
  "estimatedMinutes": 20
}`,

  QUALITY: `You are a Department Head. Review and validate all specialist outputs. Consolidate the best ideas into one polished result.
Respond ONLY with this JSON:
{
  "score": 88,
  "approved": true,
  "improvements": ["improvement 1", "improvement 2"],
  "consolidatedOutput": "comprehensive synthesised output combining the best of all specialist contributions",
  "keyFindings": ["finding 1", "finding 2", "finding 3"]
}`,

  DELIVERY: `You are a professional Account Manager preparing the final client deliverable.
Respond ONLY with this JSON:
{
  "summary": "2-3 sentence executive summary of what was done",
  "mainOutput": "the primary detailed deliverable — full content ready to share with client",
  "sections": [
    { "title": "section heading", "content": "section content" }
  ],
  "emailDraft": "complete professional email to client explaining the deliverable and next steps",
  "nextSteps": ["next step 1", "next step 2", "next step 3"]
}`,
}

const SPECIALIST_PROMPTS: Record<string, string> = {
  'Cost Analyst':           'You are a Senior Cost Consultant with 15+ years of experience in pricing, cost estimation, and financial analysis.',
  'Engineering Analyst':    'You are a Senior Manufacturing Engineer specialising in technical analysis, BOM, and engineering calculations.',
  'Software Engineer':      'You are a Senior Full Stack Developer specialising in architecture, APIs, and scalable systems.',
  'UI/UX Designer':         'You are a Senior Product Designer specialising in user flows, wireframes, and design systems.',
  'Content Writer':         'You are a Professional Business Writer specialising in reports, proposals, and compelling copy.',
  'Proposal Specialist':    'You are a Senior Sales Consultant specialising in winning proposals, quotations, and client presentations.',
  'Marketing Strategist':   'You are a Digital Marketing Manager specialising in campaigns, SEO, and growth strategies.',
  'Research Specialist':    'You are an Industry Research Analyst specialising in market research, competitive analysis, and insight gathering.',
  'Data Analyst':           'You are a Business Intelligence Analyst specialising in data interpretation, reporting, and dashboards.',
  'Video Producer':         'You are a Creative Director specialising in script planning, video concepts, and production guidance.',
  'Graphic Designer':       'You are a Creative Design Lead specialising in branding, visual identity, and graphic assets.',
  'AI Automation Specialist': 'You are an Automation Consultant specialising in workflow automation, AI integrations, and agent building.',
}

function specialistPrompt(name: string): string {
  const base = SPECIALIST_PROMPTS[name] ?? `You are a ${name} with deep domain expertise.`
  return `${base}
Analyse the task and any provided drawings or specifications, then deliver your expert contribution.
Respond ONLY with this JSON:
{
  "contribution": "your detailed expert work / analysis / content",
  "keyPoints": ["key point 1", "key point 2", "key point 3"],
  "recommendations": ["recommendation 1", "recommendation 2"]
}`
}

// ── Route handler ─────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function POST(req: NextRequest, ctx: any) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const taskId: string = ctx?.params?.taskId ?? ''

  // Optional clarifications + user notes from the pre-execution step
  let clarifications: Record<string, string> = {}
  let userNotes = ''
  try {
    const body = await req.json()
    if (body?.clarifications && typeof body.clarifications === 'object') {
      clarifications = body.clarifications
    }
    if (typeof body?.userNotes === 'string' && body.userNotes.trim()) {
      userNotes = body.userNotes.trim()
    }
  } catch { /* no body — proceed without clarifications */ }

  const stream = new ReadableStream({
    async start(controller) {
      function send(event: string, data: unknown) {
        try { controller.enqueue(sse(event, data)) } catch { /* client disconnected */ }
      }

      try {
        // ── Load task + workspace ──────────────────────────────────────────────
        const task = await prisma.projectTask.findFirst({
          where: { id: taskId, workspace: { userId: user.id } },
          include: { workspace: { select: { title: true, objective: true, leadId: true } } },
        })
        if (!task) { send('error', { message: 'Task not found' }); return }

        // ── Build email + attachment context ───────────────────────────────────
        let emailCtx = ''
        let attachmentImages: AttachmentImage[] = []
        let otherAttachments: string[] = []

        if (task.workspace.leadId) {
          const thread = await prisma.emailThread.findFirst({
            where: { leadId: task.workspace.leadId, userId: user.id },
            orderBy: { lastMessageAt: 'desc' },
            include: {
              messages: {
                where: { isInbound: true },    // only client messages have attachments
                orderBy: { sentAt: 'asc' },
                take: 8,
                select: { fromEmail: true, fromName: true, bodyText: true, gmailMessageId: true },
              },
            },
          })

          if (thread?.messages.length) {
            // Build text context
            const lines = thread.messages.map(m => {
              const who  = m.fromName ? `${m.fromName} <${m.fromEmail}>` : m.fromEmail
              const body = (m.bodyText ?? '').replace(/\s+/g, ' ').trim().slice(0, 500)
              return body ? `From: ${who}\n${body}` : null
            }).filter(Boolean)
            if (lines.length) emailCtx = `\n\nCLIENT EMAIL THREAD:\n${lines.join('\n---\n')}`

            // Fetch attachments from Gmail
            const gmailToken = await getGmailAccessToken(user.id)
            if (gmailToken) {
              const msgIds = thread.messages.map(m => m.gmailMessageId).filter(Boolean) as string[]
              if (msgIds.length) {
                const fetched = await fetchEmailAttachments(msgIds, gmailToken, 4)
                attachmentImages = fetched.images
                otherAttachments = fetched.otherFiles
              }
            }
          }
        }

        // Note attachments in text context so all agents are aware
        let attachmentNote = ''
        if (attachmentImages.length > 0) {
          attachmentNote = `\n\nCLIENT ATTACHMENTS (already provided — DO NOT ask client to share these again):\n${attachmentImages.map(i => `• ${i.filename} [image — analyzed visually]`).join('\n')}`
        }
        if (otherAttachments.length > 0) {
          attachmentNote += `\n${otherAttachments.map(f => `• ${f}`).join('\n')}`
        }

        // Inject user-provided clarification answers (from pre-execution question step)
        const clarificationCtx = Object.keys(clarifications).length > 0
          ? `\n\nUSER CLARIFICATIONS (direct answers from the freelancer before execution — treat as authoritative):\n${Object.entries(clarifications).map(([q, a]) => `Q: ${q}\nA: ${a}`).join('\n\n')}`
          : ''

        // Inject freeform notes the freelancer typed before executing
        const userNotesCtx = userNotes
          ? `\n\nFREELANCER'S SPECIFIC INSTRUCTIONS (follow these precisely — they override general assumptions):\n${userNotes}`
          : ''

        const taskCtx = [
          `Task: "${task.title}"`,
          task.description ? `Description: ${task.description}` : '',
          `Project: "${task.workspace.title}"`,
          task.workspace.objective ? `Objective: ${task.workspace.objective}` : '',
          emailCtx,
          attachmentNote,
          clarificationCtx,
          userNotesCtx,
        ].filter(Boolean).join('\n')

        // ── Stage 1: Task Understanding Agent ─────────────────────────────────
        send('progress', { agent: 'Task Understanding Agent', role: 'Business Analyst', stage: 1, status: 'working', message: attachmentImages.length ? `Analyzing task + ${attachmentImages.length} client attachment(s)…` : 'Reading task and client request…' })
        const blueprint = parseAgent(
          await callAgent(buildAnalystPrompt(attachmentImages.length > 0, otherAttachments), taskCtx, 'claude-sonnet-4-6', 1800, attachmentImages),
          { objective: task.title, clientNeeds: '', deliverables: [], urgency: 'MEDIUM', taskType: 'Other', requiredSpecialists: [], attachmentsAnalyzed: [] }
        )
        send('progress', { agent: 'Task Understanding Agent', role: 'Business Analyst', stage: 1, status: 'done' })

        // ── Stage 2: Workflow Architect ────────────────────────────────────────
        send('progress', { agent: 'Workflow Architect', role: 'Project Manager', stage: 2, status: 'working', message: 'Designing execution plan and selecting team…' })
        const plan = parseAgent(
          await callAgent(PROMPTS.ARCHITECT, `${taskCtx}\n\nTask Blueprint:\n${JSON.stringify(blueprint)}`),
          { approach: 'Step-by-step execution', stages: [], team: [], estimatedMinutes: 20 }
        )
        const rawTeam: string[] = Array.isArray(plan.team) ? plan.team :
          Array.isArray(blueprint.requiredSpecialists) ? blueprint.requiredSpecialists : []
        const team: string[] = rawTeam.filter((s: unknown) => typeof s === 'string').slice(0, 4)
        if (team.length === 0) team.push('Content Writer')
        send('progress', { agent: 'Workflow Architect', role: 'Project Manager', stage: 2, status: 'done' })
        send('team_formed', { team, estimatedMinutes: plan.estimatedMinutes ?? 20, stages: plan.stages ?? [], approach: plan.approach ?? '' })

        // ── Stage 3: Specialist Agents ─────────────────────────────────────────
        const specialistOutputs: { specialist: string; contribution: string; keyPoints: string[]; recommendations: string[] }[] = []
        for (const specialist of team) {
          send('progress', { agent: specialist, role: specialist, stage: 3, status: 'working', message: `${specialist} is working on your task…` })
          // Pass images to first specialist only to stay within token limits
          const specImages = specialistOutputs.length === 0 ? attachmentImages : undefined
          const raw = await callAgent(
            specialistPrompt(specialist),
            `${taskCtx}\n\nBlueprint: ${JSON.stringify(blueprint)}\nPlan: ${JSON.stringify(plan)}`,
            'claude-haiku-4-5-20251001', 1600, specImages
          )
          const out = parseAgent(raw, { contribution: `${specialist} analysis completed.`, keyPoints: [], recommendations: [] })
          specialistOutputs.push({ specialist, contribution: String(out.contribution ?? ''), keyPoints: Array.isArray(out.keyPoints) ? out.keyPoints : [], recommendations: Array.isArray(out.recommendations) ? out.recommendations : [] })
          send('progress', { agent: specialist, role: specialist, stage: 3, status: 'done' })
        }

        // ── Stage 4: Quality Review ────────────────────────────────────────────
        send('progress', { agent: 'Quality Reviewer', role: 'Department Head', stage: 4, status: 'working', message: 'Reviewing and improving all outputs…' })
        const review = parseAgent(
          await callAgent(
            PROMPTS.QUALITY,
            `${taskCtx}\n\nBlueprint: ${JSON.stringify(blueprint)}\nSpecialist Outputs:\n${JSON.stringify(specialistOutputs)}`,
            'claude-sonnet-4-6', 2500
          ),
          { score: 80, approved: true, improvements: [], consolidatedOutput: specialistOutputs.map(s => s.contribution).join('\n\n'), keyFindings: [] }
        )
        send('progress', { agent: 'Quality Reviewer', role: 'Department Head', stage: 4, status: 'done' })

        // ── Stage 5: Client Delivery ───────────────────────────────────────────
        send('progress', { agent: 'Client Delivery Agent', role: 'Account Manager', stage: 5, status: 'working', message: 'Preparing your final deliverable…' })
        const deliverable = parseAgent(
          await callAgent(
            PROMPTS.DELIVERY,
            `${taskCtx}\n\nReviewed & Consolidated Output:\n${JSON.stringify(review)}`,
            'claude-haiku-4-5-20251001', 2500
          ),
          { summary: 'Work completed by AI team.', mainOutput: review.consolidatedOutput ?? '', sections: [], emailDraft: '', nextSteps: [] }
        )
        send('progress', { agent: 'Client Delivery Agent', role: 'Account Manager', stage: 5, status: 'done' })

        // ── Save + complete ────────────────────────────────────────────────────
        const finalResult = { blueprint, plan, team, specialistOutputs, review, deliverable }
        try {
          await prisma.projectTask.update({
            where: { id: taskId },
            data: { output: finalResult as unknown as Prisma.InputJsonValue, status: 'IN_PROGRESS' },
          })
        } catch (saveErr) {
          console.error('[execute] DB save failed:', saveErr)
        }

        send('complete', { result: finalResult })
      } catch (err) {
        console.error('[execute] pipeline error:', err)
        const msg = err instanceof Error
          ? `${err.constructor?.name ?? 'Error'}: ${err.message}`
          : typeof err === 'string' ? err : JSON.stringify(err)
        send('error', { message: msg })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection':    'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
