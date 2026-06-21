import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'

export const GET = withAuth(async () => {
  return NextResponse.json({
    gmail:    !!process.env.GOOGLE_CLIENT_ID    && !!process.env.GOOGLE_CLIENT_SECRET,
    github:   !!process.env.GITHUB_CLIENT_ID    && !!process.env.GITHUB_CLIENT_SECRET,
    linkedin: !!process.env.LINKEDIN_CLIENT_ID  && !!process.env.LINKEDIN_CLIENT_SECRET,
    youtube:  !!process.env.GOOGLE_CLIENT_ID    && !!process.env.GOOGLE_CLIENT_SECRET,
    upwork:   !!process.env.UPWORK_CLIENT_ID    && !!process.env.UPWORK_CLIENT_SECRET,
    fiverr:   false,
  })
})
