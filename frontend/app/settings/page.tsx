'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { api, extractErrorMessage } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import Layout from '@/components/Layout'

export default function SettingsPage() {
  const router = useRouter()
  const { user, isAuthenticated, setAuth } = useAuthStore()
  const [nickname, setNickname] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordRepeat, setPasswordRepeat] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [orgRequested, setOrgRequested] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) { router.replace('/login'); return }
    setNickname(user?.nickname || '')
    setEmail(user?.email || '')
  }, [isAuthenticated, user, router])

  const handleSave = async () => {
    setError(''); setMessage(''); setSaving(true)
    if (password && password !== passwordRepeat) {
      setError('Пароли не совпадают')
      setSaving(false)
      return
    }
    try {
      const body: any = {}
      if (nickname !== user?.nickname) body.nickname = nickname
      if (email !== user?.email) body.email = email
      if (password) body.password = password
      const r = await api.patch('/users/me', body)
      if (user) {
        setAuth({ ...user, nickname: r.data.nickname, email: r.data.email }, localStorage.getItem('token') || '')
      }
      setMessage('Настройки сохранены')
      setPassword('')
      setPasswordRepeat('')
    } catch (e) { setError(extractErrorMessage(e)) }
    finally { setSaving(false) }
  }

  const requestOrganizer = async () => {
    try {
      await api.post('/users/request-organizer')
      setOrgRequested(true)
    } catch {}
  }

  if (!isAuthenticated) return null

  const inputClass = 'w-full px-4 py-3 rounded-xl border border-prof-pine/12 bg-white/60 text-sm text-prof-black placeholder:text-prof-black/30 focus:outline-none focus:ring-2 focus:ring-prof-pacific/30 focus:border-prof-pacific transition-all backdrop-blur-sm'

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-prof-black mb-1">Настройки</h1>
        <p className="text-sm text-prof-black/40 mb-8">Управление аккаунтом и подписками</p>

        {/* Profile */}
        <div className="glass-panel rounded-2xl p-6 mb-6">
          <h2 className="text-base font-bold text-prof-black mb-4">Профиль</h2>

          {message && <div className="mb-4 px-4 py-3 rounded-xl bg-emerald-50/80 border border-emerald-100 text-sm text-emerald-700">{message}</div>}
          {error && <div className="mb-4 px-4 py-3 rounded-xl bg-red-50/80 border border-red-100 text-sm text-red-600">{error}</div>}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-prof-black/50 uppercase tracking-wider mb-1.5">Никнейм</label>
              <input type="text" value={nickname} onChange={e => setNickname(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-prof-black/50 uppercase tracking-wider mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-prof-black/50 uppercase tracking-wider mb-1.5">Новый пароль</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Оставьте пустым, чтобы не менять"
                  className={inputClass + ' pr-10'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-prof-black/40 hover:text-prof-pine"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-prof-black/50 uppercase tracking-wider mb-1.5">Повторите пароль</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={passwordRepeat}
                onChange={e => setPasswordRepeat(e.target.value)}
                placeholder="Повторите новый пароль"
                className={inputClass}
              />
            </div>
            <button onClick={handleSave} disabled={saving}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-white gradient-prof shadow-md hover:shadow-lg transition-all disabled:opacity-50">
              {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </div>

        {/* Request organizer */}
        {user?.role === 'activist' && (
          <div className="glass-panel rounded-2xl p-6">
            <h2 className="text-base font-bold text-prof-black mb-2">Стать организатором</h2>
            <p className="text-sm text-prof-black/50 mb-4">Подайте заявку, чтобы получить возможность создавать мероприятия</p>
            {orgRequested ? (
              <p className="text-sm text-emerald-600 font-semibold">Заявка отправлена администраторам</p>
            ) : (
              <button onClick={requestOrganizer}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white gradient-prof shadow-md hover:shadow-lg transition-all">
                Подать заявку на роль организатора
              </button>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}
