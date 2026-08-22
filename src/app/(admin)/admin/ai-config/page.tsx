import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { redirect } from 'next/navigation'

async function requireSuperAdmin() {
  const user = await getAuthUser()
  if (!user) redirect('/login')
  if (user.role !== 'SUPER_ADMIN') redirect('/dashboard')
}

export default async function AiConfigPage() {
  await requireSuperAdmin()

  const [agents, flags] = await Promise.all([
    prisma.agentConfig.findMany({ orderBy: { agentType: 'asc' } }),
    prisma.featureFlag.findMany({ orderBy: { key: 'asc' } }),
  ])

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">AI Configuration</h1>
        <p className="text-gray-500 mt-1">Agent configs and feature flags</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-100 font-semibold text-gray-900">Agent Configurations</div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['Agent', 'Model', 'Max Output Tokens', 'Enabled'].map(h => (
                <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {agents.map(a => (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-mono text-xs text-indigo-700">{a.agentType}</td>
                <td className="px-6 py-4 text-gray-700">{a.model}</td>
                <td className="px-6 py-4 text-gray-700">{a.maxOutputTokens.toLocaleString()}</td>
                <td className="px-6 py-4">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${a.enabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {a.enabled ? 'On' : 'Off'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 font-semibold text-gray-900">Feature Flags</div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['Key', 'Value', 'Phase', 'Description'].map(h => (
                <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {flags.map(f => (
              <tr key={f.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-mono text-xs text-gray-700">{f.key}</td>
                <td className="px-6 py-4 font-mono text-xs text-gray-700">{JSON.stringify(f.value)}</td>
                <td className="px-6 py-4 text-xs text-gray-500">{f.phase ?? '—'}</td>
                <td className="px-6 py-4 text-gray-500">{f.description ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
