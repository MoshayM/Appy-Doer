import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ConnectedPlatform } from '@prisma/client'
import { revokeGmailToken } from '@/lib/services/gmail'
import { logActivity } from '@/lib/activity'

const PLATFORM_MAP: Record<string, ConnectedPlatform> = {
  linkedin: 'LINKEDIN',
  gmail:    'GMAIL',
  github:   'GITHUB',
  youtube:  'YOUTUBE',
  fiverr:   'FIVERR',
  upwork:   'UPWORK',
  naukri:   'NAUKRI_TEXT',
  resume:   'RESUME',
  manual:   'MANUAL',
}

export const DELETE = withAuth(async (req: NextRequest, user, ctx) => {
  const key      = ctx?.params?.platform as string
  const platform = PLATFORM_MAP[key]
  if (!platform) return NextResponse.json({ error: 'Unknown platform' }, { status: 400 })

  // For Gmail: fetch old email for audit log, then revoke token at Google
  if (platform === 'GMAIL') {
    const existing = await prisma.connectedAccount.findUnique({
      where:  { userId_platform: { userId: user.id, platform: 'GMAIL' } },
      select: { accountEmail: true },
    })
    await revokeGmailToken(user.id)
    await logActivity(user.id, user.role, 'GMAIL_DISCONNECTED', {
      oldEmail: existing?.accountEmail ?? null,
    })
  }

  await prisma.connectedAccount.deleteMany({
    where: { userId: user.id, platform },
  })

  return NextResponse.json({ disconnected: true })
})
