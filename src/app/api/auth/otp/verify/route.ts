import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { PaymentService } from '@/lib/services/payment'

export async function POST(req: NextRequest) {
  const { email, token } = await req.json()
  if (!email || !token) return NextResponse.json({ error: { code: 'INVALID_INPUT' } }, { status: 400 })

  const supabase = createSupabaseServerClient()
  if (!supabase) {
    return NextResponse.json({ error: { code: 'NOT_SUPPORTED', message: 'OTP login requires Supabase. Use email/password instead.' } }, { status: 400 })
  }

  const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'email' })
  if (error || !data.user) return NextResponse.json({ error: { code: 'OTP_INVALID', message: error?.message } }, { status: 400 })

  try { await PaymentService.startTrial(data.user.id) } catch { /* already started */ }

  return NextResponse.json({ ok: true, userId: data.user.id })
}
