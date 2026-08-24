import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import ActivityPanel from '@/components/dashboard/ActivityPanel'

export default async function DashboardPage() {
  const user = await getAuthUser()
  if (!user) redirect('/login')

  const [leads, milestones, agentRuns, context] = await Promise.all([
    prisma.lead.findMany({ where: { userId: user.id }, select: { stage: true } }),
    prisma.revenueMilestone.findMany({ where: { userId: user.id } }),
    prisma.agentRun.count({ where: { userId: user.id } }),
    prisma.userContext.findUnique({ where: { userId: user.id } }),
  ])

  const won       = leads.filter(l => l.stage === 'WON').length
  const active    = leads.filter(l => !['WON', 'LOST'].includes(l.stage)).length
  const firstIncome = milestones.find(m => m.isFirstIncome)

  const journeySteps = [
    { label: 'Skill Assessment',  done: context?.onboardingComplete,      href: '/dashboard/skills' },
    { label: 'Opportunity',       done: !!context?.selectedOpportunityId, href: '/dashboard/opportunities' },
    { label: 'Offer Built',       done: false,                            href: '/dashboard/offers' },
    { label: 'Portfolio Ready',   done: false,                            href: '/dashboard/portfolio' },
    { label: 'First Client Won',  done: !!firstIncome,                   href: '/dashboard/crm' },
    { label: 'Work Support',      done: agentRuns > 0,                   href: '/dashboard/workspace' },
    { label: 'Client Hub',        done: leads.length > 0,                href: '/dashboard/crm' },
  ]

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
        <p className="text-gray-500 mt-1">Here&apos;s your income journey progress.</p>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
        {/* Left column */}
        <div className="space-y-6">

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Active Leads',  value: active,           icon: '📋' },
              { label: 'Clients Won',   value: won,              icon: '🏆' },
              { label: 'AI Runs',       value: agentRuns,        icon: '🤖' },
              { label: 'Milestones',    value: milestones.length, icon: '🎯' },
            ].map(s => (
              <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="text-2xl mb-1">{s.icon}</div>
                <div className="text-2xl font-bold text-gray-900">{s.value}</div>
                <div className="text-sm text-gray-500">{s.label}</div>
              </div>
            ))}
          </div>

          {/* First Income Celebration */}
          {firstIncome && (
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-white">
              <div className="text-3xl mb-2">🎉</div>
              <h2 className="text-xl font-bold mb-1">First Income Achieved!</h2>
              <p className="text-green-100">Congratulations on landing your first client. This is what AI WorkBuddy was built for.</p>
            </div>
          )}

          {/* Journey */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="font-bold text-gray-900 mb-5">Your Income Journey</h2>
            <div className="flex items-center gap-2 flex-wrap">
              {journeySteps.map((step, i) => (
                <div key={step.label} className="flex items-center gap-2">
                  <Link
                    href={step.href}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      step.done
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'
                    }`}
                  >
                    {step.done && <span>✓</span>}
                    {step.label}
                  </Link>
                  {i < journeySteps.length - 1 && <span className="text-gray-300">→</span>}
                </div>
              ))}
            </div>
          </div>


</div>

        {/* Right column — Activity Panel */}
        <ActivityPanel />
      </div>
    </div>
  )
}
