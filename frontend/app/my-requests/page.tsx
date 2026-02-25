'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { api } from '@/lib/api'
import Layout from '@/components/Layout'
import EventRequestForm from '@/components/EventRequestForm'
import { REQUEST_STATUS_LABELS } from '@/lib/constants'

interface Department { id: number; name: string; color: string }

interface RequestItem {
  id: number; title: string; status: string; comments: string | null
  hasConflict: boolean; createdAt: string; departmentId: number | null
  eventId?: number
  dateStart?: string; dateEnd?: string; timeStart?: string; timeEnd?: string
  place?: string; format?: string; limitParticipants?: number | null
  description?: string; postLink?: string; regLink?: string
  responsibleLink?: string; labels?: string[]
}

const statusConfig: Record<string, { color: string; bg: string }> = {
  draft:     { color: 'text-gray-600',    bg: 'bg-gray-100' },
  pending:   { color: 'text-amber-600',   bg: 'bg-amber-50' },
  needsWork: { color: 'text-orange-600',  bg: 'bg-orange-50' },
  rejected:  { color: 'text-red-600',     bg: 'bg-red-50' },
  approved:  { color: 'text-emerald-600', bg: 'bg-emerald-50' },
}

export default function MyRequestsPage() {
  const [list, setList] = useState<RequestItem[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editRequest, setEditRequest] = useState<any>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const deleteInProgress = useRef(false)

  const loadList = () => {
    api.get('/event-requests?mine=true').then(r => setList(r.data || [])).catch(() => setList([])).finally(() => setLoading(false))
  }

  useEffect(() => { loadList(); api.get('/departments').then(r => setDepartments(r.data || [])).catch(() => {}) }, [])
  useEffect(() => { if (editingId === null) loadList() }, [editingId])

  const canEdit = (r: RequestItem) => r.status === 'draft' || r.status === 'needsWork' || r.status === 'approved'

  const handleCloseEdit = useCallback(() => { setEditingId(null); setEditRequest(null) }, [])
  const editFormInitialData = useMemo(() => {
    if (!editRequest) return undefined
    return {
      title: editRequest.title,
      dateStart: editRequest.dateStart?.slice(0, 10),
      dateEnd: editRequest.dateEnd?.slice(0, 10),
      timeStart: editRequest.timeStart,
      timeEnd: editRequest.timeEnd,
      place: editRequest.place,
      format: editRequest.format === 'closed' ? 'closed' : 'open',
      departmentIds: editRequest.departmentIds?.length ? editRequest.departmentIds : (editRequest.departmentId ? [editRequest.departmentId] : []),
      departmentId: editRequest.departmentId,
      limitParticipants: editRequest.limitParticipants,
      hasLimit: !!editRequest.limitParticipants,
      description: editRequest.description,
      postLink: editRequest.postLink || '',
      regLink: editRequest.regLink || '',
      responsibleLink: editRequest.responsibleLink || '',
      labels: editRequest.labels || [],
    }
  }, [editRequest])

  const handleDelete = async (id: number) => {
    if (deleteInProgress.current) return
    if (!confirm('Удалить эту заявку? При одобренной заявке будет удалено и связанное мероприятие.')) return
    deleteInProgress.current = true
    setDeletingId(id)
    try {
      await api.delete(`/event-requests/${id}`)
      loadList()
    } catch (e: any) {
      const msg = e.response?.data?.message || e.response?.data?.error || 'Не удалось удалить заявку'
      alert(msg)
    } finally {
      setDeletingId(null)
      deleteInProgress.current = false
    }
  }

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-prof-black">Мои заявки</h1>
        <p className="text-sm text-prof-black/40 mt-0.5">Управляйте своими заявками на мероприятия</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <svg className="w-7 h-7 animate-spin text-prof-pacific" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
        </div>
      ) : list.length === 0 ? (
        <div className="text-center py-20">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-prof-mint mx-auto mb-4">
            <svg className="w-8 h-8 text-prof-pacific" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>
          <p className="text-prof-black/50 font-medium">У вас пока нет заявок</p>
          <p className="text-sm text-prof-black/30 mt-1">Подайте заявку через календарь</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {list.map(r => {
            const cfg = statusConfig[r.status] || statusConfig.draft
            return (
              <div key={r.id} className="glass-panel rounded-2xl p-5 hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                      <h3 className="text-base font-bold text-prof-black truncate">{r.title}</h3>
                      <span className={`shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${cfg.color} ${cfg.bg}`}>
                        {REQUEST_STATUS_LABELS[r.status] || r.status}
                      </span>
                      {r.hasConflict && <span className="shrink-0 text-[11px] font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full">Конфликт</span>}
                    </div>
                    <p className="text-xs text-prof-black/40">
                      {new Date(r.createdAt).toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                    {r.comments && (
                      <div className="mt-3 flex items-start gap-2 bg-amber-50/80 border border-amber-100 rounded-xl px-4 py-3">
                        <svg className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
                        <p className="text-sm text-amber-700">{r.comments}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {canEdit(r) && (
                      <button onClick={() => { setEditRequest(r); setEditingId(r.id) }}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold text-white gradient-prof shadow-sm hover:shadow-md transition-all"
                        title={r.status === 'approved' ? 'После редактирования заявка пойдёт на повторную модерацию' : undefined}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        {r.status === 'approved' ? 'Изменить' : 'Редактировать'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(r.id) }}
                      disabled={deletingId === r.id}
                      title="Удалить заявку"
                      className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-500/60 hover:text-red-600 hover:bg-red-50/60 border border-red-200/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deletingId === r.id ? (
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {editingId != null && editRequest && (
        <EventRequestForm
          onClose={handleCloseEdit}
          onSubmitted={handleCloseEdit}
          departments={departments}
          requestId={editingId}
          initialData={editFormInitialData}
        />
      )}
    </Layout>
  )
}
