'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  Home,
  Library,
  Tag,
  Users,
  Building2,
  Film,
  Search,
  Settings,
  ChevronDown,
  Menu,
  X,
} from 'lucide-react'

const navigationItems = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Library', href: '/library', icon: Library },
  { label: 'Collections', href: '/collections', icon: Tag },
  { label: 'Tags', href: '/tags', icon: Tag },
  { label: 'Developers', href: '/developers', icon: Users },
  { label: 'Publishers', href: '/publishers', icon: Building2 },
  { label: 'Franchises', href: '/franchises', icon: Film },
  { label: 'Search', href: '/search', icon: Search },
]

const adminItems = [
  { label: 'Dashboard', href: '/admin' },
  { label: 'Library Management', href: '/admin/library' },
  { label: 'Job Center', href: '/admin/jobs' },
  { label: 'Metadata Review', href: '/admin/metadata' },
  { label: 'Artwork Center', href: '/admin/artwork' },
  { label: 'Collections', href: '/admin/collections' },
  { label: 'Users', href: '/admin/users' },
  { label: 'Permissions', href: '/admin/permissions' },
  { label: 'Settings', href: '/admin/settings' },
  { label: 'Audit Logs', href: '/admin/audit-logs' },
]

export function Sidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(true)
  const [adminOpen, setAdminOpen] = useState(false)
  const isAdmin = pathname.startsWith('/admin')

  return (
    <>
      {/* Mobile Toggle */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-background border-b border-border z-50 p-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-accent">Ludexis</h1>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed lg:relative top-0 left-0 h-screen w-64 bg-card border-r border-border overflow-y-auto transition-transform lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } z-40 lg:z-auto pt-20 lg:pt-0`}
      >
        {/* Logo */}
        <div className="hidden lg:flex items-center justify-center h-20 border-b border-border">
          <h1 className="text-2xl font-bold text-accent">Ludexis</h1>
        </div>

        {/* Navigation */}
        <nav className="p-4">
          <div className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>

          {/* Admin Section */}
          <div className="mt-8 pt-4 border-t border-border">
            <button
              onClick={() => setAdminOpen(!adminOpen)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-foreground hover:bg-muted ${
                isAdmin ? 'bg-muted' : ''
              }`}
            >
              <Settings size={20} />
              <span>Administration</span>
              <ChevronDown
                size={16}
                className={`ml-auto transition-transform ${adminOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {adminOpen && (
              <div className="mt-2 space-y-1 ml-2">
                {adminItems.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`block px-4 py-2 rounded-lg text-sm transition-colors ${
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-foreground hover:bg-muted'
                      }`}
                    >
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </nav>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30 top-20"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
