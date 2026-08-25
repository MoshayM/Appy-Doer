'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PlatformRole, Plan } from '@prisma/client'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { LogOut, Menu, X } from 'lucide-react'

const navItems = [
  { href: '/dashboard',               label: 'Dashboard',            icon: '📊' },
  { href: '/dashboard/skills',        label: 'Income Planner',       icon: '💰' },
  { href: '/dashboard/profile',       label: 'My Profile',           icon: '🧑‍💼' },
  { href: '/dashboard/clients',       label: 'Client Outreach',      icon: '🔍' },
  { href: '/dashboard/workspace',     label: 'Work Support',         icon: '⚡' },
  { href: '/dashboard/crm',           label: 'Client Hub',           icon: '🤝' },
  { href: '/dashboard/tickets',       label: 'My Tickets',           icon: '🎫' },
]

const financeAccountItems = [
  { href: '/dashboard/income',       label: 'Income Dashboard',       icon: '💰' },
  { href: '/dashboard/connections',  label: 'Connections',            icon: '🔗' },
  { href: '/billing',                label: 'Subscription & Billing', icon: '💳' },
  { href: '/dashboard/guide',        label: 'Platform Guide',         icon: '📚' },
]

const adminItems = [
  { href: '/admin',                    label: 'Admin Dashboard',    icon: '🛡️' },
  { href: '/admin/users',              label: 'Users',              icon: '👥' },
  { href: '/admin/tickets',            label: 'Support Tickets',    icon: '🎫' },
]

const superAdminItems = [
  { href: '/admin/ai-providers',       label: 'AI Providers',       icon: '🧩' },
  { href: '/admin/ai-config',          label: 'Agent Config',       icon: '⚙️' },
  { href: '/admin/offers',             label: 'Offer Engine',       icon: '💡' },
  { href: '/admin/flags',              label: 'Feature Flags',      icon: '🚀' },
  { href: '/admin/revenue',            label: 'Revenue Analytics',  icon: '💰' },
]

interface Props {
  role: PlatformRole
  plan: Plan
  email: string
}

function accountLabel(role: PlatformRole, plan: Plan): string {
  if (role === 'SUPER_ADMIN') return 'Super Admin'
  if (role === 'ADMIN')       return 'Admin'
  return plan === 'TRIAL' ? '7-Day Trial' : plan
}

const isAdmin = (role: PlatformRole) => role === 'ADMIN' || role === 'SUPER_ADMIN'

export default function AppSidebar({ role, plan, email }: Props) {
  const pathname = usePathname()
  const [loggingOut, setLoggingOut] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const isFreelancerActive = navItems.some(
    item => pathname === item.href || pathname.startsWith(item.href + '/'),
  )
  const isFinanceActive = financeAccountItems.some(
    item => pathname === item.href || pathname.startsWith(item.href + '/'),
  )
  const isAdminActive = adminItems.some(
    item => pathname === item.href || pathname.startsWith(item.href + '/'),
  )
  const isSystemActive = superAdminItems.some(
    item => pathname === item.href || pathname.startsWith(item.href + '/'),
  )

  const [freelancerOpen, setFreelancerOpen] = useState(isFreelancerActive || (!isAdminActive && !isSystemActive && !isFinanceActive))
  const [financeOpen, setFinanceOpen]       = useState(isFinanceActive)
  const [adminOpen, setAdminOpen]           = useState(isAdminActive)
  const [systemOpen, setSystemOpen]         = useState(isSystemActive)

  async function handleLogout() {
    setLoggingOut(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  const initials = email.split('@')[0].slice(0, 2).toUpperCase()

  const sectionBtn = (label: string, open: boolean, toggle: () => void, color: 'indigo' | 'purple' | 'gray') => (
    <button
      onClick={toggle}
      className={cn(
        'w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors',
        color === 'indigo' ? 'text-indigo-400 hover:bg-indigo-50 hover:text-indigo-600' :
        color === 'purple' ? 'text-purple-400 hover:bg-purple-50 hover:text-purple-600' :
                             'text-gray-400 hover:bg-gray-50 hover:text-gray-600',
      )}
    >
      <span>{label}</span>
      <span className={cn('transition-transform duration-200', open ? 'rotate-180' : '')}>▾</span>
    </button>
  )

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="p-5 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{filter:'drop-shadow(0 1px 4px rgba(67,56,202,0.22))'}}>
            <path d="M13 11 C6 11, 2 19, 3 26 C4 33, 10 36, 14 32 C17 29, 17 20, 14 14 Z" fill="#6d28d9"/>
            <path d="M27 11 C34 11, 38 19, 37 26 C36 33, 30 36, 26 32 C23 29, 23 20, 26 14 Z" fill="#6d28d9"/>
            <circle cx="20" cy="21" r="12" fill="#4338ca"/>
            <circle cx="15"   cy="19.5" r="3.2" fill="white"/>
            <circle cx="15"   cy="19.5" r="1.7" fill="#1e1b4b"/>
            <circle cx="15.9" cy="18.2" r=".85"  fill="white" opacity=".9"/>
            <circle cx="25"   cy="19.5" r="3.2" fill="white"/>
            <circle cx="25"   cy="19.5" r="1.7" fill="#1e1b4b"/>
            <circle cx="25.9" cy="18.2" r=".85"  fill="white" opacity=".9"/>
            <ellipse cx="20" cy="25.5" rx="2.5" ry="1.8" fill="white"/>
            <path d="M16 27.5 Q20 32 24 27.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
            <ellipse cx="20" cy="32"   rx="2.8" ry="2.6" fill="#f43f5e"/>
            <ellipse cx="20" cy="33.8" rx="2.8" ry="1"   fill="#e11d48"/>
            <line x1="20" y1="30" x2="20" y2="34.5" stroke="#e11d48" strokeWidth=".8" strokeLinecap="round"/>
          </svg>
          <div>
            <div className="font-bold text-gray-900 text-sm tracking-tight">Appy<span className="text-indigo-600">Doer</span></div>
            <div className="text-xs text-gray-400">{accountLabel(role, plan)}</div>
          </div>
        </div>
        {/* Mobile close button */}
        <button className="lg:hidden p-1 rounded-lg text-gray-400 hover:text-gray-600" onClick={() => setMobileOpen(false)}>
          <X size={18} />
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile hamburger trigger — fixed top-left */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-xl shadow-md border border-gray-200 text-gray-600"
        onClick={() => setMobileOpen(o => !o)}
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar — desktop always visible, mobile drawer */}
      <aside className={cn(
        'bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 ease-in-out',
        // Desktop: static in layout flow
        'lg:relative lg:translate-x-0 lg:w-64 lg:flex',
        // Mobile: fixed drawer from left
        'fixed inset-y-0 left-0 z-50 w-72',
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      )}>
      <SidebarContent />

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto">

        {/* ── Freelancer Tools — collapsible ── */}
        <div className="px-3">
          {sectionBtn('Freelancer Tools', freelancerOpen, () => setFreelancerOpen(o => !o), 'indigo')}
          {freelancerOpen && (
            <div className="mt-1 space-y-0.5">
              {navItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    pathname === item.href || pathname.startsWith(item.href + '/')
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                  )}
                >
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* ── Finance & Account — collapsible ── */}
        <div className="px-3 mt-2 pt-3 border-t border-gray-100">
          {sectionBtn('Finance & Account', financeOpen, () => setFinanceOpen(o => !o), 'gray')}
          {financeOpen && (
            <div className="mt-1 space-y-0.5">
              {financeAccountItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    pathname === item.href || pathname.startsWith(item.href + '/')
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                  )}
                >
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* ── Admin Controls — collapsible, ADMIN + SUPER_ADMIN ── */}
        {isAdmin(role) && (
          <div className="px-3 mt-2 pt-3 border-t border-gray-100">
            {sectionBtn('Admin Controls', adminOpen, () => setAdminOpen(o => !o), 'purple')}
            {adminOpen && (
              <div className="mt-1 space-y-0.5">
                {adminItems.map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      pathname === item.href || pathname.startsWith(item.href + '/')
                        ? 'bg-purple-50 text-purple-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                    )}
                  >
                    <span className="text-base">{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── System Tools — collapsible, SUPER_ADMIN only ── */}
        {role === 'SUPER_ADMIN' && (
          <div className="px-3 mt-2 pt-3 border-t border-gray-100">
            {sectionBtn('System Tools', systemOpen, () => setSystemOpen(o => !o), 'purple')}
            {systemOpen && (
              <div className="mt-1 space-y-0.5">
                {superAdminItems.map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      pathname === item.href || pathname.startsWith(item.href + '/')
                        ? 'bg-purple-50 text-purple-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                    )}
                  >
                    <span className="text-base">{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

      </nav>

      {/* User footer */}
      <div className="p-3 border-t border-gray-100">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg group">
          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-700 truncate">{email}</p>
            <p className="text-xs text-gray-400">{accountLabel(role, plan)}</p>
          </div>
          <a
            href="/dashboard/settings"
            title="Account settings"
            className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </a>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            title="Sign out"
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
      </aside>
    </>
  )
}
