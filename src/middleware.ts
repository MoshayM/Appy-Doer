import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { verifySessionJwt, SESSION_COOKIE } from '@/lib/jwt'

export async function middleware(req: NextRequest) {
  const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const country =
    req.headers.get('x-vercel-ip-country') ??
    req.headers.get('cf-ipcountry') ??
    'IN'

  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-country', country)

  const pathname   = req.nextUrl.pathname
  const isProtected = pathname.startsWith('/dashboard') || pathname.startsWith('/admin')
  const isAuthPage  = pathname === '/login' || pathname === '/register'

  // ── Local JWT takes priority — always checked first ───────────────────────
  const token      = req.cookies.get(SESSION_COOKIE)?.value
  const localUser  = token ? await verifySessionJwt(token) : null

  if (localUser) {
    if (isAuthPage) return NextResponse.redirect(new URL('/dashboard', req.url))
    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  // ── No local session: try Supabase if configured ──────────────────────────
  if (supabaseUrl && supabaseAnon) {
    let response = NextResponse.next({ request: { headers: requestHeaders } })

    const supabase = createServerClient(supabaseUrl, supabaseAnon, {
      cookies: {
        getAll() { return req.cookies.getAll() },
        setAll(cookiesToSet: Array<{ name: string; value: string; options: Record<string, unknown> }>) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
          response = NextResponse.next({ request: { headers: requestHeaders } })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options as never))
        },
      },
    })

    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      if (isAuthPage) return NextResponse.redirect(new URL('/dashboard', req.url))
      return response
    }
  }

  // ── No session at all ─────────────────────────────────────────────────────
  if (isProtected) return NextResponse.redirect(new URL('/login', req.url))
  return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|p/).*)'],
}
