import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import Anthropic from '@anthropic-ai/sdk'

let _anthropic: Anthropic | null = null
function getAnthropic() {
  if (!_anthropic) _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
  return _anthropic
}

function extractJson(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenced) return fenced[1].trim()
  const s = raw.indexOf('{')
  const e = raw.lastIndexOf('}')
  if (s !== -1 && e !== -1) return raw.slice(s, e + 1)
  return raw.trim()
}

export const POST = withAuth(async (req) => {
  try {
    const { content, targetLanguage } = await req.json()
    if (!content || !targetLanguage) {
      return NextResponse.json({ error: { code: 'INVALID_INPUT' } }, { status: 400 })
    }

    const prompt = `Translate the text content in the following JSON to ${targetLanguage}.

Translation rules:
- Keep all JSON keys exactly as-is
- Translate only string values that are phrases or sentences (2+ words of natural language)
- Do NOT translate:
  * Single-word strings
  * ALL_CAPS strings like HIGH, LOW, MEDIUM, EXPERT, NOT_STARTED (these are system codes)
  * Numbers, booleans, or null
  * URLs, email addresses, website slugs (strings with hyphens/underscores only)
  * Technical terms, programming languages, brand names, proper nouns
- Preserve all punctuation and formatting structure
- Return ONLY the JSON object, no markdown fences, no explanation

JSON:
${JSON.stringify(content, null, 2)}`

    const msg = await getAnthropic().messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = msg.content[0].type === 'text' ? msg.content[0].text : ''
    const translated = JSON.parse(extractJson(raw))
    return NextResponse.json({ translated })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Translation failed'
    return NextResponse.json({ error: { code: 'TRANSLATE_FAILED', message } }, { status: 500 })
  }
})
