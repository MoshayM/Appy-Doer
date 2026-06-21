'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PlatformRole, Plan } from '@prisma/client'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { LogOut } from 'lucide-react'

const navItems = [
  { href: '/dashboard',          label: 'Dashboard',          icon: '📊' },
  { href: '/dashboard/skills',   label: 'Skill Assessment',   icon: '🧠' },
  { href: '/dashboard/opportunities', label: 'Opportunities', icon: '🎯' },
  { href: '/dashboard/offers',   label: 'Offer Builder',      icon: '📦' },
  { href: '/dashboard/portfolio',label: 'Portfolio',          icon: '🗂️' },
  { href: '/dashboard/profile',  label: 'Profile Intelligence', icon: '👤' },
  { href: '/dashboard/clients',  label: 'Client Intelligence', icon: '🔍' },
  { href: '/dashboard/crm',      label: 'CRM',                icon: '📋' },
  { href: '/dashboard/outreach', label: 'Outreach', icon: '📧' },
  { href: '/dashboard/relationship', label: 'Relationships',  icon: '🤝' },
  { href: '/dashboard/workspace',label: 'Work Support',       icon: '⚡' },
  { href: '/dashboard/income',       label: 'Income Dashboard',   icon: '💰' },
  { href: '/dashboard/connections',  label: 'Connections',        icon: '🔗' },
  { href: '/dashboard/tickets',      label: 'My Tickets',         icon: '🎫' },
  { href: '/plans',              label: 'Subscription Plans', icon: '⭐' },
  { href: '/billing',            label: 'Billing',            icon: '💳' },
]

const adminItems = [
  { href: '/admin',                    label: 'Admin Dashboard',    icon: '🛡️' },
  { href: '/admin/ai-providers',       label: 'AI Providers',       icon: '🧩' },
  { href: '/admin/ai-config',          label: 'Agent Config',       icon: '⚙️' },
  { href: '/admin/users',              label: 'Users',              icon: '👥' },
  { href: '/admin/offers',             label: 'Offer Engine',       icon: '💡' },
  { href: '/admin/tickets',            label: 'Support Tickets',    icon: '🎫' },
]

interface Props {
  role: PlatformRole
  plan: Plan
  email: string
}

export default function AppSidebar({ role, plan, email }: Props) {
  const pathname = usePathname()
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    setLoggingOut(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  const initials = email.split('@')[0].slice(0, 2).toUpperCase()

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">W</div>
          <div>
            <div className="font-bold text-gray-900 text-sm">AI WorkBuddy</div>
            <div className="text-xs text-gray-400">{plan === 'TRIAL' ? '7-Day Trial' : plan}</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <div className="px-3 space-y-0.5">
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

        {(role === 'SUPER_ADMIN' || role === 'ADMIN') && (
          <div className="px-3 mt-4 space-y-0.5 border-t border-gray-100 pt-4">
            {adminItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  pathname.startsWith(item.href)
                    ? 'bg-purple-50 text-purple-700'
                    : 'text-gray-600 hover:bg-gray-50',
                )}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            ))}
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
            <p className="text-xs text-gray-400">{plan === 'TRIAL' ? '7-Day Trial' : plan}</p>
          </div>
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
  )
}
