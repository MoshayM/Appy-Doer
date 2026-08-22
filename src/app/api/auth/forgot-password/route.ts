import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { signSessionJwt } from '@/lib/jwt'
import { sendEmail, buildResetEmail, APP_URL } from '@/lib/mailer'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json() as { email?: string }

    if (!email?.trim()) {
      return NextResponse.json({ error: { code: 'INVALID_INPUT', message: 'Email required' } }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } })

    // Always return success — never reveal whether the email exists
    if (!user || !user.passwordHash) {
      return NextResponse.json({ success: true })
    }

    // Token signed with nonce = last 8 chars of passwordHash (auto-invalidates after reset)
    const token = await signSessionJwt(
      { sub: user.id, email: user.email, nonce: user.passwordHash.slice(-8) },
      3600, // 1 hour
    )

    const resetUrl = `${APP_URL}/reset-password?token=${encodeURIComponent(token)}`
    await sendEmail({
      to: user.email,
      subject: 'Reset your AI WorkBuddy password',
      html: buildResetEmail(resetUrl, user.email),
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[forgot-password]', err)
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: 'Could not send reset email' } }, { status: 500 })
  }
}
