import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: { code: 'INVALID_INPUT' } }, { status: 400 })

  const supabase = createSupabaseServerClient()
  if (!supabase) {
    return NextResponse.json({ error: { code: 'NOT_SUPPORTED', message: 'OTP login requires Supabase. Use email/password instead.' } }, { status: 400 })
  }

  const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } })
  if (error) return NextResponse.json({ error: { code: 'OTP_FAILED', message: error.message } }, { status: 400 })
  return NextResponse.json({ ok: true })
}
