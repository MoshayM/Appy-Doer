import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { verifySessionJwt } from '@/lib/jwt'

export async function POST(req: NextRequest) {
  try {
    const { token, newPassword } = await req.json() as { token?: string; newPassword?: string }

    if (!token || !newPassword) {
      return NextResponse.json({ error: { code: 'INVALID_INPUT', message: 'Token and new password required' } }, { status: 400 })
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ error: { code: 'WEAK_PASSWORD', message: 'Password must be at least 8 characters' } }, { status: 400 })
    }

    const payload = await verifySessionJwt(token)
    if (!payload?.sub || !payload.nonce) {
      return NextResponse.json({ error: { code: 'INVALID_TOKEN', message: 'Reset link is invalid or has expired' } }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } })
    if (!user?.passwordHash) {
      return NextResponse.json({ error: { code: 'USER_NOT_FOUND', message: 'Account not found' } }, { status: 400 })
    }

    // Nonce must match current hash — prevents token reuse after a successful reset
    if (user.passwordHash.slice(-8) !== payload.nonce) {
      return NextResponse.json(
        { error: { code: 'TOKEN_USED', message: 'Reset link has already been used' } },
        { status: 400 },
      )
    }

    const hash = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: hash } })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[reset-password]', err)
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: 'Password reset failed' } }, { status: 500 })
  }
}
