import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth'
import AppSidebar from '@/components/layout/AppSidebar'
import TrialBanner from '@/components/layout/TrialBanner'
import NotificationBell from '@/components/layout/NotificationBell'
import AppyDoerLogo from '@/components/AppyDoerLogo'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser()
  if (!user) redirect('/login')

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <AppSidebar role={user.role} plan={user.plan} email={user.email} />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {user.trialDaysRemaining !== null && (
          <TrialBanner daysRemaining={user.trialDaysRemaining} />
        )}

        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white shadow-sm">
          <div className="flex items-center gap-2">
            <AppyDoerLogo size={28} variant="icon" />
            <span className="font-bold text-sm text-gray-900 tracking-tight">
              Appy<span className="text-cyan-500">Doer</span>
            </span>
            {user.plan === 'TRIAL' && (
              <span className="ml-1 px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-600 text-[10px] font-semibold border border-amber-200">
                TRIAL
              </span>
            )}
            {user.plan === 'PRO' && (
              <span className="ml-1 px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-600 text-[10px] font-semibold border border-indigo-200">
                PRO
              </span>
            )}
            {user.plan === 'PREMIUM' && (
              <span className="ml-1 px-1.5 py-0.5 rounded-md bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[10px] font-semibold">
                PREMIUM
              </span>
            )}
          </div>
          <NotificationBell />
        </div>

        {/* Desktop top bar */}
        <div className="hidden lg:flex items-center justify-end px-8 py-2 border-b border-gray-100 bg-white">
          <NotificationBell />
        </div>

        {/* Main content — pb-20 on mobile for bottom nav clearance */}
        <main className="flex-1 overflow-y-auto p-4 pb-24 lg:p-8 lg:pb-8">
          {children}
        </main>
      </div>
    </div>
  )
}
