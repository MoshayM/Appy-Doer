import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { SESSION_COOKIE } from '@/lib/jwt'

export async function POST() {
  const supabase = createSupabaseServerClient()
  if (supabase) await supabase.auth.signOut()

  const res = NextResponse.json({ ok: true })
  res.cookies.set(SESSION_COOKIE, '', { maxAge: 0, path: '/' })
  return res
}
