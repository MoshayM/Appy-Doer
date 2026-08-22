import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import FlagsClient from './FlagsClient'

async function requireSuperAdmin() {
  const user = await getAuthUser()
  if (!user) redirect('/login')
  if (user.role !== 'SUPER_ADMIN') redirect('/dashboard')
}

export default async function FeatureFlagsPage() {
  await requireSuperAdmin()

  const flags = await prisma.featureFlag.findMany({
    orderBy: [{ phase: 'asc' }, { key: 'asc' }],
  })

  const serialised = flags.map(f => ({
    id:          f.id,
    key:         f.key,
    description: f.description,
    type:        f.type,
    value:       f.value,
    phase:       f.phase ?? null,
    updatedAt:   f.updatedAt.toISOString(),
  }))

  const enabledCount  = flags.filter(f => f.type === 'boolean' && f.value === true).length
  const disabledCount = flags.filter(f => f.type === 'boolean' && f.value === false).length

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-xl">🚀</div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Feature Flags</h1>
            <p className="text-gray-500 text-sm">Toggle features and experiments in real time — changes apply immediately</p>
          </div>
        </div>

        {/* Summary bar */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total Flags',  value: flags.length,  color: 'bg-gray-50 border-gray-200',     text: 'text-gray-900' },
            { label: 'Enabled',      value: enabledCount,  color: 'bg-green-50 border-green-200',   text: 'text-green-800' },
            { label: 'Disabled',     value: disabledCount, color: 'bg-gray-50 border-gray-200',     text: 'text-gray-600' },
          ].map(s => (
            <div key={s.label} className={`border rounded-xl p-4 ${s.color}`}>
              <div className={`text-3xl font-bold ${s.text}`}>{s.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <FlagsClient initialFlags={serialised} />
    </div>
  )
}
