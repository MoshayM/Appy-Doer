import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { signSessionJwt, SESSION_COOKIE, SESSION_TTL } from '@/lib/jwt'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: { code: 'INVALID_INPUT', message: 'Email and password required' } }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } }, { status: 401 })
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return NextResponse.json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } }, { status: 401 })
    }

    const token = await signSessionJwt({ sub: user.id, email: user.email })

    const res = NextResponse.json({ user: { id: user.id, email: user.email, plan: user.plan } })
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_TTL,
    })
    return res
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[login]', msg)
    return NextResponse.json({
      error: { code: 'SERVER_ERROR', message: process.env.NODE_ENV === 'development' ? msg : 'Login failed' },
    }, { status: 500 })
  }
}
