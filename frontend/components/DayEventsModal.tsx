'use client'

import { useEffect } from 'react'

function formatEventTime(start: Date): string {
  return `${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')}`
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).replace(/\//g, '.')
}

interface CalEvent {
  id: number
  title: string
  start: Date
  end: Date
  department?: { name: string; color: string }
  departments?: { id: number; name: string; color: string }[]
}

interface DayEventsModalProps {
  events: CalEvent[]
  date: Date
  isOpen: boolean
  onClose: () => void
  onSelectEvent: (event: CalEvent) => void
}

export default function DayEventsModal({
  events,
  date,
  isOpen,
  onClose,
  onSelectEvent,
}: DayEventsModalProps) {
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

  if (!isOpen) return null

  const sortedEvents = [...events].sort((a, b) => a.start.getTime() - b.start.getTime())

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-prof-black/50 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-sm max-h-[85vh] flex flex-col rounded-2xl shadow-xl border border-white/10 overflow-hidden animate-modal-in"
        style={{ background: 'rgba(40, 35, 38, 0.95)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">{formatDate(date)}</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-2">
          {sortedEvents.map((evt) => {
            const color = evt.departments?.[0]?.color || evt.department?.color || '#18A7B5'
            return (
              <button
                key={evt.id}
                onClick={() => onSelectEvent(evt)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-left text-white font-semibold text-sm transition-opacity hover:opacity-90"
                style={{ backgroundColor: color }}
              >
                <span className="truncate flex-1 min-w-0">{evt.title}</span>
                <span className="shrink-0 text-xs font-medium opacity-95">
                  {formatEventTime(evt.start)}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
