import { NextRequest, NextResponse } from 'next/server'
import { syncGmailForAllUsers, syncGmailForUser } from '@/lib/services/gmail-sync'
import { withAuth } from '@/lib/auth'

// Called by Vercel Cron every 2 minutes (unauthenticated, verified by CRON_SECRET)
export async function POST(req: NextRequest) {
  const secret = req.headers.get('authorization')?.replace('Bearer ', '')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const result = await syncGmailForAllUsers()
  return NextResponse.json({ success: true, ...result })
}

// Manual sync for logged-in user (GET)
export const GET = withAuth(async (_req, user) => {
  const result = await syncGmailForUser(user.id)
  return NextResponse.json({ success: true, ...result })
})
