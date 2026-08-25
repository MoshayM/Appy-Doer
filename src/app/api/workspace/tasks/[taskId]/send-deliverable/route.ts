import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { decrypt, encrypt } from '@/lib/encrypt'

// ── Types ─────────────────────────────────────────────────────────────────────

interface DeliverableSection { title: string; content: string }
interface SpecialistOutput { specialist: string; contribution: string; keyPoints: string[]; recommendations: string[] }
interface ExecutionResult {
  blueprint?: { objective?: string; taskType?: string }
  team?: string[]
  specialistOutputs?: SpecialistOutput[]
  review?: { score?: number; keyFindings?: string[]; consolidatedOutput?: string }
  deliverable?: { summary?: string; mainOutput?: string; sections?: DeliverableSection[]; emailDraft?: string; nextSteps?: string[] }
}

// ── RFC 2047 subject encoding ─────────────────────────────────────────────────

function encodeSubject(s: string): string {
  return /[^\x00-\x7F]/.test(s) ? `=?UTF-8?B?${Buffer.from(s).toString('base64')}?=` : s
}

// ── HTML report generator ─────────────────────────────────────────────────────

function buildHtmlReport(taskTitle: string, result: ExecutionResult): string {
  const d = result.deliverable ?? {}
  const sections = Array.isArray(d.sections) ? d.sections : []
  const team     = Array.isArray(result.team) ? result.team : []
  const findings = Array.isArray(result.review?.keyFindings) ? result.review!.keyFindings : []
  const steps    = Array.isArray(d.nextSteps) ? d.nextSteps : []

  const sectionHtml = sections.map(s => `
    <div style="margin-bottom:20px">
      <h3 style="color:#4f46e5;font-size:14px;margin:0 0 6px;text-transform:uppercase;letter-spacing:0.05em">${esc(s.title)}</h3>
      <p style="margin:0;color:#374151;line-height:1.7">${esc(s.content).replace(/\n/g, '<br>')}</p>
    </div>`).join('')

  const teamHtml = team.map(t => `<span style="display:inline-block;background:#e0e7ff;color:#4338ca;padding:3px 10px;border-radius:12px;font-size:12px;margin:3px">${esc(t)}</span>`).join(' ')

  const findingsHtml = findings.map(f => `<li style="color:#92400e;margin-bottom:6px">${esc(f)}</li>`).join('')
  const stepsHtml    = steps.map((s, i) => `<li style="margin-bottom:6px"><strong>${i + 1}.</strong> ${esc(s)}</li>`).join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Deliverable: ${esc(taskTitle)}</title>
</head>
<body style="font-family:Arial,Helvetica,sans-serif;color:#111827;background:#f9fafb;margin:0;padding:0">
<div style="max-width:720px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.1)">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:32px 40px;color:#fff">
    <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.1em;opacity:.75;text-transform:uppercase">AppyDoer · Deliverable Report</p>
    <h1 style="margin:0;font-size:22px;font-weight:700">${esc(taskTitle)}</h1>
  </div>

  <div style="padding:32px 40px">

    <!-- AI Team -->
    ${team.length ? `<div style="margin-bottom:28px">
      <p style="margin:0 0 8px;font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:.05em">AI Specialists who worked on this</p>
      <div>${teamHtml}</div>
    </div>` : ''}

    <!-- Summary -->
    ${d.summary ? `<div style="background:#eff6ff;border-left:4px solid #4f46e5;padding:16px 20px;border-radius:0 8px 8px 0;margin-bottom:28px">
      <p style="margin:0 0 4px;font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:.05em">Executive Summary</p>
      <p style="margin:0;color:#1e3a8a;line-height:1.7">${esc(d.summary).replace(/\n/g, '<br>')}</p>
    </div>` : ''}

    <!-- Main Deliverable -->
    ${d.mainOutput ? `<div style="margin-bottom:28px">
      <h2 style="color:#111827;font-size:16px;border-bottom:2px solid #e5e7eb;padding-bottom:8px;margin:0 0 16px">Deliverable</h2>
      <p style="margin:0;color:#374151;line-height:1.8;white-space:pre-wrap">${esc(d.mainOutput)}</p>
    </div>` : ''}

    <!-- Sections -->
    ${sectionHtml ? `<div style="margin-bottom:28px">
      <h2 style="color:#111827;font-size:16px;border-bottom:2px solid #e5e7eb;padding-bottom:8px;margin:0 0 16px">Details</h2>
      ${sectionHtml}
    </div>` : ''}

    <!-- Key Findings -->
    ${findingsHtml ? `<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:20px;margin-bottom:28px">
      <p style="margin:0 0 10px;font-size:11px;color:#92400e;font-weight:600;text-transform:uppercase;letter-spacing:.05em">Key Findings</p>
      <ul style="margin:0;padding-left:18px">${findingsHtml}</ul>
    </div>` : ''}

    <!-- Next Steps -->
    ${stepsHtml ? `<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:20px;margin-bottom:0">
      <p style="margin:0 0 10px;font-size:11px;color:#166534;font-weight:600;text-transform:uppercase;letter-spacing:.05em">Recommended Next Steps</p>
      <ol style="margin:0;padding-left:18px;color:#166534">${stepsHtml}</ol>
    </div>` : ''}

  </div>

  <!-- Footer -->
  <div style="border-top:1px solid #e5e7eb;padding:16px 40px;background:#f9fafb;text-align:center">
    <p style="margin:0;font-size:11px;color:#9ca3af">Prepared by AppyDoer · Confidential</p>
  </div>
</div>
</body>
</html>`
}

// ── Plain-text report generator ───────────────────────────────────────────────

function buildTextReport(taskTitle: string, result: ExecutionResult): string {
  const d    = result.deliverable ?? {}
  const team = Array.isArray(result.team) ? result.team : []
  const sections = Array.isArray(d.sections) ? d.sections : []
  const findings = Array.isArray(result.review?.keyFindings) ? result.review!.keyFindings : []
  const steps    = Array.isArray(d.nextSteps) ? d.nextSteps : []

  const bar = '═'.repeat(60)
  const line = '─'.repeat(60)

  const parts: string[] = [
    bar,
    `  AI WORKBUDDY — DELIVERABLE REPORT`,
    `  ${taskTitle}`,
    bar,
    '',
  ]

  if (team.length) {
    parts.push('AI SPECIALISTS', line, team.join(' · '), '')
  }
  if (d.summary) {
    parts.push('EXECUTIVE SUMMARY', line, d.summary, '')
  }
  if (d.mainOutput) {
    parts.push('DELIVERABLE', line, d.mainOutput, '')
  }
  sections.forEach(s => {
    parts.push(s.title.toUpperCase(), line, s.content, '')
  })
  if (findings.length) {
    parts.push('KEY FINDINGS', line, ...findings.map((f, i) => `${i + 1}. ${f}`), '')
  }
  if (steps.length) {
    parts.push('NEXT STEPS', line, ...steps.map((s, i) => `${i + 1}. ${s}`), '')
  }

  parts.push(bar, 'Prepared by AppyDoer · Confidential', bar)
  return parts.join('\n')
}

// ── HTML escape ───────────────────────────────────────────────────────────────

function esc(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// ── Multipart MIME builder (with or without attachment) ───────────────────────

function buildMimeMessage(
  from: string, to: string, subject: string,
  htmlBody: string,
  attachment?: { filename: string; mimeType: string; content: string }
): string {
  const BOUNDARY = `==AIW_DELIV_${Date.now()}==`

  if (!attachment) {
    const msg = [
      `From: ${from}`, `To: ${to}`,
      `Subject: ${encodeSubject(subject)}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=utf-8',
      '', htmlBody,
    ].join('\r\n')
    return Buffer.from(msg).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  }

  const b64Content = Buffer.from(attachment.content, 'utf-8').toString('base64')
  // Split base64 into 76-char lines (RFC 2045)
  const b64Lines = b64Content.match(/.{1,76}/g)?.join('\r\n') ?? b64Content

  const msg = [
    `From: ${from}`, `To: ${to}`,
    `Subject: ${encodeSubject(subject)}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${BOUNDARY}"`,
    '',
    `--${BOUNDARY}`,
    'Content-Type: text/html; charset=utf-8',
    '',
    htmlBody,
    '',
    `--${BOUNDARY}`,
    `Content-Type: ${attachment.mimeType}; charset=utf-8`,
    `Content-Disposition: attachment; filename="${attachment.filename}"`,
    'Content-Transfer-Encoding: base64',
    '',
    b64Lines,
    '',
    `--${BOUNDARY}--`,
  ].join('\r\n')

  return Buffer.from(msg).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

// ── Gmail token refresh ───────────────────────────────────────────────────────

async function tryRefreshToken(userId: string, encryptedRefresh: string): Promise<string | null> {
  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: decrypt(encryptedRefresh),
        client_id: process.env.GOOGLE_CLIENT_ID ?? '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      }),
    })
    const d = await res.json()
    if (!d.access_token) return null
    const expiry = new Date(Date.now() + (d.expires_in ?? 3600) * 1000)
    await prisma.connectedAccount.update({
      where: { userId_platform: { userId, platform: 'GMAIL' } },
      data: { accessToken: encrypt(d.access_token), tokenExpiry: expiry, status: 'active' },
    })
    return d.access_token
  } catch { return null }
}

// ── Route ─────────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const POST = withAuth(async (req: NextRequest, user, ctx: any) => {
  const taskId: string = ctx?.params?.taskId ?? ''
  const { toEmail, toName, subject, emailBody, attachmentFormat = 'html' } = await req.json()

  if (!toEmail) return NextResponse.json({ error: { code: 'MISSING_EMAIL', message: 'Recipient email required' } }, { status: 400 })
  if (!subject) return NextResponse.json({ error: { code: 'MISSING_SUBJECT', message: 'Subject required' } }, { status: 400 })

  // Load task and its execution result
  const task = await prisma.projectTask.findFirst({
    where: { id: taskId, workspace: { userId: user.id } },
    select: { id: true, title: true, output: true },
  })
  if (!task) return NextResponse.json({ error: { code: 'NOT_FOUND' } }, { status: 404 })

  const result: ExecutionResult = (task.output as ExecutionResult) ?? {}

  // Get Gmail account
  const gmail = await prisma.connectedAccount.findUnique({
    where: { userId_platform: { userId: user.id, platform: 'GMAIL' } },
  })

  const gmailConnected = !!(gmail?.accessToken && gmail.enabled !== false)
  if (!gmailConnected) {
    return NextResponse.json({ sent: false, sentVia: 'NONE', gmailConnected: false, error: 'Gmail not connected. Please connect Gmail in Settings.' })
  }

  // Build email body HTML
  const bodyHtml = `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.7;color:#111827;max-width:600px">
${esc(emailBody).replace(/\n/g, '<br>')}
</div>`

  // Build attachment
  let attachment: { filename: string; mimeType: string; content: string } | undefined
  if (attachmentFormat === 'html') {
    attachment = {
      filename: `${task.title.replace(/[^a-zA-Z0-9]/g, '-').slice(0, 40)}-report.html`,
      mimeType: 'text/html',
      content: buildHtmlReport(task.title, result),
    }
  } else if (attachmentFormat === 'text') {
    attachment = {
      filename: `${task.title.replace(/[^a-zA-Z0-9]/g, '-').slice(0, 40)}-report.txt`,
      mimeType: 'text/plain',
      content: buildTextReport(task.title, result),
    }
  }

  // Send via Gmail
  let accessToken = decrypt(gmail!.accessToken!)
  const senderEmail = gmail!.accountEmail ?? user.email
  const toFormatted = toName ? `${toName} <${toEmail}>` : toEmail

  const raw = buildMimeMessage(senderEmail, toFormatted, subject, bodyHtml, attachment)

  let gmailRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw }),
  })

  // Retry once after token refresh if 401
  if (gmailRes.status === 401 && gmail!.refreshToken) {
    const newToken = await tryRefreshToken(user.id, gmail!.refreshToken)
    if (newToken) {
      accessToken = newToken
      gmailRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: { Authorization: `Bearer ${newToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw }),
      })
    }
  }

  if (!gmailRes.ok) {
    const errText = await gmailRes.text()
    console.error('[send-deliverable] Gmail error:', gmailRes.status, errText)
    return NextResponse.json({ sent: false, sentVia: 'NONE', gmailConnected: true, error: `Gmail send failed (${gmailRes.status})` })
  }

  const gmailData = await gmailRes.json()
  const gmailMsgId: string = gmailData.id ?? ''
  const gmailThreadId: string = gmailData.threadId ?? gmailMsgId

  // Record the sent email in EmailThread / EmailMessage (best-effort)
  try {
    let thread = await prisma.emailThread.findFirst({
      where: { userId: user.id, contactEmail: toEmail },
      orderBy: { lastMessageAt: 'desc' },
    })
    if (!thread) {
      thread = await prisma.emailThread.create({
        data: {
          userId: user.id,
          gmailThreadId,
          contactEmail: toEmail,
          contactName: toName ?? null,
          subject,
          status: 'SENT',
          lastMessageAt: new Date(),
        },
      })
    } else {
      await prisma.emailThread.update({
        where: { id: thread.id },
        data: { lastMessageAt: new Date(), status: 'SENT', updatedAt: new Date() },
      })
    }
    await prisma.emailMessage.create({
      data: {
        threadId: thread.id,
        gmailMessageId: gmailMsgId || `local-${Date.now()}`,
        fromEmail: senderEmail,
        toEmail,
        subject,
        bodyText: emailBody,
        isInbound: false,
        sentAt: new Date(),
      },
    })
  } catch (dbErr) {
    console.error('[send-deliverable] DB record failed:', dbErr)
  }

  return NextResponse.json({ sent: true, sentVia: 'GMAIL', gmailConnected: true })
})
