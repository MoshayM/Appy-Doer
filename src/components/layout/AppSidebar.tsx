'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PlatformRole, Plan } from '@prisma/client'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { LogOut, X, Home, TrendingUp, Search, Zap, MoreHorizontal } from 'lucide-react'
import AppyDoerLogo from '@/components/AppyDoerLogo'

const navItems = [
  { href: '/dashboard',               label: 'Dashboard',       icon: '📊' },
  { href: '/dashboard/skills',        label: 'Income Planner',  icon: '💰' },
  { href: '/dashboard/profile',       label: 'My Profile',      icon: '🧑‍💼' },
  { href: '/dashboard/clients',       label: 'Client Outreach', icon: '🔍' },
  { href: '/dashboard/workspace',     label: 'Work Support',    icon: '⚡' },
  { href: '/dashboard/crm',           label: 'Client Hub',      icon: '🤝' },
  { href: '/dashboard/tickets',       label: 'My Tickets',      icon: '🎫' },
]

const financeAccountItems = [
  { href: '/dashboard/income',       label: 'Income Dashboard',       icon: '💰' },
  { href: '/dashboard/connections',  label: 'Connections',            icon: '🔗' },
  { href: '/billing',                label: 'Subscription & Billing', icon: '💳' },
  { href: '/dashboard/guide',        label: 'Platform Guide',         icon: '📚' },
]

const adminItems = [
  { href: '/admin',         label: 'Admin Dashboard', icon: '🛡️' },
  { href: '/admin/users',   label: 'Users',           icon: '👥' },
  { href: '/admin/tickets', label: 'Support Tickets', icon: '🎫' },
]

const superAdminItems = [
  { href: '/admin/ai-providers', label: 'AI Providers',      icon: '🧩' },
  { href: '/admin/ai-config',    label: 'Agent Config',      icon: '⚙️' },
  { href: '/admin/offers',       label: 'Offer Engine',      icon: '💡' },
  { href: '/admin/flags',        label: 'Feature Flags',     icon: '🚀' },
  { href: '/admin/revenue',      label: 'Revenue Analytics', icon: '💰' },
]

const mobileTabs = [
  { href: '/dashboard',           label: 'Home',    Icon: Home },
  { href: '/dashboard/skills',    label: 'Income',  Icon: TrendingUp },
  { href: '/dashboard/clients',   label: 'Clients', Icon: Search },
  { href: '/dashboard/workspace', label: 'Work',    Icon: Zap },
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
        'w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200',
        color === 'indigo' ? 'text-indigo-400 hover:bg-indigo-50 hover:text-indigo-600 active:scale-95' :
        color === 'purple' ? 'text-purple-400 hover:bg-purple-50 hover:text-purple-600 active:scale-95' :
                             'text-gray-400 hover:bg-gray-50 hover:text-gray-600 active:scale-95',
      )}
    >
      <span>{label}</span>
      <span className={cn('transition-transform duration-300', open ? 'rotate-180' : '')}>▾</span>
    </button>
  )

  const navLink = (item: { href: string; label: string; icon: string }, activeColor: 'indigo' | 'purple') => {
    const active = pathname === item.href || pathname.startsWith(item.href + '/')
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setMobileOpen(false)}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 active:scale-95',
          active
            ? activeColor === 'indigo'
              ? 'bg-indigo-50 text-indigo-700 shadow-sm shadow-indigo-100'
              : 'bg-purple-50 text-purple-700 shadow-sm shadow-purple-100'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
        )}
      >
        <span className="text-base leading-none">{item.icon}</span>
        <span>{item.label}</span>
        {active && (
          <span className={cn(
            'ml-auto w-1.5 h-1.5 rounded-full',
            activeColor === 'indigo' ? 'bg-indigo-500' : 'bg-purple-500',
          )} />
        )}
      </Link>
    )
  }

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar — desktop always visible, mobile drawer */}
      <aside className={cn(
        'bg-white flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]',
        'lg:relative lg:translate-x-0 lg:w-64 lg:flex lg:border-r lg:border-gray-200 lg:shadow-none',
        'fixed inset-y-0 left-0 z-50 w-[280px] shadow-2xl shadow-black/20',
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      )}>
        {/* Logo header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-indigo-600 to-indigo-700 lg:bg-none lg:from-transparent lg:to-transparent">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 lg:bg-transparent flex items-center justify-center lg:block">
              <AppyDoerLogo size={32} variant="icon" />
            </div>
            <div>
              <div className="font-bold text-white lg:text-gray-900 text-sm tracking-tight">
                Appy<span className="text-cyan-300 lg:text-cyan-500">Doer</span>
              </div>
              <div className="text-xs text-indigo-200 lg:text-gray-400">{accountLabel(role, plan)}</div>
            </div>
          </div>
          <button
            className="lg:hidden p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors active:scale-90"
            onClick={() => setMobileOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 overflow-y-auto">

          {/* Freelancer Tools */}
          <div className="px-3">
            {sectionBtn('Freelancer Tools', freelancerOpen, () => setFreelancerOpen(o => !o), 'indigo')}
            {freelancerOpen && (
              <div className="mt-1 space-y-0.5">
                {navItems.map(item => navLink(item, 'indigo'))}
              </div>
            )}
          </div>

          {/* Finance & Account */}
          <div className="px-3 mt-2 pt-3 border-t border-gray-100">
            {sectionBtn('Finance & Account', financeOpen, () => setFinanceOpen(o => !o), 'gray')}
            {financeOpen && (
              <div className="mt-1 space-y-0.5">
                {financeAccountItems.map(item => navLink(item, 'indigo'))}
              </div>
            )}
          </div>

          {/* Admin Controls */}
          {isAdmin(role) && (
            <div className="px-3 mt-2 pt-3 border-t border-gray-100">
              {sectionBtn('Admin Controls', adminOpen, () => setAdminOpen(o => !o), 'purple')}
              {adminOpen && (
                <div className="mt-1 space-y-0.5">
                  {adminItems.map(item => navLink(item, 'purple'))}
                </div>
              )}
            </div>
          )}

          {/* System Tools */}
          {role === 'SUPER_ADMIN' && (
            <div className="px-3 mt-2 pt-3 border-t border-gray-100">
              {sectionBtn('System Tools', systemOpen, () => setSystemOpen(o => !o), 'purple')}
              {systemOpen && (
                <div className="mt-1 space-y-0.5">
                  {superAdminItems.map(item => navLink(item, 'purple'))}
                </div>
              )}
            </div>
          )}
        </nav>

        {/* User footer */}
        <div className="p-3 border-t border-gray-100">
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-gray-50 transition-colors group">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-sm shadow-indigo-200">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-700 truncate">{email}</p>
              <p className="text-xs text-gray-400">{accountLabel(role, plan)}</p>
            </div>
            <a
              href="/dashboard/settings"
              title="Settings"
              className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors active:scale-90"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </a>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              title="Sign out"
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50 active:scale-90"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Mobile bottom navigation bar ───────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-100 flex items-stretch shadow-[0_-4px_24px_-4px_rgba(0,0,0,0.08)]" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {mobileTabs.map(tab => {
          const active = pathname === tab.href || (tab.href !== '/dashboard' && pathname.startsWith(tab.href + '/'))
          return (
            <Link
              key={tab.href}
              href={tab.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-all duration-200 active:scale-90 no-select',
                active ? 'text-indigo-600' : 'text-gray-400',
              )}
            >
              <span className={cn(
                'relative p-1.5 rounded-xl transition-all duration-200',
                active ? 'bg-indigo-50' : '',
              )}>
                <tab.Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                {active && (
                  <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-indigo-600 rounded-full" />
                )}
              </span>
              <span className={cn('text-[10px]', active ? 'font-semibold' : 'font-medium')}>{tab.label}</span>
            </Link>
          )
        })}
        {/* More → opens sidebar drawer */}
        <button
          onClick={() => setMobileOpen(o => !o)}
          className={cn(
            'flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-all duration-200 active:scale-90 no-select',
            mobileOpen ? 'text-indigo-600' : 'text-gray-400',
          )}
        >
          <span className={cn(
            'p-1.5 rounded-xl transition-all duration-200',
            mobileOpen ? 'bg-indigo-50' : '',
          )}>
            <MoreHorizontal size={20} strokeWidth={mobileOpen ? 2.5 : 1.8} />
          </span>
          <span className={cn('text-[10px]', mobileOpen ? 'font-semibold' : 'font-medium')}>More</span>
        </button>
      </nav>
    </>
  )
}
