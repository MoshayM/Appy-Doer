import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { redirect } from 'next/navigation'

async function requireSuperAdmin() {
  const user = await getAuthUser()
  if (!user) redirect('/login')
  if (user.role !== 'SUPER_ADMIN') redirect('/dashboard')
}

const PLAN_COLORS: Record<string, string> = {
  TRIAL: 'bg-blue-100 text-blue-700',
  PRO: 'bg-purple-100 text-purple-700',
  PREMIUM: 'bg-yellow-100 text-yellow-700',
  FREE: 'bg-gray-100 text-gray-500',
}

export default async function UsersPage() {
  await requireSuperAdmin()

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: {
      id: true, email: true, name: true, plan: true, role: true, createdAt: true,
      subscription: { select: { status: true, trialEndsAt: true } },
    },
  })

  const agentRunCounts = await prisma.agentRun.groupBy({
    by: ['userId'],
    where: { userId: { in: users.map(u => u.id) } },
    _count: { id: true },
  })
  const leadCounts = await prisma.lead.groupBy({
    by: ['userId'],
    where: { userId: { in: users.map(u => u.id) } },
    _count: { id: true },
  })

  const runMap = Object.fromEntries(agentRunCounts.map(r => [r.userId, r._count.id]))
  const leadMap = Object.fromEntries(leadCounts.map(r => [r.userId, r._count.id]))

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <p className="text-gray-500 mt-1">{users.length} most recent users</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['User', 'Plan', 'Role', 'Trial Ends', 'AI Runs', 'Leads', 'Joined'].map(h => (
                <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{u.name ?? '—'}</div>
                  <div className="text-xs text-gray-400">{u.email}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${PLAN_COLORS[u.plan] ?? 'bg-gray-100 text-gray-600'}`}>{u.plan}</span>
                </td>
                <td className="px-6 py-4 text-gray-600 text-xs">{u.role}</td>
                <td className="px-6 py-4 text-gray-600 text-xs">
                  {u.subscription?.trialEndsAt ? new Date(u.subscription.trialEndsAt).toLocaleDateString('en-IN') : '—'}
                </td>
                <td className="px-6 py-4 text-gray-700 font-mono">{runMap[u.id] ?? 0}</td>
                <td className="px-6 py-4 text-gray-700 font-mono">{leadMap[u.id] ?? 0}</td>
                <td className="px-6 py-4 text-gray-500 text-xs">{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
