'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Calendar, momentLocalizer, View, SlotInfo, ToolbarProps, Navigate } from 'react-big-calendar'
import moment from 'moment'
import 'moment/locale/ru'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import Layout from '@/components/Layout'
import EventModal from '@/components/EventModal'
import EventRequestForm from '@/components/EventRequestForm'
import { EVENT_LABELS } from '@/lib/constants'

moment.locale('ru')
const localizer = momentLocalizer(moment)

interface CalEvent {
  id: number
  title: string
  start: Date
  end: Date
  department?: { name: string; color: string }
  labels?: string[]
  resource?: any
}

function isTimedEvent(start: Date, end: Date): boolean {
  const ms = end.getTime() - start.getTime()
  const hours = ms / (1000 * 60 * 60)
  return hours < 23.5
}

function formatEventTime(start: Date, end: Date): string {
  return `${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')}–${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}`
}

function CustomEventComponent({ event, title, view }: { event: CalEvent; title?: string; view?: View }) {
  const color = event.department?.color || '#18A7B5'
  const timed = isTimedEvent(event.start, event.end)
  const isTimeGrid = view === 'day' || view === 'week'
  if (isTimeGrid || !timed) {
    return (
      <span className="rbc-event-label">
        {title || event.title}
        {isTimeGrid && timed && (
          <span className="block text-[11px] font-normal opacity-90 mt-0.5">{formatEventTime(event.start, event.end)}</span>
        )}
      </span>
    )
  }
  return (
    <span className="rbc-event-timed flex items-center gap-2">
      <span className="w-[8px] h-[8px] rounded-full shrink-0" style={{ backgroundColor: color }} />
      <span className="truncate text-[13px]">{title || event.title}</span>
      <span className="text-[11px] opacity-75 shrink-0">{formatEventTime(event.start, event.end)}</span>
    </span>
  )
}

interface Department {
  id: number
  name: string
  color: string
}

function CustomToolbar({ label, onNavigate, onView, view }: ToolbarProps<CalEvent, object>) {
  const views: { key: View; name: string }[] = [
    { key: 'month', name: 'Месяц' },
    { key: 'week', name: 'Неделя' },
    { key: 'day', name: 'День' },
    { key: 'agenda', name: 'Список' },
  ]

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

  return (
    <div className="mb-4">
      {/* Desktop: 3-column grid to keep month perfectly centered */}
      <div className="hidden sm:grid grid-cols-3 items-center gap-3">
        {/* Left: view switcher */}
        <div className="flex gap-1.5 justify-start">
          {views.map(v => (
            <button
              key={v.key}
              onClick={() => onView(v.key)}
              className={`px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                view === v.key
                  ? 'bg-prof-pine text-white shadow-sm'
                  : 'text-prof-black/50 hover:bg-white/60 border border-prof-pine/10'
              }`}
            >
              {v.name}
            </button>
          ))}
        </div>

        {/* Center: ← month → */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => onNavigate(Navigate.PREVIOUS)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-prof-pine/10 text-prof-black/50 hover:bg-prof-mint hover:text-prof-pine transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-lg font-bold text-prof-black min-w-[180px] text-center">
            {capitalize(label)}
          </span>
          <button
            onClick={() => onNavigate(Navigate.NEXT)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-prof-pine/10 text-prof-black/50 hover:bg-prof-mint hover:text-prof-pine transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Right: today button */}
        <div className="flex justify-end">
          <button
            onClick={() => onNavigate(Navigate.TODAY)}
            className="px-4 py-1.5 rounded-xl text-sm font-semibold text-prof-black/50 border border-prof-pine/10 hover:bg-prof-mint hover:text-prof-pine transition-all"
          >
            Сегодня
          </button>
        </div>
      </div>

      {/* Mobile: stacked layout */}
      <div className="flex flex-col items-center gap-3 sm:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate(Navigate.PREVIOUS)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-prof-pine/10 text-prof-black/50 hover:bg-prof-mint hover:text-prof-pine transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-lg font-bold text-prof-black min-w-[160px] text-center">
            {capitalize(label)}
          </span>
          <button
            onClick={() => onNavigate(Navigate.NEXT)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-prof-pine/10 text-prof-black/50 hover:bg-prof-mint hover:text-prof-pine transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <div className="flex gap-1.5 flex-wrap justify-center">
          {views.map(v => (
            <button
              key={v.key}
              onClick={() => onView(v.key)}
              className={`px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                view === v.key
                  ? 'bg-prof-pine text-white shadow-sm'
                  : 'text-prof-black/50 hover:bg-white/60 border border-prof-pine/10'
              }`}
            >
              {v.name}
            </button>
          ))}
          <button
            onClick={() => onNavigate(Navigate.TODAY)}
            className="px-4 py-1.5 rounded-xl text-sm font-semibold text-prof-black/50 border border-prof-pine/10 hover:bg-prof-mint hover:text-prof-pine transition-all"
          >
            Сегодня
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CalendarPage() {
  const { user, isAuthenticated } = useAuthStore()
  const [events, setEvents] = useState<CalEvent[]>([])
  const [allEvents, setAllEvents] = useState<CalEvent[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [subscriptionIds, setSubscriptionIds] = useState<Set<number>>(new Set())
  const [currentView, setCurrentView] = useState<View>('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<CalEvent | null>(null)
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [requestFormDate, setRequestFormDate] = useState<string>('')
  const [filterDepts, setFilterDepts] = useState<number[]>([])
  const [filterLabels, setFilterLabels] = useState<string[]>([])
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false)
  const [subscribedDepts, setSubscribedDepts] = useState<number[]>([])

  const isOrganizer = user?.role === 'organizer' || user?.role === 'admin'

  const loadEvents = useCallback(async () => {
    try {
      const unit = currentView === 'agenda' ? 'month' : currentView === 'work_week' ? 'week' : currentView
      const startDate = moment(currentDate).startOf(unit as moment.unitOfTime.StartOf).toDate()
      const endDate = moment(currentDate).endOf(unit as moment.unitOfTime.StartOf).toDate()
      const res = await api.get('/events', {
        params: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
      })
      const toDate = (d: any) => String(d ?? '').slice(0, 10)
      const toTime = (t: any) => String(t ?? '00:00').slice(0, 5)
      const formatted = (res.data || []).map((e: any) => ({
        id: e.id,
        title: e.title,
        start: new Date(`${toDate(e.dateStart)}T${toTime(e.timeStart)}`),
        end: new Date(`${toDate(e.dateEnd)}T${toTime(e.timeEnd)}`),
        department: e.department,
        labels: e.labels || [],
        resource: e,
      }))
      setAllEvents(formatted)
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }, [currentDate, currentView])

  useEffect(() => { loadEvents() }, [loadEvents])
  useEffect(() => { api.get('/departments').then(r => setDepartments(r.data || [])).catch(() => {}) }, [])
  useEffect(() => {
    if (!isAuthenticated) return
    api.get('/users/me').then(r => setSubscribedDepts(r.data?.subscribedDepartments || [])).catch(() => {})
  }, [isAuthenticated])
  useEffect(() => {
    if (!isAuthenticated) return
    api.get('/subscriptions/my').then(r => {
      const ids = new Set<number>((r.data || []).map((s: any) => s.eventId as number))
      setSubscriptionIds(ids)
    }).catch(() => {})
  }, [selectedEvent, isAuthenticated])

  const ostalnyeDept = departments.find(d => d.name === 'Остальные')

  useEffect(() => {
    let list = allEvents
    if (filterDepts.length > 0) {
      const hasOstalnye = ostalnyeDept && filterDepts.includes(ostalnyeDept.id)
      const otherIds = filterDepts.filter(id => id !== ostalnyeDept?.id)
      list = list.filter(e => {
        const deptId = e.resource?.departmentId
        const deptName = e.department?.name
        if (hasOstalnye && (deptId == null || deptName === 'Остальные')) return true
        if (otherIds.length > 0 && otherIds.includes(deptId)) return true
        return false
      })
    }
    if (filterLabels.length > 0) list = list.filter(e => (e.labels || []).some(l => filterLabels.includes(l)))
    setEvents(list)
  }, [allEvents, filterDepts, filterLabels, ostalnyeDept?.id])

  const eventStyleGetter = (event: CalEvent) => {
    const color = event.department?.color || '#18A7B5'
    const timed = isTimedEvent(event.start, event.end)
    const isTimeGrid = currentView === 'day' || currentView === 'week'
    if (timed && !isTimeGrid) {
      return {
        style: { backgroundColor: 'transparent', color: 'var(--prof-black)', border: 'none', boxShadow: 'none' },
        className: 'rbc-event--timed',
      }
    }
    return { style: { backgroundColor: color, color: '#fff', borderRadius: '8px', border: 'none' } }
  }

  const EventWithView = useCallback((props: { event: CalEvent; title?: string }) => (
    <CustomEventComponent {...props} view={currentView} />
  ), [currentView])

  const handleSubscribe = async () => {
    if (!selectedEvent || !isAuthenticated) return
    try {
      await api.post(`/subscriptions/events/${selectedEvent.id}`)
      setSubscriptionIds(prev => new Set(prev).add(selectedEvent.id))
    } catch {}
  }

  const handleSelectSlot = (slotInfo: SlotInfo) => {
    if (!isOrganizer) return
    const date = moment(slotInfo.start).format('YYYY-MM-DD')
    setRequestFormDate(date)
    setShowRequestForm(true)
  }

  const handleCloseRequestForm = useCallback(() => setShowRequestForm(false), [])
  const handleRequestSubmitted = useCallback(() => {
    setShowRequestForm(false)
    loadEvents()
  }, [loadEvents])

  const requestFormInitialData = useMemo(
    () => (requestFormDate ? { dateStart: requestFormDate, dateEnd: requestFormDate } : undefined),
    [requestFormDate]
  )

  const toggleDeptSubscription = async (deptId: number) => {
    if (!isAuthenticated) return
    const next = subscribedDepts.includes(deptId)
      ? subscribedDepts.filter(d => d !== deptId)
      : [...subscribedDepts, deptId]
    setSubscribedDepts(next)
    try { await api.patch('/users/me/departments', { departmentIds: next }) } catch {}
  }

  if (loading && allEvents.length === 0) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-32">
          <div className="flex flex-col items-center gap-3">
            <svg className="w-8 h-8 animate-spin text-prof-pacific" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-prof-black/50 text-sm font-medium">Загрузка календаря...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-prof-black">Календарь</h1>
          <p className="text-sm text-prof-black/40 mt-0.5">Все мероприятия профсоюза</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isOrganizer && (
            <button
              onClick={() => { setRequestFormDate(''); setShowRequestForm(true) }}
              className="text-sm font-bold px-5 py-2.5 rounded-xl text-white gradient-prof shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Подать мероприятие
            </button>
          )}
        </div>
      </div>

      {/* Calendar */}
      <div className="glass-panel rounded-2xl p-4 sm:p-6">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          view={currentView}
          onView={setCurrentView}
          date={currentDate}
          onNavigate={setCurrentDate}
          eventPropGetter={eventStyleGetter}
          onSelectEvent={(e) => setSelectedEvent(e as CalEvent)}
          onSelectSlot={handleSelectSlot}
          selectable={isOrganizer}
          style={{ minHeight: 600 }}
          components={{ toolbar: CustomToolbar, event: EventWithView }}
          messages={{ showMore: (count) => `+${count}` }}
          culture="ru"
        />
      </div>

      {/* Department subscriptions (main page) */}
      {isAuthenticated && departments.length > 0 && (
        <div className="mt-5 rounded-2xl px-5 py-4 bg-white/80 border border-prof-pine/8 shadow-card backdrop-blur-sm">
          <h3 className="text-sm font-bold text-prof-black/60 uppercase tracking-wider mb-3">Подписки на подразделения</h3>
          <p className="text-xs text-prof-black/50 mb-3">Получайте уведомления о новых мероприятиях выбранных подразделений</p>
          <div className="flex flex-wrap gap-2">
            {departments.map(d => {
              const isActive = subscribedDepts.includes(d.id)
              return (
                <button
                  key={d.id}
                  onClick={() => toggleDeptSubscription(d.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
                  style={{
                    backgroundColor: isActive ? d.color : 'transparent',
                    color: isActive ? '#fff' : d.color,
                    borderColor: isActive ? d.color : d.color + '40',
                  }}
                >
                  <span className="w-[6px] h-[6px] rounded-full" style={{ backgroundColor: isActive ? '#fff' : d.color, opacity: isActive ? 0.6 : 1 }} />
                  {d.name}
                  {isActive && (
                    <svg className="w-3 h-3 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Department filter dropdown */}
      {departments.length > 0 && (
        <div className="mt-5 rounded-2xl px-5 py-4 bg-white/80 border border-prof-pine/8 shadow-card backdrop-blur-sm relative">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-prof-black/60 uppercase tracking-wider">Фильтр по подразделениям</p>
            <div className="relative">
              <button
                onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-prof-pine/15 bg-white/80 text-sm font-semibold text-prof-black hover:bg-prof-mint/30 transition-all"
              >
                {filterDepts.length === 0
                  ? 'Все подразделения'
                  : filterDepts.length === 1
                    ? departments.find(d => d.id === filterDepts[0])?.name || 'Выбрано'
                    : `Выбрано: ${filterDepts.length}`}
                <svg className={`w-4 h-4 transition-transform ${filterDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
              {filterDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setFilterDropdownOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-64 max-h-72 overflow-y-auto rounded-xl border border-prof-pine/12 bg-white shadow-modal z-50 py-2">
                    {departments.map(d => {
                      const isChecked = filterDepts.includes(d.id)
                      return (
                        <label
                          key={d.id}
                          className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-prof-mint/20 cursor-pointer text-sm font-medium"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              setFilterDepts(prev =>
                                prev.includes(d.id)
                                  ? prev.filter(x => x !== d.id)
                                  : [...prev, d.id]
                              )
                            }}
                            className="rounded border-prof-pine/30 text-prof-pacific focus:ring-prof-pacific"
                          />
                          <span className="w-[6px] h-[6px] rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                          {d.name}
                        </label>
                      )
                    })}
                    {filterDepts.length > 0 && (
                      <button
                        onClick={() => { setFilterDepts([]); setFilterDropdownOpen(false) }}
                        className="w-full mt-2 pt-2 border-t border-prof-pine/8 text-xs font-bold text-prof-pacific hover:text-prof-pine px-4"
                      >
                        Сбросить
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <EventModal
        event={selectedEvent}
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onSubscribe={isAuthenticated ? handleSubscribe : undefined}
        isSubscribed={selectedEvent ? subscriptionIds.has(selectedEvent.id) : false}
      />

      {showRequestForm && (
        <EventRequestForm
          onClose={handleCloseRequestForm}
          onSubmitted={handleRequestSubmitted}
          departments={departments}
          initialData={requestFormInitialData}
        />
      )}
    </Layout>
  )
}
