import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { signSessionJwt, SESSION_COOKIE, SESSION_TTL } from '@/lib/jwt'
import { PaymentService } from '@/lib/services/payment'
import { NotificationService } from '@/lib/services/notification'

interface GoogleUserInfo {
  id: string
  email: string
  name?: string
  picture?: string
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const storedState = req.cookies.get('google_oauth_state')?.value
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  if (!code || !state || !storedState || state !== storedState) {
    return NextResponse.redirect(new URL('/login?error=oauth_failed', appUrl))
  }

  try {
    // Exchange authorization code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${appUrl}/api/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    })

    const tokens = await tokenRes.json()
    if (!tokenRes.ok) {
      console.error('[google-callback] token exchange failed:', tokens)
      return NextResponse.redirect(new URL('/login?error=oauth_failed', appUrl))
    }

    // Fetch Google user profile
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })

    if (!userInfoRes.ok) {
      return NextResponse.redirect(new URL('/login?error=oauth_failed', appUrl))
    }

    const googleUser: GoogleUserInfo = await userInfoRes.json()

    if (!googleUser.email) {
      return NextResponse.redirect(new URL('/login?error=oauth_failed', appUrl))
    }

    // Predefined admin roles — applied on every login so email→role stays in sync
    const ADMIN_ROLES: Record<string, 'ADMIN' | 'SUPER_ADMIN'> = {
      'moshay1996@gmail.com':       'ADMIN',
      'moshaymuthukumar@gmail.com': 'SUPER_ADMIN',
    }
    const assignedRole = ADMIN_ROLES[googleUser.email.toLowerCase()]

    // Find existing user or create a new one
    let user = await prisma.user.findUnique({ where: { email: googleUser.email } })
    let isNew = false

    if (!user) {
      isNew = true
      user = await prisma.user.create({
        data: {
          email: googleUser.email,
          name:  googleUser.name ?? undefined,
          plan:  'TRIAL',
          ...(assignedRole ? { role: assignedRole } : {}),
        },
      })

      await PaymentService.startTrial(user.id)
      await prisma.userContext.create({ data: { userId: user.id } })

      try {
        await NotificationService.send({
          userId: user.id,
          type: 'WELCOME',
          channel: 'EMAIL',
          title: 'Welcome to AI WorkBuddy — your 7-day trial starts now',
          body: 'Your full-access trial has started. Discover opportunities, build your profile, and land your first client.',
          meta: {},
        })
      } catch {
        // Non-fatal
      }
    } else if (assignedRole && user.role !== assignedRole) {
      // Existing user whose role needs to be promoted (e.g. first Google login after DB seed)
      user = await prisma.user.update({
        where: { id: user.id },
        data:  { role: assignedRole },
      })
    }

    const token = await signSessionJwt({ sub: user.id, email: user.email, authMethod: 'google' })

    const redirectPath = isNew ? '/dashboard' : '/dashboard'
    const res = NextResponse.redirect(new URL(redirectPath, appUrl))

    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_TTL,
    })
    res.cookies.delete('google_oauth_state')

    return res
  } catch (err) {
    console.error('[google-callback]', err)
    return NextResponse.redirect(new URL('/login?error=oauth_failed', appUrl))
  }
}
