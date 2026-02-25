'use client'

import { useState, useEffect, useRef } from 'react'
import { api, extractErrorMessage } from '@/lib/api'
import { EVENT_LABELS } from '@/lib/constants'

interface Department {
  id: number
  name: string
  color: string
}

interface InitialData {
  title?: string
  dateStart?: string
  dateEnd?: string
  timeStart?: string
  timeEnd?: string
  place?: string
  format?: 'open' | 'closed'
  departmentId?: number
  departmentIds?: number[]
  limitParticipants?: number | null
  hasLimit?: boolean
  description?: string
  postLink?: string
  regLink?: string
  responsibleLink?: string
  labels?: string[]
}

interface EventRequestFormProps {
  onClose: () => void
  onSubmitted: () => void
  departments: Department[]
  requestId?: number
  initialData?: InitialData
}

export default function EventRequestForm({
  onClose,
  onSubmitted,
  departments,
  requestId,
  initialData,
}: EventRequestFormProps) {
  const [data, setData] = useState({
    title: '',
    dateStart: '',
    dateEnd: '',
    timeStart: '09:00',
    timeEnd: '18:00',
    place: '',
    format: 'open' as 'open' | 'closed',
    departmentIds: [] as number[],
    limitParticipants: null as number | null,
    hasLimit: false,
    description: '',
    postLink: '',
    regLink: '',
    responsibleLink: '',
    labels: [] as string[],
  })
  const [loading, setLoading] = useState(false)
  const [conflictWarning, setConflictWarning] = useState<string | null>(null)
  const [conflictEvents, setConflictEvents] = useState<any[]>([])
  const [showConflictModal, setShowConflictModal] = useState(false)
  const submitInProgress = useRef(false)

  const update = (key: string, value: any) => {
    setData(prev => ({ ...prev, [key]: value }))
    if (['dateStart', 'dateEnd', 'timeStart', 'timeEnd'].includes(key)) {
      setConflictWarning(null)
      setConflictEvents([])
    }
  }

  useEffect(() => {
    if (initialData) {
      setData(prev => ({
        ...prev,
        title: initialData.title ?? prev.title,
        dateStart: initialData.dateStart ?? prev.dateStart,
        dateEnd: initialData.dateEnd ?? prev.dateEnd,
        timeStart: initialData.timeStart ?? prev.timeStart,
        timeEnd: initialData.timeEnd ?? prev.timeEnd,
        place: initialData.place ?? prev.place,
        format: (initialData.format === 'closed' ? 'closed' : 'open') as 'open' | 'closed',
        departmentIds: initialData.departmentIds ?? (initialData.departmentId ? [initialData.departmentId] : []),
        limitParticipants: initialData.limitParticipants ?? prev.limitParticipants,
        hasLimit: initialData.hasLimit ?? prev.hasLimit,
        description: initialData.description ?? prev.description,
        postLink: initialData.postLink ?? prev.postLink,
        regLink: initialData.regLink ?? prev.regLink,
        responsibleLink: initialData.responsibleLink ?? prev.responsibleLink,
        labels: initialData.labels ?? prev.labels,
      }))
    }
  }, [initialData])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = 'unset' }
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const checkConflict = async () => {
    if (!data.dateStart || !data.timeStart || !data.timeEnd) return
    try {
      const params: Record<string, string> = {
        dateStart: data.dateStart,
        dateEnd: data.dateEnd || data.dateStart,
        timeStart: data.timeStart,
        timeEnd: data.timeEnd,
      }
      if (requestId) params.requestId = String(requestId)
      const res = await api.get('/event-requests/check-conflict', { params })
      const events = res.data || []
      if (events.length > 0) {
        setConflictEvents(events)
        setConflictWarning(`Конфликт с ${events.length} мероприятием(ями)`)
      } else {
        setConflictEvents([])
        setConflictWarning(null)
      }
    } catch {
      setConflictEvents([])
      setConflictWarning(null)
    }
  }

  const doSubmit = async () => {
    if (submitInProgress.current) return
    submitInProgress.current = true
    setLoading(true)
    try {
      const payload = {
        title: data.title.trim(),
        dateStart: data.dateStart,
        dateEnd: data.dateEnd || data.dateStart,
        timeStart: data.timeStart,
        timeEnd: data.timeEnd,
        place: data.place.trim(),
        format: data.format,
        departmentIds: data.departmentIds.length > 0 ? data.departmentIds : [departments[0]?.id].filter(Boolean),
        departmentId: data.departmentIds[0] ?? departments[0]?.id,
        limitParticipants: data.hasLimit ? data.limitParticipants : null,
        description: data.description.trim() || ' ',
        postLink: data.postLink.trim() || null,
        regLink: data.regLink.trim() || null,
        responsibleLink: data.responsibleLink.trim(),
        labels: data.labels,
      }

      if (requestId) {
        await api.patch(`/event-requests/${requestId}`, payload)
        onSubmitted()
      } else {
        const res = await api.post('/event-requests', payload)
        const id = res.data?.id
        if (id) await api.post(`/event-requests/${id}/submit`)
        onSubmitted()
      }
    } catch (err: any) {
      console.error(err)
      alert(extractErrorMessage(err) || 'Ошибка при сохранении')
    } finally {
      setLoading(false)
      submitInProgress.current = false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!data.title.trim() || !data.dateStart || !data.place.trim() || !data.responsibleLink.trim()) return

    if (conflictEvents.length > 0) {
      setShowConflictModal(true)
      return
    }
    const params: Record<string, string> = {
      dateStart: data.dateStart,
      dateEnd: data.dateEnd || data.dateStart,
      timeStart: data.timeStart,
      timeEnd: data.timeEnd,
    }
    if (requestId) params.requestId = String(requestId)
    try {
      const res = await api.get('/event-requests/check-conflict', { params })
      const events = res.data || []
      if (events.length > 0) {
        setConflictEvents(events)
        setConflictWarning(`Конфликт с ${events.length} мероприятием(ями)`)
        setShowConflictModal(true)
        return
      }
    } catch {}

    await doSubmit()
  }

  const handleConfirmWithConflict = () => {
    setShowConflictModal(false)
    doSubmit()
  }

  const toggleDept = (id: number) => {
    setData(prev => ({
      ...prev,
      departmentIds: prev.departmentIds.includes(id)
        ? prev.departmentIds.filter(x => x !== id)
        : [...prev.departmentIds, id],
    }))
  }

  const toggleLabel = (l: string) => {
    setData(prev => ({
      ...prev,
      labels: prev.labels.includes(l) ? prev.labels.filter(x => x !== l) : [...prev.labels, l],
    }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-prof-black/40 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-2xl max-h-[92vh] glass-card rounded-2xl shadow-modal border border-white/40 flex flex-col animate-modal-in overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="h-1.5 gradient-prof" />
        <div className="flex-1 overflow-y-auto p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4 mb-6">
            <h2 className="text-xl font-bold text-prof-black">
              {requestId ? 'Редактировать заявку' : 'Подать заявку на мероприятие'}
            </h2>
            <button
              onClick={onClose}
              className="shrink-0 flex h-8 w-8 items-center justify-center rounded-lg text-prof-black/30 hover:text-prof-black hover:bg-prof-mint transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-prof-black/50 uppercase tracking-wider mb-1.5">Название <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={data.title}
                onChange={e => update('title', e.target.value)}
                placeholder="Название мероприятия"
                className="w-full px-4 py-2.5 rounded-xl border border-prof-pine/15 text-sm text-prof-black focus:outline-none focus:ring-2 focus:ring-prof-pacific/30 bg-white/80"
                required
              />
            </div>

            <div className="glass-panel rounded-2xl p-4 border border-white/40">
              <p className="text-xs font-bold text-prof-black/50 uppercase tracking-wider mb-3">Дата и время</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-prof-black/60 mb-1">Дата начала <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    value={data.dateStart}
                    onChange={e => update('dateStart', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-prof-pine/10 text-sm text-prof-black focus:outline-none focus:ring-2 focus:ring-prof-pacific/30 bg-white/60 backdrop-blur-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-prof-black/60 mb-1">Дата окончания</label>
                  <input
                    type="date"
                    value={data.dateEnd}
                    onChange={e => update('dateEnd', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-prof-pine/10 text-sm text-prof-black focus:outline-none focus:ring-2 focus:ring-prof-pacific/30 bg-white/60 backdrop-blur-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-prof-black/60 mb-1">Время начала</label>
                  <input
                    type="time"
                    value={data.timeStart}
                    onChange={e => update('timeStart', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-prof-pine/10 text-sm text-prof-black focus:outline-none focus:ring-2 focus:ring-prof-pacific/30 bg-white/60 backdrop-blur-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-prof-black/60 mb-1">Время окончания</label>
                  <input
                    type="time"
                    value={data.timeEnd}
                    onChange={e => update('timeEnd', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-prof-pine/10 text-sm text-prof-black focus:outline-none focus:ring-2 focus:ring-prof-pacific/30 bg-white/60 backdrop-blur-sm"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button type="button" onClick={checkConflict}
                className="text-xs font-bold text-prof-pacific hover:text-prof-pine">Проверить конфликт</button>
              {conflictWarning && (
                <span className="text-xs font-bold text-amber-600">{conflictWarning}</span>
              )}
            </div>
            {conflictEvents.length > 0 && (
              <div className="bg-amber-50/80 border border-amber-200 rounded-xl px-4 py-3 space-y-1">
                {conflictEvents.map((e: any) => (
                  <p key={e.id} className="text-sm text-amber-800">{e.title} — {e.timeStart}–{e.timeEnd}</p>
                ))}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-prof-black/50 uppercase tracking-wider mb-1.5">Место <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={data.place}
                onChange={e => update('place', e.target.value)}
                placeholder="Адрес или место проведения"
                className="w-full px-4 py-2.5 rounded-xl border border-prof-pine/15 text-sm text-prof-black focus:outline-none focus:ring-2 focus:ring-prof-pacific/30 bg-white/80"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-prof-black/50 uppercase tracking-wider mb-1.5">Формат</label>
              <div className="flex gap-2">
                {(['open', 'closed'] as const).map(f => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => update('format', f)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${data.format === f ? 'bg-prof-pacific text-white border-prof-pacific' : 'border-prof-pine/15 text-prof-black/50 hover:border-prof-pacific/40 hover:text-prof-pacific'}`}
                  >
                    {f === 'open' ? 'Открытое' : 'Закрытое'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-prof-black/50 uppercase tracking-wider mb-1.5">Подразделение(я)</label>
              <div className="flex flex-wrap gap-2">
                {departments.map(d => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => toggleDept(d.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white transition-all ${data.departmentIds.includes(d.id) ? '' : 'opacity-50'}`}
                    style={{ backgroundColor: data.departmentIds.includes(d.id) ? d.color : d.color + '60' }}
                  >
                    <span className="w-[6px] h-[6px] rounded-full bg-white/50" />{d.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-prof-black/50 uppercase tracking-wider mb-1.5">Метки</label>
              <div className="flex flex-wrap gap-2">
                {EVENT_LABELS.map(l => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => toggleLabel(l)}
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-all ${data.labels.includes(l) ? 'bg-prof-pacific text-white' : 'bg-prof-pacific/10 text-prof-pacific'}`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-bold text-prof-black/50 uppercase tracking-wider mb-1.5">
                <input type="checkbox" checked={data.hasLimit} onChange={e => update('hasLimit', e.target.checked)} />
                Ограничение участников
              </label>
              {data.hasLimit && (
                <input
                  type="number"
                  min={1}
                  value={data.limitParticipants ?? ''}
                  onChange={e => update('limitParticipants', e.target.value ? Number(e.target.value) : null)}
                  placeholder="Кол-во"
                  className="w-28 px-3 py-2 rounded-xl border border-prof-pine/15 text-sm text-prof-black focus:outline-none focus:ring-2 focus:ring-prof-pacific/30 bg-white/60"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-prof-black/50 uppercase tracking-wider mb-1.5">Описание</label>
              <textarea
                value={data.description}
                onChange={e => update('description', e.target.value)}
                placeholder="Описание мероприятия"
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl border border-prof-pine/15 text-sm text-prof-black focus:outline-none focus:ring-2 focus:ring-prof-pacific/30 bg-white/80 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-prof-black/50 uppercase tracking-wider mb-1.5">Ссылка на пост</label>
              <input
                type="url"
                value={data.postLink}
                onChange={e => update('postLink', e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-2.5 rounded-xl border border-prof-pine/15 text-sm text-prof-black focus:outline-none focus:ring-2 focus:ring-prof-pacific/30 bg-white/80"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-prof-black/50 uppercase tracking-wider mb-1.5">Ссылка на регистрацию</label>
              <input
                type="url"
                value={data.regLink}
                onChange={e => update('regLink', e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-2.5 rounded-xl border border-prof-pine/15 text-sm text-prof-black focus:outline-none focus:ring-2 focus:ring-prof-pacific/30 bg-white/80"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-prof-black/50 uppercase tracking-wider mb-1.5">Ссылка на ответственного <span className="text-red-500">*</span></label>
              <input
                type="url"
                value={data.responsibleLink}
                onChange={e => update('responsibleLink', e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-2.5 rounded-xl border border-prof-pine/15 text-sm text-prof-black focus:outline-none focus:ring-2 focus:ring-prof-pacific/30 bg-white/80"
                required
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-5 py-3 rounded-xl text-sm font-bold text-white gradient-prof shadow-md hover:shadow-lg disabled:opacity-60 transition-all"
              >
                {loading ? 'Сохранение...' : requestId ? 'Сохранить' : 'Подать заявку'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-3 rounded-xl text-sm font-semibold text-prof-black/50 hover:text-prof-black border border-prof-pine/15 hover:bg-prof-mint/30 transition-all"
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      </div>

      {showConflictModal && conflictEvents.length > 0 && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => setShowConflictModal(false)}>
          <div className="absolute inset-0 bg-prof-black/50 backdrop-blur-sm" />
          <div className="relative w-full max-w-md glass-card rounded-2xl shadow-modal border border-amber-200/60 p-6 animate-modal-in" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-amber-800 mb-2">Конфликт по времени</h3>
            <p className="text-sm text-prof-black/70 mb-4">Ваше мероприятие пересекается со следующими:</p>
            <ul className="space-y-2 mb-6 max-h-48 overflow-y-auto">
              {conflictEvents.map((e: any) => (
                <li key={e.id} className="text-sm text-amber-800 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  {e.title} — {e.timeStart}–{e.timeEnd} {e.place && `(${e.place})`}
                </li>
              ))}
            </ul>
            <div className="flex gap-3">
              <button onClick={handleConfirmWithConflict} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 transition-all">
                Всё равно отправить
              </button>
              <button onClick={() => setShowConflictModal(false)} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-prof-black/50 border border-prof-pine/15 hover:bg-prof-mint/30">
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
