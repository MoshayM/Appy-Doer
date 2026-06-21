import { prisma } from '@/lib/prisma'
import { getValidGmailToken } from '@/lib/services/gmail'
import { NotificationService } from '@/lib/services/notification'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

interface GmailMessage {
  id: string
  threadId: string
  payload?: {
    headers?: { name: string; value: string }[]
    parts?: GmailPart[]
    body?: { data?: string }
    mimeType?: string
  }
  internalDate?: string
}

interface GmailPart {
  mimeType?: string
  body?: { data?: string }
  parts?: GmailPart[]
}

interface GmailThread {
  id: string
  messages: GmailMessage[]
}

function base64Decode(encoded: string): string {
  try {
    return Buffer.from(encoded.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8')
  } catch {
    return ''
  }
}

function extractBody(msg: GmailMessage): { html: string; text: string } {
  function walkParts(parts: GmailPart[]): { html: string; text: string } {
    let html = ''
    let text = ''
    for (const part of parts) {
      if (part.mimeType === 'text/html' && part.body?.data) html = base64Decode(part.body.data)
      else if (part.mimeType === 'text/plain' && part.body?.data) text = base64Decode(part.body.data)
      else if (part.parts) {
        const sub = walkParts(part.parts)
        if (!html && sub.html) html = sub.html
        if (!text && sub.text) text = sub.text
      }
    }
    return { html, text }
  }

  const payload = msg.payload
  if (!payload) return { html: '', text: '' }
  if (payload.parts) return walkParts(payload.parts)
  if (payload.body?.data) {
    const decoded = base64Decode(payload.body.data)
    return payload.mimeType === 'text/html' ? { html: decoded, text: '' } : { html: '', text: decoded }
  }
  return { html: '', text: '' }
}

function getHeader(msg: GmailMessage, name: string): string {
  return msg.payload?.headers?.find(h => h.name.toLowerCase() === name.toLowerCase())?.value ?? ''
}

async function fetchGmailThread(accessToken: string, threadId: string): Promise<GmailThread | null> {
  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/threads/${threadId}?format=full`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  )
  if (!res.ok) return null
  return res.json()
}

async function markThreadRead(accessToken: string, threadId: string): Promise<void> {
  await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/threads/${threadId}/modify`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ removeLabelIds: ['UNREAD'] }),
  }).catch(() => {})
}

async function analyzeReply(bodyText: string, contactName: string): Promise<{ intent: string; summary: string; aiInsight: string }> {
  try {
    const res = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      messages: [{
        role: 'user',
        content: `Analyze this email reply from a prospect named ${contactName || 'the prospect'}.

Reply:
${bodyText.slice(0, 1500)}

Respond with ONLY this JSON:
{
  "intent": "INTERESTED | NEED_QUOTE | NEED_MEETING | NEED_SAMPLE | NOT_INTERESTED | WRONG_CONTACT | OUT_OF_OFFICE | SPAM",
  "summary": "One sentence summary of what the prospect said",
  "suggestedAction": "One sentence on what to do next"
}`,
      }],
    })
    const raw = res.content[0].type === 'text' ? res.content[0].text : '{}'
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(cleaned)
    return {
      intent: parsed.intent ?? 'REPLIED',
      summary: parsed.summary ?? 'Prospect replied to your email.',
      aiInsight: parsed.suggestedAction ?? '',
    }
  } catch {
    return { intent: 'REPLIED', summary: 'Prospect replied to your email.', aiInsight: '' }
  }
}

const INTENT_TO_LEAD_STAGE: Record<string, string> = {
  INTERESTED:    'INTERESTED',
  NEED_QUOTE:    'INTERESTED',
  NEED_MEETING:  'INTERESTED',
  NEED_SAMPLE:   'INTERESTED',
  NOT_INTERESTED:'LOST',
}

export async function syncGmailForUser(userId: string): Promise<{ synced: number; newReplies: number }> {
  const accessToken = await getValidGmailToken(userId)
  if (!accessToken) return { synced: 0, newReplies: 0 }

  const gmailAccount = await prisma.connectedAccount.findUnique({
    where: { userId_platform: { userId, platform: 'GMAIL' } },
    select: { accountEmail: true },
  })
  const userEmail = gmailAccount?.accountEmail ?? ''

  // Get threads that are still active
  const threads = await prisma.emailThread.findMany({
    where: {
      userId,
      status: { notIn: ['WON', 'LOST'] },
    },
    include: {
      messages: { select: { gmailMessageId: true } },
    },
    orderBy: { lastMessageAt: 'desc' },
    take: 50,
  })

  let synced = 0
  let newReplies = 0

  for (const thread of threads) {
    try {
      const gmailThread = await fetchGmailThread(accessToken, thread.gmailThreadId)
      if (!gmailThread) continue

      const existingMsgIds = new Set(thread.messages.map(m => m.gmailMessageId))
      let hadNewInbound = false

      for (const gmailMsg of gmailThread.messages) {
        if (existingMsgIds.has(gmailMsg.id)) continue

        const fromHeader = getHeader(gmailMsg, 'from')
        const fromEmail  = fromHeader.match(/<(.+?)>/)?.[1] ?? fromHeader
        const fromName   = fromHeader.match(/^(.+?)</)?.[1]?.trim().replace(/"/g, '') ?? ''
        const toHeader   = getHeader(gmailMsg, 'to')
        const subject    = getHeader(gmailMsg, 'subject') || thread.subject
        const isInbound  = fromEmail.toLowerCase() !== userEmail.toLowerCase()
        const sentAt     = gmailMsg.internalDate
          ? new Date(parseInt(gmailMsg.internalDate))
          : new Date()
        const { html, text } = extractBody(gmailMsg)

        await prisma.emailMessage.create({
          data: {
            threadId:       thread.id,
            gmailMessageId: gmailMsg.id,
            fromEmail,
            fromName,
            toEmail:        toHeader,
            subject,
            bodyHtml:       html || null,
            bodyText:       text || null,
            isInbound,
            sentAt,
          },
        })

        if (isInbound) hadNewInbound = true
      }

      if (hadNewInbound) {
        newReplies++

        // AI analysis on latest inbound message
        const latestInbound = gmailThread.messages
          .filter(m => {
            const from = getHeader(m, 'from')
            const fe = from.match(/<(.+?)>/)?.[1] ?? from
            return fe.toLowerCase() !== userEmail.toLowerCase()
          })
          .pop()

        const { html, text } = latestInbound ? extractBody(latestInbound) : { html: '', text: '' }
        const replyText = text || html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
        const analysis  = await analyzeReply(replyText, thread.contactName ?? '')

        const newStatus = analysis.intent === 'NOT_INTERESTED' ? 'LOST'
          : analysis.intent === 'NEED_QUOTE' || analysis.intent === 'INTERESTED' || analysis.intent === 'NEED_MEETING' ? 'REPLIED'
          : 'REPLIED'

        await prisma.emailThread.update({
          where: { id: thread.id },
          data: {
            status:       newStatus as 'SENT' | 'OPENED' | 'REPLIED' | 'INTERESTED' | 'NEGOTIATING' | 'WON' | 'LOST',
            unreadCount:  { increment: 1 },
            lastMessageAt: new Date(),
            aiIntent:     analysis.intent,
            aiInsight:    `${analysis.summary}${analysis.aiInsight ? ' ' + analysis.aiInsight : ''}`,
          },
        })

        // Update CRM lead stage if linked
        if (thread.leadId && INTENT_TO_LEAD_STAGE[analysis.intent]) {
          await prisma.lead.update({
            where: { id: thread.leadId },
            data:  { stage: INTENT_TO_LEAD_STAGE[analysis.intent] as 'INTERESTED' | 'LOST', lastActivityAt: new Date() },
          }).catch(() => {})
        }

        // Create in-app notification
        await NotificationService.send({
          userId,
          type: 'REPLY_RECEIVED',
          channel: 'IN_APP',
          title: `${thread.contactName || thread.contactEmail} replied!`,
          body: analysis.summary,
          meta: { threadId: thread.id, intent: analysis.intent, contactEmail: thread.contactEmail },
        })

        // Mark as read in Gmail (optional — respects user preference)
        // await markThreadRead(accessToken, thread.gmailThreadId)
      } else if (thread.status === 'SENT') {
        // Check for open tracking via Gmail (opened if they fetched it)
        // Thread has messages but no new inbound — keep as is
      }

      synced++
    } catch (err) {
      console.error(`[gmail-sync] error syncing thread ${thread.gmailThreadId}`, err)
    }
  }

  // Update lastSyncAt on ConnectedAccount
  await prisma.connectedAccount.updateMany({
    where: { userId, platform: 'GMAIL' },
    data: { lastSyncAt: new Date() } as never,
  })

  return { synced, newReplies }
}

export async function syncGmailForAllUsers(): Promise<{ users: number; totalReplies: number }> {
  const accounts = await prisma.connectedAccount.findMany({
    where: { platform: 'GMAIL', status: 'active', enabled: true },
    select: { userId: true },
  })

  let totalReplies = 0
  for (const account of accounts) {
    try {
      const result = await syncGmailForUser(account.userId)
      totalReplies += result.newReplies
    } catch (err) {
      console.error(`[gmail-sync] failed for user ${account.userId}`, err)
    }
  }

  return { users: accounts.length, totalReplies }
}
