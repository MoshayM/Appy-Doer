import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { withAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const POST = withAuth(async (req: NextRequest, user) => {
  const { currentPassword, newPassword } = await req.json() as {
    currentPassword?: string; newPassword?: string
  }

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: { code: 'INVALID_INPUT', message: 'Both passwords required' } }, { status: 400 })
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: { code: 'WEAK_PASSWORD', message: 'New password must be at least 8 characters' } }, { status: 400 })
  }

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
  if (!dbUser?.passwordHash) {
    return NextResponse.json(
      { error: { code: 'OAUTH_USER', message: 'Your account uses Google sign-in — no password is set' } },
      { status: 400 },
    )
  }

  const valid = await bcrypt.compare(currentPassword, dbUser.passwordHash)
  if (!valid) {
    return NextResponse.json(
      { error: { code: 'WRONG_PASSWORD', message: 'Current password is incorrect' } },
      { status: 400 },
    )
  }

  const hash = await bcrypt.hash(newPassword, 12)
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: hash } })

  return NextResponse.json({ success: true })
})
