import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import ProvidersClient, {
  type ProviderInfo,
  type AgentRow,
  type GlobalDefault,
} from './ProvidersClient'

async function requireSuperAdmin() {
  const user = await getAuthUser()
  if (!user) redirect('/login')
  if (user.role !== 'SUPER_ADMIN') redirect('/dashboard')
}

const PROVIDERS: Omit<ProviderInfo, 'configured'>[] = [
  {
    id: 'anthropic',
    name: 'Anthropic / Claude',
    emoji: '🟠',
    borderColor: 'border-orange-300',
    bgColor: 'bg-orange-50',
    envVar: 'ANTHROPIC_API_KEY',
    models: ['claude-opus-4-8', 'claude-sonnet-4-6', 'claude-haiku-4-5-20251001'],
  },
  {
    id: 'openai',
    name: 'OpenAI / GPT',
    emoji: '🟢',
    borderColor: 'border-teal-300',
    bgColor: 'bg-teal-50',
    envVar: 'OPENAI_API_KEY',
    models: ['gpt-4o', 'gpt-4o-mini', 'o1', 'o3-mini'],
  },
  {
    id: 'google',
    name: 'Google / Gemini',
    emoji: '🔵',
    borderColor: 'border-blue-300',
    bgColor: 'bg-blue-50',
    envVar: 'GOOGLE_AI_API_KEY',
    models: ['gemini-2.0-flash', 'gemini-2.0-pro', 'gemini-1.5-flash'],
  },
  {
    id: 'xai',
    name: 'xAI / Grok',
    emoji: '⚫',
    borderColor: 'border-gray-800',
    bgColor: 'bg-gray-50',
    envVar: 'GROK_API_KEY',
    models: ['grok-3', 'grok-3-mini', 'grok-2'],
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    emoji: '🟣',
    borderColor: 'border-purple-300',
    bgColor: 'bg-purple-50',
    envVar: 'PERPLEXITY_API_KEY',
    models: ['sonar-pro', 'sonar', 'sonar-reasoning'],
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    emoji: '🔶',
    borderColor: 'border-orange-400',
    bgColor: 'bg-orange-50',
    envVar: 'MISTRAL_API_KEY',
    models: ['mistral-large-2', 'mistral-medium-3', 'codestral'],
  },
]

function getConfiguredEnvVars(): Record<string, boolean> {
  return {
    ANTHROPIC_API_KEY: Boolean(process.env.ANTHROPIC_API_KEY),
    OPENAI_API_KEY: Boolean(process.env.OPENAI_API_KEY),
    GOOGLE_AI_API_KEY: Boolean(process.env.GOOGLE_AI_API_KEY),
    GROK_API_KEY: Boolean(process.env.GROK_API_KEY),
    PERPLEXITY_API_KEY: Boolean(process.env.PERPLEXITY_API_KEY),
    MISTRAL_API_KEY: Boolean(process.env.MISTRAL_API_KEY),
  }
}

export default async function AiProvidersPage() {
  await requireSuperAdmin()

  const envStatus = getConfiguredEnvVars()

  const providers: ProviderInfo[] = PROVIDERS.map(p => ({
    ...p,
    configured: envStatus[p.envVar] ?? false,
  }))

  let agents: AgentRow[] = []
  try {
    const rows = await prisma.agentConfig.findMany({ orderBy: { agentType: 'asc' } })
    agents = rows.map(r => ({
      id: r.id,
      agentType: r.agentType,
      model: r.model,
      enabled: r.enabled,
    }))
  } catch {
    // table may not exist in dev
  }

  let globalDefault: GlobalDefault | null = null
  try {
    const flag = await prisma.featureFlag.findUnique({
      where: { key: 'default_ai_provider' },
    })
    if (flag && flag.value && typeof flag.value === 'object' && !Array.isArray(flag.value)) {
      const val = flag.value as Record<string, unknown>
      if (typeof val.provider === 'string' && typeof val.model === 'string') {
        globalDefault = { provider: val.provider, model: val.model }
      }
    }
  } catch {
    // feature flags table may not exist
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">AI Provider Management</h1>
        <p className="text-gray-500 mt-1">
          Configure API keys, global defaults, and per-agent model assignments
        </p>
        {globalDefault && (
          <div className="mt-3 inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-2 text-sm text-indigo-700">
            <span className="font-semibold">Global Default:</span>
            <span>
              {globalDefault.provider} / {globalDefault.model}
            </span>
          </div>
        )}
      </div>

      <ProvidersClient
        providers={providers}
        agents={agents}
        globalDefault={globalDefault}
      />
    </div>
  )
}
