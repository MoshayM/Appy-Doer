import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export default async function AdminDashboard() {
  const user = await getAuthUser()
  if (!user) redirect('/login')

  // Super Admin short-circuit — full access enforced here
  if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  const [totalUsers, trialUsers, proUsers, premiumUsers, freeUsers, totalLeads, wonLeads, agentRuns] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { plan: 'TRIAL' } }),
      prisma.user.count({ where: { plan: 'PRO' } }),
      prisma.user.count({ where: { plan: 'PREMIUM' } }),
      prisma.user.count({ where: { plan: 'FREE' } }),
      prisma.lead.count(),
      prisma.lead.count({ where: { stage: 'WON' } }),
      prisma.agentRun.count(),
    ])

  const recentUsers = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: { id: true, email: true, name: true, plan: true, role: true, createdAt: true },
  })

  const agentRunsByType = await prisma.agentRun.groupBy({
    by: ['agentType'],
    _count: { _all: true },
    orderBy: { _count: { agentType: 'desc' } },
  })

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-xl">🛡️</div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Super Admin Dashboard</h1>
            <p className="text-gray-500 text-sm">Full access — all features unlocked</p>
          </div>
        </div>
      </div>

      {/* Platform stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Users',   value: totalUsers,  icon: '👥' },
          { label: 'Trial',         value: trialUsers,  icon: '⏱️' },
          { label: 'Pro',           value: proUsers,    icon: '⭐' },
          { label: 'Premium',       value: premiumUsers, icon: '💎' },
          { label: 'Free (Locked)', value: freeUsers,   icon: '🔒' },
          { label: 'Total Leads',   value: totalLeads,  icon: '📋' },
          { label: 'Won Leads',     value: wonLeads,    icon: '🏆' },
          { label: 'Agent Runs',    value: agentRuns,   icon: '🤖' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="text-xl mb-1">{s.icon}</div>
            <div className="text-2xl font-bold text-gray-900">{s.value.toLocaleString()}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Recent users */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="font-bold text-gray-900 mb-4">Recent Users</h2>
          <div className="space-y-3">
            {recentUsers.map(u => (
              <div key={u.id} className="flex items-center justify-between text-sm">
                <div>
                  <div className="font-medium text-gray-900">{u.name ?? u.email}</div>
                  {u.name && <div className="text-gray-400 text-xs">{u.email}</div>}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    u.plan === 'PREMIUM' ? 'bg-purple-100 text-purple-700' :
                    u.plan === 'PRO'     ? 'bg-blue-100 text-blue-700' :
                    u.plan === 'TRIAL'   ? 'bg-amber-100 text-amber-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>{u.plan}</span>
                  {u.role === 'SUPER_ADMIN' && <span className="text-xs text-purple-600 font-medium">SUPER</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Agent usage */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="font-bold text-gray-900 mb-4">Agent Usage</h2>
          <div className="space-y-3">
            {agentRunsByType.map(row => (
              <div key={row.agentType} className="flex items-center justify-between text-sm">
                <span className="text-gray-700 font-medium">{row.agentType.replace(/_/g, ' ')}</span>
                <span className="text-gray-900 font-bold">{row._count._all}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Admin quick links */}
      <div className="grid md:grid-cols-3 gap-4">
        {([
          { title: 'User Management',   desc: 'View, edit, suspend users',         href: '/admin/users',        icon: '👥', superAdminOnly: false as boolean },
          { title: 'Support Tickets',   desc: 'User issues, workflow problems',    href: '/admin/tickets',      icon: '🎫', superAdminOnly: false as boolean },
          { title: 'AI Providers',      desc: 'API keys, models, global defaults', href: '/admin/ai-providers', icon: '🧩', superAdminOnly: true  as boolean },
          { title: 'AI Control Center', desc: 'Prompts, token budgets per agent',  href: '/admin/ai-config',    icon: '🤖', superAdminOnly: true  as boolean },
          { title: 'Offer Engine',      desc: 'Campaigns, targeting, discounts',   href: '/admin/offers',       icon: '💡', superAdminOnly: true  as boolean },
          { title: 'Feature Flags',     desc: 'Toggle features, A/B tests',        href: '/admin/flags',        icon: '🚀', superAdminOnly: true  as boolean },
          { title: 'Revenue Analytics', desc: 'MRR, ARR, churn, conversion',      href: '/admin/revenue',      icon: '💰', superAdminOnly: true  as boolean },
        ])
          .filter(a => !a.superAdminOnly || user.role === 'SUPER_ADMIN')
          .map(a => (
          <a key={a.title} href={a.href} className="bg-white border border-gray-200 rounded-xl p-5 hover:border-purple-300 hover:shadow-sm transition-all group block">
            <div className="text-2xl mb-3">{a.icon}</div>
            <div className="font-semibold text-gray-900 group-hover:text-purple-700 transition-colors text-sm">{a.title}</div>
            <div className="text-xs text-gray-500 mt-1">{a.desc}</div>
          </a>
        ))}
      </div>
    </div>
  )
}
