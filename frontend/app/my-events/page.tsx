'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import Layout from '@/components/Layout'
import EventModal from '@/components/EventModal'

interface SubscriptionItem {
  id: number
  eventId: number
  event: {
    id: number
    title: string
    dateStart: string
    dateEnd: string
    timeStart: string
    timeEnd: string
    place: string
    department?: { name: string; color: string }
  }
}

function toCalEvent(s: SubscriptionItem) {
  const e = s.event
  const toDate = (d: string, t: string) => new Date(`${String(d).slice(0, 10)}T${String(t || '00:00').slice(0, 5)}`)
  return {
    id: e.id,
    title: e.title,
    start: toDate(e.dateStart, e.timeStart),
    end: toDate(e.dateEnd || e.dateStart, e.timeEnd),
    department: e.department,
    resource: { place: e.place },
  }
}

export default function MyEventsPage() {
  const [list, setList] = useState<SubscriptionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [subscriptionIds, setSubscriptionIds] = useState<Set<number>>(new Set())

  const loadList = () => {
    api.get('/subscriptions/my')
      .then(r => {
        const data = r.data || []
        setList(data)
        setSubscriptionIds(new Set(data.map((s: SubscriptionItem) => s.eventId)))
      })
      .catch(() => setList([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadList() }, [])

  const handleUnsubscribe = async (eventId: number) => {
    try {
      await api.delete(`/subscriptions/events/${eventId}`)
      setList(prev => prev.filter(s => s.eventId !== eventId))
      setSubscriptionIds(prev => {
        const next = new Set(prev)
        next.delete(eventId)
        return next
      })
      if (selectedEvent?.id === eventId) setSelectedEvent(null)
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-prof-black">Мои события</h1>
        <p className="text-sm text-prof-black/40 mt-0.5">Мероприятия, на которые вы подписаны</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <svg className="w-7 h-7 animate-spin text-prof-pacific" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : list.length === 0 ? (
        <div className="text-center py-20">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-prof-mint mx-auto mb-4">
            <svg className="w-8 h-8 text-prof-pacific" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
          <p className="text-prof-black/50 font-medium">У вас пока нет подписок</p>
          <p className="text-sm text-prof-black/30 mt-1">Подписывайтесь на мероприятия в календаре</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {list.map(s => {
            const c = s.event.department?.color || '#18A7B5'
            const calEvent = toCalEvent(s)
            return (
              <div
                key={s.id}
                className="glass-panel rounded-2xl p-5 hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setSelectedEvent(calEvent)}>
                    <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold text-white" style={{ backgroundColor: c }}>
                        <span className="w-[6px] h-[6px] rounded-full bg-white/50" />{s.event.department?.name || '—'}
                      </span>
                      <h3 className="text-base font-bold text-prof-black truncate">{s.event.title}</h3>
                    </div>
                    <p className="text-xs text-prof-black/40">
                      {new Date(`${s.event.dateStart}T${s.event.timeStart}`).toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      {' — '}
                      {s.event.place}
                    </p>
                  </div>
                  <button
                    onClick={() => handleUnsubscribe(s.eventId)}
                    className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-500/60 hover:text-red-600 hover:bg-red-50/60 border border-red-200/40 transition-all"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Отписаться
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <EventModal
        event={selectedEvent}
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        isSubscribed={selectedEvent ? subscriptionIds.has(selectedEvent.id) : false}
      />
    </Layout>
  )
}
