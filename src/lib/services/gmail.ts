import { prisma } from '@/lib/prisma'
import { encrypt, decrypt } from '@/lib/encrypt'

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_REVOKE_URL = 'https://oauth2.googleapis.com/revoke'

export interface GmailTokens {
  accessToken: string
  refreshToken: string | null
  expiresAt: Date | null
}

export async function getValidGmailToken(userId: string): Promise<string | null> {
  const account = await prisma.connectedAccount.findUnique({
    where: { userId_platform: { userId, platform: 'GMAIL' } },
    select: { accessToken: true, refreshToken: true, tokenExpiry: true, status: true },
  })

  if (!account || account.status !== 'active' || !account.accessToken) return null

  const accessToken = decrypt(account.accessToken)

  // Token is still valid (with 5-min buffer)
  if (account.tokenExpiry && account.tokenExpiry.getTime() > Date.now() + 5 * 60 * 1000) {
    return accessToken
  }

  // Try refresh
  if (!account.refreshToken) return null

  const refreshToken = decrypt(account.refreshToken)
  const refreshed = await refreshGmailToken(userId, refreshToken)
  return refreshed
}

async function refreshGmailToken(userId: string, refreshToken: string): Promise<string | null> {
  try {
    const res = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type:    'refresh_token',
        refresh_token: refreshToken,
        client_id:     process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      }),
    })

    if (!res.ok) {
      // Refresh token is invalid — mark account as expired
      await prisma.connectedAccount.updateMany({
        where: { userId, platform: 'GMAIL' },
        data:  { status: 'expired' },
      })
      return null
    }

    const data = await res.json() as { access_token: string; expires_in: number }

    await prisma.connectedAccount.updateMany({
      where: { userId, platform: 'GMAIL' },
      data: {
        accessToken: encrypt(data.access_token),
        tokenExpiry: new Date(Date.now() + data.expires_in * 1000),
        status:      'active',
        updatedAt:   new Date(),
      },
    })

    return data.access_token
  } catch {
    return null
  }
}

export async function revokeGmailToken(userId: string): Promise<void> {
  const account = await prisma.connectedAccount.findUnique({
    where:  { userId_platform: { userId, platform: 'GMAIL' } },
    select: { accessToken: true, refreshToken: true },
  })

  if (!account) return

  // Revoke both tokens at Google (revoke refresh token first — it invalidates access too)
  const tokenToRevoke = account.refreshToken
    ? decrypt(account.refreshToken)
    : account.accessToken
      ? decrypt(account.accessToken)
      : null

  if (tokenToRevoke) {
    await fetch(`${GOOGLE_REVOKE_URL}?token=${encodeURIComponent(tokenToRevoke)}`, {
      method: 'POST',
    }).catch(() => { /* non-blocking — still delete from DB */ })
  }
}
