'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

export interface ProviderInfo {
  id: string
  name: string
  emoji: string
  borderColor: string
  bgColor: string
  envVar: string
  configured: boolean
  models: string[]
}

export interface AgentRow {
  id: string
  agentType: string
  model: string
  enabled: boolean
}

export interface GlobalDefault {
  provider: string
  model: string
}

interface Props {
  providers: ProviderInfo[]
  agents: AgentRow[]
  globalDefault: GlobalDefault | null
}

async function callApi(action: string, payload: Record<string, string>) {
  const res = await fetch('/api/admin/ai-providers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, payload }),
  })
  return res.json() as Promise<{ ok?: boolean; error?: string }>
}

function ProviderCard({
  provider,
  isDefault,
  onRefresh,
}: {
  provider: ProviderInfo
  isDefault: boolean
  onRefresh: () => void
}) {
  const [selectedModel, setSelectedModel] = useState(provider.models[0])
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [savingKey, setSavingKey] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  async function handleSetDefault() {
    setSaving(true)
    setFeedback(null)
    const res = await callApi('update_global_default', {
      provider: provider.id,
      model: selectedModel,
    })
    setSaving(false)
    if (res.ok) {
      setFeedback('Set as global default')
      onRefresh()
    } else {
      setFeedback(res.error ?? 'Error')
    }
  }

  async function handleSaveKey() {
    if (!apiKeyInput.trim()) return
    setSavingKey(true)
    setFeedback(null)
    const res = await callApi('update_env_key', {
      envVar: provider.envVar,
      value: apiKeyInput.trim(),
    })
    setSavingKey(false)
    if (res.ok) {
      setFeedback('API key saved — restart server to apply')
      setApiKeyInput('')
      onRefresh()
    } else {
      setFeedback(res.error ?? 'Error')
    }
  }

  return (
    <div
      className={`bg-white rounded-2xl border-2 p-5 flex flex-col gap-4 ${provider.borderColor}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{provider.emoji}</span>
          <div>
            <div className="font-bold text-gray-900 text-sm">{provider.name}</div>
            {isDefault && (
              <span className="text-xs text-indigo-600 font-medium">Global Default</span>
            )}
          </div>
        </div>
        <span
          className={`text-xs px-2 py-1 rounded-full font-semibold ${
            provider.configured
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-600'
          }`}
        >
          {provider.configured ? 'Key Set' : 'No Key'}
        </span>
      </div>

      {/* Model selector */}
      <div>
        <label className="text-xs text-gray-500 mb-1 block font-medium">Model Version</label>
        <select
          value={selectedModel}
          onChange={e => setSelectedModel(e.target.value)}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          {provider.models.map(m => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      {/* Set default button */}
      <button
        onClick={handleSetDefault}
        disabled={saving}
        className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors ${
          isDefault
            ? 'bg-indigo-600 text-white cursor-default'
            : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
        } disabled:opacity-50`}
      >
        {saving ? 'Saving…' : isDefault ? 'Current Default' : 'Set as Global Default'}
      </button>

      {/* API key input */}
      <div>
        <label className="text-xs text-gray-500 mb-1 block font-medium">
          {provider.configured ? 'Replace API Key' : 'Set API Key'}
        </label>
        <div className="flex gap-2">
          <input
            type="password"
            value={apiKeyInput}
            onChange={e => setApiKeyInput(e.target.value)}
            placeholder="sk-…"
            className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
          <button
            onClick={handleSaveKey}
            disabled={savingKey || !apiKeyInput.trim()}
            className="text-sm bg-gray-900 text-white px-3 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-40 transition-colors whitespace-nowrap"
          >
            {savingKey ? '…' : 'Save Key'}
          </button>
        </div>
      </div>

      {feedback && (
        <p className="text-xs text-indigo-600 font-medium">{feedback}</p>
      )}
    </div>
  )
}

function AgentTable({
  agents,
  allModels,
  onRefresh,
}: {
  agents: AgentRow[]
  allModels: string[]
  onRefresh: () => void
}) {
  const [pendingType, startTransition] = useTransition()
  const [saving, setSaving] = useState<string | null>(null)
  const [localModels, setLocalModels] = useState<Record<string, string>>(
    Object.fromEntries(agents.map(a => [a.agentType, a.model])),
  )

  async function handleModelChange(agentType: string, model: string) {
    setLocalModels(prev => ({ ...prev, [agentType]: model }))
    setSaving(agentType)
    const res = await callApi('update_model', { agentType, model })
    setSaving(null)
    if (res.ok) {
      startTransition(() => onRefresh())
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900">Per-Agent Model Configuration</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Override which model each agent type uses
        </p>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            {['Agent Type', 'Model', 'Status', ''].map(h => (
              <th
                key={h}
                className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {agents.map(a => (
            <tr key={a.id} className="hover:bg-gray-50">
              <td className="px-6 py-3 font-mono text-xs text-indigo-700">{a.agentType}</td>
              <td className="px-6 py-3">
                <select
                  value={localModels[a.agentType] ?? a.model}
                  onChange={e => handleModelChange(a.agentType, e.target.value)}
                  className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
                >
                  {allModels.map(m => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-6 py-3">
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${
                    a.enabled
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {a.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </td>
              <td className="px-6 py-3 text-xs text-gray-400">
                {saving === a.agentType ? 'Saving…' : ''}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function ProvidersClient({ providers, agents, globalDefault }: Props) {
  const router = useRouter()
  const allModels = Array.from(new Set(providers.flatMap(p => p.models)))

  function refresh() {
    router.refresh()
  }

  return (
    <div className="space-y-10">
      {/* Provider grid */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">AI Provider API Keys & Defaults</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {providers.map(provider => (
            <ProviderCard
              key={provider.id}
              provider={provider}
              isDefault={globalDefault?.provider === provider.id}
              onRefresh={refresh}
            />
          ))}
        </div>
      </section>

      {/* Per-agent table */}
      <section>
        <AgentTable agents={agents} allModels={allModels} onRefresh={refresh} />
      </section>
    </div>
  )
}
