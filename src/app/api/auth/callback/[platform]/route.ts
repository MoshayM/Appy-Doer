import { NextRequest, NextResponse } from 'next/server'
import { verifySessionJwt } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'
import { encrypt } from '@/lib/encrypt'
import { ConnectedPlatform } from '@prisma/client'
import { logActivity } from '@/lib/activity'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

// ─── Popup-aware HTML response ────────────────────────────────────────────────
// If the window has an opener (popup flow) → postMessage + close.
// If opened directly (full-page flow)      → redirect to connections page.

function popupResponse(ok: boolean, platform: string, message: string): NextResponse {
  const icon       = ok ? '✓' : '✗'
  const color      = ok ? '#16a34a' : '#dc2626'
  const bg         = ok ? '#f0fdf4' : '#fef2f2'
  const eventType  = ok ? 'OAUTH_SUCCESS' : 'OAUTH_ERROR'
  const fallbackQs = ok
    ? `connected=${encodeURIComponent(platform)}`
    : `error=callback_failed&platform=${encodeURIComponent(platform)}`

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${ok ? 'Connected' : 'Error'} — AppyDoer</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:system-ui,-apple-system,sans-serif;background:${bg};display:flex;align-items:center;justify-content:center;min-height:100vh}
    .card{background:#fff;border-radius:1rem;box-shadow:0 4px 32px rgba(0,0,0,.1);padding:2.5rem 3rem;text-align:center;max-width:360px;width:90%}
    .icon{font-size:3rem;color:${color};margin-bottom:1rem}
    h2{color:${color};font-size:1.2rem;margin-bottom:.5rem}
    p{color:#6b7280;font-size:.85rem;margin-top:.5rem}
    .spinner{width:20px;height:20px;border:2px solid #e5e7eb;border-top-color:${color};border-radius:50%;animation:spin .7s linear infinite;margin:.75rem auto 0}
    @keyframes spin{to{transform:rotate(360deg)}}
  </style>
</head>
<body>
<div class="card">
  <div class="icon">${icon}</div>
  <h2>${message}</h2>
  <p>${ok ? 'Fetching your profile…' : 'You can close this window.'}</p>
  ${ok ? '<div class="spinner"></div>' : ''}
</div>
<script>
(function(){
  var msg = { type: '${eventType}', platform: '${platform}' };
  try {
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage(msg, '${APP_URL}');
      setTimeout(function(){ window.close(); }, ${ok ? 1800 : 2500});
    } else {
      window.location.replace('${APP_URL}/dashboard/connections?${fallbackQs}');
    }
  } catch(e) {
    window.location.replace('${APP_URL}/dashboard/connections?${fallbackQs}');
  }
})();
</script>
</body>
</html>`

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

// ─── Token exchange ───────────────────────────────────────────────────────────

interface TokenResponse {
  access_token: string
  refresh_token?: string
  expires_in?: number
  id_token?: string
}

async function exchangeCode(platform: string, code: string): Promise<TokenResponse> {
  const configs: Record<string, { tokenUrl: string; clientIdEnv: string; clientSecretEnv: string }> = {
    linkedin: { tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',  clientIdEnv: 'LINKEDIN_CLIENT_ID', clientSecretEnv: 'LINKEDIN_CLIENT_SECRET' },
    gmail:    { tokenUrl: 'https://oauth2.googleapis.com/token',            clientIdEnv: 'GOOGLE_CLIENT_ID',   clientSecretEnv: 'GOOGLE_CLIENT_SECRET'   },
    github:   { tokenUrl: 'https://github.com/login/oauth/access_token',    clientIdEnv: 'GITHUB_CLIENT_ID',   clientSecretEnv: 'GITHUB_CLIENT_SECRET'   },
    youtube:  { tokenUrl: 'https://oauth2.googleapis.com/token',            clientIdEnv: 'GOOGLE_CLIENT_ID',   clientSecretEnv: 'GOOGLE_CLIENT_SECRET'   },
    upwork:   { tokenUrl: 'https://www.upwork.com/api/v3/oauth2/token',     clientIdEnv: 'UPWORK_CLIENT_ID',   clientSecretEnv: 'UPWORK_CLIENT_SECRET'   },
  }
  const cfg = configs[platform]
  if (!cfg) throw new Error(`No token config for platform: ${platform}`)

  const res = await fetch(cfg.tokenUrl, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body:    new URLSearchParams({
      grant_type:    'authorization_code',
      code,
      redirect_uri:  `${APP_URL}/api/auth/callback/${platform}`,
      client_id:     process.env[cfg.clientIdEnv]!,
      client_secret: process.env[cfg.clientSecretEnv]!,
    }),
  })
  if (!res.ok) throw new Error(`Token exchange failed: ${res.status}`)
  return res.json()
}

// ─── Profile fetch ────────────────────────────────────────────────────────────

interface ProfileResult {
  name?: string; email?: string; headline?: string; avatarUrl?: string
  profileUrl?: string; bio?: string; company?: string; location?: string
  skills?: string[]; subscribers?: number; channelTitle?: string
  channelDescription?: string; jobTitle?: string; hourlyRate?: string; totalJobs?: number
  providerAccountId?: string
}

async function fetchProfile(platform: string, token: string): Promise<ProfileResult> {
  if (platform === 'linkedin') {
    const data = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json())
    return {
      providerAccountId: data.sub,
      name:       data.name,
      email:      data.email,
      headline:   data.headline ?? data.job_title,
      avatarUrl:  data.picture,
      profileUrl: data.vanityName ? `https://www.linkedin.com/in/${data.vanityName}` : undefined,
      location:   data.locale?.country,
    }
  }

  if (platform === 'gmail') {
    const data = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json())
    return { providerAccountId: data.sub, name: data.name, email: data.email, avatarUrl: data.picture }
  }

  if (platform === 'github') {
    const [user, emailsRaw] = await Promise.all([
      fetch('https://api.github.com/user',        { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' } }).then(r => r.json()),
      fetch('https://api.github.com/user/emails', { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' } }).then(r => r.json()),
    ])
    const emails  = Array.isArray(emailsRaw) ? emailsRaw as { email: string; primary: boolean }[] : []
    const primary = emails.find(e => e.primary)

    // Also grab top repos for portfolio evidence
    const repos = await fetch('https://api.github.com/user/repos?sort=updated&per_page=8', {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
    }).then(r => r.ok ? r.json() : []) as { name: string; description: string | null; language: string | null; stargazers_count: number }[]

    return {
      providerAccountId: String(user.id),
      name:       user.name ?? user.login,
      email:      primary?.email ?? user.email,
      headline:   user.bio,
      avatarUrl:  user.avatar_url,
      profileUrl: user.html_url,
      location:   user.location,
      company:    user.company,
      // Extra GitHub-specific fields stored in profileData
      ...(repos.length ? { repos: repos.slice(0, 8).map(r => ({ name: r.name, description: r.description, language: r.language, stars: r.stargazers_count })) } : {}),
    } as ProfileResult
  }

  if (platform === 'youtube') {
    const [userData, chData] = await Promise.all([
      fetch('https://www.googleapis.com/oauth2/v3/userinfo', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ])
    const ch = chData.items?.[0]
    return {
      providerAccountId: userData.sub,
      name:               userData.name,
      email:              userData.email,
      avatarUrl:          userData.picture,
      channelTitle:       ch?.snippet?.title,
      channelDescription: ch?.snippet?.description,
      profileUrl:         ch ? `https://www.youtube.com/channel/${ch.id}` : undefined,
      subscribers:        ch ? parseInt(ch.statistics?.subscriberCount ?? '0', 10) : undefined,
    }
  }

  if (platform === 'upwork') {
    const data = await fetch('https://www.upwork.com/api/v3/users/me.json', {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json())
    const u = data.user ?? data
    return {
      providerAccountId: u.id ?? u.uid,
      name:       [u.first_name, u.last_name].filter(Boolean).join(' '),
      email:      u.email,
      headline:   u.title,
      avatarUrl:  u.portrait_100_img ?? u.portrait_50_img,
      profileUrl: u.url,
      location:   [u.city, u.country?.name].filter(Boolean).join(', '),
      jobTitle:   u.title,
      hourlyRate: u.rate ? `$${u.rate}/hr` : undefined,
      totalJobs:  u.total_jobs_posted,
    }
  }

  return {}
}

// ─── Platform enum map ────────────────────────────────────────────────────────

const PLATFORM_MAP: Record<string, ConnectedPlatform> = {
  linkedin: 'LINKEDIN',
  gmail:    'GMAIL',
  github:   'GITHUB',
  youtube:  'YOUTUBE',
  upwork:   'UPWORK',
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest, ctx: { params: { platform: string } }) {
  const platform = ctx.params.platform
  const url      = new URL(req.url)
  const code     = url.searchParams.get('code')
  const state    = url.searchParams.get('state')
  const errParam = url.searchParams.get('error')

  if (errParam || !code || !state) {
    return popupResponse(false, platform, 'Access denied or cancelled')
  }

  const payload = await verifySessionJwt(state)
  if (!payload || payload.platform !== platform) {
    return popupResponse(false, platform, 'Invalid or expired session — please try again')
  }

  const dbPlatform = PLATFORM_MAP[platform]
  if (!dbPlatform) {
    return popupResponse(false, platform, 'Unknown platform')
  }

  const userId = payload.sub

  try {
    const tokens  = await exchangeCode(platform, code)
    const profile = await fetchProfile(platform, tokens.access_token)

    // For Gmail: detect if this is a new connection or an account change
    let gmailAction: 'GMAIL_CONNECTED' | 'GMAIL_ACCOUNT_CHANGED' | 'GMAIL_RECONNECTED' | null = null
    let gmailOldEmail: string | null = null

    if (platform === 'gmail') {
      const existing = await prisma.connectedAccount.findUnique({
        where:  { userId_platform: { userId, platform: 'GMAIL' } },
        select: { accountEmail: true, status: true },
      })
      if (!existing) {
        gmailAction = 'GMAIL_CONNECTED'
      } else if (existing.accountEmail && existing.accountEmail !== profile.email) {
        gmailAction   = 'GMAIL_ACCOUNT_CHANGED'
        gmailOldEmail = existing.accountEmail
      } else {
        gmailAction = 'GMAIL_RECONNECTED'
      }
    }

    await prisma.connectedAccount.upsert({
      where:  { userId_platform: { userId, platform: dbPlatform } },
      update: {
        providerAccountId: profile.providerAccountId ?? undefined,
        accessToken:       encrypt(tokens.access_token),
        refreshToken:      tokens.refresh_token ? encrypt(tokens.refresh_token) : undefined,
        tokenExpiry:       tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : undefined,
        profileData:       profile as never,
        profileUrl:        profile.profileUrl ?? null,
        accountEmail:      profile.email ?? null,
        status:            'active',
        enabled:           true,
        updatedAt:         new Date(),
      } as never,
      create: {
        userId,
        platform:          dbPlatform,
        providerAccountId: profile.providerAccountId ?? undefined,
        accessToken:       encrypt(tokens.access_token),
        refreshToken:      tokens.refresh_token ? encrypt(tokens.refresh_token) : undefined,
        tokenExpiry:       tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : undefined,
        profileData:       profile as never,
        profileUrl:        profile.profileUrl ?? null,
        accountEmail:      profile.email ?? null,
        status:            'active',
      } as never,
    })

    // Audit log Gmail events
    if (gmailAction) {
      logActivity(userId, 'CUSTOMER', gmailAction, {
        newEmail: profile.email ?? null,
        oldEmail: gmailOldEmail,
      }).catch(() => { /* non-blocking */ })
    }

    return popupResponse(true, platform, `${platform.charAt(0).toUpperCase() + platform.slice(1)} connected!`)
  } catch (err) {
    console.error(`[oauth-callback/${platform}]`, err)
    return popupResponse(false, platform, 'Connection failed — please try again')
  }
}
