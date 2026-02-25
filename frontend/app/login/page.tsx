'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api, extractErrorMessage } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

export default function LoginPage() {
  const router = useRouter()
  const { setAuth } = useAuthStore()
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({ email: '', password: '', nickname: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register'
      const body = isLogin
        ? { email: formData.email, password: formData.password }
        : formData
      const response = await api.post(endpoint, body)
      setAuth(response.data.user, response.data.accessToken)
      router.push('/calendar')
    } catch (err: any) {
      setError(extractErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left: branding panel */}
      <div className="hidden lg:flex lg:w-1/2 gradient-prof relative overflow-hidden items-center justify-center p-12">
        {/* decorative circles */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-white/5" />
        <div className="absolute top-1/2 left-1/4 w-48 h-48 rounded-full bg-white/5" />

        <div className="relative z-10 max-w-md text-white">
          <div className="mb-8">
            <img src="/logo.svg" alt="ПРОФ" className="h-12 brightness-0 invert" />
          </div>
          <h1 className="text-4xl font-bold leading-tight mb-4">
            Календарь мероприятий
          </h1>
          <p className="text-lg text-white/80 font-light leading-relaxed">
            Единая платформа для планирования, подачи и управления мероприятиями профсоюзной организации
          </p>
          <div className="mt-10 flex gap-6 text-sm text-white/60">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </span>
              Расписание
            </div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </span>
              Подписки
            </div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              </span>
              Уведомления
            </div>
          </div>
        </div>
      </div>

      {/* Right: form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12 bg-[#f8fdfb]">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex lg:hidden mb-8 justify-center">
            <img src="/logo.svg" alt="ПРОФ" className="h-10" />
          </div>

          <div className="bg-white rounded-2xl shadow-card p-8">
            <h2 className="text-2xl font-bold text-prof-black mb-1">
              {isLogin ? 'Вход в систему' : 'Регистрация'}
            </h2>
            <p className="text-sm text-prof-black/50 mb-6">
              {isLogin
                ? 'Войдите, чтобы управлять мероприятиями'
                : 'Создайте аккаунт для участия'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {error}
                </div>
              )}

              {!isLogin && (
                <div>
                  <label className="block text-sm font-semibold text-prof-black/70 mb-1.5">
                    Никнейм
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nickname}
                    onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                    placeholder="Ваше имя или ник"
                    className="w-full px-4 py-3 rounded-xl border border-prof-pine/15 bg-prof-mint/20 text-prof-black placeholder:text-prof-black/30 focus:outline-none focus:ring-2 focus:ring-prof-pacific/40 focus:border-prof-pacific transition-all"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-prof-black/70 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="name@university.ru"
                  className="w-full px-4 py-3 rounded-xl border border-prof-pine/15 bg-prof-mint/20 text-prof-black placeholder:text-prof-black/30 focus:outline-none focus:ring-2 focus:ring-prof-pacific/40 focus:border-prof-pacific transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-prof-black/70 mb-1.5">
                  Пароль
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Минимум 6 символов"
                  className="w-full px-4 py-3 rounded-xl border border-prof-pine/15 bg-prof-mint/20 text-prof-black placeholder:text-prof-black/30 focus:outline-none focus:ring-2 focus:ring-prof-pacific/40 focus:border-prof-pacific transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-bold text-white gradient-prof shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    Загрузка...
                  </span>
                ) : isLogin ? 'Войти' : 'Создать аккаунт'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-prof-black/50">
                {isLogin ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}{' '}
                <button
                  onClick={() => { setIsLogin(!isLogin); setError('') }}
                  className="font-semibold text-prof-pacific hover:text-prof-pine transition-colors"
                >
                  {isLogin ? 'Зарегистрироваться' : 'Войти'}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
