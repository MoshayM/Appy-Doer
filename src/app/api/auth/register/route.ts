import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { signSessionJwt, SESSION_COOKIE, SESSION_TTL } from '@/lib/jwt'
import { PaymentService } from '@/lib/services/payment'
import { NotificationService } from '@/lib/services/notification'

export async function POST(req: NextRequest) {
  try {
    const { email, name, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: { code: 'INVALID_INPUT', message: 'Email and password required' } }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: { code: 'EMAIL_EXISTS', message: 'An account with this email already exists' } }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: { email, name: name || undefined, plan: 'TRIAL', passwordHash },
    })

    const trialEndsAt = await PaymentService.startTrial(user.id)

    await prisma.userContext.create({ data: { userId: user.id } })

    try {
      await NotificationService.send({
        userId: user.id,
        type: 'WELCOME',
        channel: 'EMAIL',
        title: 'Welcome to AI WorkBuddy — your 7-day trial starts now',
        body: 'Your full-access trial has started. Discover opportunities, build your profile, and land your first client.',
        meta: { trialEndsAt: trialEndsAt.toISOString() },
      })
    } catch {
      // Notification failure is non-fatal
    }

    const token = await signSessionJwt({ sub: user.id, email: user.email, authMethod: 'email' })

    const res = NextResponse.json({ user: { id: user.id, email: user.email, plan: user.plan }, trialEndsAt })
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_TTL,
    })
    return res
  } catch (err) {
    console.error('[register]', err)
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: 'Registration failed' } }, { status: 500 })
  }
}
