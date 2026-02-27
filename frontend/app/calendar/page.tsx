'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
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
  departments?: { id: number; name: string; color: string }[]
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

function formatEventStartTime(start: Date): string {
  return `${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')}`
}

function CustomEventComponent({ event, title, view }: { event: CalEvent; title?: string; view?: View }) {
  const timed = isTimedEvent(event.start, event.end)
  const isTimeGrid = view === 'day' || view === 'week'
  const isMonthView = view === 'month'
  if (isTimeGrid) {
    return (
      <span className="rbc-event-label">
        {title || event.title}
        {timed && (
          <span className="block text-[11px] font-normal opacity-90 mt-0.5">{formatEventTime(event.start, event.end)}</span>
        )}
      </span>
    )
  }
  if (isMonthView) {
    return (
      <span className="rbc-event-timed flex items-center justify-between gap-2 w-full">
        <span className="truncate text-[12px] font-semibold">{title || event.title}</span>
        <span className="text-[11px] font-medium shrink-0 opacity-95">{formatEventStartTime(event.start)}</span>
      </span>
    )
  }
  return (
    <span className="rbc-event-label">{title || event.title}</span>
  )
}

interface Department {
  id: number
  name: string
  color: string
}

interface CustomToolbarProps extends ToolbarProps<CalEvent, object> {
  departments?: Department[]
  filterDepts?: number[]
  setFilterDepts?: (ids: number[] | ((prev: number[]) => number[])) => void
  filterDropdownOpen?: boolean
  setFilterDropdownOpen?: (v: boolean) => void
}

function CustomToolbar({ label, onNavigate, onView, view, departments = [], filterDepts = [], setFilterDepts, filterDropdownOpen, setFilterDropdownOpen }: CustomToolbarProps) {
  const [viewDropdownOpen, setViewDropdownOpen] = useState(false)
  const viewButtonRef = useRef<HTMLButtonElement>(null)
  const filterButtonRef = useRef<HTMLButtonElement>(null)
  const [viewDropdownRect, setViewDropdownRect] = useState<DOMRect | null>(null)
  const [filterDropdownRect, setFilterDropdownRect] = useState<DOMRect | null>(null)

  useEffect(() => {
    if (viewDropdownOpen && viewButtonRef.current) {
      const update = () => setViewDropdownRect(viewButtonRef.current!.getBoundingClientRect())
      update()
      window.addEventListener('scroll', update, true)
      window.addEventListener('resize', update)
      return () => { window.removeEventListener('scroll', update, true); window.removeEventListener('resize', update) }
    }
    setViewDropdownRect(null)
  }, [viewDropdownOpen])

  useEffect(() => {
    if (filterDropdownOpen && filterButtonRef.current) {
      const update = () => setFilterDropdownRect(filterButtonRef.current!.getBoundingClientRect())
      update()
      window.addEventListener('scroll', update, true)
      window.addEventListener('resize', update)
      return () => { window.removeEventListener('scroll', update, true); window.removeEventListener('resize', update) }
    }
    setFilterDropdownRect(null)
  }, [filterDropdownOpen])

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

        {/* Right: filter + today button */}
        <div className="flex items-center justify-end gap-2">
          {departments.length > 0 && setFilterDepts && setFilterDropdownOpen && (
            <div className="relative">
              <button
                ref={filterButtonRef}
                onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-prof-pine/15 bg-white/80 text-sm font-semibold text-prof-black hover:bg-prof-mint/30 transition-all"
              >
                {filterDepts.length === 0
                  ? 'Подразделения'
                  : filterDepts.length === 1
                    ? departments.find(d => d.id === filterDepts[0])?.name || 'Выбрано'
                    : `Выбрано: ${filterDepts.length}`}
                <svg className={`w-3.5 h-3.5 transition-transform ${filterDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
              {filterDropdownOpen && filterDropdownRect && createPortal(
                <>
                  <div className="fixed inset-0 z-[9998]" onClick={() => setFilterDropdownOpen(false)} />
                  <div
                    className="fixed w-56 max-h-64 overflow-y-auto rounded-xl border border-prof-pine/12 bg-white shadow-modal z-[9999] py-2"
                    style={{ left: filterDropdownRect.right - 224, top: filterDropdownRect.bottom + 8 }}
                  >
                    {departments.map(d => {
                      const isChecked = filterDepts.includes(d.id)
                      return (
                        <label
                          key={d.id}
                          className="flex items-center gap-2.5 px-3 py-2 hover:bg-prof-mint/20 cursor-pointer text-sm font-medium"
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
                        className="w-full mt-2 pt-2 border-t border-prof-pine/8 text-xs font-bold text-prof-pacific hover:text-prof-pine px-3"
                      >
                        Сбросить
                      </button>
                    )}
                  </div>
                </>,
                document.body
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile: toolbar с выпадающим списком вида */}
      <div className="flex flex-col gap-3 sm:hidden">
        <div className="glass-panel rounded-2xl p-3 border border-prof-pine/10">
          <div className="flex items-center justify-between gap-2 mb-3">
            <button
              onClick={() => onNavigate(Navigate.PREVIOUS)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-prof-pine/10 text-prof-black/50 hover:bg-prof-mint hover:text-prof-pine transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-base font-bold text-prof-black text-center truncate flex-1">
              {capitalize(label)}
            </span>
            <button
              onClick={() => onNavigate(Navigate.NEXT)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-prof-pine/10 text-prof-black/50 hover:bg-prof-mint hover:text-prof-pine transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <div className="flex gap-2 flex-wrap items-center justify-center">
            {/* Выпадающий список: Месяц / Неделя / День / Список */}
            <div className="relative">
              <button
                ref={viewButtonRef}
                onClick={() => setViewDropdownOpen(!viewDropdownOpen)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-prof-pine/15 bg-white/80 text-sm font-semibold text-prof-black hover:bg-prof-mint/30 transition-all w-full min-w-[120px] justify-between"
              >
                {views.find(v => v.key === view)?.name || 'Вид'}
                <svg className={`w-4 h-4 shrink-0 transition-transform ${viewDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
              {viewDropdownOpen && viewDropdownRect && createPortal(
                <>
                  <div className="fixed inset-0 z-[9998]" onClick={() => setViewDropdownOpen(false)} />
                  <div
                    className="fixed min-w-[120px] rounded-xl border border-prof-pine/12 bg-white shadow-modal z-[9999] py-2"
                    style={{ left: viewDropdownRect.left, top: viewDropdownRect.bottom + 8, width: viewDropdownRect.width }}
                  >
                    {views.map(v => (
                      <button
                        key={v.key}
                        onClick={() => { onView(v.key); setViewDropdownOpen(false) }}
                        className={`w-full px-4 py-2.5 text-left text-sm font-semibold transition-colors ${
                          view === v.key ? 'bg-prof-mint/60 text-prof-pine' : 'hover:bg-prof-mint/30 text-prof-black'
                        }`}
                      >
                        {v.name}
                      </button>
                    ))}
                  </div>
                </>,
                document.body
              )}
            </div>
            {departments.length > 0 && setFilterDepts && setFilterDropdownOpen && (
            <div className="relative">
              <button
                ref={filterButtonRef}
                onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-prof-pine/15 bg-white/80 text-sm font-semibold text-prof-black"
              >
                {filterDepts.length === 0 ? 'Подразделения' : filterDepts.length === 1 ? departments.find(d => d.id === filterDepts[0])?.name : `Выбрано: ${filterDepts.length}`}
                <svg className={`w-3.5 h-3.5 ${filterDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
              {filterDropdownOpen && filterDropdownRect && createPortal(
                <>
                  <div className="fixed inset-0 z-[9998]" onClick={() => setFilterDropdownOpen(false)} />
                  <div
                    className="fixed w-56 max-h-64 overflow-y-auto rounded-xl border border-prof-pine/12 bg-white shadow-modal z-[9999] py-2"
                    style={{ left: filterDropdownRect.left + (filterDropdownRect.width - 224) / 2, top: filterDropdownRect.bottom + 8 }}
                  >
                    {departments.map(d => (
                      <label key={d.id} className="flex items-center gap-2.5 px-3 py-2 hover:bg-prof-mint/20 cursor-pointer text-sm font-medium">
                        <input type="checkbox" checked={filterDepts.includes(d.id)} onChange={() => setFilterDepts(prev => prev.includes(d.id) ? prev.filter(x => x !== d.id) : [...prev, d.id])} className="rounded border-prof-pine/30 text-prof-pacific focus:ring-prof-pacific" />
                        <span className="w-[6px] h-[6px] rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                        {d.name}
                      </label>
                    ))}
                    {filterDepts.length > 0 && (
                      <button onClick={() => { setFilterDepts([]); setFilterDropdownOpen(false) }} className="w-full mt-2 pt-2 border-t border-prof-pine/8 text-xs font-bold text-prof-pacific px-3">
                        Сбросить
                      </button>
                    )}
                  </div>
                </>,
                document.body
              )}
            </div>
          )}
          </div>
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
        department: (e.departments?.length ? e.departments[0] : e.department) ?? undefined,
        departments: e.departments?.length ? e.departments : (e.department ? [e.department] : []),
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
        const deptIds = e.resource?.departmentIds?.length ? e.resource.departmentIds : (e.resource?.departmentId != null ? [e.resource.departmentId] : [])
        const deptName = e.department?.name
        if (hasOstalnye && (deptIds.length === 0 || deptName === 'Остальные')) return true
        if (otherIds.length > 0 && deptIds.some((id: number) => otherIds.includes(id))) return true
        return false
      })
    }
    if (filterLabels.length > 0) list = list.filter(e => (e.labels || []).some(l => filterLabels.includes(l)))
    setEvents(list)
  }, [allEvents, filterDepts, filterLabels, ostalnyeDept?.id])

  const sortedEvents = useMemo(() => {
    if (currentView !== 'month') return events
    return [...events].sort((a, b) => {
      const aMulti = !isTimedEvent(a.start, a.end)
      const bMulti = !isTimedEvent(b.start, b.end)
      if (aMulti !== bMulti) return aMulti ? -1 : 1
      return a.start.getTime() - b.start.getTime()
    })
  }, [events, currentView])

  const eventStyleGetter = (event: CalEvent) => {
    const color = event.departments?.[0]?.color || event.department?.color || '#18A7B5'
    const timed = isTimedEvent(event.start, event.end)
    const isTimeGrid = currentView === 'day' || currentView === 'week'
    if (!isTimeGrid) {
      return {
        style: { backgroundColor: color, color: '#faf8f5', border: 'none', boxShadow: 'none' },
        className: 'rbc-event--timed',
      }
    }
    return { style: { backgroundColor: color, color: '#faf8f5', borderRadius: '8px', border: 'none' } }
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

      {/* Calendar — на мобильных: меньше отступов, больше места */}
      <div className="glass-panel rounded-2xl p-3 sm:p-6 calendar-mobile">
        <Calendar
          localizer={localizer}
          events={sortedEvents}
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
          components={{
            toolbar: (props: ToolbarProps<CalEvent, object>) => (
              <CustomToolbar
                {...props}
                departments={departments}
                filterDepts={filterDepts}
                setFilterDepts={setFilterDepts}
                filterDropdownOpen={filterDropdownOpen}
                setFilterDropdownOpen={setFilterDropdownOpen}
              />
            ),
            event: EventWithView,
          }}
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
