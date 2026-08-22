import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

async function requireSuperAdmin() {
  const user = await getAuthUser()
  if (!user) redirect('/login')
  if (user.role !== 'SUPER_ADMIN') redirect('/dashboard')
}

function formatINR(paise: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(paise / 100)
}

function fmtNum(n: number) {
  return n.toLocaleString('en-IN')
}

export default async function RevenueAnalyticsPage() {
  await requireSuperAdmin()

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const [
    monthlyAgg,
    yearlyAgg,
    totalRevenueAgg,
    recentRevenueAgg,
    subsByStatus,
    subsByPlan,
    newUsers30d,
    totalUsers,
    trialCount,
    convertedCount,
    recentPayments,
  ] = await Promise.all([
    prisma.subscription.aggregate({
      where: { status: 'ACTIVE', interval: 'MONTH' },
      _sum:  { priceINR: true },
      _count: { _all: true },
    }),
    prisma.subscription.aggregate({
      where: { status: 'ACTIVE', interval: 'YEAR' },
      _sum:  { priceINR: true },
      _count: { _all: true },
    }),
    prisma.payment.aggregate({ _sum: { amountINR: true } }),
    prisma.payment.aggregate({
      where: { createdAt: { gte: thirtyDaysAgo } },
      _sum:  { amountINR: true },
    }),
    prisma.subscription.groupBy({
      by:    ['status'],
      _count: { _all: true },
    }),
    prisma.subscription.groupBy({
      by:    ['plan'],
      _count: { _all: true },
      where: { status: 'ACTIVE' },
    }),
    prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.user.count(),
    prisma.subscription.count({ where: { status: 'TRIALING' } }),
    prisma.subscription.count({ where: { status: { in: ['ACTIVE', 'GRACE'] } } }),
    prisma.payment.findMany({
      orderBy: { createdAt: 'desc' },
      take: 12,
      include: {
        subscription: {
          include: { user: { select: { email: true } } },
        },
      },
    }),
  ])

  const monthlyMRR = monthlyAgg._sum.priceINR ?? 0
  const yearlyMRR  = Math.round((yearlyAgg._sum.priceINR ?? 0) / 12)
  const totalMRR   = monthlyMRR + yearlyMRR
  const totalARR   = totalMRR * 12

  const totalRev   = totalRevenueAgg._sum.amountINR ?? 0
  const recentRev  = recentRevenueAgg._sum.amountINR ?? 0

  const activeCount   = subsByStatus.find(s => s.status === 'ACTIVE')?._count._all ?? 0
  const trialingCount = subsByStatus.find(s => s.status === 'TRIALING')?._count._all ?? 0
  const canceledCount = subsByStatus.find(s => s.status === 'CANCELED')?._count._all ?? 0
  const expiredCount  = subsByStatus.find(s => s.status === 'EXPIRED')?._count._all ?? 0

  const conversionRate = trialCount + convertedCount > 0
    ? Math.round((convertedCount / (trialCount + convertedCount)) * 100)
    : 0

  const STATUS_COLOR: Record<string, string> = {
    ACTIVE:   'bg-green-100 text-green-700',
    TRIALING: 'bg-amber-100 text-amber-700',
    CANCELED: 'bg-red-100 text-red-700',
    EXPIRED:  'bg-gray-100 text-gray-500',
    GRACE:    'bg-blue-100 text-blue-700',
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-xl">💰</div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Revenue Analytics</h1>
          <p className="text-gray-500 text-sm">Real-time subscription and payment metrics</p>
        </div>
      </div>

      {/* MRR / ARR hero */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Monthly Recurring Revenue', value: formatINR(totalMRR),  sub: `${fmtNum(activeCount)} active subscriptions`,    bg: 'bg-indigo-50 border-indigo-200', val: 'text-indigo-700' },
          { label: 'Annual Run Rate (ARR)',      value: formatINR(totalARR),  sub: 'MRR × 12',                                       bg: 'bg-purple-50 border-purple-200', val: 'text-purple-700' },
          { label: 'Total Revenue',              value: formatINR(totalRev),  sub: 'All payments collected',                         bg: 'bg-green-50 border-green-200',   val: 'text-green-700'  },
          { label: 'Revenue (Last 30 Days)',     value: formatINR(recentRev), sub: `${fmtNum(newUsers30d)} new users joined`,         bg: 'bg-blue-50 border-blue-200',     val: 'text-blue-700'   },
        ].map(card => (
          <div key={card.label} className={`border rounded-2xl p-5 ${card.bg}`}>
            <div className={`text-2xl font-bold ${card.val}`}>{card.value}</div>
            <div className="text-xs font-semibold text-gray-600 mt-1">{card.label}</div>
            <div className="text-xs text-gray-400 mt-0.5">{card.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Subscription status breakdown */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="font-bold text-gray-900 mb-4">Subscription Status</h2>
          <div className="space-y-3">
            {[
              { label: 'Active',    count: activeCount,   status: 'ACTIVE' },
              { label: 'Trialing',  count: trialingCount, status: 'TRIALING' },
              { label: 'Canceled',  count: canceledCount, status: 'CANCELED' },
              { label: 'Expired',   count: expiredCount,  status: 'EXPIRED' },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[row.status] ?? 'bg-gray-100 text-gray-500'}`}>
                    {row.label}
                  </span>
                </div>
                <span className="font-bold text-gray-900 text-sm">{fmtNum(row.count)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Trial → Paid conversion</span>
              <span className="font-bold text-indigo-700">{conversionRate}%</span>
            </div>
            <div className="mt-1.5 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${conversionRate}%` }}/>
            </div>
          </div>
        </div>

        {/* Revenue by plan */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="font-bold text-gray-900 mb-4">Active Subscriptions by Plan</h2>
          {subsByPlan.length === 0 ? (
            <p className="text-gray-400 text-sm">No active subscriptions yet.</p>
          ) : (
            <div className="space-y-3">
              {subsByPlan.sort((a, b) => b._count._all - a._count._all).map(row => {
                const total = subsByPlan.reduce((s, r) => s + r._count._all, 0)
                const pct = total > 0 ? Math.round((row._count._all / total) * 100) : 0
                const PLAN_COLOR: Record<string, string> = {
                  PREMIUM: 'bg-purple-500',
                  PRO:     'bg-blue-500',
                  TRIAL:   'bg-amber-400',
                  FREE:    'bg-gray-300',
                }
                return (
                  <div key={row.plan}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">{row.plan}</span>
                      <span className="text-gray-500">{fmtNum(row._count._all)} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${PLAN_COLOR[row.plan] ?? 'bg-gray-400'}`} style={{ width: `${pct}%` }}/>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-gray-100 grid grid-cols-2 gap-3">
            <div>
              <div className="text-lg font-bold text-gray-900">{fmtNum(totalUsers)}</div>
              <div className="text-xs text-gray-400">Total users</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-700">+{fmtNum(newUsers30d)}</div>
              <div className="text-xs text-gray-400">Last 30 days</div>
            </div>
          </div>
        </div>

        {/* MRR breakdown */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="font-bold text-gray-900 mb-4">MRR Breakdown</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-700">Monthly plans</div>
                <div className="text-xs text-gray-400">{fmtNum(monthlyAgg._count._all)} subscriptions</div>
              </div>
              <div className="text-lg font-bold text-gray-900">{formatINR(monthlyMRR)}</div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-700">Annual plans (÷12)</div>
                <div className="text-xs text-gray-400">{fmtNum(yearlyAgg._count._all)} subscriptions</div>
              </div>
              <div className="text-lg font-bold text-gray-900">{formatINR(yearlyMRR)}</div>
            </div>
            <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
              <div className="text-sm font-semibold text-indigo-700">Total MRR</div>
              <div className="text-xl font-bold text-indigo-700">{formatINR(totalMRR)}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-purple-700">ARR Projection</div>
              <div className="text-xl font-bold text-purple-700">{formatINR(totalARR)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent payments */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Recent Payments</h2>
          <p className="text-xs text-gray-400 mt-0.5">Last 12 transactions</p>
        </div>
        {recentPayments.length === 0 ? (
          <div className="px-6 py-10 text-center text-gray-400 text-sm">No payments recorded yet.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentPayments.map(p => (
              <div key={p.id} className="px-6 py-3 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {p.subscription?.user?.email ?? '—'}
                  </div>
                  <div className="text-xs text-gray-400">
                    {p.gateway} · {p.createdAt.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    p.status === 'captured' || p.status === 'PAID' || p.status === 'succeeded'
                      ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>{p.status}</span>
                  <span className="text-sm font-bold text-gray-900">{formatINR(p.amountINR)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
