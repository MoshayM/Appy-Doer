import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ConnectedPlatform } from '@prisma/client'

const FETCH_TIMEOUT_MS = 8000

function withTimeout(promise: Promise<Response>): Promise<Response> {
  const abort = new AbortController()
  const timer = setTimeout(() => abort.abort(), FETCH_TIMEOUT_MS)
  return promise.finally(() => clearTimeout(timer))
}

function timedFetch(url: string, init?: RequestInit): Promise<Response> {
  const abort = new AbortController()
  const timer = setTimeout(() => abort.abort(), FETCH_TIMEOUT_MS)
  return fetch(url, { ...init, signal: abort.signal }).finally(() => clearTimeout(timer))
}

function extractGitHubUsername(input: string): string | null {
  const trimmed = input.trim()
  const match   = trimmed.match(/(?:github\.com\/)?([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?)/)
  return match?.[1] ?? null
}

function detectPlatform(url: string): ConnectedPlatform | null {
  const u = url.toLowerCase()
  if (u.includes('github.com'))                         return 'GITHUB'
  if (u.includes('linkedin.com'))                       return 'LINKEDIN'
  if (u.includes('fiverr.com'))                         return 'FIVERR'
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'YOUTUBE'
  if (u.includes('upwork.com'))                         return 'UPWORK'
  return null
}

export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const body = await req.json() as { url?: string; platform?: string }
    const rawUrl = body.url?.trim()

    if (!rawUrl) {
      return NextResponse.json({ error: { message: 'URL is required' } }, { status: 400 })
    }

    const platform: ConnectedPlatform | null =
      (body.platform as ConnectedPlatform | undefined) ?? detectPlatform(rawUrl)

    if (!platform) {
      return NextResponse.json(
        { error: { message: 'Could not detect platform. Paste a LinkedIn, GitHub, Fiverr, YouTube, or Upwork URL.' } },
        { status: 400 },
      )
    }

    // ── GitHub: fetch real public profile data ─────────────────────────────
    if (platform === 'GITHUB') {
      const username = extractGitHubUsername(rawUrl)
      if (!username) {
        return NextResponse.json({ error: { message: 'Invalid GitHub URL or username' } }, { status: 400 })
      }

      let ghUser: Record<string, unknown>
      let ghRepos: { name: string; description: string | null; language: string | null }[] = []

      try {
        const [userRes, reposRes] = await Promise.all([
          timedFetch(`https://api.github.com/users/${username}`, {
            headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'AppyDoer' },
          }),
          timedFetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=6`, {
            headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'AppyDoer' },
          }),
        ])

        if (!userRes.ok) {
          const msg = userRes.status === 404
            ? `GitHub user "${username}" not found`
            : `GitHub returned ${userRes.status} — try again`
          return NextResponse.json({ error: { message: msg } }, { status: userRes.status === 404 ? 404 : 502 })
        }

        ghUser  = await userRes.json()
        ghRepos = reposRes.ok ? await reposRes.json() : []
      } catch (fetchErr) {
        const isTimeout = fetchErr instanceof Error && fetchErr.name === 'AbortError'
        return NextResponse.json(
          { error: { message: isTimeout ? 'GitHub API timed out — please try again' : 'Could not reach GitHub — check your connection' } },
          { status: 502 },
        )
      }

      const profileData = {
        name:        (ghUser.name ?? ghUser.login) as string,
        headline:    ghUser.bio as string | undefined,
        location:    ghUser.location as string | undefined,
        company:     ghUser.company as string | undefined,
        avatarUrl:   ghUser.avatar_url as string | undefined,
        profileUrl:  ghUser.html_url as string,
        repos:       ghRepos.slice(0, 6).map(r => ({ name: r.name, description: r.description, language: r.language })),
        followers:   ghUser.followers as number | undefined,
        publicRepos: ghUser.public_repos as number | undefined,
      }

      await prisma.connectedAccount.upsert({
        where:  { userId_platform: { userId: user.id, platform: 'GITHUB' } },
        update: { profileData: profileData as never, profileUrl: profileData.profileUrl, accountEmail: null, updatedAt: new Date() },
        create: { userId: user.id, platform: 'GITHUB', profileData: profileData as never, profileUrl: profileData.profileUrl },
      })

      return NextResponse.json({ imported: true, platform: 'GITHUB', name: profileData.name, profileUrl: profileData.profileUrl })
    }

    // ── LinkedIn / Fiverr / YouTube / Upwork: store URL as reference ───────
    const profileData: Record<string, string> = { profileUrl: rawUrl, importMethod: 'url_import' }

    if (platform === 'FIVERR') {
      const match = rawUrl.match(/fiverr\.com\/([^/?#]+)/)
      if (match?.[1]) profileData.username = match[1]
    }
    if (platform === 'YOUTUBE') {
      const match = rawUrl.match(/youtube\.com\/@([^/?#]+)/)
      if (match?.[1]) profileData.handle = `@${match[1]}`
    }
    if (platform === 'UPWORK') {
      const match = rawUrl.match(/upwork\.com\/freelancers\/([^/?#]+)/)
      if (match?.[1]) profileData.slug = match[1]
    }

    await prisma.connectedAccount.upsert({
      where:  { userId_platform: { userId: user.id, platform } },
      update: { profileData: profileData as never, profileUrl: rawUrl, updatedAt: new Date() },
      create: { userId: user.id, platform, profileData: profileData as never, profileUrl: rawUrl },
    })

    return NextResponse.json({ imported: true, platform, profileUrl: rawUrl })

  } catch (err) {
    console.error('[import-url]', err)
    return NextResponse.json(
      { error: { message: 'Import failed — please try again' } },
      { status: 500 },
    )
  }
})
