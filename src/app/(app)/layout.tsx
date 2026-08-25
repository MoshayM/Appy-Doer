import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth'
import AppSidebar from '@/components/layout/AppSidebar'
import TrialBanner from '@/components/layout/TrialBanner'
import NotificationBell from '@/components/layout/NotificationBell'

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
        {/* Top bar — padded on mobile for hamburger button */}
        <div className="flex items-center justify-between lg:justify-end px-4 lg:px-8 py-2 border-b border-gray-100 bg-white">
          {/* Spacer for mobile hamburger (the button itself is fixed-position in the sidebar) */}
          <div className="lg:hidden w-10" />
          <NotificationBell />
        </div>
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
