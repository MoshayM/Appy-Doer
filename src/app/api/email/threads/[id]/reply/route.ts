import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getValidGmailToken } from '@/lib/services/gmail'
import { decrypt, encrypt } from '@/lib/encrypt'
import { logActivity } from '@/lib/activity'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

function encodeSubject(subject: string): string {
  if (/[^\x00-\x7F]/.test(subject)) {
    return `=?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`
  }
  return subject
}

type Attachment = { filename: string; mimeType: string; dataBase64: string }

function buildReplyMessage(
  from: string, to: string, subject: string,
  html: string, threadId: string, messageId: string,
  attachments: Attachment[] = [],
): string {
  const replySubject = subject.startsWith('Re:') ? subject : `Re: ${subject}`

  if (attachments.length === 0) {
    const msg = [
      `From: ${from}`, `To: ${to}`,
      `Subject: ${encodeSubject(replySubject)}`,
      `In-Reply-To: ${messageId}`, `References: ${messageId}`,
      'MIME-Version: 1.0', 'Content-Type: text/html; charset=utf-8', '', html,
    ].join('\r\n')
    return Buffer.from(msg).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  }

  const boundary = `----=_Part_${Date.now()}`
  const lines: string[] = [
    `From: ${from}`, `To: ${to}`,
    `Subject: ${encodeSubject(replySubject)}`,
    `In-Reply-To: ${messageId}`, `References: ${messageId}`,
    'MIME-Version: 1.0', `Content-Type: multipart/mixed; boundary="${boundary}"`, '',
    `--${boundary}`, 'Content-Type: text/html; charset=utf-8', '', html,
  ]
  for (const att of attachments) {
    const safeFilename = att.filename.replace(/[^\w.\-]/g, '_')
    lines.push(
      `--${boundary}`,
      `Content-Type: ${att.mimeType}; name="${safeFilename}"`,
      `Content-Disposition: attachment; filename="${safeFilename}"`,
      'Content-Transfer-Encoding: base64', '',
      (att.dataBase64.match(/.{1,76}/g) ?? [att.dataBase64]).join('\r\n'),
    )
  }
  lines.push(`--${boundary}--`)
  return Buffer.from(lines.join('\r\n')).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export const POST = withAuth(async (req: NextRequest, user, ctx) => {
  const threadId = ctx?.params?.id as string
  const { body, subject, attachments = [] } = await req.json() as { body: string; subject?: string; attachments?: Attachment[] }

  if (!body?.trim()) {
    return NextResponse.json({ error: { code: 'INVALID_INPUT', message: 'Reply body required' } }, { status: 400 })
  }

  const thread = await prisma.emailThread.findFirst({
    where: { id: threadId, userId: user.id },
    include: { messages: { orderBy: { sentAt: 'desc' }, take: 1 } },
  })
  if (!thread) return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Thread not found' } }, { status: 404 })

  const gmailAccount = await prisma.connectedAccount.findUnique({
    where: { userId_platform: { userId: user.id, platform: 'GMAIL' } },
  })
  if (!gmailAccount?.accessToken) {
    return NextResponse.json({ error: { code: 'GMAIL_NOT_CONNECTED', message: 'Connect Gmail to reply' } }, { status: 400 })
  }

  const accessToken = await getValidGmailToken(user.id)
  if (!accessToken) {
    return NextResponse.json({ error: { code: 'GMAIL_TOKEN_INVALID', message: 'Gmail token expired — please reconnect' } }, { status: 401 })
  }

  const senderEmail = gmailAccount.accountEmail ?? user.email
  const lastMsg     = thread.messages[0]
  const lastMsgId   = lastMsg?.gmailMessageId ? `<${lastMsg.gmailMessageId}>` : ''
  const replySubject = subject || (thread.subject.startsWith('Re:') ? thread.subject : `Re: ${thread.subject}`)

  const htmlBody = `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;max-width:600px">${body.replace(/\n/g, '<br>')}</div>`
  const raw = buildReplyMessage(senderEmail, thread.contactEmail, replySubject, htmlBody, thread.gmailThreadId, lastMsgId, attachments)

  const gmailRes = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/send`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw, threadId: thread.gmailThreadId }),
    },
  )

  if (!gmailRes.ok) {
    const errData = await gmailRes.json().catch(() => ({}))
    const msg = (errData as {error?: {message?: string}}).error?.message ?? 'Gmail send failed'
    return NextResponse.json({ error: { code: 'GMAIL_SEND_FAILED', message: msg } }, { status: 500 })
  }

  const gmailData = await gmailRes.json() as { id: string; threadId: string }

  // Save as outbound EmailMessage
  await prisma.emailMessage.create({
    data: {
      threadId:       thread.id,
      gmailMessageId: gmailData.id,
      fromEmail:      senderEmail,
      fromName:       user.email,
      toEmail:        thread.contactEmail,
      subject:        replySubject,
      bodyHtml:       htmlBody,
      bodyText:       body,
      isInbound:      false,
      sentAt:         new Date(),
    },
  })

  await prisma.emailThread.update({
    where:  { id: thread.id },
    data:   { lastMessageAt: new Date(), status: 'REPLIED', updatedAt: new Date() },
  })

  await logActivity(user.id, user.role, 'EMAIL_REPLY_SENT', { threadId: thread.id, to: thread.contactEmail })

  return NextResponse.json({ success: true, gmailMessageId: gmailData.id })
})
