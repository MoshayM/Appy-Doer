import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth'
import AppSidebar from '@/components/layout/AppSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser()
  if (!user) redirect('/login')
  if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') redirect('/dashboard')

  return (
    <div className="flex h-screen bg-gray-50">
      <AppSidebar role={user.role} plan={user.plan} email={user.email} />
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  )
}
