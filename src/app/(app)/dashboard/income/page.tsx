import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatINR } from '@/lib/utils'
import { redirect } from 'next/navigation'

const MILESTONES = [
  { label: 'First ₹1,000',     amount: 1000 },
  { label: 'First ₹10,000',    amount: 10000 },
  { label: 'First ₹50,000',    amount: 50000 },
  { label: 'First ₹1,00,000',  amount: 100000 },
  { label: 'First ₹5,00,000',  amount: 500000 },
]

export default async function IncomeDashboard() {
  const user = await getAuthUser()
  if (!user) redirect('/login')

  const [leads, milestones] = await Promise.all([
    prisma.lead.findMany({ where: { userId: user.id }, select: { stage: true } }),
    prisma.revenueMilestone.findMany({ where: { userId: user.id } }),
  ])

  const won   = leads.filter(l => l.stage === 'WON').length
  const total = leads.length
  const firstIncome = milestones.find(m => m.isFirstIncome)

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Income Dashboard</h1>
        <p className="text-gray-500 mt-1">Track your journey to financial freedom.</p>
      </div>

      {/* First Income Celebration */}
      {firstIncome ? (
        <div className="bg-gradient-to-r from-green-400 to-emerald-500 rounded-2xl p-8 mb-8 text-white text-center">
          <div className="text-5xl mb-3">🎉</div>
          <h2 className="text-2xl font-bold mb-1">First Income Achieved!</h2>
          <p className="opacity-90">You've landed your first client. You are on your way.</p>
        </div>
      ) : (
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-6 mb-8 flex items-center gap-4">
          <div className="text-3xl">🎯</div>
          <div>
            <div className="font-bold text-gray-900">Primary Goal: First Income</div>
            <p className="text-sm text-gray-600 mt-0.5">Mark a lead as WON to trigger your First Income Celebration.</p>
          </div>
          <a href="/dashboard/crm" className="ml-auto bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors whitespace-nowrap">
            Open CRM →
          </a>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Leads',   value: total },
          { label: 'Clients Won',   value: won },
          { label: 'Win Rate',      value: total > 0 ? `${Math.round(won / total * 100)}%` : '—' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-gray-900 mb-1">{s.value}</div>
            <div className="text-sm text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Milestones */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h2 className="font-bold text-gray-900 mb-5">Income Milestones</h2>
        <div className="space-y-3">
          {MILESTONES.map(m => {
            const achieved = milestones.some(r => r.amountINR >= m.amount || r.isFirstIncome)
            return (
              <div key={m.label} className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${achieved ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                  {achieved ? '✓' : '○'}
                </div>
                <div className="flex-1">
                  <div className={`font-medium text-sm ${achieved ? 'text-gray-900' : 'text-gray-400'}`}>{m.label}</div>
                </div>
                {achieved && <span className="text-xs text-green-600 font-medium">Achieved</span>}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
