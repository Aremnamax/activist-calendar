'use client'

import { useState, useEffect, useRef } from 'react'
import { api } from '@/lib/api'
import Layout from '@/components/Layout'
import EventRequestForm from '@/components/EventRequestForm'
import { REQUEST_STATUS_LABELS } from '@/lib/constants'

interface Department { id: number; name: string; color: string }

interface RequestItem {
  id: number
  title: string
  status: string
  comments: string | null
  hasConflict: boolean
  createdAt: string
  organizer?: { nickname?: string; email?: string }
  department?: { name: string; color: string }
  departmentId: number | null
  dateStart?: string
  dateEnd?: string
  timeStart?: string
  timeEnd?: string
  place?: string
  format?: string
  departmentIds?: number[]
  limitParticipants?: number | null
  description?: string
  postLink?: string
  regLink?: string
  responsibleLink?: string
  labels?: string[]
  conflictingEvents?: any[]
}

const statusDot: Record<string, string> = {
  draft: 'bg-gray-400',
  pending: 'bg-amber-500',
  needsWork: 'bg-orange-500',
  rejected: 'bg-red-500',
  approved: 'bg-emerald-500',
}

export default function AdminRequestsPage() {
  const [list, setList] = useState<RequestItem[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [moderateId, setModerateId] = useState<number | null>(null)
  const [action, setAction] = useState<'approve' | 'reject'>('approve')
  const [commentText, setCommentText] = useState('')
  const [viewRequest, setViewRequest] = useState<RequestItem | null>(null)
  const [moderateConflictEvents, setModerateConflictEvents] = useState<any[]>([])
  const [moderateError, setModerateError] = useState('')
  const [moderateLoading, setModerateLoading] = useState(false)
  const [listError, setListError] = useState('')
  const fetchedConflictForId = useRef<number | null>(null)

  const loadList = () => {
    setListError('')
    setLoading(true)
    api.get('/event-requests')
      .then(r => setList(r.data || []))
      .catch((e: any) => {
        setList([])
        setListError(e.response?.data?.message || 'Не удалось загрузить заявки')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadList(); api.get('/departments').then(r => setDepartments(r.data || [])).catch(() => {}) }, [])
  useEffect(() => { if (moderateId === null) loadList() }, [moderateId])

  const openViewRequest = (r: RequestItem) => {
    setViewRequest(r)
    api.get(`/event-requests/${r.id}`)
      .then(res => setViewRequest(res.data))
      .catch(() => {})
  }

  useEffect(() => {
    if (!moderateId) {
      setModerateConflictEvents([])
      fetchedConflictForId.current = null
      return
    }
    const req = list.find(r => r.id === moderateId)
    if (!req?.hasConflict) {
      setModerateConflictEvents([])
      return
    }
    if (fetchedConflictForId.current === moderateId) return
    fetchedConflictForId.current = moderateId
    let cancelled = false
    api.get(`/event-requests/${moderateId}`)
      .then(res => {
        if (!cancelled) setModerateConflictEvents(res.data?.conflictingEvents || [])
      })
      .catch(() => { if (!cancelled) setModerateConflictEvents([]) })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- list omitted to prevent refetch loop; ref guards duplicates
  }, [moderateId])

  const handleModerate = async () => {
    if (!moderateId || moderateLoading) return
    setModerateError('')
    if (action === 'reject' && !commentText.trim()) {
      setModerateError('Укажите причину отклонения')
      return
    }
    setModerateLoading(true)
    try {
      await api.patch(`/event-requests/${moderateId}/moderate`, {
        status: action === 'approve' ? 'approved' : 'rejected',
        comments: commentText || undefined,
      })
      setModerateId(null)
      setCommentText('')
      setModerateError('')
      loadList()
    } catch (e: any) {
      const msg = e.response?.data?.message || e.response?.data?.error || 'Ошибка при модерации'
      setModerateError(msg)
      console.error(e)
    } finally {
      setModerateLoading(false)
    }
  }

  const fmtDate = (s: string) => new Date(s).toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' })

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-prof-black">Модерация заявок</h1>
        <p className="text-sm text-prof-black/40 mt-0.5">Одобрение и отклонение заявок на мероприятия</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <svg className="w-7 h-7 animate-spin text-prof-pacific" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : listError ? (
        <div className="text-center py-20">
          <p className="text-red-500 font-medium mb-2">{listError}</p>
          <button onClick={loadList} className="px-4 py-2 rounded-xl text-sm font-semibold text-prof-pacific hover:bg-prof-mint">
            Повторить
          </button>
        </div>
      ) : list.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-prof-black/50 font-medium">Нет заявок</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {list.map(r => {
            const color = r.department?.color || '#18A7B5'
            return (
              <div
                key={r.id}
                className={`glass-panel rounded-2xl p-5 hover:shadow-md transition-shadow ${r.status === 'pending' ? 'ring-1 ring-amber-200' : ''}`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => openViewRequest(r)}>
                    <div className="flex items-center gap-2.5 mb-1">
                      <span className={`w-[6px] h-[6px] rounded-full shrink-0 ${statusDot[r.status] || 'bg-gray-400'}`} />
                      <h3 className="text-base font-bold text-prof-black truncate">{r.title}</h3>
                      <span className="shrink-0 text-[11px] font-bold text-prof-black/40 bg-prof-mint/60 px-2 py-0.5 rounded-full">
                        {REQUEST_STATUS_LABELS[r.status] || r.status}
                      </span>
                      {r.hasConflict && (
                        <span className="shrink-0 text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Конфликт</span>
                      )}
                    </div>
                    <p className="text-xs text-prof-black/40 ml-5">
                      {r.organizer?.nickname} ({r.organizer?.email}) &middot; {fmtDate(r.createdAt)}
                    </p>
                  </div>
                  {r.status === 'pending' && (
                    <div className="flex gap-2 shrink-0 ml-5 lg:ml-0">
                      <button
                        onClick={() => { setModerateId(r.id); setAction('approve'); setCommentText(''); setModerateError('') }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 shadow-sm transition-all"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Одобрить
                      </button>
                      <button
                        onClick={() => { setModerateId(r.id); setAction('reject'); setCommentText(''); setModerateError('') }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-red-500 hover:bg-red-600 shadow-sm transition-all"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Отклонить
                      </button>
                      <button
                        onClick={() => openViewRequest(r)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-prof-black/50 hover:bg-prof-mint/30 border border-prof-pine/15 transition-all"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                        </svg>
                        Подробнее
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {moderateId && (() => {
        const req = list.find(r => r.id === moderateId)
        return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => { setModerateId(null); setModerateError('') }}>
          <div className="absolute inset-0 bg-prof-black/40 backdrop-blur-sm" />
          <div className="relative w-full max-w-md glass-card rounded-2xl shadow-modal border border-white/40 p-6 animate-modal-in" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-prof-black mb-4">
              {action === 'approve' ? 'Одобрить заявку' : 'Отклонить заявку'}
            </h3>
            {req?.hasConflict && (
              <div className="mb-4 p-3 bg-amber-50/80 border border-amber-200 rounded-xl">
                <p className="text-xs font-bold text-amber-800 mb-2">Конфликт по времени:</p>
                {moderateConflictEvents.length > 0 ? (
                  <div className="space-y-1">
                    {moderateConflictEvents.map((e: any) => (
                      <p key={e.id} className="text-xs text-amber-700">{e.title} — {e.timeStart}–{e.timeEnd}</p>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-amber-700">Заявка пересекается с другими мероприятиями. Подробности — в «Подробнее».</p>
                )}
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-prof-black/50 uppercase tracking-wider mb-1.5">
                {action === 'reject' ? <>Причина отклонения <span className="text-red-500">*</span></> : 'Комментарий (необязательно)'}
              </label>
              <textarea
                value={commentText}
                onChange={e => { setCommentText(e.target.value); setModerateError('') }}
                placeholder={action === 'reject' ? 'Укажите причину отклонения' : 'Комментарий'}
                rows={3}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm text-prof-black focus:outline-none focus:ring-2 focus:ring-prof-pacific/30 bg-white/80 resize-none ${moderateError ? 'border-red-400' : 'border-prof-pine/15'}`}
              />
              {moderateError && <p className="text-xs text-red-500 mt-1">{moderateError}</p>}
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleModerate}
                disabled={moderateLoading}
                className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60 disabled:cursor-not-allowed ${action === 'approve' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'}`}
              >
                {moderateLoading ? 'Отправка...' : (action === 'approve' ? 'Одобрить' : 'Отклонить')}
              </button>
              <button onClick={() => { setModerateId(null); setModerateError('') }} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-prof-black/50 border border-prof-pine/15">
                Отмена
              </button>
            </div>
          </div>
        </div>
        )
      })()}

      {viewRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setViewRequest(null)}>
          <div className="absolute inset-0 bg-prof-black/40 backdrop-blur-sm" />
          <div className="relative w-full max-w-2xl max-h-[90vh] glass-card rounded-2xl shadow-modal border border-white/40 overflow-hidden animate-modal-in" onClick={e => e.stopPropagation()}>
            <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${viewRequest.department?.color || '#18A7B5'}, ${(viewRequest.department?.color || '#18A7B5')}88)` }} />
            <div className="p-6 overflow-y-auto max-h-[85vh]">
              <div className="flex items-start justify-between gap-4 mb-6">
                <h2 className="text-xl font-bold text-prof-black">{viewRequest.title}</h2>
                <button onClick={() => setViewRequest(null)} className="shrink-0 flex h-8 w-8 items-center justify-center rounded-lg text-prof-black/30 hover:text-prof-black hover:bg-prof-mint transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <InfoBlock label="Дата" value={`${viewRequest.dateStart} — ${viewRequest.dateEnd || viewRequest.dateStart}`} />
                <InfoBlock label="Время" value={`${viewRequest.timeStart} — ${viewRequest.timeEnd}`} />
                <InfoBlock label="Место" value={viewRequest.place || '—'} />
                <InfoBlock label="Подразделение" value={viewRequest.department?.name || '—'} color={viewRequest.department?.color} />
              </div>
              {viewRequest.labels?.length ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {viewRequest.labels.map((l: string, i: number) => (
                    <span key={i} className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-prof-pacific/10 text-prof-pacific">{l}</span>
                  ))}
                </div>
              ) : null}
              {viewRequest.hasConflict && viewRequest.conflictingEvents?.length ? (
                <div className="mt-4 p-4 bg-amber-50/80 border border-amber-200 rounded-xl">
                  <p className="text-sm font-bold text-amber-800 mb-2">Конфликт с мероприятиями:</p>
                  {viewRequest.conflictingEvents.map((e: any) => (
                    <p key={e.id} className="text-sm text-amber-700">{e.title} — {e.timeStart}–{e.timeEnd}</p>
                  ))}
                </div>
              ) : null}
              {viewRequest.comments && (
                <div className="mt-4 flex items-start gap-2 bg-amber-50/80 border border-amber-100 rounded-xl px-4 py-3">
                  <svg className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
                  <p className="text-sm text-amber-700">{viewRequest.comments}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

function InfoBlock({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <p className="text-xs font-bold text-prof-black/40 uppercase tracking-wider">{label}</p>
      {color ? (
        <span className="inline-flex items-center gap-1.5 mt-1 px-3 py-1 rounded-full text-xs font-bold text-white" style={{ backgroundColor: color }}>
          <span className="w-[6px] h-[6px] rounded-full bg-white/50" />{value}
        </span>
      ) : (
        <p className="text-sm font-semibold text-prof-black mt-0.5">{value}</p>
      )}
    </div>
  )
}
