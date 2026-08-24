import { prisma } from './prisma'
import { decrypt, encrypt } from './encrypt'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AttachmentImage {
  filename: string
  mimeType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
  base64: string // standard base64
}

export interface EmailAttachments {
  images: AttachmentImage[]
  otherFiles: string[] // filenames of non-image attachments (PDFs, docs, etc.)
}

// ── Internals ─────────────────────────────────────────────────────────────────

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
const MAX_IMAGE_BYTES = 4 * 1024 * 1024 // 4 MB per image

interface GmailPart {
  mimeType: string
  filename?: string
  body?: { attachmentId?: string; size?: number; data?: string }
  parts?: GmailPart[]
}

function extractAttachmentParts(payload: GmailPart): { filename: string; mimeType: string; attachmentId: string; size: number }[] {
  const result: { filename: string; mimeType: string; attachmentId: string; size: number }[] = []

  if (payload.filename && payload.body?.attachmentId) {
    result.push({
      filename: payload.filename,
      mimeType: payload.mimeType,
      attachmentId: payload.body.attachmentId,
      size: payload.body.size ?? 0,
    })
  }

  if (payload.parts) {
    for (const part of payload.parts) {
      result.push(...extractAttachmentParts(part))
    }
  }

  return result
}

// ── Gmail token (with auto-refresh) ──────────────────────────────────────────

export async function getGmailAccessToken(userId: string): Promise<string | null> {
  try {
    const account = await prisma.connectedAccount.findUnique({
      where: { userId_platform: { userId, platform: 'GMAIL' } },
    })
    if (!account?.accessToken || account.enabled === false) return null

    // Return current token if still valid (with 5-min buffer)
    const fiveMinFuture = new Date(Date.now() + 5 * 60 * 1000)
    if (!account.tokenExpiry || account.tokenExpiry > fiveMinFuture) {
      return decrypt(account.accessToken)
    }

    // Refresh expired token
    if (!account.refreshToken) return null
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type:    'refresh_token',
        refresh_token: decrypt(account.refreshToken),
        client_id:     process.env.GOOGLE_CLIENT_ID ?? '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      }),
    })
    const d = await res.json()
    if (!d.access_token) return null

    await prisma.connectedAccount.update({
      where: { userId_platform: { userId, platform: 'GMAIL' } },
      data: {
        accessToken:  encrypt(d.access_token),
        tokenExpiry:  new Date(Date.now() + (d.expires_in ?? 3600) * 1000),
        status:       'active',
      },
    })
    return d.access_token
  } catch { return null }
}

// ── Main: fetch attachments from inbound Gmail messages ───────────────────────
//
// Only processes inbound (client) messages.
// Downloads images for Claude Vision; notes other file types by name.

export async function fetchEmailAttachments(
  gmailMessageIds: string[], // IDs from inbound EmailMessage rows
  accessToken: string,
  maxImages = 4
): Promise<EmailAttachments> {
  const images: AttachmentImage[] = []
  const otherFiles: string[] = []

  for (const msgId of gmailMessageIds) {
    if (!msgId || images.length >= maxImages) break

    try {
      const msgRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgId}?format=full`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )
      if (!msgRes.ok) continue

      const msgData = await msgRes.json()
      const parts = extractAttachmentParts(msgData.payload ?? {})

      for (const part of parts) {
        if (images.length >= maxImages) break

        if (IMAGE_TYPES.has(part.mimeType) && part.size > 0 && part.size <= MAX_IMAGE_BYTES) {
          const attRes = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgId}/attachments/${part.attachmentId}`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          )
          if (!attRes.ok) continue

          const attData = await attRes.json()
          if (!attData.data) continue

          // Gmail returns base64url; convert to standard base64
          const base64 = (attData.data as string).replace(/-/g, '+').replace(/_/g, '/')

          images.push({
            filename: part.filename,
            mimeType: part.mimeType as AttachmentImage['mimeType'],
            base64,
          })
        } else if (part.filename) {
          otherFiles.push(part.filename)
        }
      }
    } catch { /* skip — don't fail the pipeline over one message */ }
  }

  return { images, otherFiles }
}
