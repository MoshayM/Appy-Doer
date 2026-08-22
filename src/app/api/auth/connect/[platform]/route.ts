import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { signSessionJwt } from '@/lib/jwt'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

// ─── Popup-aware error HTML ───────────────────────────────────────────────────

function errorPopup(platform: string, message: string): NextResponse {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Error — WorkBuddy</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:system-ui,-apple-system,sans-serif;background:#fef2f2;display:flex;align-items:center;justify-content:center;min-height:100vh}
    .card{background:#fff;border-radius:1rem;box-shadow:0 4px 32px rgba(0,0,0,.1);padding:2.5rem 3rem;text-align:center;max-width:360px;width:90%}
    .icon{font-size:3rem;color:#dc2626;margin-bottom:1rem}
    h2{color:#dc2626;font-size:1.1rem;margin-bottom:.5rem}
    p{color:#6b7280;font-size:.85rem;margin-top:.5rem}
  </style>
</head>
<body>
<div class="card">
  <div class="icon">✗</div>
  <h2>${message}</h2>
  <p>This window will close automatically…</p>
</div>
<script>
(function(){
  var msg = { type: 'OAUTH_ERROR', platform: '${platform}', message: '${message}' };
  try {
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage(msg, '${APP_URL}');
      setTimeout(function(){ window.close(); }, 2500);
    } else {
      window.location.replace('${APP_URL}/dashboard/connections?error=not_configured&platform=${platform}');
    }
  } catch(e) {
    window.location.replace('${APP_URL}/dashboard/connections?error=not_configured&platform=${platform}');
  }
})();
</script>
</body>
</html>`
  return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}

// ─── OAuth configs ────────────────────────────────────────────────────────────

const OAUTH_CONFIGS: Record<string, {
  authUrl: string; clientIdEnv: string; scope: string; extra?: Record<string, string>
}> = {
  linkedin: {
    authUrl:     'https://www.linkedin.com/oauth/v2/authorization',
    clientIdEnv: 'LINKEDIN_CLIENT_ID',
    scope:       'openid profile email',
  },
  gmail: {
    authUrl:     'https://accounts.google.com/o/oauth2/v2/auth',
    clientIdEnv: 'GOOGLE_CLIENT_ID',
    scope:       'https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/gmail.labels openid email profile',
    extra:       { access_type: 'offline', prompt: 'select_account consent' },
  },
  github: {
    authUrl:     'https://github.com/login/oauth/authorize',
    clientIdEnv: 'GITHUB_CLIENT_ID',
    scope:       'read:user user:email repo',
  },
  youtube: {
    authUrl:     'https://accounts.google.com/o/oauth2/v2/auth',
    clientIdEnv: 'GOOGLE_CLIENT_ID',
    scope:       'https://www.googleapis.com/auth/youtube.readonly openid email profile',
    extra:       { access_type: 'offline', prompt: 'consent' },
  },
  upwork: {
    authUrl:     'https://www.upwork.com/ab/account-security/oauth2/authorize',
    clientIdEnv: 'UPWORK_CLIENT_ID',
    scope:       'r_userinfo',
  },
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export const GET = withAuth(async (req: NextRequest, user, ctx) => {
  const platform = ctx?.params?.platform as string
  const config   = OAUTH_CONFIGS[platform]

  if (!config) {
    return errorPopup(platform, 'Unknown platform — not supported')
  }

  const clientId = process.env[config.clientIdEnv]
  if (!clientId) {
    return errorPopup(platform, `${platform} OAuth is not configured on this server`)
  }

  const state = await signSessionJwt(
    { sub: user.id, platform, nonce: Math.random().toString(36).slice(2) },
    5 * 60,
  )

  const qs = new URLSearchParams({
    client_id:     clientId,
    redirect_uri:  `${APP_URL}/api/auth/callback/${platform}`,
    scope:         config.scope,
    response_type: 'code',
    state,
    ...config.extra,
  })

  return NextResponse.redirect(`${config.authUrl}?${qs}`)
})
