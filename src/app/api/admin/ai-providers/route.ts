import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { readFileSync, writeFileSync } from 'fs'
import path from 'path'
import { AgentType } from '@prisma/client'

const ALLOWED_ENV_VARS = [
  'ANTHROPIC_API_KEY',
  'OPENAI_API_KEY',
  'GOOGLE_AI_API_KEY',
  'GROK_API_KEY',
  'PERPLEXITY_API_KEY',
  'MISTRAL_API_KEY',
] as const

type AllowedEnvVar = (typeof ALLOWED_ENV_VARS)[number]

async function checkSuperAdmin(): Promise<boolean> {
  try {
    const user = await getAuthUser()
    return user?.role === 'SUPER_ADMIN'
  } catch {
    return false
  }
}

function parseEnvFile(content: string): Map<string, string> {
  const map = new Map<string, string>()
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const val = trimmed.slice(eqIdx + 1).trim()
    map.set(key, val)
  }
  return map
}

function serializeEnvFile(original: string, key: string, value: string): string {
  const lines = original.split('\n')
  let found = false
  const updated = lines.map(line => {
    const trimmed = line.trim()
    if (trimmed.startsWith('#') || !trimmed.includes('=')) return line
    const eqIdx = trimmed.indexOf('=')
    const lineKey = trimmed.slice(0, eqIdx).trim()
    if (lineKey === key) {
      found = true
      return `${key}=${value}`
    }
    return line
  })
  if (!found) {
    updated.push(`${key}=${value}`)
  }
  return updated.join('\n')
}

export async function POST(req: NextRequest) {
  const isAdmin = await checkSuperAdmin()
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: { action: string; payload: Record<string, string> }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { action, payload } = body

  try {
    if (action === 'update_model') {
      const { agentType, model } = payload
      if (!agentType || !model) {
        return NextResponse.json({ error: 'Missing agentType or model' }, { status: 400 })
      }
      await prisma.agentConfig.update({
        where: { agentType: agentType as AgentType },
        data: { model },
      })
      return NextResponse.json({ ok: true })
    }

    if (action === 'update_global_default') {
      const { provider, model } = payload
      if (!provider || !model) {
        return NextResponse.json({ error: 'Missing provider or model' }, { status: 400 })
      }
      await prisma.featureFlag.upsert({
        where: { key: 'default_ai_provider' },
        update: { value: { provider, model } as never },
        create: {
          key: 'default_ai_provider',
          type: 'json',
          value: { provider, model } as never,
          description: 'Global default AI provider and model',
        },
      })
      return NextResponse.json({ ok: true })
    }

    if (action === 'update_env_key') {
      const { envVar, value } = payload
      if (!ALLOWED_ENV_VARS.includes(envVar as AllowedEnvVar)) {
        return NextResponse.json({ error: 'Env var not in whitelist' }, { status: 400 })
      }
      const envPath = path.join(process.cwd(), '.env.local')
      let current = ''
      try {
        current = readFileSync(envPath, 'utf-8')
      } catch {
        current = ''
      }
      const updated = serializeEnvFile(current, envVar, value)
      writeFileSync(envPath, updated, 'utf-8')
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
