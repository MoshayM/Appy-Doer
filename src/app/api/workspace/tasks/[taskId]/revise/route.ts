import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 300

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

let _client: Anthropic | null = null
function ai() {
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
  return _client
}

async function callAgent(
  system: string,
  userText: string,
  model: 'claude-haiku-4-5-20251001' | 'claude-sonnet-4-6' = 'claude-haiku-4-5-20251001',
  maxTokens = 2000
): Promise<string> {
  const msg = await ai().messages.create({
    model, max_tokens: maxTokens, system,
    messages: [{ role: 'user', content: userText }],
  })
  const text = msg.content.find(c => c.type === 'text')
  return text?.type === 'text' ? text.text : ''
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function POST(req: NextRequest, ctx: any) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const taskId: string = ctx?.params?.taskId ?? ''

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let body: { revisionPrompt: string; mode: 'finetune' | 'recreate'; currentResult?: Record<string, any> } = {
    revisionPrompt: '', mode: 'finetune',
  }
  try { body = await req.json() } catch { /* use defaults */ }

  const { revisionPrompt, mode } = body

  const stream = new ReadableStream({
    async start(controller) {
      function send(event: string, data: unknown) {
        try { controller.enqueue(sse(event, data)) } catch { /* client disconnected */ }
      }

      try {
        const task = await prisma.projectTask.findFirst({
          where: { id: taskId, workspace: { userId: user.id } },
          include: { workspace: { select: { title: true, objective: true } } },
        })
        if (!task) { send('error', { message: 'Task not found' }); return }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const existingResult = (task.output as Record<string, any>) ?? {}

        const taskCtx = [
          `Task: "${task.title}"`,
          task.workspace.objective ? `Objective: ${task.workspace.objective}` : '',
          `Project: "${task.workspace.title}"`,
          revisionPrompt ? `\nREVISION REQUEST FROM FREELANCER:\n${revisionPrompt}` : '',
        ].filter(Boolean).join('\n')

        // ── FINE-TUNE: targeted AI revision of existing deliverable ───────────
        if (mode === 'finetune') {
          const currentDeliverable = existingResult.deliverable ?? {}

          send('progress', { agent: 'Revision Analyst', role: 'Senior Editor', stage: 1, status: 'working', message: 'Analyzing what needs to change…' })
          const analysisRaw = await callAgent(
            `You are a professional deliverable editor. Analyze what needs to be changed.
Respond ONLY with JSON:
{
  "issueType": "content|structure|tone|accuracy|completeness|formatting",
  "changesNeeded": ["specific change 1", "specific change 2"],
  "sectionsAffected": ["summary"|"mainOutput"|"sections"|"emailDraft"|"nextSteps"]
}`,
            `Current deliverable:\n${JSON.stringify(currentDeliverable).slice(0, 4000)}\n\nRevision request: ${revisionPrompt}`,
            'claude-haiku-4-5-20251001', 700
          )
          const analysis = parseAgent(analysisRaw, {
            issueType: 'content',
            changesNeeded: [revisionPrompt],
            sectionsAffected: ['mainOutput', 'emailDraft'],
          })
          send('progress', { agent: 'Revision Analyst', role: 'Senior Editor', stage: 1, status: 'done' })

          send('progress', { agent: 'Content Editor', role: 'Expert Writer', stage: 2, status: 'working', message: 'Applying changes to the deliverable…' })
          const editorRaw = await callAgent(
            `You are a professional content editor. Apply ONLY the requested changes to the deliverable. Keep every unchanged section exactly as-is.

Return the COMPLETE updated deliverable as JSON — all fields must be present:
{
  "summary": "...",
  "mainOutput": "...",
  "sections": [{"title": "...", "content": "..."}],
  "emailDraft": "...",
  "nextSteps": ["..."]
}`,
            `TASK CONTEXT:\n${taskCtx}

CURRENT DELIVERABLE:
${JSON.stringify(currentDeliverable).slice(0, 5000)}

CHANGES TO APPLY:
${(analysis.changesNeeded as string[]).join('\n')}

Affected sections: ${(analysis.sectionsAffected as string[]).join(', ')}`,
            'claude-sonnet-4-6', 3500
          )
          const updatedDeliverable = parseAgent(editorRaw, currentDeliverable)
          send('progress', { agent: 'Content Editor', role: 'Expert Writer', stage: 2, status: 'done' })

          send('progress', { agent: 'Quality Check', role: 'Department Head', stage: 3, status: 'working', message: 'Reviewing revised content…' })
          const reviewRaw = await callAgent(
            `You are a Department Head. Briefly validate the revised deliverable addresses the requested changes.
Respond ONLY with JSON:
{ "score": 85, "approved": true, "improvements": [], "keyFindings": ["finding 1"], "consolidatedOutput": "" }`,
            `Revision request: ${revisionPrompt}\nRevised deliverable summary: ${String(updatedDeliverable.summary ?? '').slice(0, 500)}`,
            'claude-haiku-4-5-20251001', 600
          )
          const review = parseAgent(reviewRaw, {
            ...(existingResult.review ?? {}),
            improvements: [],
            keyFindings: existingResult.review?.keyFindings ?? [],
          })
          if (!review.consolidatedOutput) review.consolidatedOutput = existingResult.review?.consolidatedOutput ?? ''
          send('progress', { agent: 'Quality Check', role: 'Department Head', stage: 3, status: 'done' })

          const finalResult = {
            ...existingResult,
            review: { ...existingResult.review, ...review },
            deliverable: updatedDeliverable,
            _revised: true,
            _revisionPrompt: revisionPrompt,
          }

          try {
            await prisma.projectTask.update({
              where: { id: taskId },
              data: { output: finalResult as unknown as Prisma.InputJsonValue },
            })
          } catch (saveErr) { console.error('[revise finetune] DB save failed:', saveErr) }

          send('complete', { result: finalResult })

        // ── RECREATE: full fresh pipeline with revision context ───────────────
        } else {
          send('progress', { agent: 'Task Analyst', role: 'Business Analyst', stage: 1, status: 'working', message: 'Re-analysing task with your feedback…' })
          const blueprintRaw = await callAgent(
            `You are a Senior Business Analyst. Re-analyse this task. The previous deliverable had issues (described in the revision request). Create a fresh, improved plan that directly addresses those issues.
Respond ONLY with JSON:
{
  "objective": "clear one-sentence goal",
  "clientNeeds": "what the client specifically needs",
  "deliverables": ["deliverable 1", "deliverable 2"],
  "urgency": "HIGH",
  "taskType": "Report/Proposal/Analysis/Other",
  "requiredSpecialists": ["Specialist A", "Specialist B"]
}`,
            taskCtx, 'claude-sonnet-4-6', 1500
          )
          const blueprint = parseAgent(blueprintRaw, {
            objective: task.title, clientNeeds: revisionPrompt,
            deliverables: [], requiredSpecialists: ['Content Writer'],
          })
          send('progress', { agent: 'Task Analyst', role: 'Business Analyst', stage: 1, status: 'done' })

          const team: string[] = Array.isArray(blueprint.requiredSpecialists)
            ? blueprint.requiredSpecialists.slice(0, 3)
            : ['Content Writer']

          send('progress', { agent: 'Planner', role: 'Project Manager', stage: 2, status: 'working', message: 'Building fresh execution plan…' })
          const planRaw = await callAgent(
            `You are a Senior Project Manager. Create a focused execution plan.
Respond ONLY with JSON:
{ "approach": "1-2 sentence approach", "stages": [{"name":"...","description":"..."}], "estimatedMinutes": 15 }`,
            `${taskCtx}\n\nBlueprint: ${JSON.stringify(blueprint)}`,
            'claude-haiku-4-5-20251001', 800
          )
          const plan = parseAgent(planRaw, { approach: revisionPrompt, stages: [], estimatedMinutes: 15 })
          send('progress', { agent: 'Planner', role: 'Project Manager', stage: 2, status: 'done' })

          // Specialist outputs
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const specialistOutputs: any[] = []
          for (const specialist of team) {
            send('progress', { agent: specialist, role: specialist, stage: 3, status: 'working', message: `${specialist} creating fresh content…` })
            const specRaw = await callAgent(
              `You are a ${specialist}. The previous deliverable was unsatisfactory — create improved, high-quality content addressing the revision request.
Respond ONLY with JSON:
{ "contribution": "detailed expert content", "keyPoints": ["point 1","point 2"], "recommendations": ["rec 1"] }`,
              `${taskCtx}\n\nBlueprint: ${JSON.stringify(blueprint)}`,
              'claude-haiku-4-5-20251001', 1600
            )
            const out = parseAgent(specRaw, { contribution: '', keyPoints: [], recommendations: [] })
            specialistOutputs.push({ specialist, ...out })
            send('progress', { agent: specialist, role: specialist, stage: 3, status: 'done' })
          }

          send('progress', { agent: 'Quality Reviewer', role: 'Department Head', stage: 4, status: 'working', message: 'Quality reviewing fresh content…' })
          const reviewRaw = await callAgent(
            `You are a Department Head. Review and consolidate all specialist outputs into the best possible deliverable.
Respond ONLY with JSON:
{ "score": 88, "approved": true, "improvements": [], "consolidatedOutput": "comprehensive combined output", "keyFindings": ["finding 1","finding 2"] }`,
            `${taskCtx}\n\nSpecialist outputs:\n${JSON.stringify(specialistOutputs)}`,
            'claude-sonnet-4-6', 2500
          )
          const review = parseAgent(reviewRaw, {
            score: 80, approved: true, improvements: [],
            consolidatedOutput: specialistOutputs.map(s => s.contribution).join('\n\n'),
            keyFindings: [],
          })
          send('progress', { agent: 'Quality Reviewer', role: 'Department Head', stage: 4, status: 'done' })

          send('progress', { agent: 'Client Delivery Agent', role: 'Account Manager', stage: 5, status: 'working', message: 'Preparing fresh deliverable…' })
          const deliverableRaw = await callAgent(
            `You are a professional Account Manager preparing the final deliverable.
The previous version had issues — this is a fresh, improved version.
Respond ONLY with JSON:
{
  "summary": "2-3 sentence executive summary",
  "mainOutput": "comprehensive primary deliverable content — full and complete",
  "sections": [{"title": "heading", "content": "section content"}],
  "emailDraft": "complete professional email to client",
  "nextSteps": ["next step 1", "next step 2"]
}`,
            `${taskCtx}\n\nReviewed output:\n${JSON.stringify(review)}`,
            'claude-haiku-4-5-20251001', 2500
          )
          const deliverable = parseAgent(deliverableRaw, {
            summary: 'Deliverable recreated.', mainOutput: review.consolidatedOutput ?? '',
            sections: [], emailDraft: '', nextSteps: [],
          })
          send('progress', { agent: 'Client Delivery Agent', role: 'Account Manager', stage: 5, status: 'done' })

          const finalResult = {
            blueprint, plan,
            team,
            specialistOutputs,
            review,
            deliverable,
            _revised: true,
            _revisionPrompt: revisionPrompt,
          }

          try {
            await prisma.projectTask.update({
              where: { id: taskId },
              data: { output: finalResult as unknown as Prisma.InputJsonValue },
            })
          } catch (saveErr) { console.error('[revise recreate] DB save failed:', saveErr) }

          send('complete', { result: finalResult })
        }

      } catch (err) {
        console.error('[revise] pipeline error:', err)
        const msg = err instanceof Error ? `${err.constructor?.name}: ${err.message}` : 'Revision failed'
        send('error', { message: msg })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type':      'text/event-stream',
      'Cache-Control':     'no-cache, no-transform',
      'Connection':        'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
