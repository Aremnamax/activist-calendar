'use client'

import { useEffect } from 'react'

interface EventModalProps {
  event: any
  isOpen: boolean
  onClose: () => void
  onSubscribe?: () => void
  isSubscribed?: boolean
}

export default function EventModal({
  event,
  isOpen,
  onClose,
  onSubscribe,
  isSubscribed = false,
}: EventModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [isOpen])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (isOpen) window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  if (!isOpen || !event) return null

  const deptColor = event.department?.color || '#18A7B5'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      {/* backdrop */}
      <div className="absolute inset-0 bg-prof-black/40 backdrop-blur-sm" />

      {/* modal */}
      <div
        className="relative w-full max-w-lg glass-card rounded-2xl shadow-modal border border-white/40 overflow-hidden animate-modal-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* color bar */}
        <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${deptColor}, ${deptColor}88)` }} />

        <div className="p-6 sm:p-8">
          {/* header */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-prof-black leading-tight">{event.title}</h2>
            <button
              onClick={onClose}
              className="shrink-0 flex h-8 w-8 items-center justify-center rounded-lg text-prof-black/30 hover:text-prof-black hover:bg-prof-mint transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* info grid */}
          <div className="grid gap-4">
            {/* date & time */}
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-prof-mint text-prof-pine">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </span>
              <div>
                <p className="text-xs font-semibold text-prof-black/40 uppercase tracking-wider">Дата и время</p>
                <p className="text-sm font-semibold text-prof-black mt-0.5">
                  {new Date(event.start).toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
                <p className="text-sm text-prof-black/60">
                  {new Date(event.start).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                  {' \u2014 '}
                  {new Date(event.end).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>

            {/* place */}
            {event.resource?.place && (
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-prof-mint text-prof-pine">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </span>
                <div>
                  <p className="text-xs font-semibold text-prof-black/40 uppercase tracking-wider">Место</p>
                  <p className="text-sm font-semibold text-prof-black mt-0.5">{event.resource.place}</p>
                </div>
              </div>
            )}

            {/* department */}
            {event.department && (
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-prof-mint text-prof-pine">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </span>
                <div>
                  <p className="text-xs font-semibold text-prof-black/40 uppercase tracking-wider">Подразделение</p>
                  <span
                    className="inline-flex mt-1 items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: deptColor }}
                  >
                    <span className="w-[6px] h-[6px] rounded-full bg-white/50" />
                    {event.department.name}
                  </span>
                </div>
              </div>
            )}

            {/* description */}
            {event.resource?.description && (
              <div className="bg-prof-mint/30 rounded-xl p-4 mt-1">
                <p className="text-xs font-semibold text-prof-black/40 uppercase tracking-wider mb-1.5">Описание</p>
                <p className="text-sm text-prof-black/70 leading-relaxed whitespace-pre-line">{event.resource.description}</p>
              </div>
            )}

            {/* labels */}
            {event.labels && event.labels.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-1">
                {event.labels.map((label: string, index: number) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-prof-pacific/10 text-prof-pacific"
                  >
                    {label}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* subscribe button */}
          {onSubscribe && (
            <div className="mt-6 pt-5 border-t border-prof-pine/8">
              <button
                onClick={onSubscribe}
                disabled={isSubscribed}
                className={`w-full py-3 rounded-xl text-sm font-bold transition-all ${
                  isSubscribed
                    ? 'bg-prof-mint text-prof-pine cursor-default'
                    : 'gradient-prof text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
                }`}
              >
                {isSubscribed ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Вы подписаны
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    Подписаться на мероприятие
                  </span>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
