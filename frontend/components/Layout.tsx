'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { useState, useEffect, useRef } from 'react'
import { api } from '@/lib/api'

/* ───── Icons ───── */
const CalendarIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)
const RequestIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)
const AdminIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
  </svg>
)
const EventsIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
)
const BellIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
)
const SettingsIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)
const LogoutIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
)
const MenuIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
  </svg>
)
const CloseIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  show: boolean
  badge?: number
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user, isAuthenticated, logout } = useAuthStore()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<any[]>([])
  const [bellOpen, setBellOpen] = useState(false)
  const bellRef = useRef<HTMLDivElement>(null)

  const isAdmin = user?.role === 'admin'
  const isOrganizer = user?.role === 'organizer' || isAdmin

  useEffect(() => {
    if (!isAuthenticated) return
    if (isAdmin) {
      api.get('/event-requests/pending-count').then(r => setPendingCount(r.data?.count || 0)).catch(() => {})
    }
    api.get('/notifications/unread-count').then(r => setUnreadCount(r.data?.count || 0)).catch(() => {})
  }, [isAuthenticated, isAdmin, pathname])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const openBell = async () => {
    const willOpen = !bellOpen
    setBellOpen(willOpen)
    if (willOpen) {
      try {
        const r = await api.get('/notifications')
        setNotifications(r.data || [])
        if (unreadCount > 0) {
          await api.patch('/notifications/read-all')
          setUnreadCount(0)
        }
      } catch {}
    }
  }

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all')
      setUnreadCount(0)
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    } catch {}
  }

  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const navItems: NavItem[] = [
    { href: '/calendar', label: 'Календарь', icon: <CalendarIcon />, show: true },
    { href: '/my-requests', label: 'Мои заявки', icon: <RequestIcon />, show: isAuthenticated && isOrganizer },
    { href: '/admin/requests', label: 'Модерация', icon: <AdminIcon />, show: isAuthenticated && isAdmin, badge: pendingCount },
    { href: '/my-events', label: 'Мои события', icon: <EventsIcon />, show: isAuthenticated },
  ]

  const active = (href: string) => pathname === href

  const roleLabel = (role?: string) => {
    if (role === 'admin') return 'Администратор'
    if (role === 'organizer') return 'Организатор'
    return 'Активист'
  }

  return (
    <div className="min-h-screen bg-[#f4fbf8]">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-header border-b border-white/30">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/calendar" className="flex items-center group">
              <img src="/logo.svg" alt="ПРОФ" className="h-9 group-hover:opacity-80 transition-opacity" />
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.filter(n => n.show).map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    active(item.href)
                      ? 'bg-prof-pine text-white shadow-md'
                      : 'text-prof-black/70 hover:bg-white/60 hover:text-prof-pine'
                  }`}
                >
                  {item.icon}
                  {item.label}
                  {!!item.badge && item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1 shadow">
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              {isAuthenticated ? (
                <>
                  {/* Notification bell */}
                  <div className="relative" ref={bellRef}>
                    <button
                      onClick={openBell}
                      className="relative p-2 rounded-xl text-prof-black/50 hover:bg-white/60 hover:text-prof-pine transition-colors"
                    >
                      <BellIcon />
                      {unreadCount > 0 && (
                        <span className="absolute top-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold px-0.5">
                          {unreadCount}
                        </span>
                      )}
                    </button>
                    {bellOpen && (
                      <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl shadow-modal border border-white/30 overflow-hidden z-50" style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px) saturate(1.4)' }}>
                        <div className="flex items-center justify-between px-4 py-3 border-b border-prof-pine/8">
                          <p className="text-sm font-bold text-prof-black">Уведомления</p>
                          {unreadCount > 0 && (
                            <button onClick={markAllRead} className="text-xs font-semibold text-prof-pacific hover:text-prof-pine">
                              Прочитать все
                            </button>
                          )}
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                          {notifications.length === 0 ? (
                            <p className="px-4 py-6 text-sm text-prof-black/40 text-center">Нет уведомлений</p>
                          ) : (
                            notifications.slice(0, 20).map(n => {
                              const isOrgRequest = n.metadata?.action === 'organizer_request'
                              return (
                                <div key={n.id} className={`px-4 py-3 border-b border-prof-pine/5 last:border-0 text-sm ${n.isRead ? 'text-prof-black/40' : 'text-prof-black bg-prof-mint/20'}`}>
                                  <p className="leading-snug">{n.message}</p>
                                  {isOrgRequest && isAdmin && !n.metadata?.resolved && (
                                    <div className="flex gap-2 mt-2">
                                      <button
                                        onClick={async (e) => {
                                          e.stopPropagation()
                                          try {
                                            await api.post(`/users/${n.metadata.userId}/approve-organizer`)
                                            await api.patch(`/notifications/${n.id}/read`)
                                            setUnreadCount(c => Math.max(0, c - 1))
                                            setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, isRead: true, metadata: { ...x.metadata, resolved: 'approved' } } : x))
                                          } catch {}
                                        }}
                                        className="px-3 py-1 rounded-lg text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 transition-colors"
                                      >
                                        Одобрить
                                      </button>
                                      <button
                                        onClick={async (e) => {
                                          e.stopPropagation()
                                          try {
                                            await api.post(`/users/${n.metadata.userId}/reject-organizer`)
                                            await api.patch(`/notifications/${n.id}/read`)
                                            setUnreadCount(c => Math.max(0, c - 1))
                                            setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, isRead: true, metadata: { ...x.metadata, resolved: 'rejected' } } : x))
                                          } catch {}
                                        }}
                                        className="px-3 py-1 rounded-lg text-xs font-bold text-white bg-red-500 hover:bg-red-600 transition-colors"
                                      >
                                        Отклонить
                                      </button>
                                    </div>
                                  )}
                                  {isOrgRequest && n.metadata?.resolved && (
                                    <p className={`text-xs font-semibold mt-1.5 ${n.metadata.resolved === 'approved' ? 'text-emerald-600' : 'text-red-500'}`}>
                                      {n.metadata.resolved === 'approved' ? 'Одобрено' : 'Отклонено'}
                                    </p>
                                  )}
                                  <p className="text-[11px] mt-1 text-prof-black/30">
                                    {new Date(n.createdAt).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                </div>
                              )
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* User avatar + dropdown */}
                  <div className="relative hidden sm:block" ref={userMenuRef}>
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="flex items-center gap-3 ml-1 p-1 rounded-xl hover:bg-white/50 transition-colors"
                    >
                      <div className="text-right">
                        <p className="text-sm font-semibold text-prof-black leading-tight">{user?.nickname}</p>
                        <p className="text-xs text-prof-pacific font-medium">{roleLabel(user?.role)}</p>
                      </div>
                      <div className="h-9 w-9 rounded-xl gradient-prof flex items-center justify-center text-white font-bold text-sm shadow-sm">
                        {user?.nickname?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    </button>
                    {userMenuOpen && (
                      <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl shadow-modal border border-white/30 overflow-hidden z-50 py-1" style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px) saturate(1.4)' }}>
                        <Link
                          href="/settings"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-prof-black/70 hover:bg-prof-mint/40 hover:text-prof-pine transition-colors"
                        >
                          <SettingsIcon />
                          Настройки
                        </Link>
                        <div className="border-t border-prof-pine/8 my-1" />
                        <button
                          onClick={() => { setUserMenuOpen(false); logout() }}
                          className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm font-medium text-red-500/70 hover:bg-red-50/60 hover:text-red-600 transition-colors"
                        >
                          <LogoutIcon />
                          Выйти
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <Link
                  href="/login"
                  className="px-5 py-2 rounded-xl text-sm font-bold text-white gradient-prof shadow-md hover:shadow-lg transition-all"
                >
                  Войти
                </Link>
              )}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2 text-prof-black/70 hover:bg-white/60 rounded-xl transition-colors"
              >
                {mobileOpen ? <CloseIcon /> : <MenuIcon />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-72 glass-card shadow-2xl animate-slide-in border-l border-white/30">
            <div className="flex items-center justify-between p-4 border-b border-prof-pine/10">
              {isAuthenticated ? (
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-xl gradient-prof flex items-center justify-center text-white font-bold text-sm">
                    {user?.nickname?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-prof-black">{user?.nickname}</p>
                    <p className="text-xs text-prof-pacific">{roleLabel(user?.role)}</p>
                  </div>
                </div>
              ) : (
                <span className="text-sm font-bold text-prof-black">ПРОФ</span>
              )}
              <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <CloseIcon />
              </button>
            </div>
            <nav className="p-3 space-y-1">
              {navItems.filter(n => n.show).map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    active(item.href) ? 'bg-prof-pine text-white shadow-md' : 'text-prof-black/70 hover:bg-white/60 hover:text-prof-pine'
                  }`}
                >
                  {item.icon}
                  {item.label}
                  {!!item.badge && item.badge > 0 && (
                    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1">
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}
              {isAuthenticated && (
                <Link
                  href="/settings"
                  onClick={() => setMobileOpen(false)}
                  className={`relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    active('/settings') ? 'bg-prof-pine text-white shadow-md' : 'text-prof-black/70 hover:bg-white/60 hover:text-prof-pine'
                  }`}
                >
                  <SettingsIcon />
                  Настройки
                </Link>
              )}
            </nav>
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-prof-pine/10">
              {isAuthenticated ? (
                <button
                  onClick={() => { logout(); setMobileOpen(false) }}
                  className="flex items-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
                >
                  <LogoutIcon />
                  Выйти из аккаунта
                </button>
              ) : (
                <Link href="/login" onClick={() => setMobileOpen(false)} className="flex items-center justify-center w-full px-4 py-3 rounded-xl text-sm font-bold text-white gradient-prof">
                  Войти / Регистрация
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {children}
      </main>
    </div>
  )
}
