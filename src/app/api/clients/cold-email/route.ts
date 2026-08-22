import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Anthropic from '@anthropic-ai/sdk'
import { logActivity } from '@/lib/activity'
import { decrypt, encrypt } from '@/lib/encrypt'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

// RFC 2047 encode non-ASCII subject so Gmail API accepts it
function encodeSubject(subject: string): string {
  if (/[^\x00-\x7F]/.test(subject)) {
    return `=?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`
  }
  return subject
}

// Build base64url-encoded RFC 2822 message for Gmail API
function buildGmailMessage(from: string, to: string, subject: string, html: string): string {
  const msg = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${encodeSubject(subject)}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=utf-8',
    '',
    html,
  ].join('\r\n')
  return Buffer.from(msg).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

// Try to refresh the Gmail access token
async function refreshGmailToken(refreshToken: string): Promise<string | null> {
  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type:    'refresh_token',
        refresh_token: refreshToken,
        client_id:     process.env.GOOGLE_CLIENT_ID ?? '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      }),
    })
    const data = await res.json()
    return data.access_token ?? null
  } catch {
    return null
  }
}

export const POST = withAuth(async (req: NextRequest, user) => {
  const {
    prospectName, prospectCompany, prospectRole, prospectEmail,
    outreachAngle, prewrittenSubject, prewrittenBody,
    sendVia = 'auto',
    draftOnly = false,
    leadId: rawLeadId,
  } = await req.json()

  // Auto-resolve leadId by email if not passed explicitly
  let leadId: string | null = rawLeadId ?? null
  if (!leadId && prospectEmail && !draftOnly) {
    const matched = await prisma.lead.findFirst({
      where: { userId: user.id, contact: { contains: prospectEmail, mode: 'insensitive' } },
      select: { id: true },
    })
    if (matched) leadId = matched.id
  }

  if (!prospectEmail && !outreachAngle) {
    return NextResponse.json({ error: { code: 'INVALID_INPUT', message: 'Prospect details required' } }, { status: 400 })
  }

  // Gather context: skills, offer, profile link, connected accounts
  const [skillRun, offerRun, profile, userContext, gmailAccount] = await Promise.all([
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
    prisma.professionalProfile.findFirst({
      where: { userId: user.id, published: true },
      select: { websiteSlug: true },
    }),
    prisma.userContext.findUnique({ where: { userId: user.id } }),
    prisma.connectedAccount.findUnique({
      where: { userId_platform: { userId: user.id, platform: 'GMAIL' } },
    }),
  ])

  const profileUrl = profile?.websiteSlug ? `${APP_URL}/p/${profile.websiteSlug}` : null
  const skillData  = skillRun?.outputJson as Record<string, unknown> | null
  const offerData  = offerRun?.outputJson as Record<string, unknown> | null

  // ── Generate content ────────────────────────────────────────────────────────
  let subject = (prewrittenSubject as string | undefined) ?? 'Quick question about [Service]'
  let body    = (prewrittenBody    as string | undefined) ?? ''

  if (!prewrittenSubject || !prewrittenBody) {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    try {
      const res = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 800,
        messages: [{
          role: 'user',
          content: `Generate a concise, personalized cold email for an Indian freelancer reaching out to a prospect.

Freelancer context:
- Profession: ${userContext?.profession ?? 'Freelancer'}
- Key skills: ${(skillData?.monetizableSkills as string[] | undefined)?.slice(0, 4).join(', ') ?? 'Various skills'}
- Service offer: ${(offerData as { offerName?: string } | null)?.offerName ?? 'Freelance services'}
- Positioning: ${(offerData as { positioningStatement?: string } | null)?.positioningStatement ?? ''}
${profileUrl ? `- Portfolio/profile: ${profileUrl}` : ''}

Prospect:
- Name: ${prospectName}
- Company: ${prospectCompany}
- Role: ${prospectRole}
- Outreach angle: ${outreachAngle}

Write a cold email under 200 words. Opens with the outreach angle, shows value in 2-3 lines, includes a 15-min call CTA, ends with signature and portfolio link if available.

Respond with ONLY this JSON:
{ "subject": "Email subject line", "body": "Full email body" }`,
        }],
      })
      const raw    = res.content[0].type === 'text' ? res.content[0].text : ''
      const parsed = JSON.parse(raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim())
      subject = parsed.subject ?? subject
      body    = parsed.body    ?? ''
    } catch (err) {
      console.error('[cold-email] generation failed', err)
      return NextResponse.json({ error: { code: 'GENERATION_FAILED', message: 'Failed to generate email' } }, { status: 500 })
    }
  }

  // ── Draft-only: return generated content without sending ───────────────────
  if (draftOnly) {
    return NextResponse.json({ subject, body, sent: false, sentVia: 'NONE', profileUrl, trackingId: null, gmailConnected: !!gmailAccount?.accessToken })
  }

  // ── Create EmailTrack record for tracking pixel ─────────────────────────────
  let trackingId: string | null = null
  if (prospectEmail) {
    try {
      const track = await prisma.emailTrack.create({
        data: {
          userId:        user.id,
          leadId:        leadId ?? null,
          recipientEmail: prospectEmail,
          subject,
          sentVia:       'PENDING',
        },
      })
      trackingId = track.trackingId
    } catch { /* non-critical */ }
  }

  // ── HTML body with tracking pixel ──────────────────────────────────────────
  const htmlBody = `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;max-width:600px">
${body.replace(/\n/g, '<br>')}
</div>
${trackingId ? `<img src="${APP_URL}/api/track/email/${trackingId}" width="1" height="1" alt="" style="display:none">` : ''}`

  // ── Try Gmail first if connected ────────────────────────────────────────────
  let sent            = false
  let sentVia         = 'NONE'
  let gmailThreadId:  string | null = null
  let gmailMessageId: string | null = null
  let gmailSenderEmail: string | null = null
  let gmailError: string | null = null
  const useGmail   = (sendVia === 'gmail' || sendVia === 'auto')
                     && gmailAccount?.accessToken
                     && gmailAccount?.enabled !== false

  if (useGmail && prospectEmail) {
    try {
      let accessToken   = decrypt(gmailAccount!.accessToken!)
      const senderEmail = gmailAccount!.accountEmail ?? user.email
      gmailSenderEmail  = senderEmail
      const raw         = buildGmailMessage(senderEmail, prospectEmail, subject, htmlBody)

      let gmailRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify({ raw }),
      })

      // Try token refresh on 401
      if (gmailRes.status === 401 && gmailAccount!.refreshToken) {
        const newToken = await refreshGmailToken(decrypt(gmailAccount!.refreshToken!))
        if (newToken) {
          accessToken = newToken
          await prisma.connectedAccount.update({
            where: { userId_platform: { userId: user.id, platform: 'GMAIL' } },
            data:  { accessToken: encrypt(newToken) },
          })
          gmailRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
            method: 'POST',
            headers: { Authorization: `Bearer ${newToken}`, 'Content-Type': 'application/json' },
            body:    JSON.stringify({ raw }),
          })
        } else {
          gmailError = 'Gmail token expired and refresh failed — please reconnect Gmail'
        }
      }

      if (gmailRes.ok) {
        const gmailData = await gmailRes.json()
        gmailThreadId  = gmailData.threadId ?? null
        gmailMessageId = gmailData.id       ?? null
        sent    = true
        sentVia = 'GMAIL'
        await logActivity(user.id, user.role, 'COLD_EMAIL_SENT', { to: prospectEmail, company: prospectCompany, via: 'gmail' })
      } else if (!gmailError) {
        // Capture the actual Gmail API error message
        let errBody: { error?: { message?: string; status?: string } } = {}
        try { errBody = await gmailRes.json() } catch { /* ignore */ }
        const apiMsg = errBody?.error?.message ?? errBody?.error?.status ?? `HTTP ${gmailRes.status}`
        gmailError = `Gmail API error: ${apiMsg}`
        console.error('[cold-email] gmail send error', gmailRes.status, errBody)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      gmailError = `Gmail send failed: ${msg}`
      console.error('[cold-email] gmail send exception', err)
    }
  }

  // ── Fallback: Resend ────────────────────────────────────────────────────────
  if (!sent && (sendVia === 'resend' || sendVia === 'auto') && process.env.RESEND_API_KEY && prospectEmail) {
    try {
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'AI WorkBuddy <onboarding@resend.dev>',
          to:   [prospectEmail],
          subject,
          html: htmlBody,
        }),
      })
      if (resendRes.ok) {
        sent    = true
        sentVia = 'RESEND'
        await logActivity(user.id, user.role, 'COLD_EMAIL_SENT', { to: prospectEmail, company: prospectCompany, via: 'resend' })
      }
    } catch (err) {
      console.error('[cold-email] resend failed', err)
    }
  }

  // ── Update EmailTrack with actual sentVia + threadId ───────────────────────
  if (trackingId) {
    try {
      await prisma.emailTrack.update({
        where: { trackingId },
        data:  { sentVia: sentVia, gmailThreadId, gmailMessageId },
      })
    } catch { /* non-critical */ }
  }

  // ── Create EmailThread + initial EmailMessage for conversation tracking ──────
  if (sent && sentVia === 'GMAIL' && gmailThreadId && prospectEmail) {
    try {
      let thread = await prisma.emailThread.findUnique({
        where: { userId_gmailThreadId: { userId: user.id, gmailThreadId } },
      })
      if (!thread) {
        thread = await prisma.emailThread.create({
          data: {
            userId:        user.id,
            leadId:        leadId ?? null,
            gmailThreadId,
            contactEmail:  prospectEmail,
            contactName:   prospectName ?? null,
            subject,
            status:        'SENT',
            lastMessageAt: new Date(),
          },
        })
      }
      // Store the sent message immediately so the conversation view shows it right away
      if (thread && gmailMessageId) {
        await prisma.emailMessage.upsert({
          where:  { gmailMessageId },
          update: {},
          create: {
            threadId:       thread.id,
            gmailMessageId,
            fromEmail:      gmailSenderEmail ?? user.email,
            toEmail:        prospectEmail,
            subject,
            bodyHtml:       htmlBody,
            bodyText:       body,
            isInbound:      false,
            sentAt:         new Date(),
          },
        })
      }
    } catch (err) {
      console.error('[cold-email] failed to create EmailThread/EmailMessage', err)
    }
  }

  // Auto-advance lead stage to Proposal Sent when email goes out
  if (sent && leadId) {
    try {
      await prisma.lead.update({
        where: { id: leadId },
        data:  { stage: 'PROPOSAL_SENT', lastActivityAt: new Date() },
      })
    } catch { /* non-critical */ }
  }

  return NextResponse.json({
    subject,
    body,
    sent,
    sentVia,
    profileUrl,
    trackingId,
    gmailConnected: !!gmailAccount?.accessToken && gmailAccount?.enabled !== false,
    gmailError: sent ? null : gmailError,
  })
})
