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

  const won         = leads.filter(l => l.stage === 'WON').length
  const active      = leads.filter(l => !['WON', 'LOST'].includes(l.stage)).length
  const firstIncome = milestones.find(m => m.isFirstIncome)

  const journeySteps = [
    { label: 'Skill Assessment', done: context?.onboardingComplete,       href: '/dashboard/skills',        emoji: '🧠' },
    { label: 'Opportunity',      done: !!context?.selectedOpportunityId,  href: '/dashboard/opportunities', emoji: '🎯' },
    { label: 'Offer Built',      done: false,                             href: '/dashboard/offers',        emoji: '📦' },
    { label: 'Portfolio Ready',  done: false,                             href: '/dashboard/portfolio',     emoji: '🖼️' },
    { label: 'First Client Won', done: !!firstIncome,                    href: '/dashboard/crm',           emoji: '🏆' },
    { label: 'Work Support',     done: agentRuns > 0,                    href: '/dashboard/workspace',     emoji: '⚡' },
    { label: 'Client Hub',       done: leads.length > 0,                 href: '/dashboard/crm',           emoji: '🤝' },
  ]

  const doneCount = journeySteps.filter(s => s.done).length
  const progressPct = Math.round((doneCount / journeySteps.length) * 100)

  const stats = [
    { label: 'Active Leads',  value: active,            icon: '📋', color: 'from-indigo-500 to-indigo-600',   ring: 'ring-indigo-100'  },
    { label: 'Clients Won',   value: won,               icon: '🏆', color: 'from-amber-400 to-orange-500',    ring: 'ring-amber-100'   },
    { label: 'AI Runs',       value: agentRuns,         icon: '🤖', color: 'from-cyan-500 to-sky-600',        ring: 'ring-cyan-100'    },
    { label: 'Milestones',    value: milestones.length, icon: '🎯', color: 'from-emerald-500 to-green-600',   ring: 'ring-emerald-100' },
  ]

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <p className="text-xs font-semibold text-indigo-500 uppercase tracking-widest">AI Workforce OS</p>
        <h1 className="text-2xl font-bold text-gray-900 mt-0.5 tracking-tight">Welcome back 👋</h1>
        <p className="text-gray-400 text-sm mt-1">Your income journey at a glance.</p>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-5 items-start">
        {/* Left column */}
        <div className="space-y-5">

          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {stats.map(s => (
              <div
                key={s.label}
                className={`bg-white rounded-2xl p-4 border border-gray-100 shadow-sm ring-2 ${s.ring} ring-opacity-0 hover:ring-opacity-100 transition-all duration-300 active:scale-95 cursor-default`}
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-lg mb-3 shadow-sm`}>
                  {s.icon}
                </div>
                <div className="text-2xl font-bold text-gray-900 tracking-tight">{s.value}</div>
                <div className="text-xs font-medium text-gray-400 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* First Income Celebration */}
          {firstIncome && (
            <div className="relative bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 rounded-2xl p-5 text-white overflow-hidden shadow-lg shadow-green-200">
              <div className="absolute -top-4 -right-4 text-8xl opacity-10 select-none">🎉</div>
              <div className="text-3xl mb-2">🎉</div>
              <h2 className="text-lg font-bold mb-1">First Income Achieved!</h2>
              <p className="text-green-100 text-sm leading-relaxed">Congratulations on landing your first client. This is what AppyDoer was built for.</p>
            </div>
          )}

          {/* Income Journey */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">Income Journey</h2>
              <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                {doneCount}/{journeySteps.length} done
              </span>
            </div>

            {/* Progress bar */}
            <div className="mb-4">
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-700"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {/* Mobile: vertical stepper */}
            <div className="flex flex-col gap-1.5 lg:hidden">
              {journeySteps.map((step, i) => (
                <Link
                  key={step.label}
                  href={step.href}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 active:scale-[0.98] ${
                    step.done
                      ? 'bg-green-50 border border-green-200/60'
                      : 'bg-gray-50 border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/40'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
                    step.done
                      ? 'bg-green-500 text-white shadow-sm shadow-green-200'
                      : 'bg-white border-2 border-gray-200 text-gray-400'
                  }`}>
                    {step.done ? '✓' : i + 1}
                  </div>
                  <span className="text-sm">{step.emoji}</span>
                  <span className={`text-sm font-medium ${step.done ? 'text-green-700' : 'text-gray-700'}`}>
                    {step.label}
                  </span>
                  <span className="ml-auto text-gray-300 text-base">›</span>
                </Link>
              ))}
            </div>

            {/* Desktop: horizontal chips */}
            <div className="hidden lg:flex items-center gap-2 flex-wrap">
              {journeySteps.map((step, i) => (
                <div key={step.label} className="flex items-center gap-2">
                  <Link
                    href={step.href}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 active:scale-95 ${
                      step.done
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'
                    }`}
                  >
                    <span>{step.emoji}</span>
                    {step.done && <span>✓</span>}
                    {step.label}
                  </Link>
                  {i < journeySteps.length - 1 && <span className="text-gray-200 font-light">→</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions — mobile only */}
          <div className="lg:hidden grid grid-cols-2 gap-3">
            {[
              { href: '/dashboard/clients',   label: 'Find Clients',    icon: '🔍', color: 'from-indigo-500 to-indigo-600' },
              { href: '/dashboard/workspace', label: 'Work Support',    icon: '⚡', color: 'from-cyan-500 to-sky-600'     },
              { href: '/dashboard/profile',   label: 'My Profile',      icon: '🧑‍💼', color: 'from-violet-500 to-purple-600' },
              { href: '/dashboard/crm',       label: 'Client Hub',      icon: '🤝', color: 'from-emerald-500 to-green-600' },
            ].map(a => (
              <Link
                key={a.href}
                href={a.href}
                className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm transition-all duration-200 active:scale-95 hover:shadow-md"
              >
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${a.color} flex items-center justify-center text-lg flex-shrink-0 shadow-sm`}>
                  {a.icon}
                </div>
                <span className="text-sm font-semibold text-gray-700">{a.label}</span>
              </Link>
            ))}
          </div>

        </div>

        {/* Right column — Activity Panel */}
        <ActivityPanel />
      </div>
    </div>
  )
}
