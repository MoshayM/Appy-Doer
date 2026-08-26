import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const start = Date.now()

  try {
    await prisma.$queryRaw`SELECT 1`
    const dbLatencyMs = Date.now() - start

    return NextResponse.json({
      status: 'ok',
      db: 'up',
      dbLatencyMs,
      version: process.env.NEXT_PUBLIC_APP_VERSION ?? '1.0.0',
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    return NextResponse.json(
      {
        status: 'error',
        db: 'down',
        error: err instanceof Error ? err.message : 'unknown',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    )
  }
}
